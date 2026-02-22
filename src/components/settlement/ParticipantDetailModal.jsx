// src/components/settlement/ParticipantDetailModal.jsx
import { useState } from 'react';
import { X, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import ReceiptDetailModal from './ReceiptDetailModal';
import { formatCurrency, getCurrencyUnit } from '../../utils/currency';

const ParticipantDetailModal = ({
  participant,
  userId,
  isOpen,
  onClose,
  receipts,
  userProfiles,
  members,
  currentUser,
  currency = 'KRW'
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  if (!isOpen || !participant || !userId) return null;

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 해당 참여자가 포함된 영수증 필터링
  const participantReceipts = receipts.filter(receipt => {
    // 납부자인 경우
    if (receipt.paidBy === userId) return true;

    // 분담자인 경우
    return receipt.items?.some(item => item.splitAmong?.includes(userId));
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // 각 영수증에서 해당 참여자 관련 항목만 추출
  const getParticipantItems = (receipt) => {
    return receipt.items?.filter(item => item.splitAmong?.includes(userId)) || [];
  };

  const userProfile = userProfiles?.[userId];
  const displayName = userProfile?.displayName || participant.name || userId;
  const profileImage = userProfile?.profileImage || '';

  // 영수증 클릭 핸들러
  const handleReceiptClick = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  // 영수증 수정 핸들러 (준비 중)
  const handleReceiptEdit = () => {
    setShowReceiptModal(false);
    alert('영수증 수정 기능은 준비 중입니다.');
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {displayName[0]}
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* 내용 */}
          <div className="p-4 space-y-4">
            {/* 정산 요약 */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              {/* 정산 결과 - 크게 강조 */}
              <div className="text-center mb-4">
                <p className="text-sm opacity-80 mb-2">정산 결과</p>
                <div className="flex items-center justify-center gap-3">
                  {participant.balance > 0 ? (
                    <>
                      <TrendingUp className="w-8 h-8 text-green-300" />
                      <span className="text-4xl font-bold text-green-300">
                        +{formatCurrency(participant.balance, currency)}
                      </span>
                    </>
                  ) : participant.balance < 0 ? (
                    <>
                      <TrendingDown className="w-8 h-8 text-red-300" />
                      <span className="text-4xl font-bold text-red-300">
                        {formatCurrency(participant.balance, currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">0{getCurrencyUnit(currency)}</span>
                  )}
                </div>
                <p className="text-xs opacity-75 mt-3">
                  {participant.balance > 0
                    ? '정산자에게 받을 금액입니다'
                    : participant.balance < 0
                    ? '정산자에게 낼 금액입니다'
                    : '정산할 금액이 없습니다'}
                </p>
              </div>

              {/* 상세 정보 - 작게 표시 */}
              <div className="flex justify-around pt-4 border-t border-white/20 text-xs">
                <div className="text-center">
                  <p className="opacity-70 mb-1">낸 금액</p>
                  <p className="font-semibold">{formatCurrency(participant.totalPaid || 0, currency)}</p>
                </div>
                <div className="text-center">
                  <p className="opacity-70 mb-1">부담액</p>
                  <p className="font-semibold">{formatCurrency(participant.totalOwed || 0, currency)}</p>
                </div>
              </div>
            </div>

            {/* 관련 영수증 목록 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                관련 영수증 ({participantReceipts.length}개)
              </h3>

              {participantReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 text-sm">관련 영수증이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participantReceipts.map((receipt) => {
                    const participantItems = getParticipantItems(receipt);
                    const isPayer = receipt.paidBy === userId;
                    const myShare = participantItems.reduce((sum, item) => sum + (item.perPerson || 0), 0);

                    return (
                      <div
                        key={receipt.id}
                        onClick={() => handleReceiptClick(receipt)}
                        className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                          isPayer ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
                        }`}
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
                              {formatDateTime(receipt.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* 품목 리스트 */}
                        <div className="mb-3 space-y-1.5">
                          {receipt.items.map((item, idx) => {
                            const isParticipantItem = item.splitAmong?.includes(userId);
                            return (
                              <div
                                key={idx}
                                className={`flex justify-between items-start text-sm py-2 px-2 rounded ${
                                  isParticipantItem ? 'bg-blue-50' : 'bg-gray-50'
                                }`}
                              >
                                <span className={`${isParticipantItem ? 'font-semibold text-blue-900' : 'text-gray-700'} flex-1`}>
                                  {item.itemName}
                                </span>
                                <div className="flex flex-col items-end gap-0.5 ml-2">
                                  {isParticipantItem ? (
                                    <>
                                      <div className="flex items-baseline gap-1">
                                        <span className="font-bold text-blue-600">
                                          {formatCurrency(item.perPerson || 0, currency)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          / {formatCurrency(item.amount || 0, currency)}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {item.splitAmong?.length || 0}명 분담
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-gray-600">
                                        {formatCurrency(item.amount || 0, currency)}
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

                        {/* 하단: 분담 금액 / 낸 사람 정보 */}
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">낸 사람</span>
                              <span className={`font-bold ${isPayer ? 'text-green-600' : 'text-gray-900'}`}>
                                {receipt.paidByName}
                                {isPayer && (
                                  <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    본인
                                  </span>
                                )}
                              </span>
                              {isPayer && (
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(receipt.totalAmount, currency)}
                                </span>
                              )}
                            </div>
                            {!isPayer && myShare > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">분담액</span>
                                <span className="text-lg font-bold text-blue-600">
                                  {formatCurrency(myShare, currency)}
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
            </div>
          </div>

          {/* 하단 닫기 버튼 */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 영수증 상세 모달 */}
      <ReceiptDetailModal
        receipt={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
        onEdit={handleReceiptEdit}
        onDelete={() => {}}
        canEdit={false} // 참여자 상세 모달에서는 수정/삭제 버튼 숨김
        members={members}
        userProfiles={userProfiles}
        currency={currency}
      />
    </>
  );
};

export default ParticipantDetailModal;
