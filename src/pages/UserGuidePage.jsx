// src/pages/UserGuidePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Heart,
  Receipt,
  Wallet,
  Bell,
  UserCheck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Mail,
  Users
} from 'lucide-react';

const UserGuidePage = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const guides = [
    {
      id: 'start',
      icon: UserCheck,
      title: '시작하기',
      color: 'blue',
      steps: [
        {
          title: '1. 초대 코드 받기',
          content: '라운지 관리자로부터 초대 링크를 받으세요. 카카오톡이나 문자로 공유됩니다.'
        },
        {
          title: '2. 카카오 로그인',
          content: '초대 링크를 클릭하면 카카오 로그인 화면이 나타납니다. 카카오 계정으로 간편하게 가입할 수 있어요.'
        },
        {
          title: '3. 프로필 등록',
          content: '이름, 성별, 생년 등 기본 정보를 입력하면 가입이 완료됩니다.'
        },
        {
          title: '4. 라운지 입장',
          content: '자동으로 라운지에 입장되며, 바로 예약과 다른 기능들을 사용할 수 있습니다.'
        }
      ]
    },
    {
      id: 'reservation',
      icon: Calendar,
      title: '예약하기',
      color: 'green',
      steps: [
        {
          title: '예약 화면 확인',
          content: '하단 메뉴의 "일정" 탭을 누르면 주간 예약 현황을 볼 수 있어요. 리스트형과 달력형 두 가지 보기가 가능합니다.'
        },
        {
          title: '날짜 선택',
          content: '원하는 날짜를 클릭하세요. 이미 예약이 있는 날짜는 예약자 수와 성별 분포가 표시됩니다.'
        },
        {
          title: '예약 등록',
          content: '날짜를 선택하면 예약 확인 창이 나타나요. "예약하기" 버튼을 누르면 완료!'
        },
        {
          title: '내 예약 확인',
          content: '내가 예약한 날짜는 녹색으로 표시되고, 리스트에서 항상 맨 앞에 나타납니다.'
        },
        {
          title: '예약 취소',
          content: '이미 예약한 날짜를 다시 클릭하면 "예약 취소" 버튼이 나타나요. 언제든 취소할 수 있습니다.'
        }
      ]
    },
    {
      id: 'praise',
      icon: Heart,
      title: '칭찬하기',
      color: 'pink',
      steps: [
        {
          title: '칭찬 탭 이동',
          content: '하단 메뉴에서 하트 아이콘의 "칭찬" 탭을 선택하세요.'
        },
        {
          title: '칭찬 대상 선택',
          content: '같은 라운지 멤버 중 칭찬하고 싶은 사람을 선택하세요. 여러 명을 동시에 선택할 수 있어요.'
        },
        {
          title: '칭찬 내용 작성',
          content: '칭찬 메시지를 자유롭게 작성하세요. 짧은 한 마디도, 긴 감사 인사도 좋아요!'
        },
        {
          title: '칭찬 보내기',
          content: '"보내기" 버튼을 누르면 칭찬이 전달됩니다. 받는 사람에게 이메일 알림도 갈 수 있어요.'
        },
        {
          title: '받은 칭찬 확인',
          content: '칭찬 페이지 상단에서 내가 받은 칭찬 개수와 내용을 확인할 수 있습니다.'
        }
      ]
    },
    {
      id: 'settlement',
      icon: Receipt,
      title: '정산 확인',
      color: 'purple',
      steps: [
        {
          title: '정산 탭 이동',
          content: '하단 메뉴의 "정산" 탭을 선택하면 주간 정산 내역을 볼 수 있어요.'
        },
        {
          title: '주간 정산 확인',
          content: '월요일부터 일요일까지 한 주 단위로 정산이 진행됩니다. 좌우 화살표로 이전/다음 주를 확인하세요.'
        },
        {
          title: '내 정산 금액',
          content: '상단 카드에서 내가 낸 금액, 써야 할 금액, 최종 정산액을 한눈에 확인할 수 있어요.'
        },
        {
          title: '영수증 제출 (주주만)',
          content: '주주라면 "영수증 제출" 버튼으로 공동 구매한 물품의 영수증을 등록할 수 있어요. 사진을 찍고 항목과 금액을 입력하세요.'
        },
        {
          title: '카드/테이블 보기',
          content: '정산 내역을 카드형과 테이블형 두 가지로 볼 수 있어요. 취향에 맞게 선택하세요.'
        }
      ]
    },
    {
      id: 'expense',
      icon: Wallet,
      title: '공용 운영비',
      color: 'orange',
      steps: [
        {
          title: '운영비 탭 이동',
          content: '하단 메뉴의 "운영비" 탭을 선택하세요.'
        },
        {
          title: '신청 내역 확인',
          content: '현재까지 신청된 운영비 지출 내역을 확인할 수 있어요. 승인/대기/거절 상태가 표시됩니다.'
        },
        {
          title: '신청하기 (주주만)',
          content: '주주라면 "+" 버튼으로 운영비 사용을 신청할 수 있어요. 항목, 금액, 사유를 입력하세요.'
        },
        {
          title: '승인 확인',
          content: '관리자가 승인하면 상태가 "승인됨"으로 바뀌어요. 거절된 경우 사유를 확인할 수 있습니다.'
        }
      ]
    },
    {
      id: 'settings',
      icon: Bell,
      title: '알림 설정',
      color: 'indigo',
      steps: [
        {
          title: '더보기 메뉴',
          content: '하단 메뉴의 "더보기" 탭을 선택하세요.'
        },
        {
          title: '이메일 알림 설정',
          content: '"개인정보 수정" 메뉴에서 이메일 주소를 등록하고 알림 설정을 조정할 수 있어요.'
        },
        {
          title: '받을 수 있는 알림',
          content: '칭찬 받음, 정산 마감, 운영비 신청/승인 등 다양한 알림을 이메일로 받을 수 있습니다.'
        },
        {
          title: '알림 끄기',
          content: '원하지 않는 알림은 언제든 설정에서 끌 수 있어요.'
        }
      ]
    }
  ];

  const faqs = [
    {
      q: '게스트와 주주의 차이는?',
      a: '주주는 라운지 운영에 참여하며 영수증 제출과 운영비 신청이 가능합니다. 게스트는 예약과 칭찬 등 기본 기능만 이용할 수 있어요. 권한은 관리자가 설정합니다.'
    },
    {
      q: '예약을 깜빡했는데 당일 예약 가능한가요?',
      a: '네, 당일에도 예약과 취소가 자유롭게 가능합니다. 다만 라운지마다 정책이 다를 수 있으니 관리자에게 문의하세요.'
    },
    {
      q: '정산은 자동으로 되나요?',
      a: '네, 매주 정해진 시간(보통 월요일 저녁)에 자동으로 마감됩니다. 마감 전까지 영수증을 제출하면 해당 주 정산에 반영돼요.'
    },
    {
      q: '칭찬을 보내면 상대방이 누가 보냈는지 알 수 있나요?',
      a: '네, 칭찬을 받은 사람은 누가 보냈는지 확인할 수 있어요. 진심 어린 칭찬을 나눠보세요!'
    },
    {
      q: '탈퇴하고 싶어요',
      a: '더보기 > 계정 > 회원 탈퇴 메뉴에서 탈퇴할 수 있습니다. 탈퇴 시 모든 데이터가 삭제되니 신중하게 결정하세요.'
    },
    {
      q: '문의사항은 어디로 하나요?',
      a: '라운지 운영에 관한 문의는 관리자에게, 앱 사용 문제는 하단의 문의하기 버튼을 이용해주세요.'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
        accent: 'bg-blue-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        iconBg: 'bg-green-100',
        accent: 'bg-green-500'
      },
      pink: {
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        icon: 'text-pink-600',
        iconBg: 'bg-pink-100',
        accent: 'bg-pink-500'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        iconBg: 'bg-purple-100',
        accent: 'bg-purple-500'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        iconBg: 'bg-orange-100',
        accent: 'bg-orange-500'
      },
      indigo: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        icon: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        accent: 'bg-indigo-500'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold">사용 가이드</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 인트로 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-2">라운지 이용 가이드</h2>
          <p className="text-blue-50 leading-relaxed">
            라운지를 처음 이용하시나요? 예약부터 정산까지, 모든 기능을 쉽게 사용하는 방법을 안내해드릴게요.
          </p>
        </div>

        {/* 가이드 섹션들 */}
        <div className="space-y-4 mb-8">
          {guides.map((guide) => {
            const Icon = guide.icon;
            const colors = getColorClasses(guide.color);
            const isExpanded = expandedSection === guide.id;

            return (
              <div key={guide.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection(guide.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{guide.title}</h3>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className={`border-t ${colors.border} ${colors.bg} p-4`}>
                    <div className="space-y-4">
                      {guide.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className={`w-6 h-6 rounded-full ${colors.accent} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">자주 묻는 질문</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                  <span className="text-blue-600 font-bold">Q.</span>
                  <span>{faq.q}</span>
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 도움말 카드 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">추가 도움이 필요하신가요?</h3>
          <p className="text-sm text-gray-600 mb-4">
            사용 중 문제가 발생하거나 궁금한 점이 있다면 라운지 관리자에게 문의하세요.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/more')}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              설정으로 이동
            </button>
            <button
              onClick={() => navigate('/introduction')}
              className="flex-1 bg-white text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              앱 소개 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuidePage;
