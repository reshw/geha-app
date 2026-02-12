import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useReservations } from '../../hooks/useReservations';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import LoginOverlay from '../auth/LoginOverlay';
import Loading from '../common/Loading';
import { formatYearMonth, getCalendarDays, formatDate, isToday, isPastDate } from '../../utils/dateUtils';
import { WEEK_DAYS } from '../../utils/constants';
import { canReserveOnDate } from '../../utils/permissions';

const Calendar = () => {
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace, spaces } = useStore(); // spaces는 WeeklyList에서 이미 로드됨
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const { reservations, loading: reservationsLoading } = useReservations(selectedSpace?.id);

  // 스페이스 로드는 WeeklyList에서 이미 처리됨 (중복 제거)
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };
  
  const handleDateClick = (day) => {
    if (!day) return;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const userType = selectedSpace?.userType;
    
    if (!canReserveOnDate(userType, date)) {
      alert('이 날짜는 예약할 수 없습니다');
      return;
    }
    
    alert(`예약 모달 - ${formatDate(date)}`);
  };
  
  const renderReservations = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDate(date);
    const dayReservations = reservations[dateStr] || [];
    
    if (dayReservations.length === 0) return null;
    
    return (
      <div className="text-xs text-blue-600 font-medium">
        {dayReservations.length}건
      </div>
    );
  };
  
  if (!isLoggedIn) {
    return <LoginOverlay />;
  }
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {selectedSpace?.name} - {formatYearMonth(currentDate)}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 스페이스 선택 */}
      {spaces.length > 1 && (
        <div className="mb-4">
          <select 
            value={selectedSpace?.id || ''} 
            onChange={(e) => {
              const space = spaces.find(s => s.id === e.target.value);
              setSelectedSpace(space);
            }}
            className="px-4 py-2 border rounded-lg"
          >
            {spaces.map(space => (
              <option key={space.id} value={space.id}>
                {space.name} ({space.userType})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* 캘린더 */}
      {reservationsLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* 요일 헤더 */}
          {WEEK_DAYS.map((day, index) => (
            <div 
              key={day} 
              className={`text-center py-2 font-medium ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''
              }`}
            >
              {day}
            </div>
          ))}
          
          {/* 날짜 셀 */}
          {getCalendarDays(currentDate.getFullYear(), currentDate.getMonth()).map((day, index) => {
            if (!day) {
              return <div key={index} className="min-h-[100px] bg-gray-50 rounded-lg" />;
            }
            
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isPast = isPastDate(date);
            const dayOfWeek = date.getDay();
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[100px] border rounded-lg p-2 cursor-pointer relative
                  ${isPast ? 'bg-gray-50' : 'hover:bg-blue-50'}
                  ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <span className={`
                  text-sm font-medium
                  ${isPast ? 'text-gray-400' : ''}
                  ${dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : ''}
                `}>
                  {day}
                </span>
                <div className="mt-2">
                  {renderReservations(day)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Calendar;
