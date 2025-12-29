import { useState, useEffect } from 'react';
import { X, Utensils } from 'lucide-react';
import MealParticipantListModal from './MealParticipantListModal';
import simpleMealService from '../../services/simpleMealService';
import { formatDate } from '../../utils/dateUtils';

/**
 * 간단한 식사 모달
 * - 점심/저녁 참여자만 표시
 * - 클릭하면 참여자 리스트 모달
 */
const SimpleMealModal = ({
  isOpen,
  onClose,
  date,
  spaceId,
  currentUser,
  profiles
}) => {
  const [participants, setParticipants] = useState({ lunch: [], dinner: [] });
  const [loading, setLoading] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);

  // 참여자 로드
  useEffect(() => {
    if (isOpen && date && spaceId) {
      loadParticipants();
    }
  }, [isOpen, date, spaceId]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const dateStr = formatDate(date);
      const data = await simpleMealService.getMealParticipants(spaceId, dateStr);
      setParticipants(data);
    } catch (error) {
      console.error('참여자 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 참여 토글
  const handleToggle = async (mealType) => {
    try {
      const dateStr = formatDate(date);

      if (mealType === 'lunch') {
        await simpleMealService.toggleLunch(spaceId, dateStr, currentUser.id);
      } else {
        await simpleMealService.toggleDinner(spaceId, dateStr, currentUser.id);
      }

      // 새로고침
      await loadParticipants();
    } catch (error) {
      console.error('참여 토글 실패:', error);
      alert('참여 처리에 실패했습니다.');
    }
  };

  // 섹션 클릭
  const handleSectionClick = (mealType) => {
    setSelectedMealType(mealType);
    setShowParticipantModal(true);
  };

  if (!isOpen || !date) return null;

  const dateObj = new Date(date);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  // 프로필 사진 렌더링 (최대 5개)
  const renderProfileImages = (participantIds, color) => {
    const displayCount = 5;
    const displayIds = participantIds.slice(0, displayCount);
    const hasMore = participantIds.length > displayCount;

    return (
      <div className="flex items-center gap-1">
        {displayIds.map((userId) => {
          const profile = profiles[userId];
          if (!profile) return null;

          return (
            <div key={userId} className="relative">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.displayName || '참여자'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
                  {profile.displayName?.[0] || '?'}
                </div>
              )}
            </div>
          );
        })}

        {hasMore && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
            ...
          </div>
        )}

        {participantIds.length === 0 && (
          <div className="text-sm text-gray-400">참여자 없음</div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto meal-section"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Utensils className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">밥</h3>
                <div className="text-sm text-gray-600">{dateLabel}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">
              로딩 중...
            </div>
          ) : (
            <div className="p-6 space-y-4 meal-section-tabs">
              {/* 점심 */}
              <div
                onClick={() => handleSectionClick('lunch')}
                className="p-5 bg-green-50 border-2 border-green-200 rounded-xl cursor-pointer hover:bg-green-100 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-green-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    점심
                  </h4>
                  <div className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                    {participants.lunch.length}명
                  </div>
                </div>

                {renderProfileImages(participants.lunch, 'green')}

                <div className="mt-3 text-center text-xs text-green-600">
                  클릭하여 참여자 확인 및 참여/취소
                </div>
              </div>

              {/* 저녁 */}
              <div
                onClick={() => handleSectionClick('dinner')}
                className="p-5 bg-orange-50 border-2 border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-orange-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    저녁
                  </h4>
                  <div className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                    {participants.dinner.length}명
                  </div>
                </div>

                {renderProfileImages(participants.dinner, 'orange')}

                <div className="mt-3 text-center text-xs text-orange-600">
                  클릭하여 참여자 확인 및 참여/취소
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 참여자 리스트 모달 */}
      {showParticipantModal && (
        <MealParticipantListModal
          isOpen={showParticipantModal}
          onClose={() => {
            setShowParticipantModal(false);
            setSelectedMealType(null);
          }}
          mealType={selectedMealType}
          participants={selectedMealType === 'lunch' ? participants.lunch : participants.dinner}
          profiles={profiles}
          currentUserId={currentUser.id}
          onToggle={async () => {
            await handleToggle(selectedMealType);
            setShowParticipantModal(false);
            setSelectedMealType(null);
          }}
        />
      )}
    </>
  );
};

export default SimpleMealModal;
