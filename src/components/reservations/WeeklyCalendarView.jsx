// src/components/reservations/WeeklyCalendarView.jsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight, UserRound, Mars, Venus } from 'lucide-react';
import { formatDate, isToday } from '../../utils/dateUtils';

const WeeklyCalendarView = ({
  currentWeekStart,
  reservationsObj,
  profiles,
  user,
  onDateClick,
  onPrevWeek,
  onNextWeek,
  onThisWeek
}) => {
  // 이전주, 현재주, 다음주 날짜 배열 생성 (총 21일)
  const getAllWeeksDates = () => {
    const allDates = [];

    // 이전 주
    for (let i = -7; i < 0; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      allDates.push({ date, isPrevWeek: true, isNextWeek: false });
    }

    // 현재 주
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      allDates.push({ date, isPrevWeek: false, isNextWeek: false });
    }

    // 다음 주
    for (let i = 7; i < 14; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      allDates.push({ date, isPrevWeek: false, isNextWeek: true });
    }

    return allDates;
  };

  const allWeeksDates = getAllWeeksDates();
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  // 주차 범위 표시
  const weekRange = `${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()} - ${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1}/${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}`;

  // 주차별로 날짜를 그룹화
  const prevWeekDates = allWeeksDates.slice(0, 7);
  const currentWeekDates = allWeeksDates.slice(7, 14);
  const nextWeekDates = allWeeksDates.slice(14, 21);

  // 주차 정보 계산
  const getPrevWeekRange = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  const getNextWeekRange = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  // 날짜 셀 렌더링 함수
  const renderDateCell = ({ date, isPrevWeek, isNextWeek }, index) => {
    const dateStr = formatDate(date);
    const isCurrentDay = isToday(date);
    const dateReservations = reservationsObj[dateStr] || [];
    const isCurrentWeek = !isPrevWeek && !isNextWeek;

    // 남녀 통계
    const maleCount = dateReservations.filter(r => profiles[r.userId]?.gender === 'male').length;
    const femaleCount = dateReservations.filter(r => profiles[r.userId]?.gender === 'female').length;

    // 주주/게스트 통계
    const memberTypes = ['shareholder', 'manager', 'vice-manager'];
    const shareholderCount = dateReservations.filter(r => memberTypes.includes(r.type)).length;
    const guestCount = dateReservations.length - shareholderCount;

    // 내 예약 여부
    const hasMyReservation = dateReservations.some(r => String(r.userId) === String(user.id));

    return (
      <button
        key={dateStr}
        onClick={() => dateReservations.length > 0 && onDateClick(date, dateReservations)}
        className={`
          min-h-[90px] p-2 flex flex-col items-center justify-start
          transition-colors relative
          ${isCurrentDay ? 'bg-blue-50' :
            isCurrentWeek ? 'bg-white hover:bg-gray-50' :
            'bg-gray-50 hover:bg-gray-100'}
          ${dateReservations.length > 0 ? 'cursor-pointer' : 'cursor-default'}
        `}
      >
        {/* 날짜 */}
        <div className={`
          text-sm font-semibold mb-1
          ${isCurrentDay ? 'text-blue-600' :
            index % 7 === 5 ? 'text-blue-500' :
            index % 7 === 6 ? 'text-red-500' :
            'text-gray-700'}
        `}>
          {date.getDate()}
        </div>

        {/* 오늘 표시 */}
        {isCurrentDay && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
        )}

        {/* 내 예약 표시 */}
        {hasMyReservation && (
          <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full"></div>
        )}

        {/* 예약 정보 */}
        {dateReservations.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
            {/* 총 인원 */}
            <div className="flex items-center gap-1">
              <UserRound className="w-3 h-3 text-gray-400" />
              <span className="text-lg font-bold text-gray-900">
                {dateReservations.length}
              </span>
            </div>

            {/* 남녀 구분 */}
            <div className="flex items-center gap-1.5 text-xs">
              {maleCount > 0 && (
                <span className="flex items-center gap-0.5 text-blue-600">
                  <Mars className="w-3 h-3" />
                  {maleCount}
                </span>
              )}
              {femaleCount > 0 && (
                <span className="flex items-center gap-0.5 text-pink-600">
                  <Venus className="w-3 h-3" />
                  {femaleCount}
                </span>
              )}
            </div>

            {/* 주주/게스트 구분 */}
            <div className="text-[10px] text-gray-500 leading-tight">
              주{shareholderCount}/게{guestCount}
            </div>
          </div>
        ) : (
          <div className="flex-1"></div>
        )}
      </button>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 주간 네비게이션 */}
      <div className="flex items-center justify-center gap-2 px-4 pb-4">
        <button
          onClick={onPrevWeek}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
        <div className="px-4 py-2 rounded-full bg-white text-blue-600 font-semibold min-w-[140px] text-center">
          📅 {weekRange}
        </div>
        <button
          onClick={onNextWeek}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-black" />
        </button>
        <button
          onClick={onThisWeek}
          className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-semibold text-white transition-colors"
        >
          오늘
        </button>
      </div>

      {/* 달력 그리드 - 주차별 분리 */}
      <div className="space-y-3 mx-4">
        {/* 지난 주 */}
        <div className="bg-gray-50 rounded-xl shadow overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200">
            <button
              onClick={onPrevWeek}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs font-semibold text-gray-600">
              지난 주 ({getPrevWeekRange()})
            </span>
            <div className="w-6"></div>
          </div>
          <div className="grid grid-cols-7 bg-white border-b border-gray-200">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-semibold ${
                  index === 5 ? 'text-blue-600' :
                  index === 6 ? 'text-red-600' :
                  'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y bg-white">
            {prevWeekDates.map((dateInfo, idx) => renderDateCell(dateInfo, idx))}
          </div>
        </div>

        {/* 이번 주 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-300">
          <div className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5">
            <span className="text-sm font-bold text-white">
              이번 주 ({weekRange})
            </span>
          </div>
          <div className="grid grid-cols-7 bg-blue-50 border-b border-blue-200">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-bold ${
                  index === 5 ? 'text-blue-600' :
                  index === 6 ? 'text-red-600' :
                  'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y">
            {currentWeekDates.map((dateInfo, idx) => renderDateCell(dateInfo, idx + 7))}
          </div>
        </div>

        {/* 다음 주 */}
        <div className="bg-gray-50 rounded-xl shadow overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200">
            <div className="w-6"></div>
            <span className="text-xs font-semibold text-gray-600">
              다음 주 ({getNextWeekRange()})
            </span>
            <button
              onClick={onNextWeek}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 bg-white border-b border-gray-200">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-semibold ${
                  index === 5 ? 'text-blue-600' :
                  index === 6 ? 'text-red-600' :
                  'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y bg-white">
            {nextWeekDates.map((dateInfo, idx) => renderDateCell(dateInfo, idx + 14))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendarView;
