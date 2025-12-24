// src/pages/IntroductionPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Receipt,
  Heart,
  Wallet,
  Bell,
  Users,
  Settings,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp,
  MessageSquare,
  Shield,
  Smartphone,
  BarChart3
} from 'lucide-react';

const IntroductionPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      id: 'reservation',
      icon: Calendar,
      title: '예약 관리',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      description: '직관적인 예약 시스템',
      details: [
        '리스트형/달력형 이중 뷰',
        '남녀 구분 통계',
        '주주/게스트 분류',
        '3주치 미리보기',
        '내 예약 우선 표시',
        '원터치 예약 취소'
      ],
      highlights: [
        '전주/현재주/다음주 동시 로드로 빠른 네비게이션',
        '예약자 상세 모달로 전체 현황 한눈에',
        '성별 아이콘으로 한눈에 파악'
      ]
    },
    {
      id: 'settlement',
      icon: Receipt,
      title: '정산 시스템',
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      description: '완전 자동화 정산',
      details: [
        '영수증 사진 업로드',
        '자동 분담금 계산',
        '주차별 정산 관리',
        '테이블/카드 이중 뷰',
        '이미지/CSV 다운로드',
        '스케줄 자동 마감'
      ],
      highlights: [
        '스페이스별 맞춤 스케줄 설정 (매주/매달/매년)',
        'Netlify Scheduled Functions로 무료 자동화',
        '실시간 데이터 동기화로 항상 정확한 정산'
      ]
    },
    {
      id: 'praise',
      icon: Heart,
      title: '칭찬 시스템',
      color: 'pink',
      gradient: 'from-pink-500 to-pink-600',
      description: '감사와 칭찬 전달',
      details: [
        '익명/실명 선택 가능',
        '사진 첨부 지원',
        '스페이스별 칭찬 모음',
        '푸시 알림 발송',
        '감정 이모지 지원',
        '타임라인 뷰'
      ],
      highlights: [
        'OpenAI GPT-4로 악성 댓글 필터링',
        '푸시 알림으로 즉시 전달',
        '따뜻한 커뮤니티 문화 조성'
      ]
    },
    {
      id: 'expense',
      icon: Wallet,
      title: '운영비 관리',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      description: '투명한 운영비 관리',
      details: [
        '운영비 청구 요청',
        '승인/거부 프로세스',
        '카테고리별 분류',
        '월별 통계',
        '영수증 첨부',
        '이력 관리'
      ],
      highlights: [
        '매니저 승인 시스템으로 투명성 확보',
        '월별 지출 현황 한눈에',
        '카테고리별 분석'
      ]
    },
    {
      id: 'notification',
      icon: Bell,
      title: '알림 시스템',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      description: '다채널 알림 발송',
      details: [
        '알림톡 연동 (NHN)',
        '이메일 알림 (Resend)',
        '푸시 알림',
        '정산 완료 자동 발송',
        '맞춤 템플릿',
        '발송 이력 관리'
      ],
      highlights: [
        '정산 완료 시 자동 알림톡 발송',
        '이메일 설정으로 원하는 알림만',
        '실시간 푸시로 놓치지 않는 소식'
      ]
    },
    {
      id: 'management',
      icon: Users,
      title: '스페이스 관리',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      description: '강력한 관리 기능',
      details: [
        '멤버 권한 관리',
        '게스트 정책 설정',
        '초대 코드 시스템',
        '스페이스 설정',
        '매니저 양도',
        '다중 스페이스 지원'
      ],
      highlights: [
        '드래그 앤 드롭으로 스페이스 순서 변경',
        '역할별 권한 세밀 설정',
        '게스트 자동 확인 및 알림'
      ]
    }
  ];

  const techStack = [
    { name: 'React 19', icon: '⚛️', desc: '최신 React 기능 활용' },
    { name: 'Firebase', icon: '🔥', desc: 'Realtime Database & Auth' },
    { name: 'Netlify', icon: '⚡', desc: '무료 Scheduled Functions' },
    { name: 'Tailwind CSS', icon: '🎨', desc: '모바일 최적화 UI' },
    { name: 'OpenAI GPT-4', icon: '🤖', desc: '지능형 콘텐츠 필터' },
    { name: 'NHN Cloud', icon: '💬', desc: '알림톡 연동' },
    { name: 'Resend', icon: '📧', desc: '트랜잭셔널 이메일' },
    { name: 'Cloudinary', icon: '📸', desc: '이미지 최적화' }
  ];

  const stats = [
    { label: '주요 기능', value: '6+', icon: Zap },
    { label: '자동화 프로세스', value: '5+', icon: Clock },
    { label: '알림 채널', value: '3', icon: MessageSquare },
    { label: '모바일 최적화', value: '100%', icon: Smartphone }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">라운지 앱 소개</h1>
              <p className="text-xs text-white/80 mt-0.5">공유 오피스를 위한 올인원 솔루션</p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="sticky top-[72px] z-20 bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex overflow-x-auto hide-scrollbar">
            {[
              { id: 'overview', label: '개요', icon: BarChart3 },
              { id: 'features', label: '주요 기능', icon: Zap },
              { id: 'tech', label: '기술 스택', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 히어로 섹션 */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">라운지 앱</h2>
                  <p className="text-white/90 text-sm">All-in-One Space Management</p>
                </div>
              </div>
              <p className="text-white/90 leading-relaxed">
                공유 오피스와 라운지 운영을 위한 완전한 디지털 솔루션입니다.
                예약부터 정산, 칭찬, 운영비 관리까지 모든 것을 한 곳에서.
              </p>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* 주요 특징 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                왜 라운지 앱인가요?
              </h3>
              <div className="space-y-3">
                {[
                  '완전 자동화된 정산 시스템으로 시간 절약',
                  '투명한 운영비 관리로 신뢰 구축',
                  '다채널 알림으로 놓치는 소식 없음',
                  '모바일 최적화로 언제 어디서나 접근',
                  '무료 자동화 인프라로 비용 절감',
                  '지속적인 업데이트와 개선'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 주요 기능 탭 */}
        {activeTab === 'features' && (
          <div className="space-y-4 animate-fadeIn">
            {features.map((feature, idx) => (
              <div
                key={feature.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className={`bg-gradient-to-r ${feature.gradient} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-white/90 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* 주요 기능 */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">주요 기능</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {feature.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 하이라이트 */}
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <h4 className="font-semibold text-sm text-yellow-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      핵심 포인트
                    </h4>
                    <div className="space-y-2">
                      {feature.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-yellow-900">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 기술 스택 탭 */}
        {activeTab === 'tech' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                최신 기술 스택
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                안정성과 성능을 위해 검증된 최신 기술을 사용합니다.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {techStack.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl">{tech.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{tech.name}</div>
                      <div className="text-sm text-gray-600">{tech.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 아키텍처 하이라이트 */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <h3 className="font-bold text-lg mb-4 text-purple-900">아키텍처 특징</h3>
              <div className="space-y-3">
                {[
                  {
                    title: '서버리스 아키텍처',
                    desc: 'Netlify Functions로 비용 효율적인 백엔드'
                  },
                  {
                    title: '실시간 데이터베이스',
                    desc: 'Firebase Firestore로 즉각적인 동기화'
                  },
                  {
                    title: '스케줄 자동화',
                    desc: 'Cron 작업으로 정산 자동 마감'
                  },
                  {
                    title: '이미지 최적화',
                    desc: 'Cloudinary CDN으로 빠른 로딩'
                  },
                  {
                    title: '모바일 우선',
                    desc: 'Progressive Web App (PWA) 지원'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-semibold text-purple-900 mb-1">{item.title}</div>
                    <div className="text-sm text-purple-700">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default IntroductionPage;
