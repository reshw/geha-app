import { useState } from 'react';
import { X, CheckCircle, XCircle, Calendar, User, ImageIcon } from 'lucide-react';
import { canManageReservations } from '../../utils/permissions';

const ExpenseDetailModal = ({ expense, selectedSpace, onClose, onApprove, onReject }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const isManager = selectedSpace?.userType && canManageReservations(selectedSpace.userType);
  const isPending = expense.status === 'pending';
  const canApproveOrReject = isManager && isPending;
  
  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR') + '원';
  };
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            대기중
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            승인됨
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            <XCircle className="w-4 h-4" />
            거부됨
          </span>
        );
      default:
        return null;
    }
  };
  
  const handleApprove = async () => {
    if (!window.confirm('이 청구를 승인하시겠습니까?')) return;
    
    setIsApproving(true);
    try {
      await onApprove(expense.id);
      onClose();
    } catch (error) {
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }
    
    if (!window.confirm('이 청구를 거부하시겠습니까?')) return;
    
    setIsRejecting(true);
    try {
      await onReject(expense.id, rejectReason);
      onClose();
    } catch (error) {
      alert('거부 처리 중 오류가 발생했습니다.');
    } finally {
      setIsRejecting(false);
    }
  };
  
  return (
    <>
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="bg-white w-full sm:max-w-md overflow-hidden flex flex-col"
          style={{
            maxHeight: '85vh',
            height: 'auto',
            borderRadius: '16px 16px 0 0',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 (고정) */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-900">운영비 상세</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          {/* 스크롤 가능한 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">청구자:</span>
                  <span className="font-bold">{expense.userName}</span>
                </div>
                {getStatusBadge(expense.status)}
              </div>
              
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="font-medium">사용일:</span>
                <span>{formatDate(expense.usedAt)}</span>
              </div>
              
              <div className="text-sm text-gray-500">
                청구일: {formatDateTime(expense.createdAt)}
              </div>
            </div>
            
            {/* 승인/거부 정보 */}
            {expense.status === 'approved' && expense.approvedByName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-green-800 mb-1">
                  ✅ 승인됨
                </div>
                <div className="text-sm text-green-700">
                  승인자: {expense.approvedByName}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {formatDateTime(expense.approvedAt)}
                </div>
              </div>
            )}
            
            {expense.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-red-800 mb-1">
                  ❌ 거부됨
                </div>
                {expense.rejectedByName && (
                  <div className="text-sm text-red-700">
                    거부자: {expense.rejectedByName}
                  </div>
                )}
                {expense.rejectionReason && (
                  <div className="text-sm text-red-600 mt-2">
                    사유: {expense.rejectionReason}
                  </div>
                )}
                {expense.rejectedAt && (
                  <div className="text-xs text-red-500 mt-1">
                    {formatDateTime(expense.rejectedAt)}
                  </div>
                )}
              </div>
            )}
            
            {/* 증빙 이미지 - 품목 내역보다 먼저 표시 */}
            {expense.imageUrl && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">📷 증빙 이미지</h3>
                <div className="relative">
                  <img 
                    src={expense.imageUrl} 
                    alt="영수증"
                    className="w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(expense.imageUrl, '_blank')}
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    클릭하여 크게 보기
                  </div>
                </div>
              </div>
            )}
            
            {/* 품목 내역 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">📋 품목 내역</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {expense.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.itemName || '항목명 없음'}
                        {item.itemSpec && (
                          <span className="text-gray-500 text-sm ml-1">({item.itemSpec})</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.itemPrice > 0 && (
                          <>
                            {formatCurrency(item.itemPrice)} × {item.itemQty || 1}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">
                      {formatCurrency(item.total || 0)}
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">총액</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(expense.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 메모 */}
            {expense.memo && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">📝 메모</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  {expense.memo}
                </div>
              </div>
            )}
          </div>
          
          {/* 하단 버튼 (고정) */}
          {canApproveOrReject && (
            <div className="border-t border-gray-200 p-4 bg-white space-y-3">
              {showRejectInput ? (
                <>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="거부 사유를 입력해주세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectReason('');
                      }}
                      className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isRejecting}
                      className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRejecting ? '처리중...' : '거부 확정'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    거부하기
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {isApproving ? '처리중...' : '승인하기'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpenseDetailModal;