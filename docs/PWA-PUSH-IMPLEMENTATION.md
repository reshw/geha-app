# PWA 및 iOS 웹푸시 구현 가이드

> **작성일**: 2026-02-05
> **프로젝트**: Lounge App (게하 앱)
> **목표**: Progressive Web App 기능 추가 및 iOS 16.4+ Safari 웹푸시 지원

---

## 📋 개요

### 현재 상태
- React 19.1.1 + Vite 7.2.6 SPA
- Firebase 10.13.0 (Firestore만 사용 중)
- PWA 기능 완전 미구현 (manifest, service worker 없음)
- 현재 알림: NHN Cloud 알림톡 + Resend 이메일

### 구현 목표
- ✅ PWA 기본 설정 완료 (홈 화면 추가 가능)
- ✅ Firebase Cloud Messaging 연동
- ✅ iOS Safari 웹푸시 지원 (iOS 16.4+)
- ✅ 사용자별 푸시 알림 설정 UI

---

## 🗂️ 파일 구조

### 새로 생성할 파일 (총 11개)

#### PWA 기본 파일
```
public/
├── manifest.json                    # PWA 매니페스트
├── sw.js                            # Service Worker (Firebase Messaging)
└── icons/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    ├── icon-512x512.png
    └── apple-touch-icon.png
```

#### 푸시 알림 서비스 및 훅
```
src/
├── config/
│   └── firebaseMessaging.js         # Firebase Messaging 초기화
├── services/
│   └── pushNotificationService.js   # 푸시 구독/설정 관리
├── hooks/
│   └── usePushNotification.js       # 푸시 알림 React 훅
└── utils/
    └── pushUtils.js                 # 푸시 유틸리티 함수
```

#### UI 컴포넌트
```
src/components/settings/
└── PushNotificationSettings.jsx     # 푸시 설정 페이지
```

#### Netlify Functions
```
netlify/functions/
└── send-push-notification.js        # FCM 푸시 발송 함수
```

### 수정할 기존 파일 (총 8개)

```
package.json                         # vite-plugin-pwa, workbox-window 추가
vite.config.js                       # VitePWA 플러그인 설정
index.html                           # manifest 링크, iOS 메타태그
netlify.toml                         # 푸시 함수 환경변수
.env                                 # Firebase VAPID 키
src/config/firebase.js               # app export 추가
src/App.jsx                          # 포그라운드 알림 리스너
src/pages/MorePage.jsx              # 푸시 설정 메뉴 추가
```

---

## 🚀 Phase별 구현 계획

### Phase 1: PWA 기본 설정 ⏳
**목표**: PWA 설치 가능하게 만들기

**작업 항목**:
- [ ] `npm install -D vite-plugin-pwa workbox-window` 실행
- [ ] `vite.config.js`에 VitePWA 플러그인 추가
- [ ] `public/manifest.json` 생성
- [ ] `public/icons/` 폴더 생성 및 vite.svg 기반 임시 아이콘 생성
- [ ] `index.html`에 manifest 링크 및 iOS 메타태그 추가

**검증**:
- Chrome DevTools > Application > Manifest 확인
- iOS Safari에서 "홈 화면에 추가" 가능 확인

**완료 후**: Phase 2로 진행

---

### Phase 2: Firebase Messaging 설정 ⏳
**목표**: FCM 토큰 발급 및 Firestore 저장

**사전 준비**:
- [ ] Firebase Console에서 VAPID 키 생성
- [ ] `.env`에 `VITE_FIREBASE_VAPID_KEY` 추가

**작업 항목**:
- [ ] `src/config/firebase.js` 수정 (app export 추가)
- [ ] `src/config/firebaseMessaging.js` 생성
- [ ] `public/sw.js` 생성 (Firebase Messaging Service Worker)
- [ ] `src/services/pushNotificationService.js` 생성
- [ ] `src/utils/pushUtils.js` 생성

