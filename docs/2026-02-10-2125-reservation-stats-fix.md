# 예약 통계 데이터 로드 오류 수정

**날짜:** 2026-02-10 21:25
**작업자:** Claude Code
**관련 페이지:** ReservationStatsPage

## 문제 설명

예약 통계 페이지(`ReservationStatsPage`)에서 데이터를 불러오지 못하는 문제가 발생했습니다.

- **증상 1:** 통계 페이지에서 예약 데이터가 표시되지 않음
- **증상 2:** 관리자 통계에서 모든 회원의 합계가 0박으로 표시됨
- **영향 범위:** 숙박 랭킹, 게스트 초대 랭킹 등 모든 통계 데이터

## 원인 분석

### 1. Firebase Firestore 쿼리 제약사항 위반

`reservationService.js`의 `getAllReservations` 함수에서 **여러 필드에 대한 범위 필터를 동시에 사용**하는 쿼리를 작성했습니다:

```javascript
// 문제가 있던 코드
q = query(
  reservesRef,
  where('checkIn', '<=', end),      // 범위 필터 1
  where('checkOut', '>=', start),   // 범위 필터 2
  orderBy('checkIn', 'desc')
);
```

**Firebase Firestore의 제약사항:**
- 두 개 이상의 필드에 대한 범위 필터(`<`, `<=`, `>`, `>=`)를 동시에 사용할 수 없음
- Composite index를 생성해도 해결되지 않는 경우가 있음
- 이로 인해 쿼리가 실패하거나 데이터를 가져오지 못함

### 2. 멤버 데이터 로드 실패

`ReservationStatsPage.jsx`에서 `selectedSpace.members`를 사용하려고 했으나 해당 데이터가 존재하지 않았습니다:

```javascript
// 문제가 있던 코드
const membersList = selectedSpace?.members || [];  // members 필드가 없음
setMembers(membersList);  // 빈 배열이 설정됨
```

**실제 데이터 구조:**
- 멤버 정보는 `selectedSpace.members`가 아니라 `spaces/{spaceId}/assignedUsers` 서브컬렉션에 저장됨
- 이로 인해 통계 계산 시 주주 필터링이 안 되고, 모든 통계가 0으로 표시됨

## 해결 방법

### 1. 하이브리드 필터링 방식 적용 (예약 데이터)

**서버(Firebase) 측:** `checkIn` 필드만으로 1차 필터링
**클라이언트 측:** `checkOut` 필드로 2차 필터링

```javascript
// 수정된 코드
if (startDate) {
  // Firebase: checkIn만으로 필터링
  q = query(
    reservesRef,
    where('checkIn', '>=', start),
    orderBy('checkIn', 'asc')
  );
}

// 클라이언트: checkOut으로 추가 필터링
snapshot.forEach((docSnap) => {
  const checkIn = data.checkIn.toDate();
  const checkOut = data.checkOut.toDate();

  // 날짜 겹침 체크
  if (startDate && endDate) {
    if (checkIn > endDate || checkOut < startDate) {
      return; // 필터링
    }
  }

  reservations.push({ ... });
});
```

**장점:**
- Firebase 쿼리 제약사항 회피
- Composite index 불필요
- 추가 로그로 디버깅 용이
- 클라이언트 필터링으로 정확한 기간 필터링 보장

### 2. 멤버 데이터 직접 조회 (assignedUsers 서브컬렉션)

**`authService`에 새 함수 추가:**

```javascript
async getSpaceMembers(spaceId) {
  const assignedUsersRef = collection(db, `spaces/${spaceId}/assignedUsers`);
  const snapshot = await getDocs(assignedUsersRef);

  const memberList = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    memberList.push({
      userId: docSnap.id,
      displayName: data.displayName || '이름 없음',
      userType: data.userType || 'guest',
      // ...
    });
  });

  return memberList;
}
```

**ReservationStatsPage에서 사용:**

```javascript
// 수정 전
const membersList = selectedSpace?.members || [];

// 수정 후
const membersList = await authService.getSpaceMembers(spaceId);
```

**장점:**
- 실제 Firebase 데이터 구조와 일치
- `MemberManagePage`와 동일한 로직 사용 (일관성)
- userType 정보를 포함하여 주주 필터링 가능

## 변경된 파일

### 1. `src/services/reservationService.js`

- **함수:** `getAllReservations(spaceId, startDate, endDate)`
- **라인:** 602-658

**주요 변경사항:**
1. Firebase 쿼리에서 `checkOut` 범위 필터 제거
2. `checkIn >= startDate`만 사용
3. 클라이언트 측 날짜 겹침 체크 추가
4. 디버깅용 console.log 추가

### 2. `src/pages/ReservationStatsPage.jsx`

- **함수:** `loadData()`
- **라인:** 38-98

**주요 변경사항:**
1. `selectedSpace.members` 대신 `authService.getSpaceMembers(spaceId)` 사용
2. Firebase `spaces/{spaceId}/assignedUsers` 컬렉션에서 직접 멤버 조회
3. 멤버 로드 로그 추가

### 3. `src/services/authService.js`

- **함수:** `getSpaceMembers(spaceId)` (신규 추가)
- **라인:** 238-258

**주요 변경사항:**
1. 스페이스 멤버 목록을 조회하는 새로운 함수 추가
2. `spaces/{spaceId}/assignedUsers` 서브컬렉션에서 멤버 정보 조회
3. userId, displayName, userType 등 필요한 정보 반환

## 테스트 방법

### 1. 통계 페이지 접속
```
/reservations/stats
```

### 2. 기간별 데이터 확인
- **이번 달:** 현재 월의 예약만 표시되는지 확인
- **지난 달:** 이전 월의 예약만 표시되는지 확인
- **이번 시즌 (25.11~26.03):** 해당 기간의 예약만 표시
- **지난 시즌 (24.11~25.03):** 해당 기간의 예약만 표시
- **전체:** 모든 예약 표시

### 3. 콘솔 로그 확인
```
📊 통계용 예약 조회 시작, spaceId: xxx
기간: [startDate] ~ [endDate]
📋 Firebase에서 조회된 예약 수: [count]
✅ 필터링 후 예약 수: [count]
```

### 4. 통계 데이터 확인
- 숙박 랭킹이 표시되는지
- 게스트 초대 랭킹이 표시되는지
- 내 통계 카드에 데이터가 표시되는지

## 추가 개선 사항

### 향후 고려사항

1. **인덱스 최적화**
   - `checkIn` 필드에 대한 단일 인덱스 확인
   - 정렬 방향 최적화 (asc vs desc)

2. **캐싱 추가**
   - 동일 기간 재조회 시 캐싱 활용
   - 페이지 이동 후 재방문 시 성능 개선

3. **에러 핸들링 강화**
   - 쿼리 실패 시 사용자 친화적 에러 메시지
   - 재시도 로직 추가

## 참고 자료

- [Firebase Firestore Query Limitations](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)
- ReservationStatsPage: `src/pages/ReservationStatsPage.jsx:38-98`
- getAllReservations: `src/services/reservationService.js:602-658`

## 배포 체크리스트

- [x] 코드 수정 완료
- [ ] 로컬 테스트 완료
- [ ] 개발 환경 배포
- [ ] 기능 테스트 (모든 기간 옵션)
- [ ] 프로덕션 배포
- [ ] 모니터링 (콘솔 에러 확인)

---

**다음 작업 시 참고:**
- Firebase 쿼리를 작성할 때는 항상 제약사항 확인
- 여러 필드 범위 필터가 필요한 경우 클라이언트 필터링 고려
- 통계 데이터는 캐싱으로 성능 최적화 가능
