import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">서비스 이용약관</h1>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl p-6 md:p-8">
          <div className="space-y-8 text-white">
            {/* 제1조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제1조 (목적)
              </h2>
              <p className="text-gray-300 leading-relaxed">
                이 약관은 제이에이치308(이하 "회사")이 제공하는 게하(게스트하우스) 예약 서비스(이하 "서비스")의 
                이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 서비스 이용조건 및 절차 등을 규정함을 
                목적으로 합니다.
              </p>
            </section>

            {/* 제2조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제2조 (정의)
              </h2>
              <div className="space-y-3">
                <p className="text-gray-300">이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                <ol className="space-y-3 pl-6">
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">1. "서비스"</span>란 회원이 게스트하우스를 
                    이용할 수 있도록 회사가 제공하는 모바일 기반 예약 관리 시스템을 말합니다.
                  </li>
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">2. "회원"</span>이란 본 약관에 따라 회사와 
                    이용계약을 체결하고 서비스를 이용하는 자를 말합니다.
                  </li>
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">3. "주주(Shareholder)"</span>란 게스트하우스의 
                    지분을 소유하고 무료로 예약 및 이용이 가능한 회원을 말합니다.
                  </li>
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">4. "게스트(Guest)"</span>란 주주의 초대를 받아 
                    유료로 게스트하우스를 이용하는 회원을 말합니다.
                  </li>
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">5. "매니저(Manager)"</span>란 게스트하우스의 
                    전반적인 운영 및 관리 권한을 가진 회원을 말합니다.
                  </li>
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">6. "부매니저(Vice-Manager)"</span>란 매니저를 
                    보조하여 제한된 관리 권한을 가진 회원을 말합니다.
                  </li>
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">7. "예약"</span>이란 회원이 특정 기간 동안 
                    게스트하우스를 이용하기 위해 서비스를 통해 신청하고 확정된 상태를 말합니다.
                  </li>
                  <li className="text-gray-300">
                    <span className="font-semibold text-white">8. "스페이스(Space)"</span>란 서비스 내에서 
                    특정 게스트하우스를 구분하기 위한 독립된 단위를 말합니다.
                  </li>
                </ol>
              </div>
            </section>

            {/* 제3조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제3조 (약관의 효력 및 변경)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 이 약관은 서비스 화면에 게시하거나 
                  기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회사는 필요한 경우 관련 법령(약관의 규제에 
                  관한 법률, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등)을 위배하지 않는 범위에서 
                  본 약관을 변경할 수 있습니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 약관이 변경되는 경우 회사는 변경 사항을 
                  시행일 7일 전부터 서비스 내 공지사항을 통해 공지합니다. 다만, 회원에게 불리한 약관의 변경인 
                  경우에는 시행일 30일 전부터 공지하며, 회원의 이메일로도 개별 통지합니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">④</span> 회원은 변경된 약관에 동의하지 않을 경우 
                  서비스 이용을 중단하고 이용계약을 해지할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 
                  서비스를 계속 이용하는 경우에는 약관의 변경사항에 동의한 것으로 간주됩니다.
                </li>
              </ol>
            </section>

            {/* 제4조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제4조 (이용계약의 체결)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 이용계약은 회원이 되고자 하는 자가 
                  약관의 내용에 동의를 한 다음 카카오 소셜 로그인을 통해 회원가입을 신청하고, 
                  회사가 이를 승낙함으로써 체결됩니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회사는 회원가입신청자의 신청에 대하여 
                  서비스 이용을 승낙함을 원칙으로 합니다. 다만, 다음 각 호에 해당하는 신청에 대하여는 
                  승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>실명이 아니거나 타인의 명의를 도용한 경우</li>
                    <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                    <li>만 14세 미만 미성년자가 법정대리인의 동의를 얻지 아니한 경우</li>
                    <li>이용자의 귀책사유로 인하여 승인이 불가능하거나 기타 규정한 제반 사항을 위반하며 신청하는 경우</li>
                    <li>서비스 관련 설비의 여유가 없거나, 기술상 또는 업무상 문제가 있는 경우</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 회원가입계약의 성립 시기는 회사의 
                  승낙이 회원에게 도달한 시점으로 합니다.
                </li>
              </ol>
            </section>

            {/* 제5조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제5조 (회원 정보의 제공 및 변경)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회원은 서비스 이용을 위해 다음의 정보를 
                  제공해야 합니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>필수정보: 카카오 계정 정보(이름, 이메일), 휴대폰 번호, 성별, 출생연도</li>
                    <li>선택정보: 프로필 이미지, 예약 메모</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회원은 회원가입 시 등록한 정보에 변경이 
                  있는 경우, 즉시 서비스 내 설정 메뉴를 통해 수정하거나 회사에 통지하여야 합니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 회원이 제2항의 변경사항을 수정하지 
                  않아 발생한 불이익에 대하여 회사는 책임지지 않습니다.
                </li>
              </ol>
            </section>

            {/* 제6조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제6조 (회원의 유형 및 권한)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 주주는 다음의 권한을 가집니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>게스트하우스 무료 예약 및 이용</li>
                    <li>게스트 초대 및 예약 대리</li>
                    <li>자신의 예약 내역 조회 및 관리</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 게스트는 다음의 권한을 가집니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>주주의 초대를 통한 게스트하우스 유료 예약 및 이용</li>
                    <li>자신의 예약 내역 조회</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 매니저는 다음의 권한을 가집니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>모든 회원의 예약 내역 조회 및 관리</li>
                    <li>회원 정보 열람 (개인정보 보호법 준수 범위 내)</li>
                    <li>예약 취소 및 변경</li>
                    <li>스페이스 설정 관리</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">④</span> 부매니저는 매니저의 권한 중 회사가 
                  지정한 제한된 권한을 가집니다.
                </li>
              </ol>
            </section>

            {/* 제7조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제7조 (예약 및 이용)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회원은 서비스를 통해 게스트하우스 
                  이용 예약을 신청할 수 있으며, 예약은 다음의 정보를 포함해야 합니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>투숙객 이름 및 연락처</li>
                    <li>체크인 및 체크아웃 일자</li>
                    <li>투숙 인원</li>
                    <li>기타 특이사항 (선택)</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 예약 신청이 완료되면 회원에게 예약 확인 
                  알림톡 또는 SMS가 발송됩니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 예약의 취소 및 변경은 다음과 같이 가능합니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>주주 및 게스트: 체크인 예정일 3일 전까지 무료 취소 가능</li>
                    <li>체크인 예정일 3일 이내: 취소 수수료 부과 가능</li>
                    <li>매니저 및 부매니저: 불가피한 사유 발생 시 예약 취소 가능 (사전 통지 필수)</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">④</span> 예약이 중복되거나 시설 이용이 불가능한 
                  상황이 발생한 경우, 회사는 먼저 예약한 회원에게 우선권을 부여합니다.
                </li>
              </ol>
            </section>

            {/* 제8조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제8조 (이용 요금)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 주주, 매니저, 부매니저의 게스트하우스 
                  이용은 무료입니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 게스트의 게스트하우스 이용은 주주가 
                  정한 요금 정책에 따라 유료로 제공됩니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 이용 요금의 결제 방법은 다음과 같습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>계좌이체</li>
                    <li>기타 회사가 지정하는 결제 수단</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">④</span> 요금 정책은 주주 간 협의를 통해 
                  변경될 수 있으며, 변경 시 사전에 공지됩니다.
                </li>
              </ol>
            </section>

            {/* 제9조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제9조 (회원의 의무)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회원은 다음 각 호의 행위를 하여서는 
                  안 됩니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>타인의 정보 도용</li>
                    <li>회사 또는 제3자의 지식재산권 침해</li>
                    <li>회사 또는 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                    <li>서비스를 통해 얻은 정보의 무단 복제, 배포, 상업적 이용</li>
                    <li>외설 또는 폭력적인 메시지, 화상, 음성 등의 공개 또는 게시</li>
                    <li>회사의 동의 없이 영리를 목적으로 서비스를 사용하는 행위</li>
                    <li>기타 불법적이거나 부당한 행위</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회원은 게스트하우스 이용 시 다음 사항을 
                  준수해야 합니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>시설물 및 비품의 파손 또는 분실 방지</li>
                    <li>소음 및 쓰레기 관리 등 이웃에 대한 배려</li>
                    <li>화재 예방 및 안전 수칙 준수</li>
                    <li>반려동물 동반 시 사전 협의 및 피해 방지</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 회원이 제1항 및 제2항을 위반하여 
                  발생한 손해에 대해서는 회원이 책임을 집니다.
                </li>
              </ol>
            </section>

            {/* 제10조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제10조 (회사의 의무)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회사는 관련 법령과 본 약관이 금지하거나 
                  공서양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위하여 
                  최선을 다합니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회사는 회원이 안전하게 서비스를 
                  이용할 수 있도록 개인정보(신용정보 포함) 보호를 위해 보안시스템을 갖추어야 하며 
                  개인정보처리방침을 공시하고 준수합니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 회사는 서비스 이용과 관련하여 
                  회원으로부터 제기된 의견이나 불만이 정당하다고 인정할 경우 이를 처리하여야 합니다. 
                  회원이 제기한 의견이나 불만사항에 대해서는 게시판을 활용하거나 이메일 등을 통하여 
                  회원에게 처리과정 및 결과를 전달합니다.
                </li>
              </ol>
            </section>

            {/* 제11조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제11조 (서비스 제공의 중단)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회사는 다음 각 호의 경우에 서비스 제공을 
                  일시적으로 중단할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우</li>
                    <li>서비스를 제공하는데 필요한 기간통신사업자가 전기통신 서비스를 중지한 경우</li>
                    <li>국가비상사태, 정전, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 정상적인 서비스 제공이 불가능한 경우</li>
                    <li>기타 불가항력적 사유가 있는 경우</li>
                  </ul>
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회사는 제1항의 사유로 서비스 제공이 
                  중단된 경우 이를 사전에 통지합니다. 다만, 회사가 통제할 수 없는 사유로 인한 서비스 중단의 
                  경우에는 사후에 통지할 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제12조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제12조 (계약 해지 및 이용 제한)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회원은 언제든지 서비스 내 설정 메뉴 
                  또는 회사에 연락하여 이용계약 해지를 신청할 수 있으며, 회사는 관련 법령 등이 정하는 바에 
                  따라 이를 즉시 처리합니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회원이 계약을 해지하는 경우, 관련법 
                  및 개인정보처리방침에 따라 회사가 회원정보를 보유하는 경우를 제외하고는 해지 즉시 회원의 
                  모든 데이터는 소멸됩니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 회사는 회원이 다음 각 호의 사유에 
                  해당하는 경우 사전 통보 후 이용계약을 해지하거나 일정 기간 서비스 이용을 제한할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>타인의 명의를 도용한 경우</li>
                    <li>서비스 운영을 고의로 방해한 경우</li>
                    <li>가입 신청 시 허위 내용을 등록한 경우</li>
                    <li>본 약관을 포함하여 기타 회사가 정한 이용조건에 위반한 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 제13조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제13조 (손해배상)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회사는 서비스와 관련하여 회원에게 
                  어떠한 손해가 발생하더라도 회사의 고의 또는 중과실에 의한 경우를 제외하고는 이에 대하여 
                  책임을 지지 않습니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회원이 서비스를 이용함에 있어 
                  행한 불법행위나 본 약관 위반행위로 인하여 회사가 당해 회원 이외의 제3자로부터 손해배상 
                  청구 또는 소송을 비롯한 각종 이의제기를 받는 경우 당해 회원은 자신의 책임과 비용으로 
                  회사를 면책시켜야 하며, 회사가 면책되지 못한 경우 당해 회원은 그로 인하여 회사에 발생한 
                  모든 손해를 배상하여야 합니다.
                </li>
              </ol>
            </section>

            {/* 제14조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제14조 (면책조항)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회사는 천재지변, 전쟁, 기간통신사업자의 
                  서비스 중지 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 
                  서비스 제공에 관한 책임이 면제됩니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회사는 회원의 귀책사유로 인한 
                  서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">③</span> 회사는 회원이 서비스를 이용하여 
                  기대하는 수익을 얻지 못한 것에 대하여 책임을 지지 않으며, 서비스를 통하여 얻은 자료로 
                  인한 손해에 관하여 책임을 지지 않습니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">④</span> 회사는 회원 상호간 또는 회원과 
                  제3자 상호간에 서비스를 매개로 발생한 분쟁에 대해서는 개입할 의무가 없으며 이로 인한 
                  손해를 배상할 책임도 없습니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">⑤</span> 회사는 무료로 제공되는 서비스 
                  이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.
                </li>
              </ol>
            </section>

            {/* 제15조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제15조 (분쟁 해결)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 회사는 회원으로부터 제출되는 불만사항 
                  및 의견을 우선적으로 처리합니다. 다만, 신속한 처리가 곤란한 경우에는 회원에게 그 사유와 
                  처리일정을 즉시 통보합니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회사와 회원 간 발생한 분쟁은 
                  전자문서 및 전자거래 기본법에 의해 설치된 전자문서·전자거래분쟁조정위원회의 조정에 따를 
                  수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제16조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제16조 (준거법 및 관할법원)
              </h2>
              <ol className="space-y-3 pl-6">
                <li className="text-gray-300">
                  <span className="font-semibold text-white">①</span> 본 약관은 대한민국 법률에 따라 
                  규율되고 해석됩니다.
                </li>
                <li className="text-gray-300">
                  <span className="font-semibold text-white">②</span> 회사와 회원 간 발생한 분쟁에 관한 
                  소송은 민사소송법상의 관할법원에 제기합니다.
                </li>
              </ol>
            </section>

            {/* 부칙 */}
            <section className="space-y-4 pt-4 border-t border-white/20">
              <h2 className="text-2xl font-bold text-white">부칙</h2>
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-white/20">
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-semibold text-white">제1조 (시행일)</span></p>
                  <p>본 약관은 2024년 12월 25일부터 시행됩니다.</p>
                  <p className="mt-4"><span className="font-semibold text-white">제2조 (경과조치)</span></p>
                  <p>본 약관 시행 전에 가입한 회원에 대해서도 본 약관이 적용됩니다.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;