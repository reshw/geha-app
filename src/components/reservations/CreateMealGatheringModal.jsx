import { useState, useEffect } from 'react';
import { X, Clock, MapPin, Users, Search } from 'lucide-react';
import Modal from '../common/Modal';

/**
 * 식사 모임 생성 모달
 */
const CreateMealGatheringModal = ({
  isOpen,
  onClose,
  onConfirm,
  date,
  mealType, // "lunch" | "dinner"
  currentUser,
  profiles // 오늘 예약이 있는 사람들
}) => {
  const [title, setTitle] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [location, setLocation] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 초기화
  useEffect(() => {
    if (isOpen) {
      const defaultTitle = mealType === 'lunch' ? '점심 모임' : '저녁 모임';
      setTitle(defaultTitle);
      setDepartureTime('');
      setLocation('');
      setSelectedParticipants([currentUser.id]); // 주최자 자동 포함
      setSearchQuery('');
      setShowDropdown(false);
    }
  }, [isOpen, mealType, currentUser]);

  // 검색 필터링
  const filteredProfiles = Object.entries(profiles || {})
    .filter(([userId, profile]) => {
      if (!searchQuery.trim()) return false;
      if (selectedParticipants.includes(userId)) return false; // 이미 선택된 사람 제외

      const query = searchQuery.toLowerCase();
      const displayName = profile.displayName?.toLowerCase() || '';
      return displayName.includes(query);
    });

  // 참여자 추가
  const addParticipant = (userId) => {
    if (!selectedParticipants.includes(userId)) {
      setSelectedParticipants(prev => [...prev, userId]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  // 참여자 제거
  const removeParticipant = (userId) => {
    if (userId === currentUser.id) return; // 주최자는 제거 불가
    setSelectedParticipants(prev => prev.filter(id => id !== userId));
  };

  // 저장
  const handleSubmit = () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    onConfirm({
      title: title.trim(),
      departureTime,
      location,
      participants: selectedParticipants
    });
  };

  if (!isOpen) return null;

  const mealTypeLabel = mealType === 'lunch' ? '점심' : '저녁';
  const dateObj = new Date(date);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${mealTypeLabel} 모임 생성`}>
      <div className="space-y-4 max-w-full overflow-x-hidden">
        {/* 날짜 정보 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
          <div className="text-sm font-semibold text-blue-900">
            {dateLabel} {mealTypeLabel}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 근처 중식당 가실 분"
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* 주최자 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            주최자
          </label>
          <div className="px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700">
            {currentUser.displayName || currentUser.email}
          </div>
        </div>

        {/* 시간 & 장소 (한 행) */}
        <div className="grid grid-cols-2 gap-3">
          {/* 출발시간 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              시간 (선택)
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              장소 (선택)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="조강308호 앞"
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 참여자 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            참여자 ({selectedParticipants.length}명)
          </label>

          {/* 선택된 참여자 표시 */}
          {selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedParticipants.map((userId) => {
                const profile = profiles[userId];
                if (!profile) return null;

                const isHost = userId === currentUser.id;

                return (
                  <div
                    key={userId}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-full"
                  >
                    {/* 프로필 이미지 */}
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.displayName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold">
                        {profile.displayName?.[0] || '?'}
                      </div>
                    )}

                    {/* 이름 */}
                    <span className="text-sm font-semibold text-gray-900">
                      {profile.displayName || '이름 없음'}
                    </span>

                    {/* 주최자 표시 */}
                    {isHost && (
                      <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        주최
                      </span>
                    )}

                    {/* 제거 버튼 */}
                    {!isHost && (
                      <button
                        onClick={() => removeParticipant(userId)}
                        className="ml-1 p-0.5 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 검색 Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(e.target.value.trim() !== '');
              }}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              placeholder="이름으로 검색하여 추가"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* 검색 결과 드롭다운 */}
            {showDropdown && searchQuery && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map(([userId, profile]) => (
                    <button
                      key={userId}
                      onClick={() => addParticipant(userId)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      {/* 프로필 이미지 */}
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt={profile.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-bold">
                          {profile.displayName?.[0] || '?'}
                        </div>
                      )}

                      {/* 이름 */}
                      <span className="font-semibold text-gray-900">
                        {profile.displayName || '이름 없음'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-gray-400">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            생성
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateMealGatheringModal;
