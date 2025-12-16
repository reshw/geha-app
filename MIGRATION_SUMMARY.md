# 알림톡/이메일 통합 - 변경사항 요약

## 🎯 목표 달성
✅ PHP 외부 호스팅 → Netlify Functions 내재화 완료

## 📦 변경된 파일들

### 1. Netlify Functions (3개)

#### `netlify/functions/send-notification.js` ⭐ **NEW - 권장**
- **기능**: 이메일 + 알림톡 통합 처리
- **장점**: 한 번의 API 호출로 모든 알림 처리
- **PHP 기능 완벽 재현**:
  - ✅ HTML 이메일 템플릿 (동일한 디자인)
  - ✅ 알림톡 메시지 + 현관번호 자동생성
  - ✅ 날짜/비용 자동계산
  - ✅ alimtalkEnabled 플래그로 알림톡 제어

#### `netlify/functions/send-email.js` (업데이트)323
- PHP의 이메일 HTML 템플릿 완전 이식
- reshw@naver.com으로 관리자 알림 발송

#### `netlify/functions/send-alimtalk.js` (업데이트)
- PHP의 알림톡 메시지 포맷 완전 재현
- 현관번호, 계좌정보, 버튼 링크 포함

### 2. 환경변수 (.env)
```diff
+ # PHP config.php에서 마이그레이션
+ ALIGO_API_KEY=aam0a3v7mfcn6ar5sn4mkhiwcmw0kruh
+ ALIGO_USER_ID=silversh13
+ ALIGO_SENDER_KEY=2a1782c49b7323eb43017cf41a62730f71407278
+ ALIGO_SENDER=01031148626
+ ALIGO_ACCOUNT=카카오뱅크 7979-38-83356 양석환
```

### 3. 문서
- `ALIMTALK_INTEGRATION.md`: 통합 가이드 전체
- 환경변수 설정 방법
- 사용 예제 코드
- 마이그레이션 체크리스트

## 🔧 프론트엔드 연동 방법

### 기존 (PHP 호스팅)
```javascript
// 외부 서버 호출
const response = await fetch('https://www.lunagarden.co.kr/send_alimtalk.php', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### 새로운 (Netlify Functions)
```javascript
// 내부 함수 호출 - 더 빠르고 안전!
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
    alimtalkEnabled: true  // 중요: false면 이메일만 발송
  })
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   email: { success: true, message: '이메일이 발송되었습니다.' },
//   alimtalk: { success: true, message: '알림톡이 발송되었습니다.' }
// }
```

## 🚀 배포 절차

### 1. Netlify 환경변수 설정 (필수!)
```
Netlify Dashboard 
→ Site settings 
→ Environment variables 
→ Add variable (6개 추가)
```

필요한 변수들:
- ALIGO_API_KEY
- ALIGO_USER_ID
- ALIGO_SENDER_KEY
- ALIGO_SENDER
- ALIGO_ACCOUNT
- RESEND_API_KEY (기존에 있음)

### 2. Git Push
```bash
git add .
git commit -m "feat: PHP 알림톡/이메일을 Netlify Functions로 통합"
git push origin main
```

### 3. 자동 배포 확인
- Netlify가 자동으로 빌드 & 배포
- Functions 탭에서 3개 함수 확인

### 4. 테스트
- 실제 예약 생성해보기
- 이메일 수신 확인 (reshw@naver.com)
- 알림톡 수신 확인 (게스트 폰)

## ✨ 주요 개선사항

### 성능
- ⚡ **응답속도 향상**: 외부 서버 왕복 제거
- 🔒 **보안 강화**: API 키 환경변수로 관리
- 📦 **인프라 단순화**: PHP 서버 제거 가능

### 유지보수
- 📝 **코드 일원화**: 모든 로직이 한 프로젝트에
- 🔄 **버전 관리**: Git으로 변경 이력 추적
- 🐛 **디버깅 용이**: Netlify 로그로 실시간 모니터링

### 비용
- 💰 **호스팅 비용 절감**: PHP 서버 불필요
- 🎯 **종량제**: Functions는 사용한 만큼만 과금

## ⚠️ 체크리스트

배포 전 확인사항:
- [ ] Netlify 환경변수 6개 모두 설정
- [ ] 알리고 템플릿 TW_5514 등록 확인
- [ ] 발신번호 01031148626 등록 확인
- [ ] Resend 도메인 lunagarden.co.kr 인증 확인
- [ ] 프론트엔드 코드 변경 (API 엔드포인트)
- [ ] 실제 테스트 (소액 알림톡 발송)
- [ ] 기존 PHP 서버 모니터링 (트래픽 없으면 제거)

## 📞 문제 발생 시

### Netlify Functions 로그 확인
```
Netlify Dashboard 
→ Functions 
→ send-notification 
→ 최근 실행 로그
```

### 일반적인 문제들

1. **환경변수 누락**
   - 증상: 500 에러, "undefined" 관련 오류
   - 해결: Netlify 대시보드에서 변수 재확인

2. **알림톡 발송 실패**
   - 증상: 이메일은 오지만 알림톡 안옴
   - 해결: 알리고 대시보드에서 발송 이력 확인

3. **이메일 발송 실패**
   - 증상: 알림톡은 오지만 이메일 안옴
   - 해결: Resend 대시보드에서 발송 이력 확인

## 🎉 완료!

이제 PHP 없이 완전히 자체 호스팅으로 알림톡과 이메일을 발송할 수 있습니다!
