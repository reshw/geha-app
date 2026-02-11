"""
스페이스 관리 개선을 위한 Crew 구성
"""
from crewai import Crew, Process
from agents.geha_agents import GehaAgents
from tasks.space_management_tasks import SpaceManagementTasks


class SpaceManagementCrew:
    """
    스페이스 전역 관리 개선을 위한 AI 에이전트 팀
    """

    def __init__(self, codebase_info: str):
        """
        Args:
            codebase_info: 분석할 코드베이스 정보 (파일 내용, 구조 등)
        """
        self.codebase_info = codebase_info
        self.agents = GehaAgents()
        self.tasks_builder = SpaceManagementTasks()

    def run(self):
        """
        Crew를 실행하고 결과를 반환
        """
        # 1. Recruiter가 작업 분석
        recruiter = self.agents.recruiter()

        # 2. PM이 현재 상태 분석
        pm = self.agents.product_manager()
        analysis_task = self.tasks_builder.analyze_current_state(
            agent=pm,
            codebase_info=self.codebase_info
        )

        # 3. PM이 UI/UX 솔루션 설계
        ui_design_task = self.tasks_builder.design_ui_ux_solution(
            agent=pm,
            analysis_result="{{analyze_current_state}}"  # 이전 태스크 결과 참조
        )

        # 4. Tech Lead가 기술 아키텍처 설계
        tech_lead = self.agents.tech_lead()
        architecture_task = self.tasks_builder.design_technical_architecture(
            agent=tech_lead,
            ui_solution="{{design_ui_ux_solution}}"
        )

        # 5. Tech Lead가 구현 계획 수립
        implementation_task = self.tasks_builder.create_implementation_plan(
            agent=tech_lead,
            architecture_design="{{design_technical_architecture}}"
        )

        # Crew 구성 (순차 실행)
        crew = Crew(
            agents=[recruiter, pm, tech_lead],
            tasks=[
                analysis_task,
                ui_design_task,
                architecture_task,
                implementation_task
            ],
            process=Process.sequential,  # 순차 실행
            verbose=True
        )

        # 실행
        print("\n" + "="*80)
        print("🚀 SpaceManagement Crew 시작")
        print("="*80 + "\n")

        result = crew.kickoff()

        print("\n" + "="*80)
        print("✅ SpaceManagement Crew 완료")
        print("="*80 + "\n")

        return result


def run_space_management_analysis(codebase_info: str):
    """
    스페이스 관리 개선 분석 실행

    Args:
        codebase_info: 코드베이스 정보

    Returns:
        분석 및 설계 결과
    """
    crew = SpaceManagementCrew(codebase_info)
    return crew.run()
