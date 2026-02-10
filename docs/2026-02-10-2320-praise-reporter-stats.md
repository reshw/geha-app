# 칭찬 제보자 통계 기능 추가

**날짜:** 2026-02-10 23:20
**작업자:** Claude Code
**관련 페이지:** PraisePage, PraiseStatsView (신규)

## 요구사항

칭찬 제보자(userId 기준) 통계를 관리자만 볼 수 있도록 추가
- **통계 항목**: 제보 건수 (approved 상태 칭찬만 카운트)
- **기간 필터**: 최근 4개월 (기본값) + 드롭다운 (4/3/2/1개월)
- **권한**: 관리자(manager, vice-manager)만 접근
- **UI 구조**: 게시판 / 승인대기중 / 통계 탭 메뉴

---

## 구현 내용

### 1. 페이지 구조 변경

#### Before
```
PraisePage
├── 상태 필터 (관리자만): 승인됨 / 대기중
├── 카테고리 필터
└── 칭찬 카드 목록
```

#### After
```
PraisePage
├── 메인 탭: 게시판 / 승인대기중(관리자만) / 통계(관리자만)
│
├── [게시판 탭]
│   ├── 카테고리 필터
│   └── 승인된 칭찬 목록
│
├── [승인대기중 탭] (관리자만)
│   ├── 카테고리 필터
│   └── 대기중 칭찬 목록
│
└── [통계 탭] (관리자만)
    ├── 기간 필터 (4/3/2/1개월)
    ├── 총 제보 건수
    └── 제보자 순위
```

---

## 변경된 파일

### 1. `src/services/praiseService.js`

**신규 메서드:** `getReporterStats(spaceId, startDate, endDate)`

#### 기능
- Firebase에서 approved 칭찬만 조회
- 기간 필터링 (하이브리드 방식)
  - Firebase: `createdAt >= startDate`
  - 클라이언트: `createdAt <= endDate`
- userId별 그룹핑 및 카운트
- authService로 사용자 정보 조회
- 제보 건수 기준 내림차순 정렬

#### 반환 데이터 구조
```javascript
[
  {
    userId: "user_id",
    reportCount: 10,
    userName: "실명",
    profileImage: "url",
    userType: "shareholder"
  },
  // ...
]
```

---

### 2. `src/components/praise/PraiseStatsView.jsx` (신규)

**역할:** 제보자 통계 화면 컴포넌트

#### 주요 기능
- 기간 필터 (select 드롭다운)
  - 최근 4개월 (기본값)
  - 최근 3개월
  - 최근 2개월
  - 최근 1개월
- 총 제보 건수 표시
- 제보자 순위 표시
  - 1위: 🏆 (노란색 트로피)
  - 2위: 🥈 (회색 메달)
  - 3위: 🥉 (주황색 메달)
  - 4위~: 숫자만

#### 디자인 특징
- `ReservationStatsPage.jsx` 스타일 참고
- 그래디언트 배경 (파란색)
- 프로필 이미지 또는 이니셜 아바타
- 카드 형태 레이아웃
- 반응형 (max-width: 600px)

---

### 3. `src/pages/PraisePage.jsx`

#### 상태 관리 변경
```javascript
// Before
const [statusFilter, setStatusFilter] = useState('approved');
const [categoryFilter, setCategoryFilter] = useState('all');

// After
const [mainTab, setMainTab] = useState('board'); // 'board' | 'pending' | 'stats'
const [categoryFilter, setCategoryFilter] = useState('all');
```

#### 메인 탭 UI
```jsx
<div className="flex gap-2 bg-white p-1 rounded-lg">
  <button onClick={() => setMainTab('board')}>
    게시판
  </button>

  {isManager && (
    <>
      <button onClick={() => setMainTab('pending')}>
        승인대기중
      </button>
      <button onClick={() => setMainTab('stats')}>
        통계
      </button>
    </>
  )}
</div>
```

#### 조건부 렌더링
```jsx
{mainTab === 'stats' ? (
  <PraiseStatsView spaceId={selectedSpace.id} />
) : (
  <>
    {/* 카테고리 필터 */}
    {/* 칭찬 목록 */}
  </>
)}
```

---

## 기술적 구현 세부사항

### Firebase 쿼리 (Firestore 제약 회피)

**문제:** 여러 범위 필터 동시 사용 불가
```javascript
// ❌ 불가능
where('createdAt', '>=', start)
where('createdAt', '<=', end)
```

**해결:** 하이브리드 필터링
```javascript
// ✅ Firebase: 시작일만 필터
where('status', '==', 'approved')
where('createdAt', '>=', startTimestamp)

// ✅ 클라이언트: 종료일 필터
snapshot.forEach(docSnap => {
  const createdDate = data.createdAt.toDate();
  if (createdDate > endDate) return;
  // ...
});
```

