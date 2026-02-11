"""
UI/UX 스타일 검토 분석 스크립트
"""
import sys
import io

# UTF-8 인코딩 강제 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
import os
from crews.ui_ux_review_crew import run_ui_ux_review

# 환경 변수 로드
load_dotenv()

# WeeklyList 컴포넌트 코드 읽기
with open("../src/components/reservations/WeeklyList.jsx", "r", encoding="utf-8") as f:
    weeklylist_code = f.read()

# 분석 대상 정보
component_info = f"""
# UI/UX 스타일 검토 대상

## 컴포넌트: WeeklyList.jsx

### 현재 구현 내용
- 예약 관리 메인 화면
- 스페이스 선택 드롭다운 (헤더에 통합)
- 주간 예약 리스트/달력 뷰 전환
- 프로필 이미지 기반 예약자 표시
- 날짜별 예약 상세 정보

### 주요 UI 요소
1. **헤더 (sticky)**:
   - SpaceDropdown (좌측)
   - 통계 버튼, 뷰 모드 토글, 프로필 메뉴 (우측)
   - 주간 네비게이션 (리스트 뷰)

2. **리스트 뷰**:
   - 날짜별 details/summary 카드
   - 프로필 사진 (최대 5개 + 더보기)
   - 통계 (게스트/당일/남녀 비율)
   - 식사 아이콘

3. **캘린더 뷰**:
   - 주간 달력 형식
   - 날짜별 예약자 수 표시

### 현재 스타일링
- Tailwind CSS 사용
- 그라데이션 배경 (blue-600 to blue-700)
- 둥근 모서리 (rounded-xl, rounded-2xl)
- 그림자 효과 (shadow-lg, shadow-xl)
- 반응형 디자인 (모바일 중심)

### 코드
```jsx
{weeklylist_code[:5000]}
... (나머지 코드 생략)
```

## 검토 요청사항

1. **색상 및 그라데이션**: 현재 파란색 계열의 그라데이션이 적절한지
2. **타이포그래피**: 폰트 크기, 굵기, 간격이 가독성에 적합한지
3. **간격 및 여백**: 컴포넌트 간 간격, 패딩이 답답하거나 여유롭지 않은지
4. **버튼 및 인터랙션**: 클릭 가능한 요소가 명확한지, 터치 영역이 충분한지
5. **정보 계층**: 중요한 정보가 시각적으로 강조되는지
6. **일관성**: 전체적인 디자인 시스템의 일관성
7. **접근성**: 색맹, 저시력 사용자를 위한 대비, ARIA 레이블
8. **애니메이션**: 전환 효과가 자연스러운지
9. **모바일 UX**: 모바일 환경에서의 사용성
10. **개선 제안**: 구체적인 스타일 수정 제안
"""

if __name__ == "__main__":
    print("\n[INFO] UI/UX style review starting...\n")

    # OpenAI API 키 확인
    if not os.getenv("OPENAI_API_KEY"):
        print("[ERROR] OPENAI_API_KEY environment variable is not set.")
        exit(1)

    try:
        result = run_ui_ux_review(component_info)

        print("\n[RESULT] UI/UX Review completed:\n")
        print(result)

        # 결과를 파일로 저장
        output_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(output_dir, exist_ok=True)

        output_file = os.path.join(output_dir, "ui_ux_review.md")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("# UI/UX Style Review Result\n\n")
            f.write(str(result))

        print(f"\n[SUCCESS] Results saved to: {output_file}")

    except Exception as e:
        print(f"\n[ERROR] Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()
