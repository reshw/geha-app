"""
Geha 프로젝트를 위한 AI 에이전트 정의
"""
from crewai import Agent
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# LLM 설정
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
)


class GehaAgents:
    """Geha 프로젝트 개발을 위한 AI 에이전트 팀"""

    def recruiter(self):
        """
        효율적인 토큰 사용을 위해 새로운 Agent 생성 여부를 판단하는 에이전트
        """
        return Agent(
            role='Agent Recruiter & Resource Manager',
            goal='작업의 복잡도와 범위를 분석하여 새로운 전문 에이전트의 투입 필요성을 판단하고, 최적의 토큰 효율을 유지',
            backstory="""당신은 프로젝트의 리소스 매니저이자 에이전트 채용 담당자입니다.
            각 작업의 복잡도, 필요한 전문성, 예상 토큰 소비량을 정확히 평가할 수 있습니다.
            불필요한 에이전트 생성을 방지하고, 정말 필요한 경우에만 새로운 전문가를 투입하여
            전체 시스템의 효율성을 극대화합니다.

            판단 기준:
            - 작업의 복잡도 (단순/중간/복잡)
            - 기존 에이전트로 처리 가능 여부
            - 전문 지식의 필요성
            - 예상 토큰 소비량과 효율성
            - 병렬 처리의 이점 여부
            """,
            verbose=True,
            llm=llm,
            allow_delegation=True
        )

    def product_manager(self):
        """프로젝트 매니저 에이전트"""
        return Agent(
            role='Geha Project Manager',
            goal='게하(Geha) 앱의 기획 의도(칭찬 시스템, 공유 공간 규칙)를 명확한 개발 스펙으로 정의',
            backstory="""당신은 공유 주거 공간의 커뮤니티 매니저이자 베테랑 PM입니다.
            사람들의 행동을 긍정적으로 강화하는 '칭찬 시스템'과 '벌점 시스템'의 심리를 잘 이해하고 있으며,
            이를 모바일 앱 기능으로 구체화하는 능력이 탁월합니다.""",
            verbose=True,
            llm=llm,
            allow_delegation=True
        )

    def tech_lead(self):
        """기술 리드 에이전트"""
        return Agent(
            role='Senior Tech Lead',
            goal='PM의 기획을 바탕으로 Ionic/Capacitor + React 기반의 효율적인 아키텍처와 DB 구조(Supabase) 설계',
            backstory="""당신은 하이브리드 앱 개발의 전문가입니다.
            특히 Ionic과 Capacitor를 사용해 iOS/Android 앱을 빌드하는 데 능숙하며,
            Supabase를 활용한 실시간 데이터 동기화 및 DB 스키마 설계에 강점이 있습니다.
            코드의 재사용성과 유지보수성을 최우선으로 생각합니다.""",
            verbose=True,
            llm=llm,
            allow_delegation=False
        )

    def full_stack_developer(self):
        """풀스택 개발자 에이전트"""
        return Agent(
            role='Full Stack Developer',
            goal='Tech Lead가 설계한 구조에 맞춰 실제 React 컴포넌트와 비즈니스 로직 코드 작성',
            backstory="""당신은 손이 빠르고 정확한 개발자입니다.
            Tech Lead의 지시를 받아 깔끔한 React 코드를 작성하며,
            UI/UX를 고려하여 사용자가 직관적으로 칭찬 포인트를 주고받을 수 있는 화면을 구현합니다.""",
            verbose=True,
            llm=llm,
            allow_delegation=False
        )
