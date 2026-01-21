// netlify/functions/send-pending-expense-reminder.js
// 운영비 승인 독려 메일 발송
// 매일 한국시간 오전 10시에 실행되어야 함 (netlify.toml 설정: UTC 01:00 = KST 10:00)

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin 초기화 (환경변수로 credentials 전달)
let adminApp;
try {
  if (!adminApp) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    }, 'expense-reminder-app');
  }
} catch (error) {
  console.error('Firebase Admin 초기화 실패:', error);
}

const db = getFirestore();

/**
 * 한국시간(KST, UTC+9) 변환
 */
const getKoreanTime = (date = new Date()) => {
  const utcTime = date.getTime();
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
  return new Date(utcTime + kstOffset);
};

/**
 * 각 스페이스의 pending 운영비 건수 확인 및 독려 메일 발송
 */
const sendPendingExpenseReminders = async () => {
  const kstNow = getKoreanTime();
  console.log('📧 운영비 독려 메일 발송 체크 시작 (한국시간):', kstNow.toISOString());

  // 모든 스페이스 조회
  const spacesSnapshot = await db.collection('spaces').get();
  const results = [];

  for (const spaceDoc of spacesSnapshot.docs) {
    const spaceId = spaceDoc.id;
    const spaceName = spaceDoc.data().name || spaceId;

    try {
      console.log(`\n🏠 스페이스: ${spaceName} (${spaceId})`);

      // 이메일 알림 설정 확인
      const emailSettingsRef = db.collection('spaces').doc(spaceId).collection('settings').doc('email');
      const emailSettingsDoc = await emailSettingsRef.get();

      if (!emailSettingsDoc.exists()) {
        console.log(`  ℹ️ 이메일 설정 없음`);
        results.push({
          spaceId,
          spaceName,
          status: 'no_email_settings',
          message: '이메일 설정 없음'
        });
        continue;
      }

      const emailSettings = emailSettingsDoc.data();

      // expense 알림이 비활성화되어 있거나 수신자가 없으면 스킵
      if (!emailSettings?.expense?.enabled || !emailSettings.expense.recipients?.length) {
        console.log(`  ⏸️ 운영비 이메일 알림 비활성화 또는 수신자 없음`);
        results.push({
          spaceId,
          spaceName,
          status: 'email_disabled',
          message: '이메일 알림 비활성화'
        });
        continue;
      }

      // pending 상태의 expense 건수 조회
      const expenseSnapshot = await db.collection('spaces').doc(spaceId).collection('Expense')
        .where('status', '==', 'pending')
        .get();

      const pendingCount = expenseSnapshot.size;

      if (pendingCount === 0) {
        console.log(`  ✓ 승인 대기중인 운영비 없음`);
        results.push({
          spaceId,
          spaceName,
          status: 'no_pending',
          message: '승인 대기중인 건 없음'
        });
        continue;
      }

      console.log(`  📬 승인 대기중인 운영비 ${pendingCount}건 발견 - 독려 메일 발송 시작`);

      // 독려 메일 발송
      try {
        const emailResponse = await fetch('https://loungeap.netlify.app/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense_reminder',
            spaceName: spaceName,
            pendingCount: pendingCount,
            recipients: {
              to: emailSettings.expense.recipients[0],
              cc: emailSettings.expense.recipients.slice(1)
            }
          })
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log(`  ✅ 독려 메일 발송 성공:`, emailResult);

          results.push({
            spaceId,
            spaceName,
            status: 'sent',
            message: '독려 메일 발송 성공',
            pendingCount: pendingCount,
            recipients: emailSettings.expense.recipients
          });
        } else {
          throw new Error(`Email API responded with status ${emailResponse.status}`);
        }
      } catch (emailError) {
        console.error(`  ⚠️ 독려 메일 발송 실패:`, emailError);
        results.push({
          spaceId,
          spaceName,
          status: 'email_failed',
          message: `메일 발송 실패: ${emailError.message}`,
          pendingCount: pendingCount
        });
      }

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
 * 매일 한국시간 오전 10시에 실행 (UTC 01:00)
 */
exports.handler = async (event) => {
  const kstNow = getKoreanTime();
  console.log('📧 Netlify 독려 메일 Scheduled Function 실행 (한국시간):', kstNow.toISOString());

  try {
    const results = await sendPendingExpenseReminders();

    const summary = {
      timestamp: kstNow.toISOString(),
      totalSpaces: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      noPending: results.filter(r => r.status === 'no_pending').length,
      emailDisabled: results.filter(r => r.status === 'email_disabled').length,
      noEmailSettings: results.filter(r => r.status === 'no_email_settings').length,
      emailFailed: results.filter(r => r.status === 'email_failed').length,
      errors: results.filter(r => r.status === 'error').length,
      results
    };

    console.log('\n📊 독려 메일 발송 체크 완료:', summary);

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('❌ 독려 메일 발송 실패:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
