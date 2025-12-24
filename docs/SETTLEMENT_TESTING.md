# 정산 기능 테스트 가이드

## 1. 주차별 리스트 보기 테스트

### 테스트 단계

1. **정산 페이지 접속**
   - 앱에서 정산 페이지로 이동
   - 현재 주차가 표시되는지 확인

2. **주차 네비게이션 테스트**
   - ◀ 버튼 클릭 → 이전 주차로 이동 확인
   - ▶ 버튼 클릭 → 다음 주차로 이동 확인
   - "이번 주" 버튼 클릭 → 현재 주차로 복귀 확인

3. **주차 목록 테스트**
   - 우측 상단 "목록" 버튼 클릭
   - 모든 정산 내역이 최신순으로 표시되는지 확인
   - 각 주차 클릭 시 해당 주차로 이동하는지 확인

4. **상태 표시 확인**
   - 정산 완료된 주차에 "✓ 정산완료" 배지 표시 확인
   - 현재 주차에 "이번 주" 배지 표시 확인
   - 정산 내역이 없는 주차에 "정산 내역 없음" 표시 확인

### 예상 결과

✅ 주차 간 이동이 부드럽게 작동
✅ 과거/미래 주차 조회 가능
✅ 정산 완료된 주차는 "정산완료" 버튼 미표시 (이번 주만 표시)

---

## 2. 주차 전환 로직 테스트

### 테스트 단계

1. **새 주차 시작 시뮬레이션**
   - 개발자 도구에서 `getWeekId()` 함수로 새 주차 생성
   - 또는 실제 주가 바뀔 때까지 대기

2. **이전 주차 미정산 경고 확인**
   - 브라우저 콘솔에서 경고 메시지 확인
   - "이전 주차가 아직 정산 완료되지 않았습니다" 로그 확인

3. **정산 완료 후 새 주차 생성**
   - 이전 주차 정산 완료
   - 새 주차 시작 시 경고 없이 생성되는지 확인

### 예상 결과

✅ 새 주차 생성 시 이전 주차 상태 자동 체크
✅ 미정산 주차가 있으면 콘솔에 경고 표시
⚠️ 현재는 경고만 표시하고, 자동 마감은 스케줄러가 수행

---

## 3. 자동 마감 기능 테스트

### 사전 준비

1. **환경 변수 설정 확인**
   - Netlify: `FIREBASE_SERVICE_ACCOUNT`, `SETTLEMENT_AUTO_CLOSE_SECRET`
   - GitHub Secrets: `NETLIFY_FUNCTION_URL`, `SETTLEMENT_AUTO_CLOSE_SECRET`

2. **Firebase 서비스 계정 권한 확인**
   - Firestore 읽기/쓰기 권한 있는지 확인

### 수동 테스트 (배포 전)

#### 로컬 테스트

```bash
# 1. netlify-cli 설치 (설치되지 않았다면)
npm install -g netlify-cli

# 2. 환경 변수 설정
# .env 파일 생성 또는 netlify.toml에 추가

# 3. 로컬에서 functions 실행
netlify dev

# 4. 다른 터미널에서 함수 호출
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  http://localhost:8888/.netlify/functions/settlement-auto-close
```

### 배포 후 테스트

#### 1. Netlify Functions 로그 확인

1. Netlify Dashboard → Functions 탭
2. `settlement-auto-close` 선택
3. Logs 확인

또는 CLI로:
```bash
netlify functions:log settlement-auto-close
```

#### 2. 수동 함수 호출 테스트 (로컬)

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로컬에서 functions 실행
netlify dev

