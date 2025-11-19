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
import notificationService from '../../services/notificationService';
import { formatDate, formatWeekDay, getWeekDates, isToday } from '../../utils/dateUtils';

// 토스트 알림 컴포넌트
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '16px 24px',
        borderRadius: '12px',
        background: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '15px',
        fontWeight: '600',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      {type === 'success' ? (
        <Check className="w-5 h-5" />
      ) : (
        <X className="w-5 h-5" />
      )}
      {message}
      <style>{`
        @keyframes slideDown {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// 로딩 오버레이 컴포넌트
const LoadingOverlay = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 9998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <div style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>
        예약 처리 중...
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
  
  const getDateReservations = (date) => {
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
      console.log('🔵 예약 시작');
      console.log('user:', user);
      console.log('reservationData:', reservationData);
      console.log('selectedSpace:', selectedSpace);
      
      const dataToSave = {
        userId: user.id,
        name: reservationData.name,
        type: reservationData.type,
        checkIn: reservationData.checkIn,
        checkOut: reservationData.checkOut,
        nights: reservationData.nights,
        phone: user.phoneNumber || '',
        memo: ''
      };
      
      console.log('💾 저장할 데이터:', dataToSave);
      
      // Firebase에 저장
      const savedReservation = await createReservation(dataToSave);
      
      console.log('✅ 예약 완료!');
      
      // 알림 발송 (비동기, 실패해도 예약은 유지)
      try {
        // 게스트 예약일 때만 알림 발송 (주주는 알림 불필요)
        if (reservationData.type === 'guest') {
          const notificationData = {
            name: reservationData.name,
            phone: user.phoneNumber || '',
            checkIn: reservationData.checkIn,
            checkOut: reservationData.checkOut,
            gender: user.gender,
            birthYear: user.birthYear,
            hostDisplayName: user.name,
            spaceName: selectedSpace?.name || '조강308호',
            memo: reservationData.memo || ''
          };
          
          notificationService.sendReservationConfirm(notificationData, {
            alimtalkEnabled: true,
            managers: []
          })
            .then(results => {
              console.log('📬 알림 발송 결과:', results);
              if (results.alimtalk?.success) {
                console.log('✅ 알림톡 발송 성공');
              }
            })
            .catch(err => {
              console.warn('알림 발송 실패 (예약은 완료됨):', err);
            });
        } else {
          console.log('ℹ️ 주주 예약 - 알림 발송 스킵');
        }
      } catch (notifError) {
        console.warn('알림 발송 중 에러 (예약은 완료됨):', notifError);
      }
      
      setShowReservationModal(false);
      setToast({ message: '예약이 완료되었습니다! 🎉', type: 'success' });
    } catch (error) {
      console.error('❌ 예약 실패 상세:', error);
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
      setToast({ message: `예약 실패: ${error.message}`, type: 'error' });
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
  
  // 가입한 방이 없을 때
  if (userSpaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            아직 가입한 방이 없습니다
          </h2>
          <p className="text-gray-600 mb-8">
            방 코드를 입력하여 게스트하우스에 가입하세요
          </p>
          <button
            onClick={() => window.location.href = '/join'}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-700 transition-colors"
          >
            방 가입하기
          </button>
        </div>
      </div>
    );
  }

  if (reservationsLoading) {
    return <Loading />;
  }
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  const weekStart = currentWeekStart;
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRange = `${weekStart.getFullYear()}.${String(weekStart.getMonth() + 1).padStart(2, '0')}.${String(weekStart.getDate()).padStart(2, '0')} ~ ${String(weekEnd.getMonth() + 1).padStart(2, '0')}.${String(weekEnd.getDate()).padStart(2, '0')}`;
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '720px',
        background: 'var(--bg)',
        minHeight: '100vh'
      }}>
        {/* Sticky 헤더 */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.98), rgba(37, 99, 235, 0.95))',
          backdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              letterSpacing: '.2px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff'
            }}>
              {selectedSpace?.spaceName || selectedSpace?.name || '예약 관리'} ▾
            </div>
            <button
              onClick={() => setShowDatePicker(true)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid rgba(255,255,255,.08)',
                background: 'rgba(255,255,255,.04)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            {user && (
              user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#ddd',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>
                  {user.name?.[0] || '?'}
                </div>
              )
            )}
          </div>
          
          {/* 주간 네비게이션 */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '10px 12px 12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={prevWeek}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div style={{
              height: '36px',
              padding: '0 12px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#fff',
              color: 'var(--brand)',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => setShowDatePicker(true)}>
              <span>📅</span>
              <span style={{ fontWeight: '600' }}>{weekRange}</span>
            </div>
            <button
              onClick={nextWeek}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={thisWeek}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              오늘
            </button>
          </div>
          
          {/* 스페이스 선택 */}
          {userSpaces.length > 1 && (
            <div style={{ padding: '0 12px 10px' }}>
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
        
        {/* 섹션 라벨 */}
        <div style={{
          padding: '4px 14px',
          color: 'var(--muted)',
          fontSize: '13px'
        }}>
          이번주 예약 현황
        </div>
        
        {/* 날짜별 카드 리스트 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '0 12px 80px'
        }}>
          {reservationsLoading ? (
            <Loading />
          ) : (
            weekDates.map((date, index) => {
              const dateReservations = getDateReservations(date);
              const stats = getReservationStats(dateReservations);
              const isCurrentDay = isToday(date);
              
              return (
                <details
                  key={index}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    border: isCurrentDay 
                      ? '2px solid var(--brand)' 
                      : '1px solid #e2e8f0',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  open={isCurrentDay}
                  onToggle={(e) => {
                    // 열림/닫힘 상태에 따라 배경색 변경
                    if (e.target.open) {
                      e.target.style.background = 'rgba(37, 99, 235, 0.05)';
                    } else {
                      e.target.style.background = 'var(--surface)';
                    }
                  }}
                >
                  <summary
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      minWidth: '120px',
                      fontWeight: '800',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {isCurrentDay && <span style={{ fontSize: '12px' }}>📍</span>}
                      {date.getMonth() + 1}월 {date.getDate()}일
                      <span style={{
                        marginLeft: '4px',
                        fontSize: '13px',
                        color: formatWeekDay(date) === '일' ? '#ef4444' :
                               formatWeekDay(date) === '토' ? '#3b82f6' :
                               'var(--muted)'
                      }}>
                        ({formatWeekDay(date)})
                      </span>
                    </div>
                    <div style={{
                      color: 'var(--muted)',
                      fontSize: '13px'
                    }}>
                      주주 {stats.weekdayCount} · 게스트 {stats.guestCount}
                    </div>
                    <div style={{
                      marginLeft: 'auto',
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        lineHeight: '1'
                      }}>
                        {stats.total}명
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        marginTop: '4px',
                        justifyContent: 'flex-end'
                      }}>
                        {stats.total === 0 ? (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,.06)',
                            color: 'var(--muted)',
                            border: '1px solid rgba(255,255,255,.08)'
                          }}>
                            예약 없음
                          </span>
                        ) : stats.total <= 2 ? (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            background: 'rgba(22,163,74,.12)',
                            color: '#a7f3d0',
                            border: '1px solid rgba(22,163,74,.24)'
                          }}>
                            여유
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            background: 'rgba(217,119,6,.12)',
                            color: '#fed7aa',
                            border: '1px solid rgba(217,119,6,.24)'
                          }}>
                            예약 많음
                          </span>
                        )}
                      </div>
                    </div>
                  </summary>
                  
                  {/* 카드 상세 */}
                  <div style={{
                    borderTop: '1px dashed rgba(255,255,255,.12)',
                    padding: '12px 16px 16px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,.02), transparent)'
                  }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,.03)',
                        border: '1px solid rgba(255,255,255,.06)'
                      }}>
                        <div style={{ color: 'var(--muted)' }}>주주</div>
                        <div style={{ fontWeight: '800' }}>
                          <strong style={{ fontSize: '16px' }}>{stats.weekdayCount}</strong> 명
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,.03)',
                        border: '1px solid rgba(255,255,255,.06)'
                      }}>
                        <div style={{ color: 'var(--muted)' }}>게스트</div>
                        <div style={{ fontWeight: '800' }}>
                          <strong style={{ fontSize: '16px' }}>{stats.guestCount}</strong> 명
                        </div>
                      </div>
                      <div
                        onClick={() => handleDateClick(date, dateReservations)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,.03)',
                          border: '1px solid rgba(255,255,255,.06)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ color: 'var(--muted)' }}>
                          {dateReservations.length > 0 ? '상세 보기' : '예약 추가'}
                        </div>
                        <div style={{
                          fontWeight: '700',
                          textDecoration: 'underline',
                          color: 'var(--brand)'
                        }}>
                          {dateReservations.length > 0 ? '클릭하여 상세보기' : '예약 만들기'}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              );
            })
          )}
        </div>
      </div>
      
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setShowReservationModal(true)}
        style={{
          position: 'fixed',
          right: '18px',
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--brand)',
          color: 'white',
          boxShadow: 'var(--shadow)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px'
        }}
        aria-label="새 예약 추가"
      >
        <Plus className="w-6 h-6" />
      </button>
      
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
      
      {/* 예약 상세보기 모달 */}
      {selectedDateDetail && (
        <Modal 
          isOpen={showDetailModal} 
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDateDetail(null);
          }}
          title={`${selectedDateDetail.date.getMonth() + 1}월 ${selectedDateDetail.date.getDate()}일 예약 목록`}
        >
          <div className="space-y-2">
            {selectedDateDetail.reservations.map((reservation) => {
              const displayName = reservation.name || profiles[reservation.userId]?.name || '이름없음';
              const memberTypes = ['shareholder', 'manager', 'vice-manager'];
              const isMember = memberTypes.includes(reservation.type);
              
              return (
                <div
                  key={`${reservation.id}-${reservation.checkIn}`}
                  className={`p-4 rounded-lg border-2 ${
                    isMember ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{displayName}</div>
                      <div className="text-sm text-gray-600">
                        {isMember ? '주주' : '게스트'}
                      </div>
                    </div>
                    {reservation.isCheckIn && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        체크인
                      </span>
                    )}
                  </div>
                  {reservation.memo && (
                    <p className="text-sm text-gray-600 mt-2">{reservation.memo}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
      
      {/* 토스트 알림 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* 로딩 오버레이 */}
      {isSubmitting && <LoadingOverlay />}
    </div>
  );
};

export default WeeklyList;