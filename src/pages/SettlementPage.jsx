// src/pages/SettlementPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Plus, TrendingUp, TrendingDown, Users, Calendar, User, CheckCircle, Table, LayoutGrid, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import settlementService, { getWeekId, getWeekRange } from '../services/settlementService';
import authService from '../services/authService';
import LoginOverlay from '../components/auth/LoginOverlay';
import ReceiptDetailModal from '../components/settlement/ReceiptDetailModal';
import ParticipantDetailModal from '../components/settlement/ParticipantDetailModal';
import SettlementTableView from '../components/settlement/SettlementTableView';
import { canManageSpace } from '../utils/permissions';

const SettlementPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();

  // 현재 보고 있는 주차의 시작일
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const { weekStart } = getWeekRange(today);
    return weekStart;
  });

  const [settlement, setSettlement] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myBalance, setMyBalance] = useState(null);
  const [members, setMembers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({}); // userId -> {displayName, profileImage}
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [activeTab, setActiveTab] = useState('myReceipts'); // 'myReceipts' | 'participants' | 'allReceipts'
  const [allSettlements, setAllSettlements] = useState([]); // 모든 정산 목록
  const [showWeekList, setShowWeekList] = useState(false); // 주차 목록 표시 여부

  useEffect(() => {
    if (selectedSpace?.id && user?.id) {
      loadSettlement();
      loadAllSettlements();
    } else if (selectedSpace && user) {
      // user.id가 없는 경우에도 로딩 종료
      setLoading(false);
    }
  }, [selectedSpace, user, selectedWeekStart]);

  const loadSettlement = async () => {
    if (!selectedSpace?.id || !user?.id) return;

    try {
      setLoading(true);

      // 멤버 정보 가져오기
      const spaceMembers = await settlementService.getSpaceMembers(selectedSpace.id);
      setMembers(spaceMembers);

      // 선택된 주차의 weekId 계산
      const weekId = getWeekId(selectedWeekStart);
      console.log('📅 선택된 주차:', weekId, selectedWeekStart);

      // 선택된 주차의 Settlement 가져오기
      let weekSettlement = await settlementService.getSettlementByDate(selectedSpace.id, selectedWeekStart);

      // 현재 주차를 보고 있고 settlement이 없으면 자동 생성
      const today = new Date();
      const { weekStart: currentWeekStart } = getWeekRange(today);
      const isCurrentWeek = selectedWeekStart.getTime() === currentWeekStart.getTime();

      if (!weekSettlement && isCurrentWeek) {
        console.log('🆕 현재 주차의 settlement이 없음 → 자동 생성');
        weekSettlement = await settlementService.getCurrentWeekSettlement(selectedSpace.id);
      }

      // 영수증 목록 가져오기
      let weekReceipts = [];
      if (weekSettlement?.weekId) {
        weekReceipts = await settlementService.getWeekReceipts(selectedSpace.id, weekSettlement.weekId);

        // 🔄 영수증이 있으면 무조건 재계산하여 항상 최신 상태 유지
        if (weekReceipts.length > 0) {
          const actualTotalAmount = weekReceipts.reduce((sum, receipt) => sum + (receipt.totalAmount || 0), 0);
          const storedTotalAmount = weekSettlement.totalAmount || 0;

          console.log('🔄 영수증 기반 정산 상태 확인:', {
            영수증수: weekReceipts.length,
            실제총액: actualTotalAmount,
            저장된총액: storedTotalAmount,
            참여자수: Object.keys(weekSettlement.participants || {}).length
          });

          try {
            console.log('🔄 정산 재계산 시작...');
            const updatedParticipants = await settlementService.updateSettlementCalculation(selectedSpace.id, weekSettlement.weekId);
            console.log('✅ 정산 재계산 완료:', updatedParticipants);

            // 재계산 후 최신 데이터 다시 가져오기
            const freshSettlement = await settlementService.getSettlementByDate(selectedSpace.id, selectedWeekStart);
            if (freshSettlement) {
              weekSettlement = freshSettlement;
              console.log('✅ 최신 정산 데이터 로드 완료');
            } else {
              console.warn('⚠️ 재계산 후 데이터 조회 실패 - 기존 데이터 유지');
            }
          } catch (recalcError) {
            console.error('❌ 정산 재계산 실패:', recalcError);
            console.error('상세 에러:', recalcError.message, recalcError.stack);
            // 재계산 실패해도 기존 데이터는 유지
          }
        }
      }

      setSettlement(weekSettlement);
      setReceipts(weekReceipts);

      // 참여자들의 프로필 정보 가져오기 (users 컬렉션에서)
      const participantIds = Object.keys(weekSettlement?.participants || {});
      if (participantIds.length > 0) {
        const profiles = await authService.getUserProfiles(participantIds);
        setUserProfiles(profiles);
      }

      // 내 잔액 계산
      const myInfo = weekSettlement?.participants?.[user.id];
      setMyBalance(myInfo || { name: user.displayName, totalPaid: 0, totalOwed: 0, balance: 0 });

    } catch (error) {
      console.error('정산 정보 로드 실패:', error);
      // 에러가 발생해도 기본값 설정
      setSettlement(null);
      setReceipts([]);
      setMyBalance({ name: user.displayName, totalPaid: 0, totalOwed: 0, balance: 0 });
    } finally {
      setLoading(false);
    }
  };

  // 모든 정산 목록 로드
  const loadAllSettlements = async () => {
    if (!selectedSpace?.id) return;

    try {
      const settlements = await settlementService.getAllSettlements(selectedSpace.id);
      setAllSettlements(settlements);
    } catch (error) {
      console.error('정산 목록 로드 실패:', error);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // userId로 멤버 정보 가져오기 (users 컬렉션에서)
  const getMemberInfo = (userId) => {
    const userProfile = userProfiles[userId];
    return {
      displayName: userProfile?.displayName || userId,
      profileImage: userProfile?.profileImage || '',
    };
  };

  // 영수증 클릭 핸들러
  const handleReceiptClick = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  // 영수증 수정 핸들러
  const handleReceiptEdit = () => {
    if (!selectedReceipt || !settlement?.weekId) return;

    setShowReceiptModal(false);
    // 수정 페이지로 이동
    navigate(`/settlement/submit?receiptId=${selectedReceipt.id}&weekId=${settlement.weekId}`);
  };

  // 영수증 삭제 핸들러
  const handleReceiptDelete = async () => {
    if (!selectedReceipt || !settlement?.weekId) return;

    try {
      setShowReceiptModal(false);
      setLoading(true);

      await settlementService.deleteReceipt(
        selectedSpace.id,
        settlement.weekId,
        selectedReceipt.id
      );

      // 정산 정보 다시 로드
      await loadSettlement();

      alert('영수증이 삭제되었습니다.');
      setSelectedReceipt(null);
    } catch (error) {
      console.error('영수증 삭제 실패:', error);
      alert('영수증 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 참여자 클릭 핸들러
  const handleParticipantClick = (userId, participant) => {
    setSelectedParticipantId(userId);
    setSelectedParticipant(participant);
    setShowParticipantModal(true);
  };

  // 주차 네비게이션 함수
  const prevWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeekStart(newDate);
  };

  const goToThisWeek = () => {
    const today = new Date();
    const { weekStart } = getWeekRange(today);
    setSelectedWeekStart(weekStart);
  };

  const goToWeek = (weekStart) => {
    setSelectedWeekStart(weekStart);
    setShowWeekList(false);
  };

  // 현재 주차인지 확인
  const isCurrentWeek = () => {
    const today = new Date();
    const { weekStart } = getWeekRange(today);
    return selectedWeekStart.getTime() === weekStart.getTime();
  };

  // 정산 완료 핸들러 (매니저만)
  const handleCompleteSettlement = async () => {
    if (!settlement?.weekId) return;

    console.log('💰 정산 완료 버튼 클릭:', {
      spaceId: selectedSpace.id,
      weekId: settlement.weekId,
      participantCount: Object.keys(settlement.participants || {}).length
    });

    const confirmed = window.confirm(
      '정산을 완료하시겠습니까?\n\n완료 시 모든 참여자에게 정산 결과 알림톡이 발송됩니다.'
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      console.log('🔄 settlementService.settleWeek 호출 중...');

      const result = await settlementService.settleWeek(selectedSpace.id, settlement.weekId);

      console.log('✅ settleWeek 완료:', result);

      // 알림 발송 결과에 따라 메시지 변경
      if (result.notificationResult?.skipped) {
        alert('정산이 완료되었습니다.\n\n알림톡이 비활성화되어 있어 알림이 발송되지 않았습니다.');
      } else if (result.notificationSent) {
        const { sentCount, errorCount } = result.notificationResult || {};
        let message = '정산이 완료되었습니다!';
        if (sentCount > 0) {
          message += `\n\n✅ ${sentCount}명에게 알림톡 발송 완료`;
        }
        if (errorCount > 0) {
          message += `\n⚠️ ${errorCount}명 발송 실패 (브라우저 콘솔 확인)`;
        }
        alert(message);
      } else {
        alert('정산이 완료되었습니다.\n\n알림 발송 중 오류가 발생했습니다. (브라우저 콘솔 확인)');
      }

      await loadSettlement();
      await loadAllSettlements();
    } catch (error) {
      console.error('❌ 정산 완료 실패:', error);
      alert('정산 완료에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 입금 확인 핸들러
  const handleConfirmPayment = async (userId, participantName) => {
    if (!settlement?.weekId) return;

    const confirmed = window.confirm(
      `${participantName}님의 입금을 확인하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await settlementService.confirmPayment(selectedSpace.id, settlement.weekId, userId);
      await loadSettlement();
      alert(`${participantName}님의 입금이 확인되었습니다.`);
    } catch (error) {
      console.error('입금 확인 실패:', error);
      alert('입금 확인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 입금 확인 취소 핸들러
  const handleCancelPaymentConfirmation = async (userId, participantName) => {
    if (!settlement?.weekId) return;

    const confirmed = window.confirm(
      `${participantName}님의 입금 확인을 취소하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await settlementService.cancelPaymentConfirmation(selectedSpace.id, settlement.weekId, userId);
      await loadSettlement();
      alert(`${participantName}님의 입금 확인이 취소되었습니다.`);
    } catch (error) {
      console.error('입금 확인 취소 실패:', error);
      alert('입금 확인 취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 송금 완료 핸들러
  const handleConfirmTransfer = async (userId, participantName) => {
    if (!settlement?.weekId) return;

    const confirmed = window.confirm(
      `${participantName}님에게 송금을 완료하셨습니까?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await settlementService.confirmTransfer(selectedSpace.id, settlement.weekId, userId);
      await loadSettlement();
      alert(`${participantName}님에게 송금 완료 처리되었습니다.`);
    } catch (error) {
      console.error('송금 완료 처리 실패:', error);
      alert('송금 완료 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 송금 완료 취소 핸들러
  const handleCancelTransferConfirmation = async (userId, participantName) => {
    if (!settlement?.weekId) return;

    const confirmed = window.confirm(
      `${participantName}님의 송금 완료를 취소하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await settlementService.cancelTransferConfirmation(selectedSpace.id, settlement.weekId, userId);
      await loadSettlement();
      alert(`${participantName}님의 송금 완료가 취소되었습니다.`);
    } catch (error) {
      console.error('송금 완료 취소 실패:', error);
      alert('송금 완료 취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 매니저 권한 체크
  const isManager = selectedSpace?.userType && canManageSpace(selectedSpace.userType);

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  if (!selectedSpace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl mb-4">🏠</div>
          <p className="text-gray-600 mb-2">스페이스를 불러오는 중...</p>
          <p className="text-sm text-gray-500">예약 페이지에서 스페이스를 먼저 선택해주세요</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정산 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">💰 정산</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* 주차 목록 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setShowWeekList(!showWeekList)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">목록</span>
                </button>

                {/* 주차 목록 드롭다운 */}
                {showWeekList && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowWeekList(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden min-w-[280px] max-h-[400px] overflow-y-auto">
                      {allSettlements.length > 0 ? (
                        allSettlements.map((s) => (
                          <button
                            key={s.weekId}
                            onClick={() => goToWeek(s.weekStart)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                              s.weekStart.getTime() === selectedWeekStart.getTime() ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {formatDate(s.weekStart)} ~ {formatDate(s.weekEnd)}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {s.status === 'settled' ? '✓ 정산완료' : '진행중'}
                                  {s.totalAmount > 0 && ` · ${formatCurrency(s.totalAmount)}`}
                                </div>
                              </div>
                              {s.weekStart.getTime() === selectedWeekStart.getTime() && (
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          정산 내역이 없습니다
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 뷰 모드 토글 버튼 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'card'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">카드</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">테이블</span>
                </button>
              </div>

              {/* 정산 완료 버튼 (매니저만, settled 아니면 표시) */}
              {isManager && settlement && settlement.status !== 'settled' && (
                <button
                  onClick={handleCompleteSettlement}
                  className="flex px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all items-center gap-1.5 sm:gap-2"
                  data-tour="settlement-complete-button"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm sm:text-base">정산완료</span>
                </button>
              )}
            </div>
          </div>

          {/* 주차 네비게이션 */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 text-center">
              <div className="text-sm text-gray-600">
                {settlement?.weekStart && settlement?.weekEnd ? (
                  <>
                    {formatDate(settlement.weekStart)} ~ {formatDate(settlement.weekEnd)}
                  </>
                ) : (
                  <>
                    {formatDate(selectedWeekStart)} ~ {formatDate(new Date(selectedWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                {settlement?.status === 'settled' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    ✓ 정산완료
                  </span>
                )}
                {!settlement && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    정산 내역 없음
                  </span>
                )}
                {isCurrentWeek() && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    이번 주
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isCurrentWeek() && (
                <button
                  onClick={goToThisWeek}
                  className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                >
                  이번 주
                </button>
              )}
              <button
                onClick={nextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {viewMode === 'card' ? (
          <>
            {/* 내 정산 현황 카드 */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-sm">내 정산 현황</span>
                </div>
                <div className="flex items-center gap-2">
                  {myBalance?.paymentConfirmed && myBalance?.balance < 0 && (
                    <span className="text-xs bg-green-400 text-white px-2 py-0.5 rounded-full font-semibold">
                      ✓ 입금확인
                    </span>
                  )}
                  {myBalance?.transferCompleted && myBalance?.balance > 0 && (
                    <span className="text-xs bg-green-400 text-white px-2 py-0.5 rounded-full font-semibold">
                      ✓ 송금완료
                    </span>
                  )}
                  {settlement?.status === 'active' && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">진행중</span>
                  )}
                </div>
              </div>

              {/* 정산 결과와 상세 정보를 한 줄로 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {myBalance?.balance > 0 ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-green-300" />
                      <div>
                        <p className="text-xs opacity-75">정산 결과</p>
                        <span className={`text-2xl font-bold ${
                          myBalance?.transferCompleted ? 'text-gray-300 line-through' : 'text-green-300'
                        }`}>
                          +{formatCurrency(myBalance.balance)}
                        </span>
                      </div>
                    </>
                  ) : myBalance?.balance < 0 ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-orange-300" />
                      <div>
                        <p className="text-xs opacity-75">정산 결과</p>
                        <span className={`text-2xl font-bold ${
                          myBalance?.paymentConfirmed ? 'text-gray-300 line-through' : 'text-orange-300'
                        }`}>
                          {formatCurrency(myBalance.balance)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-xs opacity-75">정산 결과</p>
                      <span className="text-2xl font-bold">0원</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 text-xs">
                  <div className="text-right">
                    <p className="opacity-70 mb-0.5">낸 금액</p>
                    <p className="font-semibold">{formatCurrency(myBalance?.totalPaid || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-70 mb-0.5">부담액</p>
                    <p className="font-semibold">{formatCurrency(myBalance?.totalOwed || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 UI */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 탭 헤더 */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('myReceipts')}
                  className={`flex-1 py-3 px-2 sm:px-4 font-semibold transition-colors ${
                    activeTab === 'myReceipts'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  data-tour="my-receipts-tab"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm sm:text-base">내 참여내역</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`flex-1 py-3 px-2 sm:px-4 font-semibold transition-colors ${
                    activeTab === 'participants'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm sm:text-base">참여자별</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('allReceipts')}
                  className={`flex-1 py-3 px-2 sm:px-4 font-semibold transition-colors ${
                    activeTab === 'allReceipts'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm sm:text-base">전체 내역</span>
                  </div>
                </button>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="p-4">
                {/* 내 참여내역 탭 */}
                {activeTab === 'myReceipts' && (
                  <>
                    {(() => {
                      const myReceipts = receipts.filter(receipt =>
                        receipt.items.some(item => item.splitAmong?.includes(user?.id))
                      );

                      if (myReceipts.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600 font-medium mb-2">참여한 내역이 없습니다</p>
                            <p className="text-sm text-gray-500">영수증 제출 시 분담자로 추가되면 여기에 표시됩니다</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {myReceipts.map((receipt) => {
                            const myItems = receipt.items.filter(item => item.splitAmong?.includes(user?.id));
                            const myShare = myItems.reduce((sum, item) => sum + (item.perPerson || 0), 0);
                            const isPayer = receipt.paidBy === user?.id;

                            return (
                              <div
                                key={receipt.id}
                                className={`border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                                  isPayer ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
                                }`}
                                onClick={() => handleReceiptClick(receipt)}
                              >
                                {/* 상호명/메모 */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    {receipt.memo && (
                                      <h4 className="font-bold text-gray-900 text-base mb-1">
                                        {receipt.memo}
                                      </h4>
                                    )}
                                    <p className="text-xs text-gray-500">
                                      {receipt.belongsToDate ? formatDate(new Date(receipt.belongsToDate)) : formatDate(receipt.createdAt)}
                                    </p>
                                  </div>
                                </div>

                                {/* 내가 분담한 품목만 표시 */}
                                <div className="mb-3 space-y-1.5">
                                  {myItems.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-start text-sm py-2 px-2 rounded bg-blue-50"
                                    >
                                      <span className="font-semibold text-blue-900 flex-1">
                                        {item.itemName}
                                      </span>
                                      <div className="flex flex-col items-end gap-0.5 ml-2">
                                        <div className="flex items-baseline gap-1">
                                          <span className="font-bold text-blue-600">
                                            {formatCurrency(item.perPerson || 0)}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            / {formatCurrency(item.amount || 0)}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {item.splitAmong?.length || 0}명 분담
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* 하단: 내가 분담한 금액 / 낸 사람 정보 */}
                                <div className="pt-3 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600">낸 사람</span>
                                      <span className={`font-bold ${isPayer ? 'text-green-600' : 'text-gray-900'}`}>
                                        {receipt.paidByName}
                                        {isPayer && (
                                          <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                            나
                                          </span>
                                        )}
                                      </span>
                                      {isPayer && (
                                        <span className="text-lg font-bold text-green-600">
                                          {formatCurrency(receipt.totalAmount)}
                                        </span>
                                      )}
                                    </div>
                                    {!isPayer && myShare > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600">내 분담액</span>
                                        <span className="text-lg font-bold text-blue-600">
                                          {formatCurrency(myShare)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* 참여자별 탭 */}
                {activeTab === 'participants' && settlement?.participants && Object.keys(settlement.participants).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(settlement.participants)
                      .sort(([, a], [, b]) => b.balance - a.balance)
                      .map(([userId, participant]) => {
                        // users 컬렉션에서 displayName과 profileImage 가져오기
                        const memberInfo = getMemberInfo(userId);
                        const displayName = memberInfo.displayName;
                        const profileImage = memberInfo.profileImage;
                        const needsPayment = participant.balance < 0;
                        const needsReceive = participant.balance > 0;
                        const isPaymentConfirmed = participant.paymentConfirmed === true;
                        const isTransferCompleted = participant.transferCompleted === true;

                        const handleAmountClick = (e) => {
                          e.stopPropagation();
                          if (!isManager) return;

                          if (needsPayment) {
                            // 입금 확인/취소
                            if (isPaymentConfirmed) {
                              handleCancelPaymentConfirmation(userId, displayName);
                            } else {
                              handleConfirmPayment(userId, displayName);
                            }
                          } else if (needsReceive) {
                            // 송금 완료/취소
                            if (isTransferCompleted) {
                              handleCancelTransferConfirmation(userId, displayName);
                            } else {
                              handleConfirmTransfer(userId, displayName);
                            }
                          }
                        };

                        return (
                          <div
                            key={userId}
                            className={`rounded-lg border-2 ${
                              userId === user.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                            } hover:shadow-md transition-all`}
                          >
                            <div className="flex items-center gap-3 p-3">
                              {/* 프로필 이미지 */}
                              <div
                                onClick={() => handleParticipantClick(userId, participant)}
                                className="cursor-pointer"
                              >
                                {profileImage ? (
                                  <img
                                    src={profileImage}
                                    alt={displayName}
                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {displayName[0]}
                                  </div>
                                )}
                              </div>

                              {/* 이름 및 정보 */}
                              <div
                                onClick={() => handleParticipantClick(userId, participant)}
                                className="flex-1 min-w-0 cursor-pointer"
                              >
                                <p className="font-semibold text-gray-900 flex items-center gap-2 mb-0.5">
                                  {displayName}
                                  {userId === user.id && (
                                    <span className="text-xs text-blue-600 font-semibold">(나)</span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>낸 {formatCurrency(participant.totalPaid)}</span>
                                  <span>·</span>
                                  <span>부담 {formatCurrency(participant.totalOwed)}</span>
                                </div>
                              </div>

                              {/* 금액 (클릭 가능) */}
                              {participant.balance !== 0 && (
                                <div
                                  onClick={handleAmountClick}
                                  className={`flex flex-col items-end gap-1 px-4 py-2 rounded-lg transition-all flex-shrink-0 ${
                                    isManager ? 'cursor-pointer' : 'cursor-default'
                                  } ${
                                    needsPayment
                                      ? isPaymentConfirmed
                                        ? 'bg-gray-100'
                                        : isManager
                                        ? 'bg-orange-50 hover:bg-orange-100 active:scale-95'
                                        : 'bg-orange-50'
                                      : needsReceive
                                      ? isTransferCompleted
                                        ? 'bg-gray-100'
                                        : isManager
                                        ? 'bg-green-50 hover:bg-green-100 active:scale-95'
                                        : 'bg-green-50'
                                      : 'bg-gray-50'
                                  }`}
                                >
                                  <div className={`font-bold text-lg ${
                                    needsPayment
                                      ? isPaymentConfirmed
                                        ? 'text-gray-400 line-through'
                                        : 'text-orange-600'
                                      : needsReceive
                                      ? isTransferCompleted
                                        ? 'text-gray-400 line-through'
                                        : 'text-green-600'
                                      : 'text-gray-600'
                                  }`}>
                                    {participant.balance > 0 ? '+' : ''}{formatCurrency(participant.balance)}
                                  </div>
                                  {((isPaymentConfirmed && needsPayment) || (isTransferCompleted && needsReceive)) && (
                                    <span className="text-xs font-semibold text-green-600 flex items-center gap-0.5">
                                      <span>✓</span>
                                      <span>{needsPayment ? '입금확인' : '송금완료'}</span>
                                    </span>
                                  )}
                                  {isManager && !isPaymentConfirmed && !isTransferCompleted && (
                                    <span className="text-xs text-gray-500">
                                      {needsPayment ? '클릭하여 확인' : needsReceive ? '클릭하여 완료' : ''}
                                    </span>
                                  )}
                                </div>
                              )}

                              {participant.balance === 0 && (
                                <div className="px-4 py-2 rounded-lg bg-gray-50">
                                  <div className="font-bold text-lg text-gray-600">
                                    0원
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* 전체 내역 탭 */}
                {activeTab === 'allReceipts' && (
                  <>
                    {receipts.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 font-medium mb-2">아직 제출된 영수증이 없습니다</p>
                  <p className="text-sm text-gray-500 mb-6">첫 영수증을 제출해보세요!</p>
                  <button
                    onClick={() => navigate('/settlement/submit')}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    영수증 제출하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => {
                    // 내가 분담한 항목들과 총 금액 계산
                    const myItems = receipt.items.filter(item => item.splitAmong?.includes(user?.id));
                    const myShare = myItems.reduce((sum, item) => sum + (item.perPerson || 0), 0);
                    const isPayer = receipt.paidBy === user?.id;

                    return (
                      <div
                        key={receipt.id}
                        className={`border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                          isPayer ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
                        }`}
                        onClick={() => handleReceiptClick(receipt)}
                      >
                        {/* 상호명/메모 */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            {receipt.memo && (
                              <h4 className="font-bold text-gray-900 text-base mb-1">
                                {receipt.memo}
                              </h4>
                            )}
                            <p className="text-xs text-gray-500">
                              {receipt.belongsToDate ? formatDate(new Date(receipt.belongsToDate)) : formatDate(receipt.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* 품목 리스트 */}
                        <div className="mb-3 space-y-1.5">
                          {receipt.items.map((item, idx) => {
                            const isMyItem = item.splitAmong?.includes(user?.id);
                            return (
                              <div
                                key={idx}
                                className={`flex justify-between items-start text-sm py-2 px-2 rounded ${
                                  isMyItem ? 'bg-blue-50' : 'bg-gray-50'
                                }`}
                              >
                                <span className={`${isMyItem ? 'font-semibold text-blue-900' : 'text-gray-700'} flex-1`}>
                                  {item.itemName}
                                </span>
                                <div className="flex flex-col items-end gap-0.5 ml-2">
                                  {isMyItem ? (
                                    <>
                                      <div className="flex items-baseline gap-1">
                                        <span className="font-bold text-blue-600">
                                          {formatCurrency(item.perPerson || 0)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          / {formatCurrency(item.amount || 0)}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {item.splitAmong?.length || 0}명 분담
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-gray-600">
                                        {formatCurrency(item.amount || 0)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {item.splitAmong?.length || 0}명 분담
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 하단: 내가 분담한 금액 / 낸 사람 정보 */}
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">낸 사람</span>
                              <span className={`font-bold ${isPayer ? 'text-green-600' : 'text-gray-900'}`}>
                                {receipt.paidByName}
                                {isPayer && (
                                  <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    나
                                  </span>
                                )}
                              </span>
                              {isPayer && (
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(receipt.totalAmount)}
                                </span>
                              )}
                            </div>
                            {!isPayer && myShare > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">내 분담액</span>
                                <span className="text-lg font-bold text-blue-600">
                                  {formatCurrency(myShare)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                      })}
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* 테이블 뷰 */
          <div className="space-y-4">
            {/* 내 정산 현황 요약 (테이블 뷰용 간소화) */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm opacity-90">내 정산 결과</p>
                    {myBalance?.paymentConfirmed && myBalance?.balance < 0 && (
                      <span className="text-xs bg-green-400 text-white px-2 py-0.5 rounded-full font-semibold">
                        ✓ 입금확인
                      </span>
                    )}
                    {myBalance?.transferCompleted && myBalance?.balance > 0 && (
                      <span className="text-xs bg-green-400 text-white px-2 py-0.5 rounded-full font-semibold">
                        ✓ 송금완료
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {myBalance?.balance > 0 ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-green-300" />
                        <span className={`text-2xl font-bold ${
                          myBalance?.transferCompleted ? 'text-gray-300 line-through' : 'text-green-300'
                        }`}>
                          +{formatCurrency(myBalance.balance)}
                        </span>
                      </>
                    ) : myBalance?.balance < 0 ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-orange-300" />
                        <span className={`text-2xl font-bold ${
                          myBalance?.paymentConfirmed ? 'text-gray-300 line-through' : 'text-orange-300'
                        }`}>
                          {formatCurrency(myBalance.balance)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold">0원</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm opacity-90">
                  <p>낸 금액: {formatCurrency(myBalance?.totalPaid || 0)}</p>
                  <p>부담액: {formatCurrency(myBalance?.totalOwed || 0)}</p>
                </div>
              </div>
            </div>

            {/* 엑셀 스타일 테이블 */}
            <SettlementTableView
              receipts={receipts}
              participants={settlement?.participants || {}}
              userProfiles={userProfiles}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              weekId={settlement?.weekId}
            />
          </div>
        )}
      </div>

      {/* 플로팅 영수증 제출 버튼 */}
      {(!settlement || settlement.status !== 'settled') && (
        <button
          onClick={() => navigate('/settlement/submit')}
          className="fixed right-4 bottom-32 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2 transition-all active:scale-95 z-[9998]"
          data-tour="submit-receipt-button"
        >
          <Plus size={20} />
          <span className="font-semibold text-sm">영수증 제출</span>
        </button>
      )}

      {/* 영수증 상세 모달 */}
      <ReceiptDetailModal
        receipt={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
        onEdit={handleReceiptEdit}
        onDelete={handleReceiptDelete}
        canEdit={selectedReceipt?.submittedBy === user?.id}
        members={members}
        userProfiles={userProfiles}
      />

      {/* 참여자 상세 모달 */}
      <ParticipantDetailModal
        participant={selectedParticipant}
        userId={selectedParticipantId}
        isOpen={showParticipantModal}
        onClose={() => {
          setShowParticipantModal(false);
          setSelectedParticipant(null);
          setSelectedParticipantId(null);
        }}
        receipts={receipts}
        userProfiles={userProfiles}
        members={members}
        currentUser={user}
      />
    </div>
  );
};

export default SettlementPage;