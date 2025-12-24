# 정산 자동 마감 기능 설정 가이드

## 개요

각 스페이스별로 설정된 시간에 정산을 자동으로 마감하는 기능입니다.

Netlify Scheduled Functions를 사용하여 매시간 자동 실행되며, 각 스페이스의 설정을 확인하여 마감 시간이 되면 자동으로 정산을 마감합니다.

**추가 비용 없음** - Netlify에서 무료로 제공하는 Scheduled Functions 사용

## 아키텍처

```
Netlify Scheduled Functions (매시간 자동 실행)
    ↓
settlement-auto-close.js
    ↓
Firestore 조회 (/spaces/{spaceId}/settings/settlement)
    ↓ (마감 시간 확인)
Firestore 업데이트 (/spaces/{spaceId}/settlement/{weekId})
```

## 스페이스별 설정

각 스페이스 매니저는 앱 내에서 다음과 같이 설정할 수 있습니다:

1. **정산 주기**: 매주 / 매달 / 매년
2. **마감 요일/날짜**:
   - 매주: 월요일 ~ 일요일 선택
   - 매달: 1일 ~ 31일 선택
   - 매년: 몇 월 몇 일 선택
3. **마감 시간**: 00:00 ~ 23:59

설정 경로: 앱 → 더보기 → 정산 자동화 설정

## 설정 방법

### 1. Firebase Admin SDK 서비스 계정 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 → 프로젝트 설정 → 서비스 계정
3. "새 비공개 키 생성" 클릭
4. JSON 파일 다운로드

### 2. Netlify 환경 변수 설정

Netlify 대시보드에서 환경 변수 설정:

- `FIREBASE_SERVICE_ACCOUNT`: Firebase 서비스 계정 JSON 전체 내용 (압축된 한 줄로)

설정 경로: Netlify Dashboard → Site Settings → Environment Variables

**중요**: JSON을 한 줄로 압축하여 입력하세요.

### 3. Netlify Functions 패키지 설치

```bash
cd netlify/functions
npm install firebase-admin
```

또는 프로젝트 루트에서:

```bash
npm install --prefix netlify/functions firebase-admin
```

### 4. 배포

```bash
git add .
git commit -m "정산 자동 마감 기능 추가"
git push
```

Netlify가 자동으로 배포하며, Scheduled Function이 등록됩니다.

## 동작 방식

### 1. 스케줄

- **실행 주기**: 매시간 정각 (Netlify가 자동 실행)
- **체크 방식**: 각 스페이스의 설정을 읽어 현재 시간과 비교
- **마감 대상**: 각 주기에 따라 다름
  - 매주: 지난 주 정산 마감
  - 매달: 지난 달 정산 마감
  - 매년: 지난 해 정산 마감

### 2. 처리 로직

1. Netlify가 매시간 정각에 `settlement-auto-close` 함수 자동 실행
2. 모든 스페이스 조회
3. 각 스페이스의 `/settings/settlement` 설정 조회
4. 자동 마감이 활성화되어 있고, 현재 시간이 설정 시간(±5분)인지 확인
5. 조건 충족 시 해당 주기의 정산 마감
   - `status: 'active'` → `status: 'settled'`
   - `autoSettled: true` 플래그 추가
   - `settledBySchedule: {...}` 어떤 스케줄에 의해 마감되었는지 기록
6. 결과 요약 로그 출력

### 3. 예외 처리

- 정산 설정이 없는 경우 → 스킵 (no_settings)
- 자동 마감이 비활성화된 경우 → 스킵 (disabled)
- 마감 시간이 아닌 경우 → 스킵 (not_time)
- 정산 데이터가 없는 경우 → 스킵 (no_data)
- 이미 정산 완료된 경우 → 스킵 (already_settled)
- 오류 발생 시 → 로그 기록 및 계속 진행 (error)

## 모니터링

### Netlify Functions 로그 확인

1. Netlify Dashboard → Functions 탭
2. `settlement-auto-close` 선택
3. Logs 확인

또는 Netlify CLI로 로그 확인:

```bash
netlify functions:log settlement-auto-close
```

### 로그 예시

```
🤖 Netlify Scheduled Function 실행: 2025-01-06T09:00:00.000Z
🏠 스페이스: 조강 308 (308308)
  ✅ 마감 시간 일치! 정산 마감 시작...
  📅 마감 대상 주차: 2024-W52
  🔄 정산 마감 처리 중...
  ✅ 정산 마감 완료

📊 자동 마감 체크 완료: {
  timestamp: "2025-01-06T09:00:00.000Z",
  totalSpaces: 3,
  settled: 1,
  notTime: 2,
  ...
}
```

