/**
 * Firebase Cloud Messaging 푸시 알림 발송 Netlify Function
 *
 * 환경변수: 필요 없음 (Firebase 자격증명은 파일에서 읽음)
 */

const admin = require('firebase-admin');
const { getFirebaseApp } = require('./firebase-loader');

// Firebase Admin 초기화 함수
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    const { adminApp } = getFirebaseApp();
    console.log('✅ Firebase Admin 초기화 완료');
    return adminApp;
  } catch (error) {
    console.error('❌ Firebase Admin 초기화 실패:', error);
    throw new Error(`Firebase 초기화 실패: ${error.message}`);
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Firebase 초기화
    try {
      initializeFirebase();
    } catch (initError) {
      console.error('❌ Firebase 초기화 실패:', initError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Firebase 초기화 실패: ${initError.message}`
        })
      };
    }

    const db = admin.firestore();
    const data = JSON.parse(event.body);
    console.log('📨 푸시 알림 발송 요청:', JSON.stringify(data, null, 2));

    const { type, userId, spaceId, notification, data: customData } = data;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // 1. 사용자의 푸시 구독 토큰 조회
    const subscriptionsRef = db.collection(`users/${userId}/pushSubscriptions`);
    const snapshot = await subscriptionsRef.get();

    if (snapshot.empty) {
      console.log('⚠️ 푸시 구독 없음 - 발송 건너뜀');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          skipped: true,
          reason: 'no_subscriptions'
        })
      };
    }

    // 2. 푸시 알림 설정 확인 (spaceId가 있으면, 단 테스트 알림은 제외)
    if (spaceId && type !== 'test') {
      const settingsRef = db.doc(`spaces/${spaceId}/pushSettings/${userId}`);
      const settingsDoc = await settingsRef.get();

      if (settingsDoc.exists) {
        const settings = settingsDoc.data();
        if (!settings.enabled) {
          console.log('⚠️ 푸시 알림 비활성화 - 발송 건너뜀');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              skipped: true,
              reason: 'disabled'
            })
          };
        }

        // 알림 유형별 설정 확인
        if (type && settings.types && !settings.types[type]) {
          console.log(`⚠️ ${type} 알림 비활성화 - 발송 건너뜀`);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              skipped: true,
              reason: `type_disabled_${type}`
            })
          };
        }
      }
    }

    // 3. 모든 구독 토큰으로 푸시 발송
    const tokens = [];
    snapshot.forEach((doc) => {
      const sub = doc.data();
      if (sub.token) {
        tokens.push(sub.token);
      }
    });

    if (tokens.length === 0) {
      console.log('⚠️ 유효한 토큰 없음');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'no_valid_tokens'
        })
      };
    }

    // FCM 메시지 생성
    const message = {
      notification: {
        title: notification?.title || '게하 앱',
        body: notification?.body || ''
      },
      data: {
        type: type || 'default',
        ...customData
      },
      tokens
    };

    console.log('📤 FCM 발송:', { tokens: tokens.length, message });

    // FCM 발송
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('✅ 푸시 알림 발송 완료:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });

    // 실패한 토큰 제거
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error('❌ 토큰 실패:', tokens[idx], resp.error);
        }
      });

      console.log('🗑️ 실패한 토큰 제거:', failedTokens.length);

      for (const token of failedTokens) {
        try {
          await db.doc(`users/${userId}/pushSubscriptions/${token}`).delete();
        } catch (err) {
          console.error('토큰 삭제 실패:', err);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      })
    };

  } catch (error) {
    console.error('❌ 푸시 알림 발송 실패:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || '푸시 알림 발송 중 오류가 발생했습니다.'
      })
    };
  }
};
