import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Check, X, Menu, Settings2, Share2, GripVertical, User, LogOut, FileText, Shield, UserCog, UserMinus } from 'lucide-react';
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
import { canManageSpace } from '../../utils/permissions';
import { USER_TYPE_LABELS } from '../../utils/constants';

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
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
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
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [draggedSpaceIndex, setDraggedSpaceIndex] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchCurrentY, setTouchCurrentY] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
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
      {/* 헤더 - sticky 추가 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between p-4">
            {/* 좌측: 스페이스 선택 */}
            <div className="relative">
              <button
                onClick={() => userSpaces.length > 1 && setShowSpaceDropdown(!showSpaceDropdown)}
                className={`flex items-center gap-2 ${userSpaces.length > 1 ? 'hover:bg-white/10' : ''} px-3 py-2 rounded-lg transition-colors`}
                disabled={userSpaces.length <= 1}
              >
                <h1 className="text-xl font-bold">{selectedSpace?.spaceName || '스페이스'}</h1>
                {userSpaces.length > 1 && <ChevronDown className="w-5 h-5" />}
              </button>
              
              {/* 스페이스 드롭다운 with 드래그 */}
              {showSpaceDropdown && userSpaces.length > 1 && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSpaceDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden min-w-[250px] max-h-[400px] overflow-y-auto">
                    {userSpaces.map((space, index) => {
                      const isDragging = draggedSpaceIndex === index;
                      let translateY = 0;
                      let scale = 1;
                      let opacity = 1;
                      
                      if (isDragging && touchStartY && touchCurrentY) {
                        translateY = touchCurrentY - touchStartY;
                        scale = 1.05;
                        opacity = 0.9;
                      }
                      
                      return (
                        <div
                          key={space.id}
                          draggable
                          onDragStart={(e) => handleSpaceDragStart(e, index)}
                          onDragOver={(e) => handleSpaceDragOver(e, index)}
                          onDragEnd={handleSpaceDragEnd}
                          onTouchStart={(e) => {
                            if (e.target.closest('.drag-handle')) {
                              handleSpaceTouchStart(e, index);
                            }
                          }}
                          onTouchMove={handleSpaceTouchMove}
                          onTouchEnd={handleSpaceTouchEnd}
                          className={`flex items-center gap-3 px-4 py-3 ${
                            selectedSpace?.id === space.id ? 'bg-blue-50' : isDragging ? 'bg-gray-100' : 'bg-white'
                          } ${index < userSpaces.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}
                          style={{
                            transform: `translateY(${translateY}px) scale(${scale})`,
                            opacity: opacity,
                            transition: isDragging ? 'none' : 'all 0.2s',
                            cursor: isDragging ? 'grabbing' : 'pointer',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            position: 'relative',
                            zIndex: isDragging ? 100 : 1,
                            boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.15)' : 'none'
                          }}
                        >
                          {/* 드래그 핸들 */}
                          <div
                            className="drag-handle"
                            style={{
                              cursor: isDragging ? 'grabbing' : 'grab',
                              color: isDragging ? '#2563eb' : '#9ca3af',
                              touchAction: 'none'
                            }}
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          
                          {/* 스페이스 정보 */}
                          <div
                            onClick={() => {
                              if (!isDragging) {
                                setSelectedSpace(space);
                                setShowSpaceDropdown(false);
                              }
                            }}
                            className="flex-1"
                          >
                            <div className={`font-semibold ${selectedSpace?.id === space.id ? 'text-blue-600' : 'text-gray-700'}`}>
                              {space.spaceName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {space.userType === 'guest' ? '게스트' : space.userType === 'shareholder' ? '주주' : space.userType === 'manager' ? '매니저' : '부매니저'}
                            </div>
                          </div>
                          
                          {/* 선택 표시 */}
                          {selectedSpace?.id === space.id && (
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            
            {/* 우측: 햄버거 + 프로필 */}
            <div className="flex items-center gap-3">
              {/* 햄버거 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* 햄버거 메뉴 드롭다운 */}
                {showHamburgerMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowHamburgerMenu(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden min-w-[200px]">
                      {/* 스페이스 관리 (manager만) */}
                      {selectedSpace?.userType && canManageSpace(selectedSpace.userType) && (
                        <button
                          onClick={() => {
                            setShowHamburgerMenu(false);
                            navigate('/manage');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                        >
                          <Settings2 className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">스페이스 관리</span>
                        </button>
                      )}
                      
                      {/* 초대 코드 공유 */}
                      <button
                        onClick={() => {
                          setShowHamburgerMenu(false);
                          const spaceId = selectedSpace?.id || selectedSpace?.spaceId;
                          const inviteLink = `${window.location.origin}/join/${spaceId}`;
                          navigator.clipboard.writeText(inviteLink).then(() => {
                            setToast({ message: '초대 코드가 복사되었습니다. 원하시는 분에게 공유해주세요!', type: 'success' });
                          }).catch(() => {
                            alert(`초대 링크: ${inviteLink}`);
                          });
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                      >
                        <Share2 className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">초대 코드 공유</span>
                      </button>
                    </div>
                  </>
                )}
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
      
      {/* 플로팅 예약 추가 버튼 */}
      <button
        onClick={() => setShowReservationModal(true)}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center gap-2 text-white hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{ 
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          right: 'max(24px, env(safe-area-inset-right))'
        }}
      >
        <Plus className="w-5 h-5" />
        <span className="font-semibold">예약하기</span>
      </button>
    </div>
  );
};

export default WeeklyList;