**검증**:
- Chrome에서 FCM 토큰 발급 확인 (콘솔 로그)
- Firestore에 `users/{userId}/pushSubscriptions/{token}` 생성 확인

**완료 후**: Phase 3로 진행

---

### Phase 3: 푸시 알림 UI ⏳
**목표**: 사용자가 푸시 알림을 켜고 끌 수 있는 UI

**작업 항목**:
- [ ] `src/hooks/usePushNotification.js` 생성
- [ ] `src/components/settings/PushNotificationSettings.jsx` 생성
- [ ] `src/pages/MorePage.jsx` 수정 (푸시 설정 메뉴 추가)
- [ ] `src/App.jsx` 수정 (포그라운드 알림 리스너)

**검증**:
- "더보기" 메뉴에서 "푸시 알림 설정" 진입 가능
- 활성화/비활성화 버튼 동작 확인
- 알림 유형별 설정 저장 확인

**완료 후**: Phase 4로 진행

---

### Phase 4: Netlify Functions ⏳
**목표**: 서버에서 푸시 알림 발송

**사전 준비**:
- [ ] Firebase Admin SDK 비공개 키 발급
- [ ] Netlify 환경변수 설정 (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)

**작업 항목**:
- [ ] `netlify/functions/send-push-notification.js` 생성
- [ ] `netlify.toml` 수정 (환경변수 설정)
- [ ] `src/services/notificationService.js` 수정 (푸시 통합)

**검증**:
- cURL로 테스트 푸시 발송
- 예약 생성 시 푸시 알림 수신 확인 (Chrome)

**완료 후**: Phase 5로 진행

---

### Phase 5: iOS 테스트 및 최적화 ⏳
**목표**: iOS Safari에서 실제 푸시 수신

**작업 항목**:
- [ ] Netlify 배포 (HTTPS 필요)
- [ ] iOS 실기기 테스트 (iOS 16.4+)
- [ ] iOS PWA 설치 안내 UI 추가 (선택적)
- [ ] 에러 처리 개선

**검증**:
- iOS Safari에서 PWA 설치
- 백그라운드 푸시 알림 수신
- 알림 클릭 시 앱 열림

---

## 🔐 환경변수 설정

### .env (로컬 개발)
```env
# 기존 Firebase 설정
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=jh308-60114
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# 새로 추가: Firebase VAPID 공개키
VITE_FIREBASE_VAPID_KEY=<Firebase Console에서 생성>
```

### Netlify 환경변수 (Production)
```env
# Firebase Admin SDK (서버용)
FIREBASE_PROJECT_ID=jh308-60114
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@jh308-60114.iam.gserviceaccount.com

# Firebase Web (클라이언트용 - 빌드 시 주입)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_VAPID_KEY=...
(기타 VITE_ 환경변수들)
```

---

## 📚 Firebase 설정 가이드

### VAPID 키 생성 (Phase 2 필요)

1. **Firebase Console 접속**
   - https://console.firebase.google.com/
   - 프로젝트 선택: **jh308-60114**
   - 프로젝트 설정 (⚙️) 클릭

2. **Cloud Messaging 탭**
   - Cloud Messaging 탭 선택
   - Web Push certificates 섹션 찾기

3. **키 생성**
   - "Generate key pair" 버튼 클릭
   - 공개 키 복사 (예: `BCJa3...xyz`)
   - `.env`에 추가:
     ```env
     VITE_FIREBASE_VAPID_KEY=BCJa3...xyz
     ```

### Admin SDK 비공개 키 발급 (Phase 4 필요)

1. **Firebase Console 접속**
   - 프로젝트 설정 → Service accounts 탭

2. **비공개 키 생성**
   - "Generate new private key" 버튼 클릭
   - JSON 파일 다운로드 (**절대 Git에 커밋 금지!**)

