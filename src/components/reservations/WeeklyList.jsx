import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Check, X, Settings2, Share2, GripVertical, User, LogOut, FileText, Shield, UserCog, UserMinus, Wallet, ShieldCheck, List, Calendar, Users, Mars, Venus, Trophy, PackageOpen, Sun, Moon, BeefOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useReservations } from '../../hooks/useReservations';
import { useMonthlyReservations } from '../../hooks/useMonthlyReservations';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import reservationService from '../../services/reservationService';
import simpleMealService from '../../services/simpleMealService';
import LoginOverlay from '../auth/LoginOverlay';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import ReservationModal from './ReservationModal';
import CancelReservationModal from './CancelReservationModal';
import ReservationDetailModal from './ReservationDetailModal';
import WeeklyCalendarView from './WeeklyCalendarView';
import MonthlyCalendarView from './MonthlyCalendarView';
import ReservationManageModal from './ReservationManageModal';
import ReservationEditModal from './ReservationEditModal';
import SimpleMealModal from './SimpleMealModal';
import SeasonOutModal from './SeasonOutModal';
import SeasonOutListView from './SeasonOutListView';
import CleanupDayModal from './CleanupDayModal';
import NoticeListView from './NoticeListView';
import NoticeEditModal from './NoticeEditModal';
import { formatDate, formatWeekDay, getWeekDates, isToday } from '../../utils/dateUtils';
import { canManageSpace } from '../../utils/permissions';
import { USER_TYPE_LABELS } from '../../utils/constants';
import { useSeasonOut } from '../../hooks/useSeasonOut';
import { useNotices } from '../../hooks/useNotices';

