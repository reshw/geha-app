# 전역 Space 선택 바 추가 작업 계획서

**날짜:** 2026-02-11 00:06
**작업자:** Claude Code
**목적:** 모든 페이지에서 Space를 선택할 수 있도록 개선

---

## 현재 문제점

### 1. Space 선택 UI가 예약 페이지에만 존재
- **SpaceDropdown** 컴포넌트가 `WeeklyList` (예약 페이지)에만 포함됨
- 다른 페이지 (칭찬, 정산, 운영비 등)에 직접 접근 시 Space 선택 불가

### 2. 사용자 경험 문제
```
사용자 시나리오:
1. 북마크로 /praise (칭찬 페이지) 직접 접근
2. "스페이스를 불러오는 중..." 메시지 표시
3. "예약 페이지에서 스페이스를 먼저 선택해주세요" 안내
4. 예약 페이지(/)로 이동해야 함
5. SpaceDropdown에서 선택 후 다시 /praise로 이동
→ 불편함 발생
```

### 3. 페이지별 Header가 제각각
| 페이지 | Header 스타일 | Space 선택 |
|--------|--------------|-----------|
| WeeklyList (예약) | 파란색 그래디언트 | ✅ 있음 |
| PraisePage (칭찬) | 흰색, 간단 제목 | ❌ 없음 |
| SettlementPage (정산) | 흰색, 버튼들 | ❌ 없음 |
| ExpenseListPage (운영비) | 파란색 그래디언트 | ❌ 없음 |

### 4. SpaceDropdown 디자인 부족
- 현재 디자인이 단순하고 세련되지 못함
- 드래그 정렬 기능이 있지만 UI가 직관적이지 않음
- 모바일에서 터치 경험 개선 필요

---

## 목표

### 주요 목표
1. **모든 페이지에서 Space 선택 가능**
   - MainLayout을 사용하는 모든 페이지에 공통 적용
   - URL 직접 접근 시에도 바로 Space 선택 가능

2. **최소한의 코드 수정**
   - 기존 페이지 Header는 그대로 유지
   - MainLayout 파일 1개만 수정

3. **SpaceDropdown 디자인 개선**
   - 더 세련된 UI
   - 명확한 선택 상태 표시
   - 드래그 인터랙션 개선

### 부차 목표
- Space가 없을 때 일관된 안내 메시지
- localStorage 복원 로직 유지
- 기존 기능 모두 정상 작동

---

## 구현 방안

### 1. 전체 구조

#### Before (현재)
```
MainLayout
├── Outlet (페이지 컨텐츠)
│   ├── WeeklyList
│   │   └── Header (SpaceDropdown 포함)
│   ├── PraisePage
│   │   └── Header (Space 선택 없음)
│   └── SettlementPage
│       └── Header (Space 선택 없음)
└── BottomNav
```

#### After (개선)
```
MainLayout
├── GlobalSpaceBar (신규, 모든 페이지 공통)
│   └── SpaceDropdown
├── Outlet (페이지 컨텐츠)
│   ├── WeeklyList
│   │   └── Header (SpaceDropdown 제거)
│   ├── PraisePage
│   │   └── Header (그대로 유지)
│   └── SettlementPage
│       └── Header (그대로 유지)
└── BottomNav
```

---

## 변경될 파일 목록

### 1. MainLayout.jsx (수정)
**경로:** `/Users/sky/dev/loungeap/geha-app/src/components/common/MainLayout.jsx`

**변경 내용:**
- GlobalSpaceBar 컴포넌트 추가
- SpaceDropdown을 MainLayout으로 이동
- userSpaces 로드 로직 추가
- selectedSpace 초기화 로직 추가

**예상 코드:**
```jsx
import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import SpaceDropdown from '../space/SpaceDropdown';
import BottomNav from './BottomNav';

export default function MainLayout() {
  const { user } = useAuth();
  const { selectedSpace, setSelectedSpace } = useStore();
  const [userSpaces, setUserSpaces] = useState([]);
  const hasInitializedSpace = useRef(false);

  // 사용자 스페이스 로드 및 초기 선택
  useEffect(() => {
    if (!user?.id) return;

    const loadSpaces = async () => {
      const spaces = await spaceService.getUserSpaces(user.id);
      setUserSpaces(spaces);

      // 첫 로드 시에만 초기화
      if (spaces.length > 0 && !hasInitializedSpace.current) {
        const lastSelectedId = localStorage.getItem('lastSelectedSpaceId');
        const lastSpace = spaces.find(s => s.id === lastSelectedId);
        const spaceToSelect = lastSpace || spaces.find(s => s.order === 0) || spaces[0];

        setSelectedSpace(spaceToSelect);
        hasInitializedSpace.current = true;
      } else if (spaces.length === 0) {
        setSelectedSpace(null);
        hasInitializedSpace.current = true;
      }
    };

    loadSpaces();
  }, [user?.id, setSelectedSpace]);

  const handleSpaceChange = (space) => {
    setSelectedSpace(space);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 전역 Space 선택 바 */}
      {user && userSpaces.length > 0 && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <SpaceDropdown
              spaces={userSpaces}
              selectedSpace={selectedSpace}
              onSelect={handleSpaceChange}
              onReorder={async (updatedSpaces) => {
                await spaceService.updateSpaceOrder(user.id, updatedSpaces);
                setUserSpaces(updatedSpaces);
              }}
              onCreateSpace={() => {/* 방 생성 신청 로직 */}}
            />
          </div>
        </div>
      )}

      {/* 페이지 컨텐츠 */}
      <Outlet />

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}
```