3. **Netlify 환경변수 설정**
   - Netlify 대시보드 → Site settings → Environment variables
   - 다음 변수 추가:
     ```
     FIREBASE_PROJECT_ID = jh308-60114
     FIREBASE_PRIVATE_KEY = (JSON의 private_key 값)
     FIREBASE_CLIENT_EMAIL = (JSON의 client_email 값)
     ```

---

## 🗄️ Firestore 데이터 구조

### users/{userId}/pushSubscriptions/{token}
```javascript
{
  token: "fcm-token-string",
  userId: "kakao-user-id",
  spaceId: "space-id",
  endpoint: "fcm",
  userAgent: "Mozilla/5.0...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### spaces/{spaceId}/pushSettings/{userId}
```javascript
{
  enabled: true,
  types: {
    reservation: true,
    settlement: true,
    expense: true,
    praise: false
  },
  updatedAt: Timestamp
}
```

---

## ✅ 검증 방법

### 데스크톱 Chrome 테스트
1. `npm run dev` 실행
2. DevTools > Application > Service Workers 확인
3. 푸시 알림 설정 페이지에서 "활성화" 클릭
4. Notification 권한 승인
5. 콘솔에서 FCM 토큰 발급 확인
6. Firestore에서 구독 정보 확인

### iOS Safari 테스트
1. Safari에서 앱 접속
2. 공유 버튼 > "홈 화면에 추가"
3. 홈 화면 아이콘으로 앱 실행
4. 로그인 후 "푸시 알림 설정"
5. "활성화" 클릭 > iOS 알림 권한 허용
6. 백그라운드 상태에서 푸시 수신 확인

---

## ⚠️ 중요 제약사항

### iOS Safari 제약
1. **PWA 설치 필수**: 홈 화면에 추가하지 않으면 푸시 불가
2. **iOS 16.4 이상**: 그 이하 버전은 웹푸시 미지원
3. **HTTPS 필수**: Netlify는 자동 제공
4. **권한 요청 타이밍**: 사용자 제스처(클릭) 이벤트 내에서만 가능

### 보안
- VAPID 비공개 키는 서버 환경변수에만 저장 (절대 클라이언트 노출 금지)
- FCM 토큰은 민감 정보이므로 Firestore 보안 규칙 설정 필요

---

## 🔧 트러블슈팅

### 문제 1: iOS에서 푸시 알림이 오지 않음
**원인**: PWA로 설치하지 않았거나, iOS 16.4 미만
**해결**:
- PWA 설치 확인: `window.navigator.standalone === true`
- iOS 버전 확인: Settings > General > About

### 문제 2: FCM 토큰 발급 실패
**원인**: VAPID 키 미설정 또는 Service Worker 등록 실패
**해결**:
- Firebase Console에서 VAPID 키 생성
- DevTools > Application > Service Workers 확인

### 문제 3: Netlify Function 타임아웃
**원인**: Firestore 쿼리가 느리거나 FCM 발송 지연
**해결**:
- Firestore 인덱스 생성
- FCM 배치 발송 사용 (최대 500개)

---

## 📝 핵심 파일 경로

1. `vite.config.js` - PWA 플러그인 설정
2. `src/services/pushNotificationService.js` - 푸시 구독/설정 핵심 로직
3. `public/sw.js` - Firebase Messaging Service Worker
4. `netlify/functions/send-push-notification.js` - 서버 푸시 발송
5. `src/components/settings/PushNotificationSettings.jsx` - 사용자 설정 UI

---

## 📊 작업 진행 상황

**진행 상황 추적 파일**: `docs/PWA-PUSH-PROGRESS.md`

각 Phase 완료 시 해당 파일을 업데이트하여 진행 상황을 기록합니다.

---

## 📖 참고 자료

- [Firebase Cloud Messaging 공식 문서](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Vite PWA Plugin 문서](https://vite-pwa-org.netlify.app/)
- [iOS Safari Web Push 지원](https://webkit.org/blog/12945/meet-web-push/)
- [PWA 매니페스트 명세](https://developer.mozilla.org/en-US/docs/Web/Manifest)
