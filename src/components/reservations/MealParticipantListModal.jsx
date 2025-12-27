import { X, Users } from 'lucide-react';

/**
 * 식사 참여자 모달
 * - 참여한 사람만 카드로 표시
 * - 하단에 본인 참여/취소 버튼
 */
const MealParticipantListModal = ({
  isOpen,
  onClose,
  mealType, // "lunch" | "dinner"
  participants, // [userId...]
  profiles,
  currentUserId,
  onToggle
}) => {
  if (!isOpen) return null;

  const mealTypeLabel = mealType === 'lunch' ? '점심' : '저녁';
  const isLunch = mealType === 'lunch';
  const isParticipating = participants.includes(currentUserId);

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className={isLunch ? 'w-6 h-6 text-green-600' : 'w-6 h-6 text-orange-600'} />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{mealTypeLabel} 참여자</h3>
              <div className="text-sm text-gray-600">{participants.length}명 참여 중</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 참여자 리스트 (참여한 사람만) */}
        <div className="p-6">
          {participants.length > 0 ? (
            <div className="space-y-2 mb-4">
              {participants.map((userId) => {
                const profile = profiles[userId];
                if (!profile) return null;

                const isMine = userId === currentUserId;

                return (
                  <div
                    key={userId}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      isMine
                        ? isLunch
                          ? 'bg-green-50 border-2 border-green-300'
                          : 'bg-orange-50 border-2 border-orange-300'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {/* 프로필 이미지 */}
                    <div className="flex-shrink-0">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt={profile.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                          {profile.displayName?.[0] || '?'}
                        </div>
                      )}
                    </div>

                    {/* 이름 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {profile.displayName || '이름 없음'}
                        {isMine && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            나
                          </span>
                        )}
                      </div>
                      {profile.phone && (
                        <div className="text-sm text-gray-500">{profile.phone}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 mb-4">
              아직 참여자가 없습니다
            </div>
          )}

          {/* 본인 참여/취소 버튼 */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onToggle}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isParticipating
                  ? isLunch
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isParticipating ? '참여 취소' : '참여하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealParticipantListModal;
