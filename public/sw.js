/**
 * Firebase Cloud Messaging Service Worker
 * - 백그라운드 푸시 알림 수신
 * - iOS Safari 지원 (iOS 16.4+)
 */

// Firebase 버전 (package.json의 firebase 버전과 동기화)
const FIREBASE_VERSION = '10.13.0';

// Firebase SDK 로드
importScripts(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`);
importScripts(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`);

// Firebase 설정
firebase.initializeApp({
  apiKey: "PLACEHOLDER_KEY", 
  authDomain: "PLACEHOLDER_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_BUCKET",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
});

const messaging = firebase.messaging();

/**
 * 백그라운드 메시지 수신
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '게하 앱';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: payload.data || {},
    tag: payload.data?.type || 'default',
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * 알림 클릭 처리
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.js] 알림 클릭:', event.notification.data);

  event.notification.close();

  const data = event.notification.data;
  let targetUrl = '/';

  // 알림 타입에 따라 이동 경로 결정
  if (data.type === 'reservation') {
    targetUrl = '/';
  } else if (data.type === 'settlement') {
    targetUrl = '/settlement';
  } else if (data.type === 'expense') {
    targetUrl = '/expenses';
  } else if (data.type === 'praise') {
    targetUrl = '/praise';
  } else if (data.url) {
    targetUrl = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

console.log('[sw.js] Firebase Messaging Service Worker 로드 완료');