---

### 2. WeeklyList.jsx (수정)
**경로:** `/Users/sky/dev/loungeap/geha-app/src/components/reservations/WeeklyList.jsx`

**변경 내용:**
- Header에서 SpaceDropdown 제거
- userSpaces 로드 로직 제거 (MainLayout으로 이동)
- selectedSpace 초기화 로직 제거 (MainLayout으로 이동)

**예상 코드 변경:**
```jsx
// Before
<div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white sticky top-0 z-30">
  <div className="flex items-center justify-between p-4">
    {/* 좌측: SpaceDropdown */}
    <div className="relative">
      <SpaceDropdown ... />
    </div>

    {/* 우측: 버튼들 */}
    <div className="flex items-center gap-2">
      {/* 통계, 뷰모드, 프로필 */}
    </div>
  </div>
</div>

// After
<div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white sticky top-0 z-30">
  <div className="flex items-center justify-between p-4">
    {/* 좌측: 제목 또는 빈 공간 */}
    <div>
      <h1 className="text-xl font-bold">📅 예약 관리</h1>
    </div>

    {/* 우측: 버튼들 */}
    <div className="flex items-center gap-2">
      {/* 통계, 뷰모드, 프로필 */}
    </div>
  </div>
</div>
```

---

### 3. SpaceDropdown.jsx (디자인 개선, 선택)
**경로:** `/Users/sky/dev/loungeap/geha-app/src/components/space/SpaceDropdown.jsx`

**변경 내용 (선택사항):**
- 드롭다운 버튼 디자인 개선
- 스페이스 항목 레이아웃 개선
- 드래그 핸들 아이콘 추가
- 애니메이션 효과 추가

**개선 아이디어:**
```jsx
// 현재 버튼
<button style={{ padding: '12px 16px', ... }}>
  {selectedSpaceName} ({selectedUserType})
</button>

// 개선 버튼
<button className="
  w-full px-4 py-3
  bg-white/10 hover:bg-white/20
  text-white
  rounded-lg
  flex items-center justify-between
  transition-all
">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
      🏠
    </div>
    <div className="text-left">
      <div className="font-semibold">{selectedSpaceName}</div>
      <div className="text-xs text-white/70">{selectedUserType}</div>
    </div>
  </div>
  <ChevronDown className="w-5 h-5" />
</button>
```

---

## 단계별 작업 내용

### Phase 1: MainLayout 수정
1. MainLayout.jsx 파일 열기
2. SpaceDropdown 관련 import 추가
3. userSpaces 상태 및 로드 로직 추가
4. GlobalSpaceBar 렌더링 추가
5. z-index 조정 (z-40, 페이지 header보다 높게)

### Phase 2: WeeklyList 수정
1. WeeklyList.jsx 파일 열기
2. Header에서 SpaceDropdown 제거
3. userSpaces 로드 로직 제거
4. selectedSpace 초기화 로직 제거
5. Header 디자인 조정 (제목 또는 간소화)

### Phase 3: SpaceDropdown 디자인 개선 (선택)
1. SpaceDropdown.jsx 파일 열기
2. 버튼 스타일 개선 (아이콘, 레이아웃)
3. 드롭다운 메뉴 스타일 개선
4. 드래그 핸들 아이콘 추가 (GripVertical)
5. 애니메이션 효과 추가

### Phase 4: 테스트
1. 예약 페이지에서 Space 선택 동작 확인
2. 칭찬 페이지 직접 접근 시 Space 선택 가능 확인
3. 정산 페이지 직접 접근 시 Space 선택 가능 확인
4. localStorage 복원 동작 확인
5. 드래그 정렬 동작 확인
6. 방 생성 신청 동작 확인

---

## 예상 코드 변경량

| 파일 | 변경 유형 | 예상 라인 수 |
|-----|---------|------------|
| MainLayout.jsx | 수정 | +50 라인 |
| WeeklyList.jsx | 수정 | -80 라인 |
| SpaceDropdown.jsx | 개선 (선택) | ±30 라인 |
| **총계** | | **+20 라인** |

---

## UI/UX 개선 사항

