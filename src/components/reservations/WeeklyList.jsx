import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Check, X, Menu, Settings2, Share2, GripVertical, User, LogOut, FileText, Shield, UserCog, UserMinus, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useReservations } from '../../hooks/useReservations';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import LoginOverlay from '../auth/LoginOverlay';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import ReservationModal from './ReservationModal';
import CancelReservationModal from './CancelReservationModal';
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservationForCancel, setSelectedReservationForCancel] = useState(null);
  
  const { reservations: reservationsObj, loading: reservationsLoading, createReservation, cancelReservation } = useReservations(selectedSpace?.id, currentWeekStart);
  
  // 🆕 스페이스 로드 및 없음 처리
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const spaces = await spaceService.getUserSpaces(user.id);
        console.log('📦 사용자 스페이스 로드:', spaces);
        
        setUserSpaces(spaces);
        
        // 스페이스가 있으면 order가 0인 것 선택 (또는 첫 번째)
        if (spaces.length > 0 && !hasInitializedSpace.current) {
          const defaultSpace = spaces.find(s => s.order === 0) || spaces[0];
          setSelectedSpace(defaultSpace);
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

  // ✅ 예약 취소 확정
 const handleCancelConfirm = async (reservation) => {
   if (!cancelReservation) {
     alert('예약 취소 기능이 아직 연결되지 않았습니다.');
     return;
   }
   setIsSubmitting(true);
   try {
     await cancelReservation(reservation.id);
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
                            navigate('/space/manage');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                        >
                          <Settings2 className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">스페이스 관리</span>
                        </button>
                      )}
                      
                      {/* 공용 운영비 */}
                      <button
                        onClick={() => {
                          setShowHamburgerMenu(false);
                          navigate('/expenses');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                      >
                        <Wallet className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">공용 운영비</span>
                      </button>
                      
                      {/* 초대 코드 공유 */}
                      <button
                        onClick={async () => {
                          setShowHamburgerMenu(false);
                          const spaceId = selectedSpace?.id || selectedSpace?.spaceId;
                          console.log('🔗 초대 링크 생성:', { selectedSpace, spaceId });
                          
                          if (!spaceId) {
                            setToast({ message: '스페이스 ID를 찾을 수 없습니다', type: 'error' });
                            return;
                          }
                          
                          const inviteLink = `${window.location.origin}/join/${spaceId}`;
                          console.log('📋 복사할 링크:', inviteLink);
                          
                          // 모바일 대응: textarea를 사용한 복사
                          try {
                            if (navigator.clipboard && window.isSecureContext) {
                              // 최신 브라우저
                              await navigator.clipboard.writeText(inviteLink);
                              console.log('✅ clipboard API로 복사 성공');
                            } else {
                              // 구형 브라우저/모바일 대응
                              const textArea = document.createElement('textarea');
                              textArea.value = inviteLink;
                              textArea.style.position = 'fixed';
                              textArea.style.left = '-999999px';
                              textArea.style.top = '-999999px';
                              document.body.appendChild(textArea);
                              textArea.focus();
                              textArea.select();
                              document.execCommand('copy');
                              textArea.remove();
                              console.log('✅ execCommand로 복사 성공');
                            }
                            setToast({ message: '초대 링크가 복사되었습니다!', type: 'success' });
                          } catch (err) {
                            console.error('❌ 복사 실패:', err);
                            // 복사 실패 시 링크 직접 표시
                            setToast({ message: '복사 실패', type: 'error' });
                            setTimeout(() => {
                              alert(`이 링크를 복사하세요:\n${inviteLink}`);
                            }, 100);
                          }
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
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const isCurrentDay = isToday(date);
          
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
            if (memberTypes.includes(r.type)) {
              acc.weekdayCount++;
            } else {
              acc.guestCount++;
            }
            return acc;
          }, { weekdayCount: 0, guestCount: 0 });
          
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
                <div className="flex items-center gap-3">
                  {allReservations.length > 0 ? (
                    <>
                      <div className="text-sm text-gray-600">
                        주주 {stats.weekdayCount} · 게스트 {stats.guestCount}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {allReservations.length}
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
                  // 게스트: 본인 프로필만 표시 (주주와 동일한 방식)
                  <div className="pt-3">
                    {myReservations.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {myReservations.map((reservation) => {
                          const profile = profiles[reservation.userId];
                          const isMine = String(reservation.userId) === String(user.id);
                          
                          return (
                            <div key={reservation.id} className="relative group">
                              {profile?.profileImage ? (
                                <img
                                  src={profile.profileImage}
                                  alt={reservation.name}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500 cursor-pointer"
          onClick={() => {
            if (!isMine) return;
            setSelectedReservationForCancel(reservation);
            setShowCancelModal(true);}}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-blue-500 bg-blue-500">
                                  {reservation.name?.[0]}
                                </div>
                              )}
                              {/* ✅ 내 예약이면 X 배지 */}
                              {isMine && (
                                <button
                                  onClick={() => {
                                    setSelectedReservationForCancel(reservation);
                                    setShowCancelModal(true);
                                  }}
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600"
                                  aria-label="예약 취소"
                                >
                                  ×
                                </button>
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
                    
                    {/* 다른 예약자 정보 */}
                    {allReservations.length > myReservations.length && (
                      <div className="mt-3 pt-3 text-xs text-gray-500 text-center border-t border-gray-200">
                        다른 {allReservations.length - myReservations.length}명의 예약자 정보는 비공개입니다
                      </div>
                    )}
                  </div>
                ) : (
                  // 주주: 전체 예약 (프로필 사진 가로 나열)
                  allReservations.length > 0 ? (
                    <div className="pt-3 space-y-3">
                      {/* 프로필 사진 가로 나열 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {allReservations.map((reservation) => {
                          const profile = profiles[reservation.userId];
                          const memberTypes = ['shareholder', 'manager', 'vice-manager'];
                          const isMember = memberTypes.includes(reservation.type);
                          const isMine = String(reservation.userId) === String(user.id);
                          
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
                                  onClick={() => {
                                    if (!isMine) return;
                                    setSelectedReservationForCancel(reservation);
                                    setShowCancelModal(true);
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
                              {/* ✅ 내 예약이면 X 배지 */}
                              {isMine && (
                                <button
                                  onClick={() => {
                                    setSelectedReservationForCancel(reservation);
                                    setShowCancelModal(true);
                                  }}
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600"
                                  aria-label="예약 취소"
                                >
                                  ×
                                </button>
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
        })}
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
    </div>
  );
};

export default WeeklyList;