import { doc, setDoc, getDoc, deleteDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFCMToken } from '../config/firebaseMessaging';

class PushNotificationService {
  VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  /**
   * 푸시 알림 권한 요청
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ 알림 권한 승인됨');
      return true;
    } else if (permission === 'denied') {
      console.log('❌ 알림 권한 거부됨');
      throw new Error('알림 권한이 거부되었습니다.');
    } else {
      console.log('⏸️ 알림 권한 대기 중');
      return false;
    }
  }

  /**
   * 푸시 구독 등록
   */
  async subscribe(userId, spaceId) {
    try {
      // 1. 권한 확인
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('알림 권한이 필요합니다.');
      }

      // 2. FCM 토큰 발급
      const token = await getFCMToken(this.VAPID_KEY);

      // 3. Firestore에 구독 정보 저장
      const subscriptionData = {
        token,
        userId,
        spaceId,
        endpoint: 'fcm',
        userAgent: navigator.userAgent,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(
        doc(db, `users/${userId}/pushSubscriptions`, token),
        subscriptionData,
        { merge: true }
      );

      console.log('✅ 푸시 구독 등록 완료:', token);
      return { success: true, token };

    } catch (error) {
      console.error('❌ 푸시 구독 실패:', error);
      throw error;
    }
  }

  /**
   * 푸시 구독 해제
   */
  async unsubscribe(userId, token) {
    try {
      await deleteDoc(doc(db, `users/${userId}/pushSubscriptions`, token));
      console.log('✅ 푸시 구독 해제 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 푸시 구독 해제 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 푸시 구독 목록 조회
   */
  async getSubscriptions(userId) {
    try {
      const subscriptionsRef = collection(db, `users/${userId}/pushSubscriptions`);
      const snapshot = await getDocs(subscriptionsRef);

      const subscriptions = [];
      snapshot.forEach((doc) => {
        subscriptions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return subscriptions;
    } catch (error) {
      console.error('❌ 푸시 구독 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 현재 기기의 구독 상태 확인
   */
  async isSubscribed(userId) {
    try {
      const subscriptions = await this.getSubscriptions(userId);
      return subscriptions.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 푸시 알림 설정 저장 (스페이스별)
   */
  async updateSettings(spaceId, userId, settings) {
    try {
      const settingsDoc = {
        enabled: settings.enabled ?? true,
        types: {
          reservation: settings.types?.reservation ?? true,
          settlement: settings.types?.settlement ?? true,
          expense: settings.types?.expense ?? true,
          praise: settings.types?.praise ?? false
        },
        updatedAt: Timestamp.now()
      };

      await setDoc(
        doc(db, `spaces/${spaceId}/pushSettings`, userId),
        settingsDoc,
        { merge: true }
      );

      console.log('✅ 푸시 알림 설정 저장 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 푸시 알림 설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 푸시 알림 설정 조회
   */
  async getSettings(spaceId, userId) {
    try {
      const settingsRef = doc(db, `spaces/${spaceId}/pushSettings`, userId);
      const snapshot = await getDoc(settingsRef);

      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        // 기본 설정 반환
        return {
          enabled: true,
          types: {
            reservation: true,
            settlement: true,
            expense: true,
            praise: false
          }
        };
      }
    } catch (error) {
      console.error('❌ 푸시 알림 설정 조회 실패:', error);
      return null;
    }
  }

  /**
   * iOS Safari 여부 확인
   */
  isIOSSafari() {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    return isIOS && isSafari;
  }

  /**
   * 푸시 알림 지원 여부 확인
   */
  isPushSupported() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * iOS 16.4+ 여부 확인 (웹푸시 지원)
   */
  isIOSPushSupported() {
    if (!this.isIOSSafari()) return false;

    // iOS 버전 추출
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      const majorVersion = parseInt(match[1], 10);
      const minorVersion = parseInt(match[2], 10);

      // iOS 16.4 이상
      if (majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4)) {
        return this.isPushSupported();
      }
    }

    return false;
  }

  /**
   * 테스트 푸시 알림 발송
   */
  async sendTestNotification(userId, spaceId) {
    try {
      const response = await fetch('/.netlify/functions/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          userId,
          spaceId,
          notification: {
            title: '🔔 테스트 알림',
            body: '푸시 알림이 정상적으로 작동합니다!'
          },
          data: {
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '푸시 알림 발송 실패');
      }

      console.log('✅ 테스트 푸시 알림 발송 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ 테스트 푸시 알림 발송 실패:', error);
      throw error;
    }
  }
}

export default new PushNotificationService();
