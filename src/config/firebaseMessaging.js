import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

let messaging = null;

/**
 * Firebase Messaging 초기화
 * iOS Safari와 Chrome 등에서 모두 동작하도록 초기화
 */
export const initializeMessaging = () => {
  try {
    // Service Worker 지원 여부 확인
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging 초기화 완료');
      return messaging;
    } else {
      console.warn('⚠️ 푸시 알림이 지원되지 않는 브라우저입니다.');
      return null;
    }
  } catch (error) {
    console.error('❌ Firebase Messaging 초기화 실패:', error);
    return null;
  }
};

/**
 * FCM 토큰 발급
 * @param {string} vapidKey - Firebase VAPID 공개 키
 * @returns {Promise<string>} FCM 토큰
 */
export const getFCMToken = async (vapidKey) => {
  if (!messaging) {
    messaging = initializeMessaging();
  }

  if (!messaging) {
    throw new Error('Messaging을 초기화할 수 없습니다.');
  }

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (token) {
      console.log('✅ FCM 토큰 발급 성공:', token);
      return token;
    } else {
      throw new Error('토큰을 발급받지 못했습니다.');
    }
  } catch (error) {
    console.error('❌ FCM 토큰 발급 실패:', error);
    throw error;
  }
};

/**
 * 포그라운드 메시지 수신 리스너
 * @param {Function} callback - 메시지 수신 시 호출될 콜백 함수
 * @returns {Function} 리스너 해제 함수
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    messaging = initializeMessaging();
  }

  if (!messaging) {
    console.warn('⚠️ Messaging이 초기화되지 않았습니다.');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 포그라운드 메시지 수신:', payload);
    callback(payload);
  });
};

export { messaging };
