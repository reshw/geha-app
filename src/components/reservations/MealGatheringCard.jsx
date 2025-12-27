import { Clock, MapPin, Users, Trash2 } from 'lucide-react';

/**
 * 식사 모임 카드
 * - 클릭하면 참여/취소 토글 (주최자 아닌 경우)
 * - 주최자는 삭제 버튼 표시
 */
const MealGatheringCard = ({
  gathering,
  profiles,
  currentUserId,
  onToggleParticipation,
  onDelete,
  onViewDetail
}) => {
  const isHost = gathering.hostId === currentUserId;
  const isParticipant = gathering.participants?.includes(currentUserId);
  const participantCount = gathering.participants?.length || 0;

  const handleCardClick = (e) => {
    // 삭제 버튼 클릭은 무시
    if (e.target.closest('.delete-button')) {
      return;
    }

    if (isHost) {
      // 주최자는 상세보기
      onViewDetail(gathering);
    } else {
      // 주최자가 아니면 참여/취소 토글
      onToggleParticipation(gathering);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirm(`"${gathering.title}" 모임을 삭제하시겠습니까?`)) {
      onDelete(gathering.id);
    }
  };

  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
        isParticipant
          ? 'bg-green-50 border-green-300 hover:bg-green-100'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={handleCardClick}
    >
      {/* 주최자 삭제 버튼 */}
      {isHost && (
        <button
          onClick={handleDeleteClick}
          className="delete-button absolute top-3 right-3 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
          title="모임 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* 제목 */}
      <div className="mb-2 pr-8">
        <h4 className="font-bold text-gray-900 text-base mb-1">
          {gathering.title}
        </h4>
        <div className="text-xs text-gray-500">
          주최: {gathering.hostName}
          {isHost && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
              주최자
            </span>
          )}
        </div>
      </div>

      {/* 시간 & 장소 (한 줄) */}
      {(gathering.departureTime || gathering.location) && (
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3 flex-wrap">
          {gathering.departureTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{gathering.departureTime}</span>
            </div>
          )}

          {gathering.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{gathering.location}</span>
            </div>
          )}
        </div>
      )}

      {/* 참여자 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        {/* 참여자 프로필 사진 */}
        <div className="flex items-center gap-1">
          {gathering.participants?.slice(0, 5).map((participantId) => {
            const profile = profiles[participantId];
            return (
              <div key={participantId} className="relative">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.displayName || '참여자'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
                    {profile?.displayName?.[0] || '?'}
                  </div>
                )}
              </div>
            );
          })}
          {participantCount > 5 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold ring-2 ring-white">
              +{participantCount - 5}
            </div>
          )}
        </div>

        {/* 참여 인원 */}
        <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
          <Users className="w-4 h-4" />
          <span>{participantCount}명</span>
        </div>
      </div>

      {/* 참여 상태 안내 */}
      <div className="mt-3 text-center text-xs">
        {isHost ? (
          <span className="text-blue-600 font-semibold">
            클릭하여 참여자 확인
          </span>
        ) : isParticipant ? (
          <span className="text-green-600 font-semibold">
            참여 중 • 클릭하면 취소
          </span>
        ) : (
          <span className="text-gray-500">
            클릭하여 참여
          </span>
        )}
      </div>
    </div>
  );
};

export default MealGatheringCard;
