// components/carpool/CarpoolDetailModal.jsx
import { useState } from 'react';
import { X, Calendar, MapPin, DollarSign, Package, MessageSquare, User, ThumbsUp, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import carpoolService from '../../services/carpoolService';

const CarpoolDetailModal = ({ isOpen, onClose, post, currentUserId, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!post) return null;

  const isOwner = currentUserId === post.userId;
  const isOffer = post.type === 'offer';

  // 날짜/시간 포맷
  const formatDateTime = (date, time) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday}) ${time}`;
  };

  // 방향 텍스트
  const getDirectionText = () => {
    if (post.direction === 'toResort') return '스키장 가는 길';
    if (post.direction === 'fromResort') return '스키장 오는 길';
    return '스키장 가는 길'; // 기본값
  };

  // 상태 텍스트 및 색상
  const getStatusConfig = () => {
    const statusMap = {
      recruiting: { text: '모집중', color: 'text-green-600', bgColor: 'bg-green-100' },
      waiting_payment: { text: '결제대기', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      confirmed: { text: '확정', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      completed: { text: '완료', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      canceled: { text: '취소', color: 'text-red-600', bgColor: 'bg-red-100' }
    };
    return statusMap[post.status] || statusMap.recruiting;
  };

  const statusConfig = getStatusConfig();

  // 카카오톡 링크 열기
  const handleKakaoClick = () => {
    if (post.kakaoId.startsWith('http')) {
      window.open(post.kakaoId, '_blank');
    } else {
      alert(`카카오톡 ID: ${post.kakaoId}\n\n카카오톡에서 검색하여 연락하세요.`);
    }
  };

  // 카풀 취소
  const handleCancel = async () => {
    if (!window.confirm('카풀을 취소하시겠습니까?')) return;

    setIsLoading(true);
    try {
      await carpoolService.cancelCarpoolPost(post.id, currentUserId);
      alert('카풀이 취소되었습니다');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('❌ 카풀 취소 실패:', error);
      alert('카풀 취소에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div className="bg-white rounded-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl ${
          isOffer ? 'bg-gradient-to-r from-green-50 to-green-100' : 'bg-gradient-to-r from-blue-50 to-blue-100'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
              isOffer ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {isOffer ? '제공' : '요청'}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.text}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6 overflow-y-auto space-y-6">
          {/* 날짜/시간 */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">날짜/시간</div>
              <div className="text-lg font-bold text-gray-900">
                {formatDateTime(post.departureDate, post.departureTime)}
              </div>
            </div>
          </div>

          {/* 경로 */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">경로</div>
              <div className="text-lg font-semibold text-gray-900">
                {post.departureLocation} → {post.destination}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {getDirectionText()}
              </div>
            </div>
          </div>

          {/* 비용 */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">카풀비용</div>
              <div className="text-2xl font-bold text-green-600">
                {post.cost?.toLocaleString()}원
              </div>
              {post.hasEquipment && post.equipmentCost > 0 && (
                <div className="text-sm text-gray-700 mt-2">
                  <span className="font-semibold">장비 요금:</span>{' '}
                  <span className="text-green-600 font-bold">
                    +{post.equipmentCost?.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 장비 */}
          {post.hasEquipment && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">장비</div>
                <div className="text-base font-semibold text-gray-900">
                  장비 가능
                  {post.equipmentCost > 0 && (
                    <span className="text-green-600 font-bold ml-2">
                      +{post.equipmentCost?.toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 메모 */}
          {post.memo && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">메모</div>
              <div className="text-gray-800 whitespace-pre-wrap">{post.memo}</div>
            </div>
          )}

          {/* 작성자 정보 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              {post.userProfileImage ? (
                <img
                  src={post.userProfileImage}
                  alt={post.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">{post.userName}</div>
                {post.gehaReputation && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <ThumbsUp className="w-4 h-4" />
                    <span>geha 칭찬 {post.gehaReputation.totalPraises}회</span>
                  </div>
                )}
              </div>
            </div>

            {/* 카카오톡 연결 버튼 */}
            <button
              onClick={handleKakaoClick}
              className="w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-gray-900 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              카카오톡으로 연락하기
            </button>
          </div>

          {/* 본인 글인 경우 취소 버튼 */}
          {isOwner && post.status !== 'canceled' && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 rounded-xl font-semibold text-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="w-5 h-5" />
                {isLoading ? '처리 중...' : '카풀 취소하기'}
              </button>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CarpoolDetailModal;