## 테스트 방법

### 1. 앱에서 설정
1. 앱 → `더보기` → `정산 자동화 설정`
2. 자동화 활성화 ON
3. **매주** 선택
4. 현재 시간 기준 **5-10분 후** 시간 설정
   - 예: 현재 14:35 → 14:40으로 설정
5. 저장

### 2. 자동 마감 대기
- Netlify가 매시간 정각에 자동 실행
- 설정 시간 (±5분) 되면 자동으로 정산 마감
- Netlify Functions 로그에서 확인

### 3. Scheduled Function 수동 테스트

Netlify CLI 설치:
```bash
npm install -g netlify-cli
```

로컬 테스트:
```bash
# .env 파일에 FIREBASE_SERVICE_ACCOUNT 설정
netlify dev

# 다른 터미널에서 함수 직접 호출
curl http://localhost:8888/.netlify/functions/settlement-auto-close
```

## 트러블슈팅

### 문제: Scheduled Function이 실행되지 않음

**해결책:**
1. Netlify 배포가 완료되었는지 확인
2. `netlify.toml`에 schedule 설정이 있는지 확인
3. Netlify Dashboard → Functions에서 `settlement-auto-close` 함수가 보이는지 확인
4. Netlify Functions 로그 확인

### 문제: Firebase 인증 실패

**해결책:**
```bash
# Netlify 환경 변수 확인
netlify env:list

# FIREBASE_SERVICE_ACCOUNT가 올바른 JSON인지 확인
# JSON을 한 줄로 압축했는지 확인
```

### 문제: 설정 시간에 실행되지 않음

**원인:**
- Netlify Scheduled Functions는 **매시간 정각**에만 실행
- ±5분 허용이므로 최대 55분~5분 사이에 실행

**해결책:**
- 14:30 설정 시 → 14시 정각에 체크 → 시간 차이 30분 > 5분 → 실행 안 됨
- 14:00 ~ 14:05 사이로 설정해야 14시 정각 실행 시 마감됨
- 또는 15:00으로 설정하여 15시 정각에 실행되도록

## 주의사항

1. **타임존**: 서버는 UTC 시간대를 사용합니다
   - Netlify Functions는 UTC 기준으로 실행
   - 앱에서는 한국 시간으로 표시되지만, 서버는 UTC 기준
   - 한국 시간 18:00 = UTC 09:00

2. **시간 오차**: ±5분 허용
   - 18:00 설정 시 17:55 ~ 18:05 사이에 실행되면 마감
   - 매시간 정각에만 체크하므로 정확한 시간 맞추기 어려움

3. **테스트 방법**:
   - 현재 시간이 14:35라면 → 15:00으로 설정
   - 15시 정각에 Netlify가 실행하면 자동 마감
   - 또는 14:00으로 설정하고 다음 정각(15시)까지 대기

4. **실행 빈도**: 매시간 정각 (1시간에 1번)
   - 00:00, 01:00, 02:00, ... 23:00

5. **비용**: 완전 무료
   - Netlify Scheduled Functions는 무료 플랜에서도 사용 가능
   - 월 125,000 function requests 무료 (초과 시 $25/백만 requests)
   - 매시간 실행 = 월 720회 실행 = 무료 범위 내

6. **알림 발송**: 현재는 정산 마감만 수행합니다. 알림톡 발송은 별도 구현 필요.

## FAQ

### Q: 정확히 18:00에 실행하고 싶은데?

A: Netlify Scheduled Functions는 매시간 정각에만 실행됩니다. 18:00 ~ 18:05 사이를 목표로 설정하세요.

### Q: 테스트를 빨리 하고 싶은데?

A: 현재 시간의 다음 정각 시간으로 설정하세요.
- 예: 현재 14:35 → 15:00으로 설정 → 15시 정각에 실행
- 또는 Netlify CLI로 로컬 테스트

### Q: 여러 스페이스가 각각 다른 시간에 마감되나요?

A: 네! 각 스페이스가 독립적인 설정을 가집니다. 308호는 월요일 18:00, 408호는 일요일 20:00 이런 식으로 설정 가능합니다.

### Q: 자동 마감이 실행되었는지 어떻게 확인하나요?

A: Netlify Dashboard → Functions → settlement-auto-close → Logs에서 확인 가능합니다.

## 향후 개선 사항

- [ ] 정산 완료 시 알림톡 자동 발송
- [ ] Slack/Discord 알림 연동
- [ ] 실행 결과 이메일 알림
- [ ] 더 정확한 시간 제어 (분 단위 스케줄)