### 1. GlobalSpaceBar 디자인
```
┌─────────────────────────────────────────┐
│ 🏠  조강308호                      ▼   │
│     주주                                │
├─────────────────────────────────────────┤
```

**특징:**
- 파란색 그래디언트 배경 (`from-blue-600 to-blue-700`)
- sticky top-0 (스크롤해도 상단 고정)
- z-40 (페이지 header보다 위)
- 높이: py-3 (약 12px)
- 그림자: shadow-md

### 2. SpaceDropdown 개선 (선택)
```
┌─────────────────────────────────────────┐
│  🏠  조강308호              ▼          │
│      주주                               │
└─────────────────────────────────────────┘
     ↓ (클릭 시)
┌─────────────────────────────────────────┐
│  ⋮  🏠  조강308호 (주주)        ✓      │
│  ⋮  🏠  라운지B (매니저)               │
│  ⋮  🏠  산장C (게스트)                 │
│  ───────────────────────────────────   │
│  ➕  방 생성 신청                      │
└─────────────────────────────────────────┘
```

**개선 포인트:**
- 드래그 핸들 (⋮) 아이콘 추가
- 선택된 항목에 체크 표시 (✓)
- 호버 효과 강화
- 애니메이션 (드롭다운 열기/닫기)

---

## 기술적 고려사항

### 1. z-index 관리
```
z-50: SpaceDropdown 메뉴 (드롭다운)
z-40: GlobalSpaceBar (MainLayout)
z-30: WeeklyList Header (예약 페이지)
z-10: 일반 페이지 Header (칭찬, 정산 등)
```

### 2. localStorage 복원
- 기존 로직 그대로 유지
- `lastSelectedSpaceId` 키 사용
- MainLayout useEffect에서 처리

### 3. Space 없을 때 처리
```jsx
{user && userSpaces.length === 0 && (
  <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-center">
    <p className="text-sm text-yellow-800">
      가입된 스페이스가 없습니다.
      <Link to="/join" className="underline">스페이스 가입하기</Link>
    </p>
  </div>
)}
```

### 4. 로그인 여부 체크
```jsx
{user && userSpaces.length > 0 && (
  <GlobalSpaceBar ... />
)}
```
- 로그인하지 않았으면 GlobalSpaceBar 숨김
- LoginOverlay가 표시될 것임

---

## 테스트 계획

### 1. 기능 테스트
- [ ] 예약 페이지에서 Space 선택 동작
- [ ] 칭찬 페이지 직접 접근 → Space 선택 가능
- [ ] 정산 페이지 직접 접근 → Space 선택 가능
- [ ] 운영비 페이지 직접 접근 → Space 선택 가능
- [ ] 북마크/URL 직접 입력 → Space 선택 가능
- [ ] localStorage 복원 (페이지 새로고침)
- [ ] 드래그 정렬 동작
- [ ] 방 생성 신청 동작

### 2. UI 테스트
- [ ] 모바일 (iOS Safari, Android Chrome)
- [ ] 데스크탑 (Chrome, Safari, Firefox)
- [ ] 드롭다운 메뉴가 화면 밖으로 나가지 않는지
- [ ] z-index 충돌 없는지
- [ ] 스크롤 시 sticky 동작 확인

### 3. 엣지 케이스
- [ ] Space가 1개만 있을 때
- [ ] Space가 10개 이상일 때 (스크롤)
- [ ] Space가 없을 때
- [ ] 로그아웃 상태에서 접근
- [ ] Space 삭제 후 동작

---

## 롤백 계획

만약 문제 발생 시:
1. git에서 이전 커밋으로 복구
2. MainLayout.jsx만 원래대로 되돌리기
3. WeeklyList.jsx도 원래대로 되돌리기

---

## 향후 확장 가능성

### 1. Space 빠른 전환
- 키보드 단축키 (Cmd+K → Space 선택 모달)
- 최근 사용 Space 목록

### 2. Space 알림
- 새 Space 초대 알림
- Space 설정 변경 알림

### 3. Space 그룹화
- 개인 Space / 팀 Space 구분
- 즐겨찾기 Space

---

## 참고 파일

- MainLayout: `/Users/sky/dev/loungeap/geha-app/src/components/common/MainLayout.jsx`
- WeeklyList: `/Users/sky/dev/loungeap/geha-app/src/components/reservations/WeeklyList.jsx`
- SpaceDropdown: `/Users/sky/dev/loungeap/geha-app/src/components/space/SpaceDropdown.jsx`
- useStore: `/Users/sky/dev/loungeap/geha-app/src/store/useStore.js`

---

**작업 시작 전 체크리스트:**
- [ ] 현재 브랜치 확인 (dev)
- [ ] git status 확인 (커밋 안 된 변경사항 확인)
- [ ] 백업 브랜치 생성 권장
- [ ] 작업 후 테스트 완료 후 커밋

**예상 소요 시간:** 1~2시간
