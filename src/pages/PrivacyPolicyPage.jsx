import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
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
          <h1 className="text-xl font-bold text-white">개인정보처리방침</h1>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl p-6 md:p-8">
          <div className="space-y-8 text-white">
            {/* 서문 */}
            <section className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                제이에이치308(이하 "회사"라 함)는 『개인정보 보호법』의 개인정보 보호 규정을 준수하고 있습니다. 
                본 개인정보처리방침을 통하여 회사가 이용자로부터 제공받은 개인정보를 어떠한 용도와 방식으로 이용하고 있으며, 
                개인정보 보호를 위해 어떠한 조치를 취하고 있는지 알려드립니다.
              </p>
              <p className="text-gray-300 leading-relaxed">
                본 개인정보처리방침은 회사가 운영하는 게하(게스트하우스) 예약 서비스에 적용됩니다.
              </p>
            </section>

            {/* 제1조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제1조 (개인정보의 처리 목적, 항목 및 보유ㆍ이용기간)
              </h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 아래와 같은 목적으로 이용자가 직접 제공하는 최소한의 개인정보를 수집하고 있으며, 
                사전에 이를 알리고 동의를 구하고 있습니다.
              </p>
              
              <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 text-white font-semibold">수집 및 이용 목적</th>
                      <th className="text-left py-3 px-2 text-white font-semibold">수집 및 이용 항목</th>
                      <th className="text-left py-3 px-2 text-white font-semibold">수집 조건</th>
                      <th className="text-left py-3 px-2 text-white font-semibold">보유ㆍ이용기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 text-gray-300 align-top">
                        회원가입 및 본인확인
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        <div className="space-y-1">
                          <div>• 이름 (필수)</div>
                          <div>• 성별 (필수)</div>
                          <div>• 출생연도 (필수)</div>
                          <div>• 카카오계정(전화번호) (필수)</div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        필수
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        회원 탈퇴 시까지
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 text-gray-300 align-top">
                        서비스 이용 식별
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        <div className="space-y-1">
                          <div>• 카카오 계정 정보 (이메일, 이름) (필수)</div>
                          <div>• 프로필 이미지 (선택)</div>
                          <div>• 카카오 고유 ID (필수)</div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        필수/선택
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        회원 탈퇴 시까지
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-2 text-gray-300 align-top">
                        예약 관리 및 서비스 제공
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        <div className="space-y-1">
                          <div>• 이름 (필수)</div>
                          <div>• 휴대폰 번호 (필수)</div>
                          <div>• 성별 (필수)</div>
                          <div>• 출생연도 (필수)</div>
                          <div>• 체크인/체크아웃 일자 (필수)</div>
                          <div>• 예약 메모 (선택)</div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        필수/선택
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        예약 종료 후 3개월
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        알림 서비스 제공
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        <div className="space-y-1">
                          <div>• 휴대폰 번호 (알림톡/SMS) (필수)</div>
                          <div>• 이메일 주소 (필수)</div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        필수
                      </td>
                      <td className="py-3 px-2 text-gray-300 align-top">
                        회원 탈퇴 시까지
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-gray-300">
                <p>회사는 이용자의 기본적 인권 침해의 우려가 있는 민감한 개인정보(인종, 사상, 정치적 성향, 건강, 성생활 등)는 수집하지 않습니다.</p>
                <p>회사는 원칙적으로 만 14세 미만 아동의 개인정보를 수집하지 않습니다.</p>
              </div>
            </section>

            {/* 제2조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제2조 (개인정보의 제3자 제공)
              </h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
                <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
              </ul>

              <div className="bg-white/5 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-semibold text-white mb-3">외부 서비스 제공자</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-semibold text-white">카카오 (Kakao)</div>
                    <div className="text-gray-400">제공 목적: 소셜 로그인 인증</div>
                    <div className="text-gray-400">제공 항목: 카카오 계정 정보</div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">솔라피 (Solapi)</div>
                    <div className="text-gray-400">제공 목적: 알림톡/SMS 발송</div>
                    <div className="text-gray-400">제공 항목: 휴대폰 번호, 예약 정보</div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Firebase (Google)</div>
                    <div className="text-gray-400">제공 목적: 데이터 저장 및 관리</div>
                    <div className="text-gray-400">제공 항목: 회원 정보, 예약 정보</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제3조 (개인정보의 파기)
              </h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
                지체없이 해당 개인정보를 파기합니다.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">파기 절차</h3>
                  <p className="text-gray-300">
                    이용자가 제공한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 
                    일정기간 저장된 후 파기됩니다. 별도 DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 
                    다른 목적으로 이용되지 않습니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">파기 방법</h3>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1">
                    <li>전자적 파일 형태: 복구 및 재생이 불가능한 기술적 방법을 사용하여 삭제</li>
                    <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제4조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제4조 (정보주체의 권리·의무 및 행사방법)
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">행사 가능한 권리</h3>
                  <p className="text-gray-300 mb-2">
                    이용자는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
                  </p>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1">
                    <li>개인정보 열람 요구</li>
                    <li>오류 등이 있을 경우 정정 요구</li>
                    <li>삭제 요구</li>
                    <li>처리정지 요구</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">권리 행사 방법</h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li>• 서비스 내 설정 메뉴</li>
                      <li>• 개인정보 보호책임자에게 직접 연락</li>
                    </ul>
                  </div>
                </div>

                <p className="text-gray-300 text-sm">
                  회사는 이용자의 요구사항에 대해 지체 없이 처리하며, 
                  이용자가 개인정보의 오류에 대한 정정을 요청하신 경우 정정을 완료하기 전까지 
                  당해 개인정보를 이용 또는 제공하지 않습니다.
                </p>
              </div>
            </section>

            {/* 제5조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제5조 (개인정보 보호책임자)
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 
                개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 
                아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-white/20">
                <h3 className="font-bold text-xl text-white mb-4">개인정보 보호책임자</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-semibold text-white">성명:</span> 양석환</p>
                  <p><span className="font-semibold text-white">이메일:</span> reshw@naver.com</p>
                  <p><span className="font-semibold text-white">소속:</span> 제이에이치308</p>
                </div>
              </div>

              <p className="text-gray-300 text-sm mt-4">
                이용자는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 
                피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 
                회사는 이용자의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.
              </p>
            </section>

            {/* 제6조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제6조 (개인정보 자동수집 장치의 설치∙운영 및 외부 서비스 연동)
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">쿠키(Cookie) 사용</h3>
                  <p className="text-gray-300 mb-2">
                    회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용정보를 저장하고 
                    수시로 불러오는 '쿠키(cookie)'를 사용할 수 있습니다.
                  </p>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1 text-sm">
                    <li>쿠키의 사용 목적: 로그인 상태 유지, 서비스 이용 편의성 제공</li>
                    <li>쿠키의 설치/운영 및 거부: 웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴에서 설정 가능</li>
                    <li>쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">소셜 로그인 서비스</h3>
                  <p className="text-gray-300 mb-2">
                    회사는 카카오 소셜 로그인 서비스를 통해 이용자 인증을 진행합니다.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4 text-sm">
                    <ul className="space-y-2 text-gray-300">
                      <li>• 소셜 로그인 시 수집되는 정보: 이름, 이메일 주소, 프로필 이미지, 카카오 계정 고유 ID</li>
                      <li>• 해당 정보는 이용자 식별 및 서비스 이용을 위해서만 활용되며, 별도의 마케팅 목적으로 사용되지 않습니다.</li>
                      <li>• 소셜 계정 연동 해제는 카카오 계정 관리 페이지에서 가능합니다.</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Firebase 서비스 이용</h3>
                  <p className="text-gray-300 text-sm">
                    회사는 Google의 Firebase 서비스를 이용하여 데이터를 저장하고 관리합니다. 
                    Firebase는 Google의 개인정보 보호정책을 따르며, 상세한 내용은 
                    <a 
                      href="https://policies.google.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline ml-1"
                    >
                      Google 개인정보처리방침
                    </a>
                    에서 확인하실 수 있습니다.
                  </p>
                </div>
              </div>
            </section>

            {/* 제7조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제7조 (개인정보의 안전성 확보조치)
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>개인정보 취급 직원의 최소화 및 교육</li>
                <li>개인정보에 대한 접근 제한 (비밀번호 설정 및 암호화)</li>
                <li>해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위한 보안 프로그램 설치 및 주기적 갱신・점검</li>
                <li>암호화 통신 등을 통한 네트워크상에서 개인정보 안전 전송</li>
                <li>개인정보에 대한 접근기록 보관 및 위변조 방지</li>
                <li>백업 및 복구 시스템 구축</li>
              </ul>
            </section>

            {/* 제8조 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-3">
                제8조 (개인정보 처리방침의 변경)
              </h2>
              <p className="text-gray-300 leading-relaxed">
                본 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 
                삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다. 
                다만, 개인정보의 수집 및 활용, 제3자 제공 등과 같이 이용자 권리의 중요한 변경이 있을 경우에는 
                최소 30일 전에 고지합니다.
              </p>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-white/20 mt-4">
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-semibold text-white">공고일자:</span> 2024년 12월 18일</p>
                  <p><span className="font-semibold text-white">시행일자:</span> 2024년 12월 25일</p>
                  <p className="text-sm pt-2 border-t border-white/20 mt-3">
                    이전 개인정보처리방침은 서비스 내 공지사항에서 확인하실 수 있습니다.
                  </p>
                </div>
              </div>
            </section>

            {/* 추가 정보 */}
            <section className="space-y-4 pt-4 border-t border-white/20">
              <h2 className="text-2xl font-bold text-white">개인정보 침해 관련 상담 및 신고</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하시기 바랍니다:
              </p>
              <div className="bg-white/5 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <div className="font-semibold text-white">개인정보침해신고센터</div>
                  <div className="text-gray-400">전화: (국번없이) 118</div>
                  <div className="text-gray-400">홈페이지: privacy.kisa.or.kr</div>
                </div>
                <div>
                  <div className="font-semibold text-white">개인정보분쟁조정위원회</div>
                  <div className="text-gray-400">전화: 1833-6972</div>
                  <div className="text-gray-400">홈페이지: www.kopico.go.kr</div>
                </div>
                <div>
                  <div className="font-semibold text-white">대검찰청 사이버범죄수사단</div>
                  <div className="text-gray-400">전화: (국번없이) 1301</div>
                  <div className="text-gray-400">홈페이지: www.spo.go.kr</div>
                </div>
                <div>
                  <div className="font-semibold text-white">경찰청 사이버안전국</div>
                  <div className="text-gray-400">전화: (국번없이) 182</div>
                  <div className="text-gray-400">홈페이지: cyberbureau.police.go.kr</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;