// 토스트 알림 컴포넌트
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 z-[99999] px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slideDown max-w-[90vw]"
      style={{
        top: 'max(20px, env(safe-area-inset-top, 20px))',
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

// 스페이스 없음 안내 컴포넌트
const NoSpaceNotice = ({ onJoinSpace }) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
        <Settings2 className="w-10 h-10 text-blue-600" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          가입된 스페이스가 없습니다
        </h2>
        <p className="text-gray-600">
          예약을 관리하려면 먼저 스페이스에 가입해주세요
        </p>
      </div>
      
      <button
        onClick={onJoinSpace}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        스페이스 가입하기
      </button>
      
      <p className="text-sm text-gray-500">
        초대 코드가 있다면 스페이스 관리자에게 문의하세요
      </p>
    </div>
  </div>
);

const WeeklyList = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const { selectedSpace, spaces, profiles, setReservations, invalidateCalendarCache } = useStore();
  const seasonOutEnabled = selectedSpace?.seasonOutEnabled ?? true;

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
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 스페이스 드롭다운 및 프로필 메뉴 상태 제거 (GlobalHeader에서 처리)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservationForCancel, setSelectedReservationForCancel] = useState(null);
  const [showReservationDetailModal, setShowReservationDetailModal] = useState(false);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState(null);
  const [selectedReservationsForDetail, setSelectedReservationsForDetail] = useState([]);
  const [loadingReservationDetail, setLoadingReservationDetail] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [showManageModal, setShowManageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservationForManage, setSelectedReservationForManage] = useState(null);
  const [currentDateStrForManage, setCurrentDateStrForManage] = useState(null); // dateStr로 저장
  const [mealsByDate, setMealsByDate] = useState({}); // 날짜별 식사 참여자 정보
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedDateForMeal, setSelectedDateForMeal] = useState(null);
  const [showSeasonOutModal, setShowSeasonOutModal] = useState(false);
  const [showCleanupDayModal, setShowCleanupDayModal] = useState(false);
  const [showNoticeEditModal, setShowNoticeEditModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  // 시즌아웃 훅
  const {
    seasonOuts,
    mySeasonOut,
    cleanupDay,
    season,
    saveMySeasonOut,
    removeMySeasonOut,
    saveCleanupDay,
    removeCleanupDay
  } = useSeasonOut(selectedSpace?.id, user?.id);

  // 공지사항 훅
  const { notices, addNotice, updateNotice, deleteNotice } = useNotices(selectedSpace?.id);

  // 스페이스 로드는 MainLayout에서 처리 (중복 제거)

  // 월 변경 핸들러 (useCallback으로 안정화 - 무한 루프 방지)
  const handleMonthChange = useCallback((newMonth) => {
    setCalendarMonth(newMonth);
  }, []);

  // 뷰 모드에 따라 다른 데이터 로딩 훅 사용
  const weeklyData = useReservations(
    viewMode === 'list' ? selectedSpace?.id : null,
    currentWeekStart
  );

  const monthlyData = useMonthlyReservations(
    viewMode === 'calendar' ? selectedSpace?.id : null,
    calendarMonth
  );

  // 현재 뷰 모드에 맞는 데이터 선택
  const { reservations: reservationsObj, loading: reservationsLoading } = weeklyData;
  const { dailyStats, myReservations, loading: monthlyLoading, fetchDateReservations } = monthlyData;

  const { createReservation, cancelReservation, refresh } = weeklyData;

  // 스페이스 로드는 MainLayout에서 이미 처리됨

  // 식사 참여자 정보 로드 함수
  const loadMeals = async () => {
    if (!selectedSpace?.id) return;

    try {
      const weekDates = getWeekDates(currentWeekStart);
      const dateStrings = weekDates.map(date => formatDate(date));

      const mealsData = await simpleMealService.getMealsByDateRange(
        selectedSpace.id,
        dateStrings
      );

      setMealsByDate(mealsData);
    } catch (error) {
      console.error('❌ 식사 정보 로드 실패:', error);
    }
  };

  // 식사 참여자 정보 자동 로드
  useEffect(() => {
    loadMeals();
  }, [selectedSpace, currentWeekStart]);

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

  // 스페이스 관련 핸들러는 GlobalHeader와 MorePage에서 처리

  const handleReservationConfirm = async (reservationData) => {
    setIsSubmitting(true);
    try {
      await createReservation(reservationData);
      setShowReservationModal(false);
      setToast({ message: '예약이 완료되었습니다', type: 'success' });
    } catch (error) {
      console.error('❌ 예약 생성 실패:', error);
      setToast({ message: error.message || '예약에 실패했습니다', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 예약 취소 확정
 const handleCancelConfirm = async (reservation) => {
   if (!cancelReservation) {
     alert('예약 취소 기능이 아직 연결되지 않았습니다.');
     return;
   }
   setIsSubmitting(true);
   try {
     await cancelReservation(reservation.id, user.id, ''); // userId 전달
     setShowCancelModal(false);
     setSelectedReservationForCancel(null);
     setToast({ message: '예약이 취소되었습니다', type: 'success' });
   } catch (error) {
     console.error('❌ 예약 취소 실패:', error);
     setToast({ message: error.message || '예약 취소에 실패했습니다', type: 'error' });
   } finally {
     setIsSubmitting(false);
   }
 };
  
  // 로그인 안 됨
  if (!isLoggedIn) {
    return <LoginOverlay />;
  }
  
  // 로딩 중
  if (loading) {
    return <Loading />;
  }
  
  // 🆕 스페이스 없음 처리
  if (spaces.length === 0) {
    return (
      <NoSpaceNotice 
        onJoinSpace={() => navigate('/join')}
      />
    );
  }
  
  const weekDates = getWeekDates(currentWeekStart);
  const weekRange = `${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()} - ${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1}/${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}`;
  const currentUserType = selectedSpace ? spaces.find(s => s.id === selectedSpace.id)?.userType : null;
  const isGuest = currentUserType === 'guest';
  const isManager = canManageSpace(currentUserType);
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  const currentMonday = (() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  })();
  
  const isCurrentWeek = currentWeekStart.getTime() === currentMonday.getTime();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 주간 네비게이션 (리스트 뷰에만 표시) - GlobalHeader 아래 sticky */}
      {viewMode === 'list' && (
        <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white sticky z-20 shadow-md" style={{ top: '60px' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 px-4 py-3">
              <button
                onClick={prevWeek}
                className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all hover:scale-105 active:scale-95 min-h-[40px]"
                aria-label="이전 주"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDatePicker(true)}
                className="px-4 py-2 rounded-full bg-white text-blue-700 font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95 min-h-[40px]"
                aria-label="날짜 선택"
              >
                📅 {weekRange}
              </button>
              <button
                onClick={nextWeek}
                className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all hover:scale-105 active:scale-95 min-h-[40px]"
                aria-label="다음 주"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={thisWeek}
                className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-semibold transition-all hover:scale-105 active:scale-95 min-h-[40px]"
                aria-label="이번 주로 이동"
              >
                오늘
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 월간 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <MonthlyCalendarView
          dailyStats={dailyStats}
          myReservations={myReservations}
          user={user}
          selectedSpace={selectedSpace}
          onMonthChange={handleMonthChange}
          onDateClick={async (date) => {
            // 모달 먼저 표시 (로딩 상태)
            setSelectedDateForDetail(date);
            setSelectedReservationsForDetail([]);
            setLoadingReservationDetail(true);
            setShowReservationDetailModal(true);

            // 백그라운드에서 데이터 로드
            const reservations = await fetchDateReservations(date);
            setSelectedReservationsForDetail(reservations);
            setLoadingReservationDetail(false);
          }}
        />
      )}

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <div className="max-w-2xl mx-auto p-4 pb-36">

        {/* 공지사항 섹션 */}
        <div className="mb-4">
          <NoticeListView
            notices={notices}
            isManager={isManager}
            onAddClick={() => {
              setEditingNotice(null);
              setShowNoticeEditModal(true);
            }}
            onEditClick={(notice) => {
              setEditingNotice(notice);
              setShowNoticeEditModal(true);
            }}
          />
        </div>

        {/* 시즌아웃 섹션 */}
        {seasonOutEnabled && (
          <div className="mb-4">
            <SeasonOutListView
              seasonOuts={seasonOuts}
              season={season}
              cleanupDay={cleanupDay}
              isManager={currentUserType === 'manager'}
              onRegisterClick={() => setShowSeasonOutModal(true)}
              onCleanupDayClick={() => setShowCleanupDayModal(true)}
            />
          </div>
        )}

        {weekDates.map((date, dateIndex) => {
          const dateStr = formatDate(date);
          const isCurrentDay = isToday(date);

          // 날짜별 예약 가져오기 (객체에서 직접 접근)
          const dateReservations = reservationsObj[dateStr] || [];

          // 게스트는 본인 예약만 상세정보 표시
          const myReservations = dateReservations.filter(r => {
            const match = String(r.userId) === String(user.id);
            return match;
          }).map(r => ({
            ...r,
            isCheckIn: formatDate(r.checkIn) === dateStr,
            hostDisplayName: profiles[r.hostId]?.displayName || r.hostId
          }));
          
          // 통계용 전체 예약 (게스트도 총 인원수는 봐야 함)
          const allReservations = dateReservations.map(r => ({
            ...r,
            isCheckIn: formatDate(new Date(r.checkIn)) === dateStr,
            hostDisplayName: profiles[r.hostId]?.displayName || r.hostId
          }));
          
          const memberTypes = ['shareholder', 'manager', 'vice-manager'];
          const stats = allReservations.reduce((acc, r) => {
            const isMember = memberTypes.includes(r.type);
            const isDayTrip = r.nights === 0 || r.isDayTrip;

            if (isMember) {
              isDayTrip ? acc.memberDayTrip++ : acc.weekdayCount++;
            } else {
              isDayTrip ? acc.guestDayTrip++ : acc.guestCount++;
            }
            return acc;
          }, { weekdayCount: 0, guestCount: 0, memberDayTrip: 0, guestDayTrip: 0 });
          
          return (
            <details 
              key={dateStr}
              className="mb-3 bg-white rounded-xl border shadow-sm overflow-hidden transition-all"
              style={{
                borderColor: isCurrentDay ? '#3b82f6' : '#e5e7eb',
                borderWidth: isCurrentDay ? '2px' : '1px'
              }}
              open={isCurrentDay || allReservations.length > 0}
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
                  {/* 밥X 아이콘 (나가서 먹는 사람) + 점심/저녁 인원 */}
                  {(() => {
                    const dateMeals = mealsByDate[dateStr] || { lunch: [], dinner: [] };
                    const lunchOut = dateMeals.lunch.length;
                    const dinnerOut = dateMeals.dinner.length;
                    const myLunch = dateMeals.lunch.includes(user.id);
                    const myDinner = dateMeals.dinner.includes(user.id);

                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateForMeal(date);
                          setShowMealModal(true);
                        }}
                        className="meal-check-button flex items-center gap-1.5 px-1.5 py-1 hover:bg-orange-100 rounded-lg transition-colors"
                        title="밥X - 나가서 먹어요"
                      >
                        <BeefOff className="w-4 h-4 text-orange-600" />
                        {lunchOut > 0 && (
                          <span
                            className={`flex items-center gap-0.5 text-xs font-semibold text-green-700 ${myLunch ? 'underline underline-offset-2' : ''}`}
                            title={`점심 밖에서 ${lunchOut}명${myLunch ? ' (나 포함)' : ''}`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            {lunchOut}
                          </span>
                        )}
                        {dinnerOut > 0 && (
                          <span
                            className={`flex items-center gap-0.5 text-xs font-semibold text-orange-700 ${myDinner ? 'underline underline-offset-2' : ''}`}
                            title={`저녁 밖에서 ${dinnerOut}명${myDinner ? ' (나 포함)' : ''}`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            {dinnerOut}
                          </span>
                        )}
                      </button>
                    );
                  })()}
                  {/* 게스트용 체크인/체크아웃 표시 */}
                  {isGuest && myReservations.length > 0 && myReservations.map(r => {
                    const isCheckInDay = formatDate(r.checkIn) === dateStr;
                    const isCheckOutDay = formatDate(r.checkOut) === dateStr;
                    if (isCheckInDay) {
                      return <span key={r.id} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold ml-1">체크인</span>;
                    } else if (isCheckOutDay) {
                      return <span key={r.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold ml-1">체크아웃</span>;
                    }
                    return null;
                  })}
                </div>
                
                {/* 인원수 */}
                <div className="flex items-center justify-end gap-3">
                  {allReservations.length > 0 ? (
                    <>
                      <div className="flex flex-col gap-1 items-end">
                        <div className="text-sm text-gray-600">
                          게스트 {stats.guestCount} / 당일 {stats.memberDayTrip + stats.guestDayTrip}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="flex items-center gap-0.5 text-blue-600">
                            <Mars className="w-3 h-3" />
                            {allReservations.filter(r => profiles[r.userId]?.gender === 'male').length}
                          </span>
                          <span>/</span>
                          <span className="flex items-center gap-0.5 text-pink-600">
                            <Venus className="w-3 h-3" />
                            {allReservations.filter(r => profiles[r.userId]?.gender === 'female').length}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {allReservations.filter(r => !r.isDayTrip && r.nights !== 0).length}
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
                  // 게스트: 본인 프로필만 표시 + 전체 보기 버튼
                  <div className="pt-3 space-y-2">
                    {myReservations.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {myReservations.filter(r => !r.isDayTrip && r.nights !== 0).map((reservation) => {
                          const profile = profiles[reservation.userId];
                          const isMine = String(reservation.userId) === String(user.id);
                          const ringColor = profile?.gender === 'female' ? 'ring-pink-500' : 'ring-blue-500';
                          const bgColor = profile?.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500';

                          return (
                            <div key={reservation.id} className="relative group">
                              {profile?.profileImage ? (
                                <div className="relative">
                                  <img
                                    src={profile.profileImage}
                                    alt={reservation.name}
                                    className={`w-12 h-12 rounded-full object-cover ring-2 ${ringColor} ${isMine ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                      if (!isMine) return;
                                      setSelectedReservationForManage(reservation);
                                      setCurrentDateStrForManage(dateStr);
                                      setShowManageModal(true);
                                    }}
                                  />
                                  {/* 내 예약 배지 */}
                                  {isMine && (
                                    <div className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="relative">
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ring-2 ${ringColor} ${bgColor} ${isMine ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                      if (!isMine) return;
                                      setSelectedReservationForManage(reservation);
                                      setCurrentDateStrForManage(dateStr);
                                      setShowManageModal(true);
                                    }}
                                  >
                                    {reservation.name?.[0]}
                                  </div>
                                  {/* 내 예약 배지 */}
                                  {isMine && (
                                    <div className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* 호버시 이름 + 초대자 표시 */}
                              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                <div>{reservation.name}</div>
                                {reservation.hostDisplayName && (
                                  <div className="text-[10px] text-gray-300">
                                    {profiles[reservation.hostId]?.displayName || reservation.hostDisplayName} 초대
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-gray-400 text-sm">
                        내 예약 없음
                      </div>
                    )}

                    {/* 전체 예약자 보기 버튼 */}
                    {allReservations.length > 0 && (() => {
                      const regularCount = allReservations.filter(r => !r.isDayTrip && r.nights !== 0).length;
                      const dayTripCount = allReservations.filter(r => r.isDayTrip || r.nights === 0).length;
                      return (
                        <button
                          onClick={() => {
                            setSelectedDateForDetail(date);
                            setSelectedReservationsForDetail(allReservations);
                            setShowReservationDetailModal(true);
                          }}
                          className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          전체보기 ({regularCount}{dayTripCount > 0 ? `+${dayTripCount}` : ''})
                        </button>
                      );
                    })()}
                  </div>
                ) : (
                  // 주주: 전체 예약 (프로필 사진 최대 5개 + 더보기)
                  allReservations.length > 0 ? (
                    <div className="pt-3 space-y-2">
                      {/* 프로필 사진 가로 나열 (최대 5개, 내 프로필 우선) */}
                      <div className="flex items-center gap-2">
                        {/* 내 예약 우선 정렬, 당일치기 제외 */}
                        {[...allReservations].filter(r => !r.isDayTrip && r.nights !== 0).sort((a, b) => {
                          const aIsMine = String(a.userId) === String(user.id);
                          const bIsMine = String(b.userId) === String(user.id);
                          if (aIsMine && !bIsMine) return -1;
                          if (!aIsMine && bIsMine) return 1;
                          return 0;
                        }).slice(0, 5).map((reservation) => {
                          const profile = profiles[reservation.userId];
                          const memberTypes = ['shareholder', 'manager', 'vice-manager'];
                          const isMember = memberTypes.includes(reservation.type);
                          const isMine = String(reservation.userId) === String(user.id);
                          const ringColor = profile?.gender === 'female' ? 'ring-pink-500' : 'ring-blue-500';
                          const bgColor = profile?.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500';

                          return (
                            <div key={reservation.id} className="relative group">
                              {profile?.profileImage ? (
                                <div className="relative">
                                  <img
                                    src={profile.profileImage}
                                    alt={reservation.name}
                                    className={`w-12 h-12 rounded-full object-cover ring-2 ${ringColor} ${isMine ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                      if (!isMine) return;
                                      setSelectedReservationForManage(reservation);
                                      setCurrentDateStrForManage(dateStr);
                                      setShowManageModal(true);
                                    }}
                                  />
                                  {/* 내 예약 배지 */}
                                  {isMine && (
                                    <div className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="relative">
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ring-2 ${ringColor} ${bgColor} ${isMine ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                      if (!isMine) return;
                                      setSelectedReservationForManage(reservation);
                                      setCurrentDateStrForManage(dateStr);
                                      setShowManageModal(true);
                                    }}
                                  >
                                    {reservation.name?.[0]}
                                  </div>
                                  {/* 내 예약 배지 */}
                                  {isMine && (
                                    <div className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* 호버시 이름 + 초대자 표시 */}
                              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                <div>{reservation.name}</div>
                                {!isMember && reservation.hostDisplayName && (
                                  <div className="text-[10px] text-gray-300">
                                    {reservation.hostDisplayName} 초대
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* 더보기 버튼 */}
                        {(() => {
                          const regularReservations = allReservations.filter(r => !r.isDayTrip && r.nights !== 0);
                          const remainingRegular = Math.max(0, regularReservations.length - 5);

                          return remainingRegular > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedDateForDetail(date);
                                setSelectedReservationsForDetail(allReservations);
                                setShowReservationDetailModal(true);
                              }}
                              className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-sm transition-colors"
                            >
                              +{remainingRegular}
                            </button>
                          ) : null;
                        })()}
                      </div>

                      {/* 전체 보기 버튼 (항상 표시) */}
                      {(() => {
                        const regularCount = allReservations.filter(r => !r.isDayTrip && r.nights !== 0).length;
                        const dayTripCount = allReservations.filter(r => r.isDayTrip || r.nights === 0).length;
                        return (
                          <button
                            onClick={() => {
                              setSelectedDateForDetail(date);
                              setSelectedReservationsForDetail(allReservations);
                              setShowReservationDetailModal(true);
                            }}
                            className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5" />
                            전체보기 ({regularCount}{dayTripCount > 0 ? `+${dayTripCount}` : ''})
                          </button>
                        );
                      })()}
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
        })}
        </div>
      )}
      
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
        existingReservations={Object.values(reservationsObj || {}).flat()}
        user={user}
        selectedSpace={selectedSpace}
      />
      {/* ✅ 예약 취소 모달 */}
 <CancelReservationModal
   isOpen={showCancelModal}
   onClose={() => {
     setShowCancelModal(false);
     setSelectedReservationForCancel(null);
   }}
   reservation={selectedReservationForCancel}
   onConfirm={handleCancelConfirm}
 />

      {/* 예약 관리 모달 */}
      <ReservationManageModal
        isOpen={showManageModal}
        onClose={() => {
          setShowManageModal(false);
          setSelectedReservationForManage(null);
          setCurrentDateStrForManage(null);
        }}
        reservation={selectedReservationForManage}
        currentDateStr={currentDateStrForManage}
        spaceId={selectedSpace?.id}
        onRefresh={async () => {
          await refresh();
          // 식사 참여자 정보도 다시 로드
          await loadMeals();
        }}
        onEdit={(reservation) => {
          // ManageModal을 먼저 닫고 EditModal 열기
          setShowManageModal(false);
          setSelectedReservationForManage(reservation);
          setShowEditModal(true);
        }}
        onCancel={(reservation) => {
          setSelectedReservationForCancel(reservation);
          setShowCancelModal(true);
        }}
        showToast={setToast}
      />

      {/* 예약 수정 모달 */}
      <ReservationEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
        }}
        reservation={selectedReservationForManage}
        existingReservations={reservationsObj}
        onConfirm={async (updateData) => {
          try {
            await reservationService.updateReservation(
              selectedSpace.id,
              selectedReservationForManage.id,
              { ...updateData, userId: user.id }  // userId 전달
            );

            invalidateCalendarCache(); // 캘린더 캐시 무효화
            await refresh();
            setToast({ message: '예약이 수정되었습니다', type: 'success' });
            setShowEditModal(false);
            setShowManageModal(false);
          } catch (error) {
            console.error('예약 수정 실패:', error);
            setToast({ message: '수정에 실패했습니다', type: 'error' });
          }
        }}
      />

      {/* 예약자 상세 모달 */}
      <ReservationDetailModal
        isOpen={showReservationDetailModal}
        onClose={() => {
          setShowReservationDetailModal(false);
          setSelectedDateForDetail(null);
          setSelectedReservationsForDetail([]);
          setLoadingReservationDetail(false);
        }}
        date={selectedDateForDetail}
        reservations={selectedReservationsForDetail}
        profiles={profiles}
        user={user}
        loading={loadingReservationDetail}
        onProfileClick={(reservation, clickedDate) => {
          // 상세 모달 닫고 예약관리 모달 열기
          setShowReservationDetailModal(false);
          setSelectedReservationForManage(reservation);
          setCurrentDateStrForManage(formatDate(clickedDate));
          setShowManageModal(true);
        }}
      />
      
      {/* 토스트 */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* 로딩 */}
      {isSubmitting && <LoadingOverlay />}
      
      {/* 플로팅 통계/뷰 전환 버튼 (왼쪽 하단 - 가로 배치) */}
      <div
        className="fixed z-40 flex flex-row gap-2"
        style={{
          bottom: 'calc(5rem + env(safe-area-inset-bottom))',
          left: 'max(20px, env(safe-area-inset-left))'
        }}
      >
        {/* 통계 버튼 */}
        <button
          onClick={() => navigate('/reservation-stats')}
          className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          title="예약 통계"
          aria-label="예약 통계 보기"
        >
          <Trophy className="w-5 h-5" />
        </button>

        {/* 리스트 뷰 버튼 */}
        <button
          onClick={() => setViewMode('list')}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
            viewMode === 'list'
              ? 'bg-white text-blue-600'
              : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
          }`}
          title="리스트 뷰"
          aria-label="리스트 뷰로 전환"
          aria-pressed={viewMode === 'list'}
        >
          <List className="w-5 h-5" />
        </button>

        {/* 달력 뷰 버튼 */}
        <button
          onClick={() => setViewMode('calendar')}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
            viewMode === 'calendar'
              ? 'bg-white text-blue-600'
              : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
          }`}
          title="달력 뷰"
          aria-label="달력 뷰로 전환"
          aria-pressed={viewMode === 'calendar'}
        >
          <Calendar className="w-5 h-5" />
        </button>

        {/* 시즌아웃 버튼 */}
        {seasonOutEnabled && (
          <button
            onClick={() => setShowSeasonOutModal(true)}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
              mySeasonOut
                ? 'bg-amber-400 text-white'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
            }`}
            title={mySeasonOut ? `내 시즌아웃: ${mySeasonOut.date?.getMonth() + 1}/${mySeasonOut.date?.getDate()}` : '시즌아웃 등록'}
            aria-label="시즌아웃 날짜 등록"
          >
            <PackageOpen className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 플로팅 예약 추가 버튼 (오른쪽 하단, 여백 증가) */}
      {!showReservationModal && !showDatePicker && (
        <button
          onClick={() => setShowReservationModal(true)}
          className="fixed z-40 px-5 py-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg flex items-center gap-2 text-white hover:shadow-xl transition-all hover:scale-105 active:scale-95 min-h-[48px]"
          style={{
            bottom: 'calc(6.5rem + env(safe-area-inset-bottom))',
            right: 'max(24px, env(safe-area-inset-right))'
          }}
          aria-label="새 예약 추가"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">예약하기</span>
        </button>
      )}

      {/* 식사 모달 */}
      <SimpleMealModal
        isOpen={showMealModal}
        onClose={() => {
          setShowMealModal(false);
          setSelectedDateForMeal(null);
          loadMeals(); // 식사 정보 새로고침
        }}
        date={selectedDateForMeal}
        spaceId={selectedSpace?.id}
        currentUser={user}
        profiles={profiles}
      />

      {/* 시즌아웃 모달 */}
      {seasonOutEnabled && (
        <SeasonOutModal
          isOpen={showSeasonOutModal}
          onClose={() => setShowSeasonOutModal(false)}
          mySeasonOut={mySeasonOut}
          onSave={saveMySeasonOut}
          onDelete={removeMySeasonOut}
          userName={user?.displayName || '사용자'}
        />
      )}

      {/* 대청소 날 결정 모달 (방장 전용) */}
      {seasonOutEnabled && (
        <CleanupDayModal
          isOpen={showCleanupDayModal}
          onClose={() => setShowCleanupDayModal(false)}
          cleanupDay={cleanupDay}
          latestDate={seasonOuts.length > 0
            ? seasonOuts.reduce((latest, s) => (s.date > latest ? s.date : latest), seasonOuts[0].date)
            : null}
          onSave={(data) => saveCleanupDay({ ...data, setBy: user?.id, setByName: user?.displayName || '방장' })}
          onDelete={removeCleanupDay}
          managerName={user?.displayName || '방장'}
        />
      )}

      {/* 공지사항 작성/수정 모달 */}
      <NoticeEditModal
        isOpen={showNoticeEditModal}
        onClose={() => {
          setShowNoticeEditModal(false);
          setEditingNotice(null);
        }}
        notice={editingNotice}
        onSave={async (data) => {
          if (editingNotice) {
            await updateNotice(editingNotice.id, data);
          } else {
            await addNotice(data, user?.id, user?.displayName);
          }
        }}
        onDelete={deleteNotice}
      />
    </div>
  );
};

export default WeeklyList;