import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Check, X, Settings2, Share2, GripVertical, User, LogOut, FileText, Shield, UserCog, UserMinus, Wallet, ShieldCheck, List, Calendar, Users, Mars, Venus, Trophy, Utensils } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useReservations } from '../../hooks/useReservations';
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
import SpaceDropdown from '../space/SpaceDropdown';
import CreateSpaceModal from '../space/CreateSpaceModal';
import ReservationManageModal from './ReservationManageModal';
import ReservationEditModal from './ReservationEditModal';
import SimpleMealModal from './SimpleMealModal';
import { formatDate, formatWeekDay, getWeekDates, isToday } from '../../utils/dateUtils';
import { canManageSpace } from '../../utils/permissions';
import { USER_TYPE_LABELS } from '../../utils/constants';

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
  const { selectedSpace, setSelectedSpace, profiles, setReservations } = useStore();
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
  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [draggedSpaceIndex, setDraggedSpaceIndex] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchCurrentY, setTouchCurrentY] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservationForCancel, setSelectedReservationForCancel] = useState(null);
  const [showReservationDetailModal, setShowReservationDetailModal] = useState(false);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState(null);
  const [selectedReservationsForDetail, setSelectedReservationsForDetail] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [showManageModal, setShowManageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservationForManage, setSelectedReservationForManage] = useState(null);
  const [currentDateStrForManage, setCurrentDateStrForManage] = useState(null); // dateStr로 저장
  const [mealsByDate, setMealsByDate] = useState({}); // 날짜별 식사 참여자 정보
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedDateForMeal, setSelectedDateForMeal] = useState(null);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  const { reservations: reservationsObj, loading: reservationsLoading, createReservation, cancelReservation, refresh } = useReservations(selectedSpace?.id, currentWeekStart);
  
  // 🆕 스페이스 로드 및 없음 처리
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const spaces = await spaceService.getUserSpaces(user.id);
        console.log('📦 사용자 스페이스 로드:', spaces);
        
        setUserSpaces(spaces);
        
        // 스페이스가 있으면 마지막 선택 공간 복원 또는 기본값 선택
        if (spaces.length > 0 && !hasInitializedSpace.current) {
          // localStorage에서 마지막 선택 공간 ID 가져오기
          const lastSelectedId = localStorage.getItem('lastSelectedSpaceId');
          console.log('💾 마지막 선택 공간 ID:' , lastSelectedId);
          
          // 마지막 선택 공간이 현재 스페이스 목록에 있는지 확인
          const lastSpace = spaces.find(s => s.id === lastSelectedId);
          
          // 마지막 선택 공간이 있으면 복원, 없으면 order 0 또는 첫 번째 공간 선택
          const spaceToSelect = lastSpace || spaces.find(s => s.order === 0) || spaces[0];
          
          console.log('✅ 선택된 공간:' , spaceToSelect.spaceName, '(ID:' , spaceToSelect.id, ')' );
          setSelectedSpace(spaceToSelect);
          hasInitializedSpace.current = true;
        }
        // 스페이스가 없으면 selectedSpace를 null로 설정
        else if (spaces.length === 0) {
          setSelectedSpace(null);
          hasInitializedSpace.current = true;
        }
      } catch (error) {
        console.error('❌ 스페이스 로드 실패:', error);
        setToast({ message: '스페이스를 불러오는데 실패했습니다', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    loadSpaces();
  }, [user, setSelectedSpace]);

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
  
  // 스페이스 드래그 핸들러
  const handleSpaceDragStart = (e, index) => {
    setDraggedSpaceIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSpaceDragOver = (e, index) => {
    e.preventDefault();
    if (draggedSpaceIndex === null || draggedSpaceIndex === index) return;

    const newSpaces = [...userSpaces];
    const draggedItem = newSpaces[draggedSpaceIndex];
    newSpaces.splice(draggedSpaceIndex, 1);
    newSpaces.splice(index, 0, draggedItem);

    setUserSpaces(newSpaces);
    setDraggedSpaceIndex(index);
  };

  const handleSpaceDragEnd = async () => {
    if (draggedSpaceIndex !== null) {
      const updatedSpaces = userSpaces.map((space, idx) => ({
        ...space,
        order: idx
      }));
      
      await spaceService.updateSpaceOrder(user.id, updatedSpaces);
      setUserSpaces(updatedSpaces);
    }
    setDraggedSpaceIndex(null);
  };

  // 터치 이벤트 핸들러
  const handleSpaceTouchStart = (e, index) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchCurrentY(touch.clientY);
    setDraggedSpaceIndex(index);
  };

  const handleSpaceTouchMove = (e) => {
    if (draggedSpaceIndex === null || touchStartY === null) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    setTouchCurrentY(touch.clientY);
    
    const itemHeight = 60;
    const diff = touch.clientY - touchStartY;
    const steps = Math.round(diff / itemHeight);
    
    if (steps !== 0) {
      const newIndex = Math.max(0, Math.min(userSpaces.length - 1, draggedSpaceIndex + steps));
      
      if (newIndex !== draggedSpaceIndex) {
        const newSpaces = [...userSpaces];
        const draggedItem = newSpaces[draggedSpaceIndex];
        newSpaces.splice(draggedSpaceIndex, 1);
        newSpaces.splice(newIndex, 0, draggedItem);
        
        setUserSpaces(newSpaces);
        setDraggedSpaceIndex(newIndex);
        setTouchStartY(touch.clientY);
      }
    }
  };

  const handleSpaceTouchEnd = async () => {
    if (draggedSpaceIndex !== null) {
      const updatedSpaces = userSpaces.map((space, idx) => ({
        ...space,
        order: idx
      }));
      
      await spaceService.updateSpaceOrder(user.id, updatedSpaces);
      setUserSpaces(updatedSpaces);
    }
    
    setDraggedSpaceIndex(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };
  
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
  
  const handleSpaceChange = (space) => {
    console.log('🔄 스페이스 변경:', space);
    setSelectedSpace(space);
    setShowSpaceDropdown(false);
  };
  
  const handleLeaveSpace = async (spaceId) => {
    if (!window.confirm('정말로 이 스페이스를 나가시겠습니까?')) {
      return;
    }

    try {
      await spaceService.leaveSpace(user.id, spaceId);

      const updatedSpaces = userSpaces.filter(s => s.id !== spaceId);
      setUserSpaces(updatedSpaces);

      if (selectedSpace?.id === spaceId) {
        if (updatedSpaces.length > 0) {
          setSelectedSpace(updatedSpaces[0]);
        } else {
          setSelectedSpace(null);
        }
      }

      setToast({ message: '스페이스에서 나갔습니다', type: 'success' });
      setShowSpaceDropdown(false);
    } catch (error) {
      console.error('❌ 스페이스 나가기 실패:', error);
      setToast({ message: '스페이스 나가기에 실패했습니다', type: 'error' });
    }
  };

  // 방 생성 신청 핸들러
  const handleCreateSpaceRequest = async (spaceName) => {
    setIsCreatingSpace(true);
    try {
      const result = await spaceService.requestSpaceCreation(
        user.id,
        user.displayName,
        spaceName
      );

      if (result.success) {
        setToast({
          message: `방 생성 신청이 완료되었습니다! (코드: ${result.spaceCode})`,
          type: 'success'
        });
        setShowCreateSpaceModal(false);
      }
    } catch (error) {
      console.error('❌ 방 생성 신청 실패:', error);
      setToast({
        message: error.message || '방 생성 신청에 실패했습니다',
        type: 'error'
      });
    } finally {
      setIsCreatingSpace(false);
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
  if (userSpaces.length === 0) {
    return (
      <NoSpaceNotice 
        onJoinSpace={() => navigate('/join')}
      />
    );
  }
  
  const weekDates = getWeekDates(currentWeekStart);
  const weekRange = `${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()} - ${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1}/${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}`;
  const currentUserType = selectedSpace ? userSpaces.find(s => s.id === selectedSpace.id)?.userType : null;
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
      {/* 헤더 - sticky 추가 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between p-4">
            {/* 좌측: 스페이스 선택 */}
            <div className="relative">
              <SpaceDropdown
                spaces={userSpaces}
                selectedSpace={selectedSpace}
                onSelect={handleSpaceChange}
                onReorder={async (updatedSpaces) => {
                  setUserSpaces(updatedSpaces);
                  await spaceService.updateSpaceOrder(user.id, updatedSpaces);
                }}
                onCreateSpace={() => setShowCreateSpaceModal(true)}
              />
            </div>

            {/* 우측: 통계 + 뷰 모드 토글 + 프로필 */}
            <div className="flex items-center gap-2">
              {/* 통계 버튼 */}
              <button
                onClick={() => navigate('/reservation-stats')}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="예약 통계"
              >
                <Trophy className="w-4 h-4 text-white" />
              </button>

              {/* 뷰 모드 토글 */}
              <div className="flex items-center bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600'
                      : 'text-white/70 hover:text-white'
                  }`}
                  title="리스트 뷰"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-blue-600'
                      : 'text-white/70 hover:text-white'
                  }`}
                  title="달력 뷰"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              {/* 프로필 메뉴 */}
              <div className="relative">
                {user?.profileImage && (
                  <>
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-9 h-9 rounded-full ring-2 ring-white/30 hover:ring-white/50 transition-all"
                    >
                      <img 
                        src={user.profileImage} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </button>

                    {/* 프로필 드롭다운 */}
                    {showProfileMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowProfileMenu(false)}
                        />
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden min-w-[220px]">
                          {/* 사용자 정보 */}
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <div className="font-semibold text-gray-900">{user.displayName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {selectedSpace?.userType && USER_TYPE_LABELS[selectedSpace.userType]}
                            </div>
                          </div>

                          {/* 메뉴 아이템 */}
                          <div className="py-2">
                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                alert('개인정보 수정 기능은 준비 중입니다.');
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                            >
                              <UserCog className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">개인정보 수정</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                navigate('/terms');
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                            >
                              <FileText className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">이용약관</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                navigate('/privacy');
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                            >
                              <Shield className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">개인정보 처리방침</span>
                            </button>

                            {/* 슈퍼어드민 메뉴 */}
                            {user?.isSuperAdmin && (
                              <>
                                <div className="border-t border-gray-100 my-2"></div>
                                <button
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    navigate('/super-admin');
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors text-purple-700 flex items-center gap-3"
                                >
                                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                                  <span className="font-medium">슈퍼어드민</span>
                                </button>
                              </>
                            )}

                            <div className="border-t border-gray-100 my-2"></div>

                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                if (window.confirm('정말 로그아웃 하시겠습니까?')) {
                                  logout();
                                  navigate('/');
                                }
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                            >
                              <LogOut className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">로그아웃</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                if (window.confirm('정말 회원 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) {
                                  alert('회원 탈퇴 기능은 준비 중입니다.');
                                }
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600 flex items-center gap-3"
                            >
                              <UserMinus className="w-5 h-5" />
                              <span className="font-medium">회원 탈퇴</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 주간 네비게이션 (리스트 뷰에만 표시) */}
          {viewMode === 'list' && (
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
          )}
        </div>
      </div>
      
      {/* 달력 뷰 */}
      {viewMode === 'calendar' && (
        <div className="pb-24 pt-4">
          <WeeklyCalendarView
            currentWeekStart={currentWeekStart}
            reservationsObj={reservationsObj}
            profiles={profiles}
            user={user}
            onDateClick={(date, reservations) => {
              setSelectedDateForDetail(date);
              setSelectedReservationsForDetail(reservations);
              setShowReservationDetailModal(true);
            }}
            onPrevWeek={prevWeek}
            onNextWeek={nextWeek}
            onThisWeek={thisWeek}
          />
        </div>
      )}

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <div className="max-w-2xl mx-auto p-4 pb-24">
        {weekDates.map((date, dateIndex) => {
          const dateStr = formatDate(date);
          const isCurrentDay = isToday(date);

          console.log(`🗓️ [WeeklyList] 카드 렌더링 [${dateIndex}]:`, {
            dateStr,
            date: date.toISOString(),
            dateObject: date
          });

          // 날짜별 예약 가져오기 (객체에서 직접 접근)
          const dateReservations = reservationsObj[dateStr] || [];
          
          // 🔍 디버깅: 예약 데이터 확인
          console.log(`📅 ${dateStr} (${formatWeekDay(date)}) 디버깅:`, {
            dateReservations: dateReservations.length,
            allReservations: dateReservations.map(r => ({
              id: r.id,
              userId: r.userId,
              userIdType: typeof r.userId,
              name: r.name,
              type: r.type
            })),
            currentUserId: user.id,
            currentUserIdType: typeof user.id,
            isGuest: isGuest
          });
          
          // 게스트는 본인 예약만 상세정보 표시
          const myReservations = dateReservations.filter(r => {
            const match = String(r.userId) === String(user.id);
            console.log(`  🔍 예약 ${r.id}: userId=${r.userId}, match=${match}`);
            return match;
          }).map(r => ({
            ...r,
            isCheckIn: formatDate(r.checkIn) === dateStr,
            hostDisplayName: profiles[r.hostId]?.displayName || r.hostId
          }));
          
          console.log(`  ✅ 내 예약: ${myReservations.length}개`);
          
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
                  {/* 포크 아이콘 (식사 열기) */}
                  <div className="relative meal-check-button">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDateForMeal(date);
                        setShowMealModal(true);
                      }}
                      className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors"
                      title="밥 보기"
                    >
                      <Utensils className="w-4 h-4 text-orange-600" />
                    </button>
                    {/* 본인 식사 상태 표시 */}
                    {(() => {
                      const dateMeals = mealsByDate[dateStr] || { lunch: [], dinner: [] };
                      const myLunch = dateMeals.lunch.includes(user.id);
                      const myDinner = dateMeals.dinner.includes(user.id);
                      const hasMyMeal = myLunch || myDinner;

                      if (!hasMyMeal) return null;

                      return (
                        <div className="absolute -top-0.5 -right-0.5 flex gap-0.5">
                          {myLunch && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 border border-white" title="점심" />
                          )}
                          {myDinner && (
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 border border-white" title="저녁" />
                          )}
                        </div>
                      );
                    })()}
                  </div>
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
                                      console.log('📅 프로필 클릭 (이미지 있음):', {
                                        dateStr,
                                        reservationId: reservation.id
                                      });
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
                                      console.log('📅 프로필 클릭 (이미지 없음):', {
                                        dateStr,
                                        reservationId: reservation.id
                                      });
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
                                      console.log('📅 프로필 클릭 (캘린더 뷰, 이미지 있음):', {
                                        dateStr,
                                        reservationId: reservation.id
                                      });
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
                                      console.log('📅 프로필 클릭 (캘린더 뷰, 이미지 없음):', {
                                        dateStr,
                                        reservationId: reservation.id
                                      });
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
          console.log('📝 [WeeklyList] 예약 수정 버튼 클릭:', {
            reservation,
            currentDateStrForManage
          });
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
        }}
        date={selectedDateForDetail}
        reservations={selectedReservationsForDetail}
        profiles={profiles}
        user={user}
        onProfileClick={(reservation, clickedDate) => {
          console.log('👤 [WeeklyList] 상세 모달에서 본인 프로필 클릭:', {
            reservation,
            clickedDate,
            dateStr: formatDate(clickedDate)
          });
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
      
      {/* 플로팅 예약 추가 버튼 */}
      {!showReservationModal && !showDatePicker && (
        <button
          onClick={() => setShowReservationModal(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center gap-2 text-white hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ 
            bottom: 'calc(5rem + env(safe-area-inset-bottom))',
            right: 'max(24px, env(safe-area-inset-right))'
          }}
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

      {/* 방 생성 신청 모달 */}
      <CreateSpaceModal
        isOpen={showCreateSpaceModal}
        onClose={() => setShowCreateSpaceModal(false)}
        onSubmit={handleCreateSpaceRequest}
        isLoading={isCreatingSpace}
      />
    </div>
  );
};

export default WeeklyList;