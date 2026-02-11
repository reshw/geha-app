"""
스페이스 관리 개선 분석 실행 스크립트
"""
import sys
import io

# UTF-8 인코딩 강제 설정 (Windows 콘솔 문제 해결)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
import os
from crews.space_management_crew import run_space_management_analysis

# 환경 변수 로드
load_dotenv()

# 코드베이스 정보 준비
codebase_info = """
# 현재 코드베이스 상태

## 1. 전역 상태 관리 (src/store/useStore.js)

```javascript
import { create } from 'zustand';

const useStore = create((set) => ({
  // 인증
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => set({ user: null, isLoggedIn: false, selectedSpace: null }),

  // 스페이스
  selectedSpace: null,
  setSelectedSpace: (space) => {
    // localStorage에 마지막 선택 공간 ID 저장
    if (space?.id) {
      localStorage.setItem('lastSelectedSpaceId', space.id);
    } else {
      localStorage.removeItem('lastSelectedSpaceId');
    }
    set({ selectedSpace: space });
  },

  // 예약
  reservations: {},
  setReservations: (reservations) => set({ reservations }),

  // 프로필
  profiles: {},
  addProfiles: (newProfiles) => set((state) => ({
    profiles: { ...state.profiles, ...newProfiles }
  })),
}));
```

## 2. SpaceDropdown 컴포넌트 (src/components/space/SpaceDropdown.jsx)

- 이미 구현된 스페이스 선택 드롭다운
- 기능: 드래그 앤 드롭으로 순서 변경, 방 생성 신청
- Props:
  - spaces: 스페이스 목록
  - selectedSpace: 현재 선택된 스페이스
  - onSelect: 스페이스 선택 핸들러
  - onReorder: 순서 변경 핸들러
  - onCreateSpace: 방 생성 신청 핸들러

## 3. WeeklyList (예약 페이지) - src/components/reservations/WeeklyList.jsx

- **현재 상태**: 헤더에 SpaceDropdown이 통합되어 있음 (line 463-474)
- sticky 헤더로 구현되어 상단에 고정
- 구조:
  ```
  헤더 (sticky, z-30)
    - 좌측: SpaceDropdown
    - 우측: 통계 버튼 + 뷰 모드 토글 + 프로필 메뉴
  ```

## 4. 문제점

### 4.1. 다른 페이지에서의 스페이스 정보 필요성
- **settlement (정산 페이지)**: 정산 데이터는 스페이스별로 관리됨
- **더보기 페이지**: 스페이스 설정, 멤버 관리 등 스페이스별 기능
- **expense (지출 관리)**: 스페이스별 지출 내역
- **praise (칭찬)**: 스페이스별 칭찬 시스템

### 4.2. 현재 문제
- WeeklyList에만 SpaceDropdown이 있음
- 다른 페이지들은 전역 상태의 selectedSpace를 사용하지만, 사용자가 스페이스를 변경할 UI가 없음
- 페이지 간 이동 시 스페이스가 변경되지 않으면 문제 없지만, 사용자가 의도적으로 스페이스를 전환하려면 다시 예약 페이지로 가야 함

### 4.3. UI/UX 제약사항
- 모바일 화면에서 세로 공간이 제한적
- 각 페이지의 헤더에 드롭다운을 추가하면 공간 낭비
- MainLayout을 통한 공통 헤더 도입도 고려했지만, 세로 공간 문제로 어려움

## 5. App 구조 (src/App.jsx)

```javascript
<Routes>
  {/* 하단 네비게이션이 있는 메인 페이지들 */}
  <Route element={<MainLayout />}>
    <Route path="/" element={<WeeklyList />} />
    <Route path="/settlement" element={<SettlementPage />} />
    <Route path="/praise" element={<PraisePage />} />
    <Route path="/expenses" element={<ExpenseListPage />} />
    <Route path="/slopes" element={<SlopesPage />} />
    <Route path="/more" element={<MorePage />} />
  </Route>

  {/* 하단 네비게이션이 없는 독립 페이지들 */}
  ...
</Routes>
```

- MainLayout은 하단 네비게이션(BottomNav)을 제공
- 상단 헤더는 각 페이지에서 독립적으로 구현

## 6. 요구사항

1. **전역적으로 스페이스 선택 가능**: 모든 페이지에서 스페이스를 전환할 수 있어야 함
2. **최소한의 UI 공간 사용**: 세로 공간이 제한적이므로 공간 효율적인 솔루션 필요
3. **일관된 UX**: 사용자가 어디서든 직관적으로 스페이스를 전환할 수 있어야 함
4. **성능**: 불필요한 리렌더링 방지, 스페이스 변경 시 효율적인 데이터 refetch

## 7. 고려할 옵션들

1. **모든 페이지 헤더에 SpaceDropdown 추가**
   - 장점: 명확하고 직관적
   - 단점: 세로 공간 낭비, 각 페이지마다 구현 필요

2. **MainLayout에 통합**
   - 장점: 한 번만 구현, 모든 페이지에 일관성
   - 단점: 세로 공간 추가 사용

3. **플로팅 버튼**
   - 장점: 공간 효율적, 필요할 때만 표시
   - 단점: 자주 사용하면 번거로울 수 있음

4. **하단 네비게이션 영역 활용**
   - 장점: 이미 존재하는 공간 활용
   - 단점: 네비게이션 복잡도 증가

5. **프로필 메뉴 통합**
   - 장점: 공간 효율적
   - 단점: 발견성 낮음, 2단계 액션 필요

## 8. 추가 정보

- 사용자는 보통 하나의 스페이스를 주로 사용하며, 가끔 다른 스페이스로 전환
- 스페이스 전환은 자주 발생하지 않지만, 필요할 때 쉽게 접근 가능해야 함
- 모바일 앱이므로 터치 인터랙션 최적화 필요
"""

if __name__ == "__main__":
    print("\n[INFO] Space management analysis starting...\n")

    # OpenAI API 키 확인
    if not os.getenv("OPENAI_API_KEY"):
        print("[ERROR] OPENAI_API_KEY environment variable is not set.")
        print("[INFO] Create crewai/.env file and add your API key:")
        print("   OPENAI_API_KEY=your_api_key_here")
        exit(1)

    try:
        result = run_space_management_analysis(codebase_info)

        print("\n[RESULT] Analysis completed:\n")
        print(result)

        # 결과를 파일로 저장
        output_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(output_dir, exist_ok=True)

        output_file = os.path.join(output_dir, "space_management_analysis.md")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("# Space Management Analysis Result\n\n")
            f.write(str(result))

        print(f"\n[SUCCESS] Results saved to: {output_file}")

    except Exception as e:
        print(f"\n[ERROR] Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()
