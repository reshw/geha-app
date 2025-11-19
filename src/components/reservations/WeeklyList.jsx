import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useReservations } from '../../hooks/useReservations';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import LoginOverlay from '../auth/LoginOverlay';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import ReservationModal from './ReservationModal';
import SpaceDropdown from '../space/SpaceDropdown';
import { formatDate, formatWeekDay, getWeekDates, isToday } from '../../utils/dateUtils';

// 토스트 알림 컴포넌트
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slideDown"
      style={{
        background: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white'
      }}
    >
      {type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      <span className="font-semibold">{message}</span>
    </div>
  );
};

// 로딩 오버레이
const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center">
    <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      <div className="text-gray-700 font-semibold">예약 처리 중...</div>
    </div>
  </div>
);

const WeeklyList = () => {
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace, setSelectedSpace, profiles } = useStore();
  const hasInitializedSpace = useRef(false);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDateDetail, setSelectedDateDetail] = useState(null);
  const [userSpaces, setUserSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { reservations, loading: reservationsLoading, createReservation } = useReservations(selectedSpace?.id, currentWeekStart);
  
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      const spaces = await spaceService.getUserSpaces(user.id);
      setUserSpaces(spaces);
      
      if (spaces.length > 0 && !hasInitializedSpace.current) {
        setSelectedSpace(spaces[0]);
        hasInitializedSpace.current = true;
      }
      setLoading(false);
    };
    
    loadSpaces();
  }, [user, setSelectedSpace]);
  
  const prevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };
  
  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };
  
  const thisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };
  
  const goToSelectedDate = () => {
    const targetDate = new Date(selectedYear, selectedMonth, 1);
    const day = targetDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
    setShowDatePicker(false);
  };
  
  const weekDates = getWeekDates(currentWeekStart);
  const weekRange = `${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()} - ${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1}/${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}`;
  const years = Array.from({length: 3}, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({length: 12}, (_, i) => i);
  
  // 게스트는 본인 예약만, 주주는 전체
  const getDateReservations = (date) => {
    const dateStr = formatDate(date);
    const allReservations = reservations[dateStr] || [];
    
    if (selectedSpace?.userType === 'guest') {
      return allReservations.filter(r => r.userId === user?.id);
    }
    
    return allReservations;
  };
  
  // 전체 예약 수 (통계용)
  const getTotalReservations = (date) => {
    const dateStr = formatDate(date);
    return reservations[dateStr] || [];
  };
  
  const getReservationStats = (dateReservations) => {
    const memberTypes = ['shareholder', 'manager', 'vice-manager'];
    const weekdayCount = dateReservations.filter(r => memberTypes.includes(r.type)).length;
    const guestCount = dateReservations.filter(r => r.type === 'guest').length;
    const total = dateReservations.length;
    
    return { weekdayCount, guestCount, total };
  };
  
  const handleDateClick = (date, reservations) => {
    if (reservations.length === 0) {
      setShowReservationModal(true);
    } else {
      setSelectedDateDetail({ date, reservations });
      setShowDetailModal(true);
    }
  };
  
  const handleReservationConfirm = async (reservationData) => {
    setIsSubmitting(true);
    try {
      const dataToSave = {
        userId: String(user.id),
        name: reservationData.name,
        type: reservationData.type,
        checkIn: reservationData.checkIn,
        checkOut: reservationData.checkOut,
        nights: reservationData.nights,
        phone: user.phoneNumber || '',
        memo: '',
        hostDisplayName: reservationData.hostDisplayName || '',
        hostId: reservationData.hostId || ''
      };
      
      await createReservation(dataToSave);
      setShowReservationModal(false);
      setToast({ message: '예약이 완료되었습니다', type: 'success' });
    } catch (error) {
      console.error('예약 실패:', error);
      setToast({ message: '예약 처리 중 오류가 발생했습니다', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isLoggedIn) {
    return <LoginOverlay />;
  }
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-bold">{selectedSpace?.spaceName || '스페이스'}</h1>
              <p className="text-sm text-blue-100 mt-1">
                {selectedSpace?.userType === 'guest' ? '게스트' : '주주'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDatePicker(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 hover:bg-white/30"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
              {user?.profileImage && (
                <img 
                  src={user.profileImage} 
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30"
                />
              )}
            </div>
          </div>
          
          {/* 주간 네비게이션 */}
          <div className="flex items-center justify-center gap-2 px-4 pb-4">
            <button onClick={prevWeek} className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowDatePicker(true)}
              className="px-4 py-2 rounded-full bg-white text-blue-600 font-semibold"
            >
              📅 {weekRange}
            </button>
            <button onClick={nextWeek} className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={thisWeek} className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-semibold">
              오늘
            </button>
          </div>
          
          {/* 스페이스 선택 */}
          {userSpaces.length > 1 && (
            <div className="px-4 pb-3">
              <SpaceDropdown
                spaces={userSpaces}
                selectedSpace={selectedSpace}
                onSelect={(space) => setSelectedSpace(space)}
                onReorder={async (updatedSpaces) => {
                  await spaceService.updateSpaceOrder(user.id, updatedSpaces);
                  setUserSpaces(updatedSpaces);
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* 날짜별 카드 리스트 */}
      <div className="max-w-2xl mx-auto p-4 pb-24">
        {reservationsLoading ? (
          <Loading />
        ) : (
          weekDates.map((date, index) => {
            const dateReservations = getDateReservations(date);
            const totalReservations = getTotalReservations(date);
            const stats = getReservationStats(totalReservations);
            const isCurrentDay = isToday(date);
            const isGuest = selectedSpace?.userType === 'guest';
            
            return (
              <details
                key={index}
                className="mb-3 bg-white rounded-xl border shadow-sm overflow-hidden transition-all"
                style={{
                  borderColor: isCurrentDay ? '#3b82f6' : '#e5e7eb',
                  borderWidth: isCurrentDay ? '2px' : '1px'
                }}
                open={isCurrentDay || totalReservations.length > 0}
              >
                <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                  {/* 날짜 */}
                  <div className="flex items-center gap-2">
                    {isCurrentDay && <span className="text-blue-600">📍</span>}
                    <span className="font-bold text-gray-900">
                      {date.getMonth() + 1}월 {date.getDate()}일
                    </span>
                    <span className={`text-sm ${
                      formatWeekDay(date) === '일' ? 'text-red-500' :
                      formatWeekDay(date) === '토' ? 'text-blue-500' :
                      'text-gray-500'
                    }`}>
                      ({formatWeekDay(date)})
                    </span>
                  </div>
                  
                  {/* 인원수 */}
                  <div className="flex items-center gap-3">
                    {totalReservations.length > 0 ? (
                      <>
                        {!isGuest && (
                          <div className="text-sm text-gray-600">
                            주주 {stats.weekdayCount} · 게스트 {stats.guestCount}
                          </div>
                        )}
                        <div className="text-2xl font-bold text-gray-900">
                          {totalReservations.length}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">예약 없음</div>
                    )}
                  </div>
                </summary>
                
                {/* 펼쳤을 때 */}
                <div className="px-4 pb-4 border-t bg-gray-50">
                  {isGuest ? (
                    // 게스트: 본인 예약만
                    dateReservations.length > 0 ? (
                      <div className="pt-3">
                        <div className="text-xs text-gray-500 mb-2">내 예약</div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {dateReservations[0].name?.[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{dateReservations[0].name}</div>
                            {dateReservations[0].isCheckIn && (
                              <span className="text-xs text-green-600 font-semibold">체크인</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-gray-400 text-sm">
                        다른 예약자 정보는 비공개입니다
                      </div>
                    )
                  ) : (
                    // 주주: 전체 예약 (프로필 사진 가로 나열)
                    totalReservations.length > 0 ? (
                      <div className="pt-3 space-y-3">
                        {/* 프로필 사진 가로 나열 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {totalReservations.map((reservation) => {
                            const profile = profiles[reservation.userId];
                            const memberTypes = ['shareholder', 'manager', 'vice-manager'];
                            const isMember = memberTypes.includes(reservation.type);
                            
                            return (
                              <div key={reservation.id} className="relative group">
                                {profile?.profileImage ? (
                                  <img
                                    src={profile.profileImage}
                                    alt={reservation.name}
                                    className="w-12 h-12 rounded-full object-cover ring-2"
                                    style={{
                                      ringColor: isMember ? '#3b82f6' : '#f59e0b'
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ring-2"
                                    style={{
                                      backgroundColor: isMember ? '#3b82f6' : '#f59e0b',
                                      ringColor: isMember ? '#3b82f6' : '#f59e0b'
                                    }}
                                  >
                                    {reservation.name?.[0]}
                                  </div>
                                )}
                                {/* 호버시 이름 표시 */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  {reservation.name}
                                  {!isMember && reservation.hostDisplayName && (
                                    <div className="text-[10px] text-gray-300">
                                      {reservation.hostDisplayName}님 초대
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-gray-400 text-sm">
                        예약이 없습니다
                      </div>
                    )
                  )}
                </div>
              </details>
            );
          })
        )}
      </div>
      
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setShowReservationModal(true)}
        className="fixed right-4 bottom-4 px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 flex items-center gap-2 font-semibold"
      >
        <Plus className="w-5 h-5" />
        예약하기
      </button>
      
      {/* 날짜 선택 모달 */}
      <Modal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} title="날짜 선택">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">년도</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">월</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {months.map(month => (
                <option key={month} value={month}>{month + 1}월</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setShowDatePicker(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={goToSelectedDate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              이동
            </button>
          </div>
        </div>
      </Modal>
      
      {/* 예약 추가 모달 */}
      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onConfirm={handleReservationConfirm}
        spaceId={selectedSpace?.id}
        existingReservations={reservations}
        user={user}
        selectedSpace={selectedSpace}
      />
      
      {/* 토스트 */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* 로딩 */}
      {isSubmitting && <LoadingOverlay />}
    </div>
  );
};

export default WeeklyList;