// netlify/functions/settlement-auto-close.js
// 정산 자동 마감 함수
// 매주 월요일 18:00에 실행되어야 함
// GitHub Actions 또는 외부 cron 서비스로 호출

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Firebase Admin 초기화 (개별 환경변수 사용)
let adminApp;
let db;

try {
  // 개별 환경변수로 서비스 계정 구성
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
    universe_domain: 'googleapis.com'
  };

  adminApp = initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore(adminApp);
  console.log('✅ Firebase Admin 초기화 성공');
} catch (error) {
  console.error('❌ Firebase Admin 초기화 실패:', error);
}

/**
 * 한국시간(KST, UTC+9) 변환
 */
const getKoreanTime = (date = new Date()) => {
  // UTC 시간에 9시간 추가하여 한국시간으로 변환
  const utcTime = date.getTime();
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
  return new Date(utcTime + kstOffset);
};

/**
 * 주차 ID 생성 (ISO Week)
 */
const getWeekId = (date = new Date()) => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
};

/**
 * 주의 시작일/종료일 계산 (월요일~일요일)
 */
const getWeekRange = (date = new Date()) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  const weekStart = new Date(date.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
};

/**
 * 스페이스의 정산 스케줄 설정이 현재 시간과 일치하는지 확인
 * 한국시간(KST) 기준으로 비교
 */
const shouldSettleNow = (scheduleSettings) => {
  if (!scheduleSettings || !scheduleSettings.enabled) {
    return false;
  }

  // 한국시간으로 변환
  const now = getKoreanTime();
  const [targetHour, targetMinute] = scheduleSettings.time.split(':').map(Number);

  // 시간 체크 (±5분 허용)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = targetHour * 60 + targetMinute;
  const minuteDiff = Math.abs(currentMinutes - targetMinutes);

  if (minuteDiff > 5) {
    return false; // 설정 시간이 아님
  }

  // 주기별 체크
  if (scheduleSettings.frequency === 'weekly') {
    return now.getDay() === scheduleSettings.weeklyDay;
  } else if (scheduleSettings.frequency === 'monthly') {
    return now.getDate() === scheduleSettings.monthlyDay;
  } else if (scheduleSettings.frequency === 'yearly') {
    return now.getMonth() + 1 === scheduleSettings.yearlyMonth &&
           now.getDate() === scheduleSettings.yearlyDay;
  }

  return false;
};

/**
 * 정산 자동 마감
 * 각 스페이스의 설정을 참조하여 마감 시간이 되면 실행
 */
