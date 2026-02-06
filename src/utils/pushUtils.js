/**
 * 푸시 알림 권한 상태 확인
 * @returns {'default' | 'granted' | 'denied' | 'unsupported'}
 */
export const getPushPermissionState = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * PWA 설치 여부 확인
 * @returns {boolean}
 */
export const isPWAInstalled = () => {
  // iOS Safari standalone 모드
  if (window.navigator.standalone === true) {
    return true;
  }

  // Android Chrome display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return false;
};

/**
 * PWA 설치 프롬프트 표시 가능 여부
 * @returns {boolean}
 */
export const canShowInstallPrompt = () => {
  // iOS는 자동 프롬프트가 없음 (수동 안내만 가능)
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (isIOS) return false;

  // Android Chrome은 beforeinstallprompt 이벤트로 확인
  return 'onbeforeinstallprompt' in window;
};

/**
 * 푸시 알림 테스트 발송
 * @param {string} title - 알림 제목
 * @param {string} body - 알림 내용
 */
export const sendTestNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200]
    });
  }
};

/**
 * iOS 사용자에게 PWA 설치 안내 표시 여부
 * @returns {boolean}
 */
export const shouldShowIOSInstallGuide = () => {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = isPWAInstalled();
  const hasSeenGuide = localStorage.getItem('ios-pwa-guide-seen') === 'true';

  return isIOS && !isStandalone && !hasSeenGuide;
};

/**
 * iOS PWA 설치 안내 표시 완료 기록
 */
export const markIOSInstallGuideSeen = () => {
  localStorage.setItem('ios-pwa-guide-seen', 'true');
};
