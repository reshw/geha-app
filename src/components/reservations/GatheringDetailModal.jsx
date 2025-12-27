import { X, Clock, MapPin, Users } from 'lucide-react';
import Modal from '../common/Modal';

/**
 * 모임 참여자 상세 모달
 */
const GatheringDetailModal = ({ isOpen, onClose, gathering, profiles }) => {
  if (!isOpen || !gathering) return null;

  const mealTypeLabel = gathering.mealType === 'lunch' ? '점심' : '저녁';
  const mealTypeColor = gathering.mealType === 'lunch' ? 'green' : 'orange';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null}>
      <div className="max-w-full overflow-x-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{gathering.title}</h3>
            <div className="text-sm text-gray-600 mt-1">
              <span className={`px-2 py-0.5 bg-${mealTypeColor}-100 text-${mealTypeColor}-700 rounded-full font-semibold`}>
                {mealTypeLabel}
              </span>
              <span className="ml-2">주최: {gathering.hostName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 정보 */}
        <div className="space-y-3 mb-5">
          {gathering.departureTime && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{gathering.departureTime}</span>
            </div>
          )}

          {gathering.location && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{gathering.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-gray-500" />
            <span>{gathering.participants?.length || 0}명 참여</span>
          </div>
        </div>

        {/* 참여자 목록 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">참여자</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {gathering.participants?.map((participantId, index) => {
              const profile = profiles[participantId];
              if (!profile) return null;

              const isHost = participantId === gathering.hostId;

              return (
                <div
                  key={participantId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  {/* 프로필 이미지 */}
                  <div className="flex-shrink-0">
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                        {profile.displayName?.[0] || '?'}
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {profile.displayName || '이름 없음'}
                      {isHost && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          주최
                        </span>
                      )}
                    </div>
                    {profile.phone && (
                      <div className="text-sm text-gray-500">{profile.phone}</div>
                    )}
                  </div>

                  {/* 순번 */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GatheringDetailModal;
