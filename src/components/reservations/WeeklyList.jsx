import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useReservations } from '../../hooks/useReservations';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import LoginOverlay from '../auth/LoginOverlay';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import { formatDate, formatWeekDay, getWeekDates, isToday } from '../../utils/dateUtils';

const WeeklyList = () => {
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace, setSelectedSpace, profiles } = useStore();
  const hasInitializedSpace = useRef(false); // 초기 스페이스 설정 플래그
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // 이번주 월요일로 시작
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [userSpaces, setUserSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const { reservations, loading: reservationsLoading } = useReservations(selectedSpace?.id);
  
  // 사용자 스페이스 로드
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user?.id) {
        console.log('❌ user.id 없음:', user);
        return;
      }
      
      console.log('✅ 스페이스 로딩 시작, user.id:', user.id);
      setLoading(true);
      const spaces = await spaceService.getUserSpaces(user.id);
      console.log('📦 불러온 스페이스:', spaces);
      setUserSpaces(spaces);
      
      if (spaces.length > 0 && !hasInitializedSpace.current) {
        console.log('🎯 첫 번째 스페이스 선택:', spaces[0]);
        setSelectedSpace(spaces[0]);
        hasInitializedSpace.current = true;
      }
      setLoading(false);
    };
    
    loadSpaces();
  }, [user, setSelectedSpace]);
  
  const prevMonth = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentWeekStart(newDate);
  };
  
  const nextMonth = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentWeekStart(newDate);
  };
  
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
  
  // 디버깅: reservations 데이터 확인
  useEffect(() => {
    console.log('=== Reservations Data ===');
    console.log('selectedSpace:', selectedSpace);
    console.log('reservations 객체:', reservations);
    console.log('reservations keys:', Object.keys(reservations));
    console.log('profiles:', profiles);
    
    // 샘플 날짜 포맷 테스트
    const testDate = new Date(2024, 11, 30); // 2024년 12월 30일
    console.log('테스트 날짜 포맷:', formatDate(testDate));
    console.log('========================');
  }, [reservations, selectedSpace, profiles]);
  
  const getDateReservations = (date) => {
    const dateStr = formatDate(date);
    const dateReservations = reservations[dateStr] || [];
    
    // 디버깅용
    console.log('날짜:', date.toLocaleDateString('ko-KR'), '=> formatDate:', dateStr);
    if (dateReservations.length > 0) {
      console.log('  예약 발견:', dateReservations);
    }
    if (Object.keys(reservations).length > 0 && dateReservations.length === 0) {
      console.log('  예약 없음. 전체 reservations keys:', Object.keys(reservations));
    }
    
    return dateReservations;
  };
  
  const getReservationStats = (dateReservations) => {
    // manager, vice-manager, shareholder를 주주로 묶음
    const memberTypes = ['shareholder', 'manager', 'vice-manager'];
    const weekdayCount = dateReservations.filter(r => memberTypes.includes(r.type)).length;
    const guestCount = dateReservations.filter(r => r.type === 'guest').length;
    const total = dateReservations.length;
    
    return { weekdayCount, guestCount, total };
  };
  
  const handleReservationClick = (reservation) => {
    alert(`예약 상세 - ${reservation.name || reservation.userId}`);
  };
  
  if (!isLoggedIn) {
    return <LoginOverlay />;
  }
  
  if (loading) {
    return <Loading />;
  }
  
  // 년도 옵션 (현재 년도 기준 ±5년)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* 모바일 폭 고정 컨테이너 */}
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-lg">
        {/* 헤더 */}
        <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">
              {selectedSpace?.name || '308호 예약'}
            </h1>
            {/* 프로필 정보 */}
            {user && (
              <div className="flex items-center gap-2">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.displayName || '프로필'}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {user.displayName?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-sm">{user.displayName || user.email}</span>
              </div>
            )}
          </div>
          
          {/* 월 단위 네비게이션 */}
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={prevMonth} 
              className="p-2 hover:bg-blue-500 rounded-lg"
              title="1개월 전"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-blue-500 rounded-lg"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentWeekStart.getFullYear()}년 {currentWeekStart.getMonth() + 1}월 {currentWeekStart.getDate()}일 ~ {weekDates[6].getFullYear()}년 {weekDates[6].getMonth() + 1}월 {weekDates[6].getDate()}일
              </span>
            </button>
            <button 
              onClick={nextMonth} 
              className="p-2 hover:bg-blue-500 rounded-lg"
              title="1개월 후"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* 주 단위 네비게이션 */}
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={prevWeek} 
              className="p-2 hover:bg-blue-500 rounded-lg"
              title="지난주"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={thisWeek}
              className="flex-1 px-3 py-2 bg-blue-500 rounded-lg text-sm hover:bg-blue-700 font-medium"
            >
              이번주
            </button>
            <button 
              onClick={nextWeek} 
              className="p-2 hover:bg-blue-500 rounded-lg"
              title="다음주"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* 스페이스 선택 */}
          {userSpaces.length > 1 && (
            <div className="mt-3">
              <select 
                value={selectedSpace?.id || ''} 
                onChange={(e) => {
                  const space = userSpaces.find(s => s.id === e.target.value);
                  setSelectedSpace(space);
                }}
                className="w-full px-3 py-2 bg-white text-gray-900 rounded-lg"
              >
                {userSpaces.map(space => (
                  <option key={space.id} value={space.id}>
                    {space.name} ({space.userType})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* 날짜별 리스트 */}
        <div className="p-4 space-y-4">
          {reservationsLoading ? (
            <Loading />
          ) : (
            weekDates.map((date, index) => {
              const dateReservations = getDateReservations(date);
              const stats = getReservationStats(dateReservations);
              const isCurrentDay = isToday(date);
              
              return (
                <div 
                  key={index}
                  className={`bg-white rounded-lg shadow-sm border-2 ${
                    isCurrentDay ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  {/* 날짜 헤더 */}
                  <div className={`p-4 border-b ${
                    isCurrentDay ? 'bg-blue-50' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold">
                          {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일
                        </span>
                        <span className={`ml-2 text-sm ${
                          formatWeekDay(date) === '일' ? 'text-red-500' :
                          formatWeekDay(date) === '토' ? 'text-blue-500' :
                          'text-gray-600'
                        }`}>
                          ({formatWeekDay(date)})
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="text-blue-600 font-medium">주주 {stats.weekdayCount}명</span>
                        {' | '}
                        <span className="text-gray-500">게스트 {stats.guestCount}명</span>
                        {' | '}
                        <span className="font-bold">총 {stats.total}명</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 예약 목록 */}
                  <div className="p-4">
                    {dateReservations.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">예약 없음</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {dateReservations.map((reservation) => {
                          const displayName = reservation.name || profiles[reservation.userId]?.name || '이름없음';
                          const memberTypes = ['shareholder', 'manager', 'vice-manager'];
                          const isMember = memberTypes.includes(reservation.type);
                          
                          return (
                            <button
                              key={`${reservation.id}-${reservation.checkIn}`}
                              onClick={() => handleReservationClick(reservation)}
                              className={`px-4 py-2 rounded-full font-medium ${
                                isMember
                                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                  : 'bg-gray-600 text-white hover:bg-gray-700'
                              }`}
                            >
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* 날짜 선택 모달 */}
      <Modal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} title="날짜 선택">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              년도
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월
            </label>
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
    </div>
  );
};

export default WeeklyList;