### userId별 그룹핑
```javascript
const userCountMap = new Map();

snapshot.forEach(docSnap => {
  const userId = data.userId;
  userCountMap.set(userId, (userCountMap.get(userId) || 0) + 1);
});
```

### 사용자 정보 조회
```javascript
const authService = (await import('./authService.js')).default;
const userIds = Array.from(userCountMap.keys());
const userProfiles = await authService.getUserProfiles(userIds);
```

### 정렬
```javascript
stats.sort((a, b) => b.reportCount - a.reportCount);
```

---

## 권한 제어

### 관리자 체크
```javascript
const isManager = selectedSpace?.userType === 'manager' ||
                  selectedSpace?.userType === 'vice-manager';
```

### 탭 표시 제어
- **게시판**: 모든 사용자
- **승인대기중**: 관리자만 (`isManager === true`)
- **통계**: 관리자만 (`isManager === true`)

---

## UI/UX 특징

### 1. 탭 디자인
- **게시판**: 파란색 (`bg-blue-500`)
- **승인대기중**: 주황색 (`bg-amber-500`)
- **통계**: 보라색 (`bg-purple-500`)
- 활성 탭: 배경색 + 그림자
- 비활성 탭: 회색 텍스트 + hover 효과

### 2. 통계 화면
```
PraiseStatsView
├── 헤더 (흰색 카드)
│   ├── 기간 필터 (오른쪽 select)
│   └── 총 제보 건수 (파란색 그래디언트)
│
└── 제보자 순위 (흰색 카드)
    ├── 1위: 🏆 노란색
    ├── 2위: 🥈 회색
    ├── 3위: 🥉 주황색
    └── 4위~: 숫자
```

### 3. 로딩 상태
- 스피너 + "통계를 불러오는 중..."
- 데이터 없을 때: "아직 칭찬이 없습니다"

### 4. 반응형
- 모바일 우선 (max-width: 600px)
- 탭 버튼: flex-1 (균등 분할)
- 통계 카드: 스크롤 가능

---

## 테스트 가이드

### 1. 관리자 계정
1. 로그인 (manager 또는 vice-manager)
2. 칭찬 페이지 접속 (`/praise`)
3. "통계" 탭 클릭
4. 기간 필터 변경 (4→3→2→1개월)
5. 제보 건수 확인
6. 순위 정확성 확인

### 2. 일반 사용자 계정
1. 로그인 (guest 또는 shareholder)
2. 칭찬 페이지 접속
3. "통계" 탭이 보이지 않는지 확인
4. "승인대기중" 탭도 보이지 않는지 확인

### 3. 데이터 정확성
- 칭찬 5건 제보 → 통계에 5건으로 표시되는지
- 다른 사용자가 제보 → 순위 변동 확인
- 기간 필터 변경 → 건수 변화 확인

### 4. 성능
- 칭찬 100건 이상 있을 때
- 로딩 시간 (<2초)
- 콘솔 에러 없는지 확인

---

## 주의사항

### 1. 주간 닉네임 vs 실명
- **칭찬 카드**: 주간 닉네임 + 동물 이모지 (익명성 보장)
- **통계**: 실명 (`users/{userId}.displayName`) - 관리자만 접근

### 2. 통계 데이터 범위
- **approved 상태만** 카운트
- pending, rejected 상태는 제외
- createdAt 기준 (eventDate 아님)

### 3. 기간 계산
```javascript
const today = new Date();
today.setHours(23, 59, 59, 999);

const startDate = new Date(today);
startDate.setMonth(today.getMonth() - period);
startDate.setHours(0, 0, 0, 0);
```

---

## 향후 확장 가능성

### 1. 추가 통계
- 카테고리별 제보 건수
- 월별 트렌드 그래프
- 사용자별 카테고리 분포

### 2. 엑셀 다운로드
- 통계 데이터 CSV/Excel 내보내기

### 3. 알림 기능
- N회 제보 시 배지 부여
- 랭킹 변동 알림

### 4. 추가 필터
- 연도별 선택
- 커스텀 날짜 범위

---

## 파일 요약

### 신규
- `src/components/praise/PraiseStatsView.jsx` (169 lines)

### 수정
- `src/services/praiseService.js` (+60 lines)
- `src/pages/PraisePage.jsx` (리팩토링)

### 총 변경 사항
- 3개 파일
- 약 230 lines 추가/수정

---

## 참고 자료

- ReservationStatsPage: `src/pages/ReservationStatsPage.jsx`
- praiseService: `src/services/praiseService.js:244-308`
- PraisePage: `src/pages/PraisePage.jsx:1-236`
- authService: `src/services/authService.js:208-236`

---

**다음 작업 시 참고:**
- 통계 화면에 추가 필터나 그래프가 필요하면 `PraiseStatsView.jsx` 수정
- 백엔드 로직 변경은 `praiseService.getReporterStats()` 수정
- 탭 UI 변경은 `PraisePage.jsx`의 메인 탭 부분 수정
