import { useState, useEffect } from 'react';
import pushNotificationService from '../services/pushNotificationService';
import { onForegroundMessage } from '../config/firebaseMessaging';
import useStore from '../store/useStore';
import { getPushPermissionState, sendTestNotification } from '../utils/pushUtils';

export const usePushNotification = () => {
  const { user, selectedSpace } = useStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState(getPushPermissionState());
  const [settings, setSettings] = useState(null);

  // 구독 상태 확인
  useEffect(() => {
    if (user?.id) {
      checkSubscription();
    }
  }, [user?.id]);

  // 푸시 설정 로드
  useEffect(() => {
    if (user?.id && selectedSpace?.id) {
      loadSettings();
    }
  }, [user?.id, selectedSpace?.id]);

  // 포그라운드 메시지 수신
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📬 포그라운드 알림 수신:', payload);

      // 브라우저 알림 표시
      const title = payload.notification?.title || '게하 앱';
      const body = payload.notification?.body || '';
      sendTestNotification(title, body);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const checkSubscription = async () => {
    try {
      const subscribed = await pushNotificationService.isSubscribed(user.id);
      setIsSubscribed(subscribed);
      setPermission(getPushPermissionState());
    } catch (error) {
      console.error('구독 상태 확인 실패:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await pushNotificationService.getSettings(selectedSpace.id, user.id);
      setSettings(data);
    } catch (error) {
      console.error('푸시 설정 로드 실패:', error);
    }
  };

  const subscribe = async () => {
    console.log('🔵 subscribe 시작', { userId: user?.id, spaceId: selectedSpace?.id });

    if (!user?.id || !selectedSpace?.id) {
      console.error('❌ 사용자 정보 없음', { user, selectedSpace });
      alert('로그인 및 스페이스 선택이 필요합니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔵 pushNotificationService.subscribe 호출');
      const result = await pushNotificationService.subscribe(user.id, selectedSpace.id);
      console.log('✅ subscribe 완료', result);

      setIsSubscribed(true);
      setPermission('granted');
      alert('✅ 푸시 알림이 활성화되었습니다!');
    } catch (error) {
      console.error('❌ 푸시 구독 실패:', error);
      alert(error.message || '푸시 알림 활성화에 실패했습니다.');
    } finally {
      console.log('🔵 setIsLoading(false)');
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const subscriptions = await pushNotificationService.getSubscriptions(user.id);
      for (const sub of subscriptions) {
        await pushNotificationService.unsubscribe(user.id, sub.id);
      }
      setIsSubscribed(false);
      alert('✅ 푸시 알림이 비활성화되었습니다.');
    } catch (error) {
      console.error('푸시 구독 해제 실패:', error);
      alert('푸시 알림 비활성화에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    if (!user?.id || !selectedSpace?.id) return;

    setIsLoading(true);
    try {
      await pushNotificationService.updateSettings(selectedSpace.id, user.id, newSettings);
      setSettings(newSettings);
      alert('✅ 푸시 알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('푸시 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTest = async () => {
    if (!user?.id || !selectedSpace?.id) {
      alert('로그인 및 스페이스 선택이 필요합니다.');
      return;
    }

    if (!isSubscribed) {
      alert('먼저 푸시 알림을 활성화해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await pushNotificationService.sendTestNotification(user.id, selectedSpace.id);

      if (result.skipped) {
        alert(`⚠️ 알림 발송 건너뜀: ${result.reason}`);
      } else if (result.success) {
        alert('✅ 테스트 푸시 알림이 발송되었습니다!\n잠시 후 알림을 확인하세요.');
      } else {
        alert('❌ 테스트 푸시 알림 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('테스트 푸시 발송 실패:', error);
      alert(`❌ 오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubscribed,
    isLoading,
    permission,
    settings,
    subscribe,
    unsubscribe,
    updateSettings,
    sendTest,
    isSupported: pushNotificationService.isPushSupported(),
    isIOSSupported: pushNotificationService.isIOSPushSupported()
  };
};
