# 알림톡/이메일 통합 가이드

## 📋 개요

PHP 기반 외부 호스팅을 Netlify Functions로 완전히 내재화했습니다.

### 기존 구조 (PHP)
```
외부 호스팅 서버
├── config.php (API 인증 정보)
├── send_alimtalk.php (알림톡 + 이메일 처리)
└── 앱에서 외부 URL 호출
```

### 새로운 구조 (Netlify Functions)11231
```
Netlify Functions
├── send-notification.js (통합: 이메일 + 알림톡)
├── send-email.js (이메일만)
├── send-alimtalk.js (알림톡만)
└── 환경변수로 인증 정보 관리
```

## 🚀 사용 방법

### 1. 통합 엔드포인트 (권장)
이메일과 알림톡을 한 번에 처리합니다.

```javascript
const response = await fetch('/.netlify/functions/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '홍길동',
    phone: '010-1234-5678',
    checkIn: '2025-11-15',
    checkOut: '2025-11-17',
    gender: '남성',
    birthYear: '1990',
    hostDisplayName: '김주주',
    spaceName: '조강308호',
    memo: '특별 요청사항',
    alimtalkEnabled: true  // false면 알림톡 미발송
  })
});

const result = await response.json();
// {
//   success: true,
//   email: { success: true, message: '이메일이 발송되었습니다.' },
//   alimtalk: { success: true, message: '알림톡이 발송되었습니다.' }
// }
```

### 2. 개별 엔드포인트

#### 이메일만 발송
```javascript
await fetch('/.netlify/functions/send-email', {
  method: 'POST',
  body: JSON.stringify({ /* 동일한 데이터 */ })
});
```

#### 알림톡만 발송
```javascript
await fetch('/.netlify/functions/send-alimtalk', {
  method: 'POST',
  body: JSON.stringify({ /* 동일한 데이터 */ })
});
```

## 🔑 환경변수 설정

Netlify 대시보드에서 다음 환경변수를 설정해야 합니다:

```bash
# 알리고 (Alimtalk)
ALIGO_API_KEY=aam0a3v7mfcn6ar5sn4mkhiwcmw0kruh
ALIGO_USER_ID=silversh13
ALIGO_SENDER_KEY=2a1782c49b7323eb43017cf41a62730f71407278
ALIGO_SENDER=01031148626
ALIGO_ACCOUNT=카카오뱅크 7979-38-83356 양석환

# Resend (Email)
RESEND_API_KEY=re_St6PqQSa_DkQZt8mUPpiRd2RgKuTyDzBb
```

### Netlify 환경변수 설정 방법
1. Netlify 대시보드 접속
2. Site settings → Environment variables
3. 위의 변수들을 각각 추가
4. 재배포 (자동으로 트리거됨)

## 📧 이메일 템플릿

PHP 템플릿과 동일한 HTML 이메일이 발송됩니다:

- **수신자**: reshw@naver.com (고정)
- **내용**:
  - 예약 정보 (입실일, 퇴실일, 숙박기간)
  - 게스트 정보 (이름, 연락처, 성별, 생년, 초대 주주)
  - 이용료 정보 (총액, 계좌번호)
  - 메모 (선택사항)

## 💬 알림톡 템플릿

게스트에게 발송되는 알림톡 메시지:

```
홍길동님(꺄아)
조강 308 게스트 예약되었습니다.

[예약안내]
· 입실일 : 2025-11-15
· 퇴실일 : 2025-11-17
   - 2박 3일

[이용료]
· 게스트 비용 : 60,000원(3만원/1박)
· 카카오뱅크 7979-38-83356 양석환

[현관 번호] : 567811*
(입실일~퇴실일에만 사용 가능합니다)

[메모]
특별 요청사항
```

**주요 기능**:
- 현관 비밀번호 자동 생성 (전화번호 뒤 4자리 + "11*")
- 이용료 자동 계산 (3만원/1박)
- 버튼: "게스트 현황 보기" → https://www.lunagarden.co.kr/guest

## 🔄 마이그레이션 체크리스트

- [x] PHP config.php → 환경변수로 이전
- [x] 이메일 HTML 템플릿 PHP → JS 변환
- [x] 알림톡 메시지 포맷 PHP → JS 변환
- [x] 날짜 계산 로직 동일하게 구현
- [x] 에러 처리 및 로깅
- [x] CORS 헤더 설정
- [ ] Netlify 환경변수 설정
- [ ] 프론트엔드에서 새 엔드포인트 호출 테스트
- [ ] 실제 발송 테스트

## 🧪 로컬 테스트

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로컬에서 Functions 테스트
netlify dev

# 테스트 요청
curl -X POST http://localhost:8888/.netlify/functions/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트",
    "phone": "01012345678",
    "checkIn": "2025-11-15",
    "checkOut": "2025-11-17",
    "alimtalkEnabled": true
  }'
```

## ⚠️ 주의사항

1. **템플릿 코드**: 알림톡 템플릿 코드 `TW_5514`가 알리고에 등록되어 있어야 합니다.
2. **발신번호**: `01031148626`이 알리고에 등록된 발신번호여야 합니다.
3. **이메일 도메인**: Resend에서 `lunagarden.co.kr` 도메인이 인증되어 있어야 합니다.
4. **요금**: 알림톡 1건당 요금이 부과됩니다. `alimtalkEnabled`로 제어하세요.

## 📚 참고 문서

- [Netlify Functions 문서](https://docs.netlify.com/functions/overview/)
- [알리고 API 문서](https://smartsms.aligo.in/admin/api/info.html)
- [Resend API 문서](https://resend.com/docs)

## 🎯 다음 단계

1. Netlify 환경변수 설정
2. 프론트엔드 코드에서 새 엔드포인트 연동
3. 실제 예약으로 테스트
4. 기존 PHP 서버 제거
