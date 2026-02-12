// src/components/reservations/MonthlyCalendarView.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Mars, Venus } from 'lucide-react';

const MonthlyCalendarView = ({
  dailyStats,
  myReservations,
  user,
  onDateClick,
  selectedSpace,
  onMonthChange
}) => {
  // 현재 보고 있는 월 (기본값: 이번 달)
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 월 변경 시 부모에게 알림 (onMonthChange는 의존성에서 제외하여 무한 루프 방지)
  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // 이전 달로 이동
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 다음 달로 이동
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 이번 달로 이동
  const thisMonth = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // 달력 그리드 생성 (6주 * 7일 = 42칸)
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
    const daysInMonth = lastDay.getDate();

    const days = [];

    // 이전 달의 날짜들 (빈 칸)
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // 다음 달의 날짜들 (6주를 채우기 위해)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="pb-36 pt-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* 월 네비게이션 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {year}년 {month + 1}월
              </h2>
            </div>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95"
              aria-label="다음 달"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <div className="mt-2 text-center">
            <button
              onClick={thisMonth}
              className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              이번 달
            </button>
          </div>
        </div>

        {/* 달력 그리드 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={`py-3 text-center font-bold text-sm ${
                  index === 0 ? 'text-red-200' : index === 6 ? 'text-blue-200' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
            {calendarDays.map((dayInfo, index) => {
              const dateKey = formatDateKey(dayInfo.date);
              const stats = dailyStats[dateKey] || { totalCount: 0, maleCount: 0, femaleCount: 0, guestCount: 0 };
              const myReservation = myReservations[dateKey]?.[0]; // 내 예약 (있으면 배열의 첫 번째)
              const hasReservations = stats.totalCount > 0;
              const isToday = dayInfo.date.getTime() === today.getTime();
              const dayOfWeek = dayInfo.date.getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 relative ${
                    !dayInfo.isCurrentMonth ? 'bg-gray-50' : myReservation ? 'bg-green-50/40 hover:bg-green-50/60' : 'bg-white hover:bg-blue-50'
                  } ${
                    hasReservations && dayInfo.isCurrentMonth
                      ? 'cursor-pointer'
                      : ''
                  } ${myReservation ? 'ring-1 ring-green-400/40 ring-inset' : ''} transition-colors`}
                  onClick={() => {
                    if (hasReservations && dayInfo.isCurrentMonth) {
                      onDateClick(dayInfo.date);
                    }
                  }}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        !dayInfo.isCurrentMonth
                          ? 'text-gray-300'
                          : isToday
                          ? 'w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center'
                          : isSunday
                          ? 'text-red-500'
                          : isSaturday
                          ? 'text-blue-500'
                          : 'text-gray-700'
                      }`}
                    >
                      {dayInfo.date.getDate()}
                    </span>
                  </div>

                  {/* 예약자 정보 표시 */}
                  {dayInfo.isCurrentMonth && hasReservations && (
                    <div className="space-y-0.5 text-xs">
                      {/* 총 인원수 */}
                      <div className={`font-bold ${myReservation ? 'text-green-600' : 'text-blue-600'}`}>
                        {stats.totalCount}명
                      </div>

                      {/* 성별 통계 (아이콘) - 세로 배치 */}
                      <div className="flex flex-col gap-0.5">
                        {stats.maleCount > 0 && (
                          <div className="flex items-center gap-0.5 text-blue-600">
                            <Mars className="w-3 h-3" />
                            <span>{stats.maleCount}</span>
                          </div>
                        )}
                        {stats.femaleCount > 0 && (
                          <div className="flex items-center gap-0.5 text-pink-600">
                            <Venus className="w-3 h-3" />
                            <span>{stats.femaleCount}</span>
                          </div>
                        )}
                      </div>

                      {/* 게스트 수 */}
                      {stats.guestCount > 0 && (
                        <div className="text-orange-600">
                          게{stats.guestCount}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 내 예약 표시 (우측 상단 인디케이터) */}
                  {myReservation && dayInfo.isCurrentMonth && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"
                         title="내 예약" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendarView;
