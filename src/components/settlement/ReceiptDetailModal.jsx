// src/components/settlement/ReceiptDetailModal.jsx
import { X, Edit, Users, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const ReceiptDetailModal = ({ receipt, isOpen, onClose, onEdit, onDelete, canEdit, members, userProfiles, currency = 'KRW' }) => {
  if (!isOpen || !receipt) return null;

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <h2 className="text-xl font-bold text-gray-900">영수증 상세</h2>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('정말 이 영수증을 삭제하시겠습니까?\n삭제된 영수증은 복구할 수 없습니다.')) {
                        onDelete();
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-4 space-y-4">
            {/* 영수증 이미지 */}
            {receipt.imageUrl && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">영수증 이미지</h3>
                <img
                  src={receipt.imageUrl}
                  alt="영수증"
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* 제출 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">제출 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">제출자</span>
                  <span className="font-medium text-gray-900">{receipt.submittedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">실제 납부자</span>
                  <span className="font-medium text-gray-900">{receipt.paidByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">제출 시간</span>
                  <span className="font-medium text-gray-900">{formatDateTime(receipt.createdAt)}</span>
                </div>
                {receipt.memo && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-600">메모</span>
                    <p className="mt-1 text-gray-900">{receipt.memo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 항목별 상세 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">항목 상세</h3>
              <div className="space-y-3">
                {receipt.items?.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(item.amount, currency)} ÷ {item.splitAmong?.length || 0}명
                          = <span className="font-semibold text-blue-600">{formatCurrency(item.perPerson, currency)}</span>/인
                        </p>
                      </div>
                      <span className="font-bold text-gray-900">{formatCurrency(item.amount, currency)}</span>
                    </div>

                    {/* 분담자 목록 */}
                    {item.splitAmong && item.splitAmong.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">분담자 ({item.splitAmong.length}명)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.splitAmong.map((userId) => {
                            const member = members?.find(m => m.userId === userId);
                            const userProfile = userProfiles?.[userId];
                            const displayName = userProfile?.displayName || member?.displayName || userId;
                            const profileImage = userProfile?.profileImage || '';

                            return (
                              <div
                                key={userId}
                                className="inline-flex items-center gap-2 bg-white border border-gray-200 px-2 py-1 rounded-full text-sm"
                              >
                                {profileImage ? (
                                  <img
                                    src={profileImage}
                                    alt={displayName}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                    {displayName[0]}
                                  </div>
                                )}
                                <span className="text-gray-700">{displayName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 총액 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <span className="font-medium">총 금액</span>
                <span className="text-2xl font-bold">{formatCurrency(receipt.totalAmount, currency)}</span>
              </div>
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
    </>
  );
};

export default ReceiptDetailModal;
