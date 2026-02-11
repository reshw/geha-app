"""
스페이스 관리 관련 태스크 정의
"""
from crewai import Task


class SpaceManagementTasks:
    """스페이스 전역 관리 관련 태스크"""

    def analyze_current_state(self, agent, codebase_info):
        """
        현재 코드베이스의 스페이스 관리 방식 분석
        """
        return Task(
            description=f"""
            다음 코드베이스 정보를 바탕으로 현재 스페이스 관리 방식을 분석하세요:

            {codebase_info}

            분석 항목:
            1. 현재 스페이스 선택 UI의 위치와 구현 방식
            2. 스페이스 정보가 필요한 모든 페이지/컴포넌트 파악
            3. 전역 상태 관리 방식 (Zustand 사용 여부 확인)
            4. 각 페이지에서 스페이스 정보를 어떻게 사용하는지
            5. 현재 구조의 문제점과 개선이 필요한 이유

            특히 다음 사항에 집중하세요:
            - WeeklyList에는 SpaceDropdown이 있지만 다른 페이지는?
            - settlement, 더보기 페이지에서의 space 사용
            - 세로 공간(vertical space) 사용 현황
            """,
            expected_output="""
            마크다운 형식의 상세 분석 보고서:
            - 현재 상태 요약
            - 페이지별 스페이스 사용 현황
            - 식별된 문제점 목록
            - 개선이 필요한 구체적인 이유
            """,
            agent=agent
        )

    def design_ui_ux_solution(self, agent, analysis_result):
        """
        UI/UX 관점에서 최적의 스페이스 선택 솔루션 설계
        """
        return Task(
            description=f"""
            다음 분석 결과를 바탕으로 UI/UX 관점에서 최적의 솔루션을 설계하세요:

            {analysis_result}

            고려 사항:
            1. 세로 공간이 제한적인 모바일 환경
            2. 사용자가 자주 스페이스를 전환하는지 여부
            3. 각 페이지의 특성 (예약, 정산, 설정 등)
            4. 일관된 사용자 경험 제공

            설계 옵션을 3가지 이상 제시하고, 각각의 장단점을 분석하세요:
            - 옵션 1: 모든 페이지 헤더에 SpaceDropdown 추가
            - 옵션 2: 플로팅 버튼으로 스페이스 선택
            - 옵션 3: 하단 네비게이션 영역 활용
            - 옵션 4: Context Menu 또는 설정 페이지에서만 관리
            - 기타 창의적인 아이디어

            각 옵션에 대해:
            - 장점 (Pros)
            - 단점 (Cons)
            - 모바일 UX 관점 평가
            - 구현 난이도
            - 최종 추천 점수 (1-10점)
            """,
            expected_output="""
            마크다운 형식의 UI/UX 설계 문서:
            - 각 옵션의 상세 설명과 mockup 텍스트 설명
            - 장단점 비교표
            - 최종 추천 솔루션 1개와 그 이유
            - 사용자 시나리오별 동작 설명
            """,
            agent=agent
        )

    def design_technical_architecture(self, agent, ui_solution):
        """
        기술적 아키텍처 설계 (전역 상태 관리 + 컴포넌트 구조)
        """
        return Task(
            description=f"""
            다음 UI 솔루션을 바탕으로 기술적 아키텍처를 설계하세요:

            {ui_solution}

            현재 기술 스택:
            - React 19.1.1
            - Zustand 4.5.5 (전역 상태 관리)
            - React Router DOM 6.26.2
            - Vite
            - Firebase (Firestore)

            설계 요구사항:
            1. 전역 상태 관리 개선 방안
               - Zustand store 구조 최적화
               - selectedSpace의 persistence 전략
               - 스페이스 변경 시 데이터 refetch 로직

            2. 컴포넌트 구조
               - SpaceDropdown 재사용성 개선
               - MainLayout 수정 필요 여부
               - 각 페이지에서의 SpaceSelector 통합 방안

            3. 데이터 흐름
               - 스페이스 변경 -> 페이지 데이터 업데이트
               - localStorage와 Zustand 동기화
               - 에러 처리 및 fallback 전략

            4. 성능 고려사항
               - 불필요한 리렌더링 방지
               - 데이터 캐싱 전략
            """,
            expected_output="""
            마크다운 형식의 기술 설계 문서:
            - 디렉토리 구조 및 파일 구성
            - 주요 컴포넌트 인터페이스 (props, state)
            - Zustand store 구조 개선안 (코드 스니펫 포함)
            - 데이터 흐름 다이어그램 (텍스트 기반)
            - 주요 함수/훅의 시그니처
            - 단계별 구현 가이드
            """,
            agent=agent
        )

    def create_implementation_plan(self, agent, architecture_design):
        """
        단계별 구현 계획 수립
        """
        return Task(
            description=f"""
            다음 아키텍처 설계를 바탕으로 단계별 구현 계획을 수립하세요:

            {architecture_design}

            구현 계획 요구사항:
            1. 단계별 작업 분리 (각 단계는 독립적으로 테스트 가능해야 함)
            2. 우선순위 설정 (High/Medium/Low)
            3. 각 단계의 예상 소요 시간
            4. 리스크 요소와 대응 방안
            5. 테스트 전략

            단계 구성 예시:
            - Phase 1: 전역 상태 관리 개선 (Zustand store 수정)
            - Phase 2: SpaceSelector 컴포넌트 최적화
            - Phase 3: 각 페이지에 SpaceSelector 통합
            - Phase 4: 테스트 및 버그 수정
            - Phase 5: 성능 최적화

            각 단계마다 포함할 내용:
            - 구체적인 작업 항목 (TODO 리스트)
            - 수정/생성할 파일 목록
            - 의존성 (이전 단계 완료 필요 여부)
            - 예상 이슈와 해결 방안
            """,
            expected_output="""
            마크다운 형식의 구현 계획서:
            - Executive Summary
            - 전체 타임라인
            - 각 Phase별 상세 계획
            - 파일별 수정 사항 체크리스트
            - 테스트 시나리오
            - 롤백 계획
            """,
            agent=agent
        )
