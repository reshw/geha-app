import { useState, useEffect } from 'react';
import { X, Plus, Utensils } from 'lucide-react';
import Modal from '../common/Modal';
import MealGatheringCard from './MealGatheringCard';
import CreateMealGatheringModal from './CreateMealGatheringModal';
import GatheringDetailModal from './GatheringDetailModal';
import mealGatheringService from '../../services/mealGatheringService';
import { formatDate } from '../../utils/dateUtils';

/**
 * 식사 모달
 * - 점심/저녁 행으로 구분
 * - 각 모임 카드 표시
 * - + 버튼으로 모임 생성
 */
const MealGatheringModal = ({
  isOpen,
  onClose,
  date,
  spaceId,
  currentUser,
  profiles,
  reservations = [] // 오늘 예약이 있는 사람 목록
}) => {
  const [gatherings, setGatherings] = useState({ lunch: [], dinner: [] });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMealType, setCreateMealType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGathering, setSelectedGathering] = useState(null);

  // 오늘 예약이 있는 사람만 필터링 (주최자는 항상 포함)
  const todayProfiles = reservations.reduce((acc, reservation) => {
    if (profiles[reservation.userId]) {
      acc[reservation.userId] = profiles[reservation.userId];
    }
    return acc;
  }, {});

  // 현재 사용자(주최자)는 예약 없어도 항상 포함
  if (currentUser && profiles[currentUser.id]) {
    todayProfiles[currentUser.id] = profiles[currentUser.id];
  }

  // 모임 로드
  useEffect(() => {
    if (isOpen && date && spaceId) {
      loadGatherings();
    }
  }, [isOpen, date, spaceId]);

  const loadGatherings = async () => {
    setLoading(true);
    try {
      const dateStr = formatDate(date);
      const data = await mealGatheringService.getGatheringsByDate(spaceId, dateStr);
      setGatherings(data);
    } catch (error) {
      console.error('모임 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 모임 생성 모달 열기
  const handleOpenCreate = (mealType) => {
    setCreateMealType(mealType);
    setShowCreateModal(true);
  };

  // 모임 생성
  const handleCreateGathering = async (gatheringData) => {
    try {
      const dateStr = formatDate(date);

      await mealGatheringService.createGathering(spaceId, {
        date: dateStr,
        mealType: createMealType,
        title: gatheringData.title,
        hostId: currentUser.id,
        hostName: currentUser.displayName || currentUser.email,
        departureTime: gatheringData.departureTime,
        location: gatheringData.location,
        participants: gatheringData.participants
      });

      // 모임 목록 새로고침
      await loadGatherings();

      // 모달 닫기
      setShowCreateModal(false);
      setCreateMealType(null);
    } catch (error) {
      console.error('모임 생성 실패:', error);
      alert('모임 생성에 실패했습니다.');
    }
  };

  // 참여/취소 토글
  const handleToggleParticipation = async (gathering) => {
    try {
      const isParticipant = gathering.participants?.includes(currentUser.id);

      if (isParticipant) {
        // 참여 취소
        await mealGatheringService.leaveGathering(spaceId, gathering.id, currentUser.id);
      } else {
        // 참여
        await mealGatheringService.joinGathering(spaceId, gathering.id, currentUser.id);
      }

      // 모임 목록 새로고침
      await loadGatherings();
    } catch (error) {
      console.error('참여 토글 실패:', error);
      alert('참여 처리에 실패했습니다.');
    }
  };

  // 모임 삭제
  const handleDeleteGathering = async (gatheringId) => {
    try {
      await mealGatheringService.deleteGathering(spaceId, gatheringId);

      // 모임 목록 새로고침
      await loadGatherings();
    } catch (error) {
      console.error('모임 삭제 실패:', error);
      alert('모임 삭제에 실패했습니다.');
    }
  };

  // 모임 상세보기
  const handleViewDetail = (gathering) => {
    setSelectedGathering(gathering);
    setShowDetailModal(true);
  };

  if (!isOpen || !date) return null;

  const dateObj = new Date(date);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={null}>
        <div className="max-h-[80vh] overflow-y-auto max-w-full overflow-x-hidden">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between -mx-6 -mt-6 mb-6 z-10">
            <div className="flex items-center gap-3">
              <Utensils className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">식사</h3>
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
            <div className="space-y-8">
              {/* 점심 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-green-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    점심 ({gatherings.lunch.length}개 모임)
                  </h4>
                  <button
                    onClick={() => handleOpenCreate('lunch')}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                    title="점심 모임 생성"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {gatherings.lunch.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {gatherings.lunch.map((gathering) => (
                      <MealGatheringCard
                        key={gathering.id}
                        gathering={gathering}
                        profiles={profiles}
                        currentUserId={currentUser.id}
                        onToggleParticipation={handleToggleParticipation}
                        onDelete={handleDeleteGathering}
                        onViewDetail={handleViewDetail}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-gray-400 mb-2">점심 모임이 없습니다</div>
                    <button
                      onClick={() => handleOpenCreate('lunch')}
                      className="text-green-600 hover:text-green-700 font-semibold text-sm"
                    >
                      + 모임 만들기
                    </button>
                  </div>
                )}
              </div>

              {/* 저녁 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-orange-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    저녁 ({gatherings.dinner.length}개 모임)
                  </h4>
                  <button
                    onClick={() => handleOpenCreate('dinner')}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                    title="저녁 모임 생성"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {gatherings.dinner.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {gatherings.dinner.map((gathering) => (
                      <MealGatheringCard
                        key={gathering.id}
                        gathering={gathering}
                        profiles={profiles}
                        currentUserId={currentUser.id}
                        onToggleParticipation={handleToggleParticipation}
                        onDelete={handleDeleteGathering}
                        onViewDetail={handleViewDetail}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-gray-400 mb-2">저녁 모임이 없습니다</div>
                    <button
                      onClick={() => handleOpenCreate('dinner')}
                      className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
                    >
                      + 모임 만들기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 모임 생성 모달 */}
      <CreateMealGatheringModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateMealType(null);
        }}
        onConfirm={handleCreateGathering}
        date={formatDate(date)}
        mealType={createMealType}
        currentUser={currentUser}
        profiles={todayProfiles}
      />

      {/* 모임 상세 모달 */}
      <GatheringDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedGathering(null);
        }}
        gathering={selectedGathering}
        profiles={profiles}
      />
    </>
  );
};

export default MealGatheringModal;
