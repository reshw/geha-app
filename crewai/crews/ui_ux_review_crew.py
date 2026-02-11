"""
UI/UX 검토를 위한 Crew 정의
"""
from crewai import Crew, Task
from agents.geha_agents import GehaAgents


class UIUXReviewCrew:
    """UI/UX 스타일 검토를 위한 Crew"""

    def __init__(self):
        self.agents = GehaAgents()

    def create_tasks(self, component_info):
        """UI/UX 검토 태스크 생성"""

        # Task 1: UI/UX 전문가의 전반적인 검토
        review_task = Task(
            description=f"""
다음 컴포넌트의 UI/UX를 전문가 관점에서 검토하세요:

{component_info}

다음 항목들을 중점적으로 검토:
1. 색상 조합 및 대비
2. 타이포그래피 (폰트 크기, 굵기, 행간)
3. 여백 및 간격 (padding, margin, gap)
4. 시각적 계층 구조
5. 버튼 및 터치 영역 크기
6. 애니메이션 및 전환 효과
7. 접근성 (색맹, 저시력)
8. 일관성

각 항목별로:
- 현재 상태 분석
- 좋은 점
- 개선이 필요한 점
- 구체적인 개선 제안 (Tailwind CSS 클래스 포함)
            """,
            agent=self.agents.product_manager(),
            expected_output="UI/UX 검토 보고서 (분석 및 개선 제안)"
        )

        # Task 2: 구체적인 스타일 개선안 제시
        style_improvement_task = Task(
            description=f"""
앞선 검토를 바탕으로 구체적인 스타일 개선안을 제시하세요:

검토 대상:
{component_info}

다음 형식으로 제시:
1. 우선순위별 개선 사항 (High/Medium/Low)
2. Before/After 비교
3. 실제 적용 가능한 Tailwind CSS 클래스
4. 색상 코드 (HEX, RGB)
5. 간격 및 크기 값 (px, rem)
6. 예상 효과

특히 다음에 집중:
- 모바일 환경 최적화
- 터치 인터랙션 개선
- 정보 가독성 향상
- 시각적 피로 감소
            """,
            agent=self.agents.tech_lead(),
            expected_output="구체적인 스타일 개선안 (우선순위별, Before/After)"
        )

        return [review_task, style_improvement_task]

    def run(self, component_info):
        """Crew 실행"""
        tasks = self.create_tasks(component_info)

        crew = Crew(
            agents=[
                self.agents.product_manager(),
                self.agents.tech_lead()
            ],
            tasks=tasks,
            verbose=True
        )

        result = crew.kickoff()
        return result


def run_ui_ux_review(component_info):
    """UI/UX 검토 실행 함수"""
    crew = UIUXReviewCrew()
    return crew.run(component_info)
