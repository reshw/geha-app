// src/pages/SettlementPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Plus, TrendingUp, TrendingDown, Users, Calendar, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import settlementService from '../services/settlementService';
import authService from '../services/authService';
import LoginOverlay from '../components/auth/LoginOverlay';
import ReceiptDetailModal from '../components/settlement/ReceiptDetailModal';
import ParticipantDetailModal from '../components/settlement/ParticipantDetailModal';

const SettlementPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();
  
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

  useEffect(() => {
    if (selectedSpace?.id && user?.id) {
      loadSettlement();
    } else if (selectedSpace && user) {
      // user.id가 없는 경우에도 로딩 종료
      setLoading(false);
    }
  }, [selectedSpace, user]);

  const loadSettlement = async () => {
    if (!selectedSpace?.id || !user?.id) return;

    try {
      setLoading(true);

      // 멤버 정보 가져오기
      const spaceMembers = await settlementService.getSpaceMembers(selectedSpace.id);
      setMembers(spaceMembers);

      // 이번주 Settlement 가져오기
      const weekSettlement = await settlementService.getCurrentWeekSettlement(selectedSpace.id);
      setSettlement(weekSettlement);

      // 영수증 목록 가져오기
      if (weekSettlement?.weekId) {
        const weekReceipts = await settlementService.getWeekReceipts(selectedSpace.id, weekSettlement.weekId);
        setReceipts(weekReceipts);
      } else {
        setReceipts([]);
      }

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
    setShowReceiptModal(false);
    // TODO: 영수증 수정 페이지로 이동 (나중에 구현)
    alert('영수증 수정 기능은 준비 중입니다.');
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
          <h1 className="text-2xl font-bold text-gray-900">💰 정산</h1>
          <p className="text-sm text-gray-600 mt-1">
            {settlement?.weekStart && settlement?.weekEnd && (
              <>
                {formatDate(settlement.weekStart)} ~ {formatDate(settlement.weekEnd)}
                {settlement.status === 'settled' && (
                  <span className="ml-2 text-green-600 font-semibold">✓ 정산완료</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 내 정산 현황 카드 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">내 정산 현황</span>
            </div>
            {settlement?.status === 'active' && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">진행중</span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">낸 금액</span>
              <span className="text-lg font-bold">{formatCurrency(myBalance?.totalPaid || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">내 부담액</span>
              <span className="text-lg font-bold">{formatCurrency(myBalance?.totalOwed || 0)}</span>
            </div>
            <div className="border-t border-white/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">정산 결과</span>
                <div className="flex items-center gap-2">
                  {myBalance?.balance > 0 ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-green-300" />
                      <span className="text-2xl font-bold text-green-300">
                        +{formatCurrency(myBalance.balance)}
                      </span>
                    </>
                  ) : myBalance?.balance < 0 ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-300" />
                      <span className="text-2xl font-bold text-red-300">
                        {formatCurrency(myBalance.balance)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">0원</span>
                  )}
                </div>
              </div>
              <p className="text-xs opacity-75 mt-2 text-center">
                {myBalance?.balance > 0 
                  ? '정산자에게 받을 금액입니다' 
                  : myBalance?.balance < 0 
                  ? '정산자에게 낼 금액입니다'
                  : '정산할 금액이 없습니다'}
              </p>
            </div>
          </div>
        </div>

        {/* 전체 정산 요약 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            이번주 정산 요약
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">총 지출</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(settlement?.totalAmount || 0)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">영수증 개수</p>
              <p className="text-xl font-bold text-gray-900">
                {receipts.length}개
              </p>
            </div>
          </div>
        </div>

        {/* 참여자별 정산 현황 */}
        {settlement?.participants && Object.keys(settlement.participants).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              참여자별 현황
            </h3>
            <div className="space-y-2">
              {Object.entries(settlement.participants)
                .sort(([, a], [, b]) => b.balance - a.balance)
                .map(([userId, participant]) => {
                  // users 컬렉션에서 displayName과 profileImage 가져오기
                  const memberInfo = getMemberInfo(userId);
                  const displayName = memberInfo.displayName;
                  const profileImage = memberInfo.profileImage;

                  return (
                    <div
                      key={userId}
                      onClick={() => handleParticipantClick(userId, participant)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                        userId === user.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      {/* 프로필 이미지 */}
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {displayName[0]}
                        </div>
                      )}

                      {/* 이름 및 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {displayName}
                          {userId === user.id && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">(나)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          낸 {formatCurrency(participant.totalPaid)} / 부담 {formatCurrency(participant.totalOwed)}
                        </p>
                      </div>

                      {/* 잔액 */}
                      <div className={`font-bold flex-shrink-0 ${
                        participant.balance > 0
                          ? 'text-green-600'
                          : participant.balance < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {participant.balance > 0 ? '+' : ''}{formatCurrency(participant.balance)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 영수증 목록 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              제출된 영수증
            </h3>
          </div>

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
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleReceiptClick(receipt)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {receipt.paidByName}
                        {receipt.paidBy !== receipt.submittedBy && (
                          <span className="text-xs text-gray-500 ml-1">
                            (등록: {receipt.submittedByName})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(receipt.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(receipt.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {receipt.items.length}개 항목
                      </p>
                    </div>
                  </div>
                  {receipt.memo && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                      💬 {receipt.memo}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {receipt.items.map((item, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {item.itemName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 플로팅 버튼 */}
      {settlement?.status === 'active' && receipts.length > 0 && (
        <button
          onClick={() => navigate('/settlement/submit')}
          className="fixed right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-50"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          <Plus size={24} />
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