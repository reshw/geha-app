# 🏠 라운지 예약 시스템 (리팩토링 완료)

깔끔하게 재작성된 라운지 예약 관리 웹 애플리케이션

## ✨ 특징

- 📦 **단순한 구조** - 핵심 기능만 구현
- 🎯 **명확한 책임** - Service/Hook/Component 분리
- 🔧 **확장 가능** - 모달, 스페이스 관리 등 쉽게 추가 가능
- 📱 **반응형** - 모바일 최적화

## 🚀 빠른 시작

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 3. 실행
npm run dev
```

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── auth/           # 인증 (KakaoLogin, LoginOverlay)
│   ├── calendar/       # 캘린더 메인
│   └── common/         # 공통 (Loading, Modal)
├── hooks/
│   ├── useAuth.js      # 인증 훅
│   └── useReservations.js  # 예약 관리 훅
├── services/
│   ├── authService.js
│   ├── reservationService.js
│   └── spaceService.js
├── utils/
│   ├── constants.js
│   ├── dateUtils.js
│   └── permissions.js
├── store/
│   └── useStore.js     # Zustand 전역 상태
└── config/
    └── firebase.js
```

## 🎯 구현 완료

- ✅ 카카오 로그인
- ✅ 캘린더 UI
- ✅ 예약 조회
- ✅ 권한별 접근 제어
- ✅ 스페이스 전환

## 📝 다음 단계 (추가 개발)

- [ ] 예약 생성 모달
- [ ] 예약 취소 기능
- [ ] 스페이스 관리 UI
- [ ] 프로필 이미지 표시
- [ ] 알림톡 연동

## 🔑 환경변수

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender
VITE_FIREBASE_APP_ID=your_app_id

VITE_KAKAO_REST_API_KEY=your_kakao_key
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
```

---

**깔끔하게 리팩토링 완료!** 🎉