# 다른 터미널에서
curl http://localhost:8888/.netlify/functions/settlement-auto-close
```

예상 응답:
```json
{
  "timestamp": "2025-01-06T09:00:00.000Z",
  "totalSpaces": 3,
  "settled": 1,
  "notTime": 2,
  "disabled": 0,
  "noSettings": 0,
  "results": [...]
}
```

#### 3. 스케줄 실행 대기

- Netlify가 매시간 정각에 자동 실행
- 설정 시간(±5분)이 되면 자동으로 마감
- Netlify Functions 로그에서 실행 기록 확인

### 검증 체크리스트

- [ ] Netlify Function이 정상 배포됨
- [ ] `netlify.toml`에 schedule 설정 추가됨
- [ ] 환경 변수가 올바르게 설정됨
- [ ] Firebase 서비스 계정 인증 성공
- [ ] 스페이스 정산 설정 조회 성공
- [ ] 마감 시간 체크 로직 동작 확인
- [ ] `status: 'active'` → `status: 'settled'` 업데이트 성공
- [ ] `autoSettled: true` 플래그 추가됨
- [ ] `settledBySchedule` 정보 기록됨
- [ ] Netlify Scheduled Function이 정상 작동
- [ ] 실행 로그가 Netlify에 정상적으로 기록됨

---

## 4. 엣지 케이스 테스트

### 1. 정산 데이터가 없는 경우

- 테스트: 영수증이 없는 주차
- 예상: 정산 마감 스킵, `status: 'no_data'` 반환

### 2. 이미 정산 완료된 경우

- 테스트: 수동으로 정산 완료 후 자동 마감 실행
- 예상: 스킵, `status: 'already_settled'` 반환

### 3. 여러 스페이스 동시 처리

- 테스트: 3개 이상의 스페이스에서 각각 다른 상태
- 예상: 모든 스페이스 개별 처리, 한 곳 실패해도 다른 곳 계속 진행

### 4. 인증 실패 테스트

- 테스트: 잘못된 Secret 키로 호출
- 예상: `401 Unauthorized` 응답

---

## 5. 통합 테스트 시나리오

### 시나리오 1: 정상 흐름

1. 월요일~일요일: 영수증 제출 및 정산 데이터 축적
2. 일요일 23:59: 주차 종료
3. 월요일 18:00: 자동 마감 실행
4. 확인: 지난 주 정산이 `settled` 상태로 변경됨
5. 확인: 새 주차는 `active` 상태로 생성됨

### 시나리오 2: 수동 마감 후 자동 마감

1. 일요일: 매니저가 수동으로 정산 완료
2. 월요일 18:00: 자동 마감 실행
3. 확인: 이미 정산 완료되어 스킵됨

### 시나리오 3: 정산 데이터 없음

1. 월요일~일요일: 영수증 제출 없음
2. 월요일 18:00: 자동 마감 실행
3. 확인: 정산 데이터 없음으로 스킵됨

---

## 문제 해결

### 문제: Scheduled Function이 실행되지 않음

**해결책:**
1. Netlify 배포가 완료되었는지 확인
2. `netlify.toml`에 schedule 설정이 있는지 확인:
   ```toml
   [functions."settlement-auto-close"]
     schedule = "@hourly"
   ```
3. Netlify Dashboard → Functions에서 함수 확인
4. Netlify Functions 로그 확인

### 문제: 500 Internal Server Error

**해결책:**
```bash
# Netlify 함수 로그 확인
netlify functions:log settlement-auto-close

# 또는 Netlify 대시보드에서 Functions → Logs 확인
```

### 문제: Firebase 인증 실패

**해결책:**
```bash
# Netlify 환경 변수 확인
netlify env:list

# FIREBASE_SERVICE_ACCOUNT가 올바른 JSON인지 확인
```

### 문제: 설정 시간에 마감되지 않음

**원인:**
- Netlify는 매시간 정각에만 실행
- ±5분 허용 범위 확인 필요

**해결책:**
- 정각 시간으로 설정 (예: 18:00, 19:00)
- 또는 정각 ±5분 내 (예: 18:03)

---

## 모니터링 및 유지보수

### 주간 체크리스트

- [ ] Netlify Functions 로그 확인 (자동 마감 성공 여부)
- [ ] 각 스페이스의 정산 마감 시간 확인
- [ ] 오류 발생 시 원인 파악 및 수정

### 월간 체크리스트

- [ ] Firebase 서비스 계정 권한 유효성 확인
- [ ] Netlify Functions 사용량 확인 (무료 범위 내인지)
- [ ] 로그 축적 관리
- [ ] 각 스페이스의 설정 검토

### 연간 체크리스트

- [ ] Netlify Functions 총 사용량 리뷰
- [ ] Firebase Admin SDK 버전 업데이트 검토
- [ ] 전체 시스템 아키텍처 리뷰
- [ ] 알림 발송 기능 추가 검토