const autoCloseSettlements = async () => {
  const kstNow = getKoreanTime();
  console.log('🤖 정산 자동 마감 체크 시작 (한국시간):', kstNow.toISOString());

  // 모든 스페이스 조회
  const spacesSnapshot = await db.collection('spaces').get();
  const results = [];

  for (const spaceDoc of spacesSnapshot.docs) {
    const spaceId = spaceDoc.id;
    const spaceName = spaceDoc.data().name || spaceId;

    try {
      console.log(`\n🏠 스페이스: ${spaceName} (${spaceId})`);

      // 스페이스의 정산 설정 조회
      const settingsRef = db.collection('spaces').doc(spaceId).collection('settings').doc('settlement');
      const settingsDoc = await settingsRef.get();

      if (!settingsDoc.exists()) {
        console.log(`  ℹ️ 정산 설정 없음 (자동 마감 비활성화)`);
        results.push({
          spaceId,
          spaceName,
          status: 'no_settings',
          message: '정산 설정 없음'
        });
        continue;
      }

      const scheduleSettings = settingsDoc.data();

      // 자동 마감이 비활성화된 경우 스킵
      if (!scheduleSettings.enabled) {
        console.log(`  ⏸️ 자동 마감 비활성화`);
        results.push({
          spaceId,
          spaceName,
          status: 'disabled',
          message: '자동 마감 비활성화'
        });
        continue;
      }

      // 현재 시간이 설정된 마감 시간인지 확인
      if (!shouldSettleNow(scheduleSettings)) {
        console.log(`  ⏰ 마감 시간 아님 (설정: ${scheduleSettings.frequency} ${scheduleSettings.time})`);
        results.push({
          spaceId,
          spaceName,
          status: 'not_time',
          message: '마감 시간 아님'
        });
        continue;
      }

      console.log(`  ✅ 마감 시간 일치! 정산 마감 시작...`);

      // 마감할 주차 계산 (현재 시점 기준 지난 주차)
      const now = new Date();
      let targetWeek = new Date(now);

      // 주기에 따라 마감할 기간 결정
      if (scheduleSettings.frequency === 'weekly') {
        // 지난 주 마감
        targetWeek.setDate(targetWeek.getDate() - 7);
      } else if (scheduleSettings.frequency === 'monthly') {
        // 지난 달 마감
        targetWeek.setMonth(targetWeek.getMonth() - 1);
      } else if (scheduleSettings.frequency === 'yearly') {
        // 지난 해 마감
        targetWeek.setFullYear(targetWeek.getFullYear() - 1);
      }

      const targetWeekId = getWeekId(targetWeek);
      console.log(`  📅 마감 대상 주차: ${targetWeekId}`);

      // 정산 조회
      const settlementRef = db.collection('spaces').doc(spaceId).collection('settlement').doc(targetWeekId);
      const settlementDoc = await settlementRef.get();

      if (!settlementDoc.exists()) {
        console.log(`  ℹ️ 정산 데이터 없음`);
        results.push({
          spaceId,
          spaceName,
          status: 'no_data',
          message: '정산 데이터 없음'
        });
        continue;
      }

      const settlementData = settlementDoc.data();

      // 이미 정산 완료된 경우 스킵
      if (settlementData.status === 'settled') {
        console.log(`  ✓ 이미 정산 완료됨`);
        results.push({
          spaceId,
          spaceName,
          status: 'already_settled',
          message: '이미 정산 완료'
        });
        continue;
      }

      // 정산 완료 처리
      console.log(`  🔄 정산 마감 처리 중...`);
      await settlementRef.update({
        status: 'settled',
        settledAt: Timestamp.now(),
        autoSettled: true,
        settledBySchedule: scheduleSettings, // 어떤 스케줄에 의해 마감되었는지 기록
      });

      console.log(`  ✅ 정산 마감 완료`);

      results.push({
        spaceId,
        spaceName,
        weekId: targetWeekId,
        status: 'settled',
        message: '자동 마감 성공',
        participants: Object.keys(settlementData.participants || {}).length,
        totalAmount: settlementData.totalAmount || 0,
        schedule: `${scheduleSettings.frequency} ${scheduleSettings.time}`
      });

    } catch (error) {
      console.error(`  ❌ 오류:`, error);
      results.push({
        spaceId,
        spaceName,
        status: 'error',
        message: error.message
      });
    }
  }

  return results;
};

/**
 * Netlify Scheduled Function Handler
 * Netlify가 자동으로 매시간 실행합니다 (netlify.toml 설정)
 */
exports.handler = async (event) => {
  // Scheduled function은 event.body가 없으므로 따로 체크하지 않음
  const kstNow = getKoreanTime();
  console.log('🤖 Netlify Scheduled Function 실행 (한국시간):', kstNow.toISOString());

  try {
    const results = await autoCloseSettlements();

    const summary = {
      timestamp: new Date().toISOString(),
      totalSpaces: results.length,
      settled: results.filter(r => r.status === 'settled').length,
      alreadySettled: results.filter(r => r.status === 'already_settled').length,
      noData: results.filter(r => r.status === 'no_data').length,
      noSettings: results.filter(r => r.status === 'no_settings').length,
      disabled: results.filter(r => r.status === 'disabled').length,
      notTime: results.filter(r => r.status === 'not_time').length,
      errors: results.filter(r => r.status === 'error').length,
      results
    };

    console.log('\n📊 자동 마감 체크 완료:', summary);

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('❌ 자동 마감 실패:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
