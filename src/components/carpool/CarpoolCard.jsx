// components/carpool/CarpoolCard.jsx
import { Calendar, MapPin, DollarSign, Package, User, ThumbsUp } from 'lucide-react';

/**
 * 카풀 포스트 카드
 *
 * 휘닉스파크 카풀방 공지 스타일 재현
 */
const CarpoolCard = ({ post, onClick }) => {
  const isOffer = post.type === 'offer';

  // 날짜/시간 포맷
  const formatDateTime = (date, time) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    return `${month}/${day}(${weekday}) ${time}`;
  };

  // 방향 표시
  const getDirectionText = () => {
    if (post.direction === 'toResort') return '→';
    if (post.direction === 'fromResort') return '←';
    return '→'; // 기본값
  };

  // 상태 배지
  const getStatusBadge = () => {
    const statusConfig = {
      recruiting: { text: '모집중', color: 'bg-green-100 text-green-700' },
      waiting_payment: { text: '결제대기', color: 'bg-yellow-100 text-yellow-700' },
      confirmed: { text: '확정', color: 'bg-blue-100 text-blue-700' },
      completed: { text: '완료', color: 'bg-gray-100 text-gray-700' },
      canceled: { text: '취소', color: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[post.status] || statusConfig.recruiting;
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
        isOffer ? 'border-green-200 hover:border-green-300' : 'border-blue-200 hover:border-blue-300'
      }`}
    >
      {/* 헤더 */}
      <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${
        isOffer ? 'bg-gradient-to-r from-green-50 to-green-100' : 'bg-gradient-to-r from-blue-50 to-blue-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            isOffer ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            {isOffer ? '제공' : '요청'}
          </span>
          {getStatusBadge()}
        </div>

        {/* 작성자 정보 */}
        <div className="flex items-center gap-2">
          {post.userProfileImage ? (
            <img
              src={post.userProfileImage}
              alt={post.userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          )}
          <span className="text-sm font-semibold text-gray-700">{post.userName}</span>
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 py-4 space-y-3">
        {/* 날짜/시간 */}
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="font-semibold">
            {formatDateTime(post.departureDate, post.departureTime)}
            {post.departureTime === '협의가능' && (
              <span className="ml-1 text-xs text-blue-600">(협의가능)</span>
            )}
          </span>
        </div>

        {/* 출발지 → 목적지 */}
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="font-medium">
            {post.departureLocation} {getDirectionText()} {post.destination}
          </span>
        </div>

        {/* 비용 */}
        <div className="flex items-center gap-2 text-gray-700">
          <DollarSign className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="font-semibold text-green-600">
            카풀 {post.cost?.toLocaleString()}원
          </span>
          {post.hasEquipment && post.equipmentCost > 0 && (
            <span className="text-sm text-gray-600">
              + 장비 {post.equipmentCost?.toLocaleString()}원
            </span>
          )}
        </div>

        {/* 장비 */}
        {post.hasEquipment && (
          <div className="flex items-center gap-2 text-gray-700">
            <Package className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="text-sm">
              장비 가능
              {post.equipmentCost > 0 && (
                <span className="font-semibold text-green-600 ml-2">
                  +{post.equipmentCost?.toLocaleString()}원
                </span>
              )}
            </span>
          </div>
        )}

        {/* 메모 */}
        {post.memo && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600 line-clamp-2">{post.memo}</p>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-xl flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {/* geha 평판 */}
          {post.gehaReputation && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span>칭찬 {post.gehaReputation.totalPraises}회</span>
            </div>
          )}

          {/* 작성 시간 */}
          <span>
            {post.createdAt && new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-semibold text-gray-700 transition-colors"
        >
          상세보기
        </button>
      </div>
    </div>
  );
};

export default CarpoolCard;
