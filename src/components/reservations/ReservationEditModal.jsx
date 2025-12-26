import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDate, formatWeekDay, getWeekDates } from '../../utils/dateUtils';

/**
 * 예약 수정 모달
 * - 기존 예약의 체크인/체크아웃 날짜 변경
 */
const ReservationEditModal = ({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  existingReservations = {}
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [isDayTrip, setIsDayTrip] = useState(false);

  // 기존 예약 정보로 초기화
  useEffect(() => {
    console.log('🔍 [ReservationEditModal] 초기화:', {
      reservation,
      isOpen
    });

    if (reservation && isOpen) {
      const checkInDate = reservation.checkIn?.toDate?.() || reservation.checkIn;
      const checkOutDate = reservation.checkOut?.toDate?.() || reservation.checkOut;

      console.log('📅 [ReservationEditModal] 날짜 설정:', {
        checkInDate,
        checkOutDate,
        isDayTrip: reservation.isDayTrip || reservation.nights === 0
      });

      setCheckIn(checkInDate);
      setCheckOut(checkOutDate);
      setIsDayTrip(reservation.isDayTrip || reservation.nights === 0);

      // 주간 시작일을 체크인 날짜가 포함된 주로 설정
      const day = checkInDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(checkInDate);
      monday.setDate(checkInDate.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      setCurrentWeekStart(monday);
    }
  }, [reservation, isOpen]);

  const weekDates = getWeekDates(currentWeekStart);

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

  const isDateDisabled = (date) => {
    // 과거 날짜 비활성화
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // 이미 예약된 날짜 확인 (본인 예약 제외)
    const dateStr = formatDate(date);
    const dayReservations = existingReservations[dateStr] || [];

    // 본인 예약 제외한 예약 개수 확인
    const otherReservations = dayReservations.filter(r => r.id !== reservation?.id);
    return otherReservations.length >= 10;
  };

  const isDateInRange = (date) => {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  };

  const isDateSelected = (date) => {
    if (!checkIn) return false;
    if (checkIn && date.getTime() === checkIn.getTime()) return true;
    if (checkOut && date.getTime() === checkOut.getTime()) return true;
    return false;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // 첫 선택 or 재선택
      setCheckIn(date);
      setCheckOut(null);
      setIsDayTrip(false);
    } else if (isDayTrip) {
      // 당일치기 모드에서는 날짜 변경만 가능
      setCheckIn(date);
      setCheckOut(null);
    } else {
      // 두 번째 선택 (일반 숙박)
      if (date.getTime() === checkIn.getTime()) {
        // 같은 날짜 선택 시 체크아웃 설정 (당일치기로 간주)
        setCheckOut(date);
        setIsDayTrip(true);
        return;
      }
      if (date > checkIn) {
        // 체크인과 체크아웃 사이에 예약 불가 날짜가 있는지 확인
        const hasDisabledInRange = checkDateRangeValid(checkIn, date);
        if (!hasDisabledInRange) {
          alert('선택한 기간 내에 예약 불가능한 날짜가 있습니다.');
          return;
        }
        setCheckOut(date);
      } else {
        // 더 이른 날짜 선택 → 체크아웃을 체크인으로, 새 날짜를 체크인으로
        setCheckOut(checkIn);
        setCheckIn(date);
      }
    }
  };

  const checkDateRangeValid = (start, end) => {
    let current = new Date(start);
    current.setDate(current.getDate() + 1);

    while (current < end) {
      if (isDateDisabled(current)) {
        return false;
      }
      current.setDate(current.getDate() + 1);
    }
    return true;
  };

  const getNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleConfirm = () => {
    const finalCheckOut = isDayTrip ? checkIn : checkOut;

    if (!checkIn) {
      alert('체크인 날짜를 선택해주세요.');
      return;
    }

    if (!isDayTrip && !checkOut) {
      alert('체크아웃 날짜를 선택하거나 당일치기를 선택해주세요.');
      return;
    }

    const nights = isDayTrip ? 0 : getNights();

    onConfirm({
      checkIn,
      checkOut: finalCheckOut,
      nights: nights,
      isDayTrip: nights === 0
    });

    // 초기화
    setCheckIn(null);
    setCheckOut(null);
    setIsDayTrip(false);
  };

  const handleClose = () => {
    setCheckIn(null);
    setCheckOut(null);
    setIsDayTrip(false);
    onClose();
  };

  if (!reservation) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="예약 수정">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">변경할 체크인/체크아웃 날짜를 선택하세요</p>

        {/* 주 네비게이션 */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <button onClick={prevWeek} className="p-2 hover:bg-gray-200 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-blue-600" />
          </button>
          <span className="font-semibold text-gray-700">
            {currentWeekStart.getFullYear()}년 {currentWeekStart.getMonth() + 1}월 {Math.ceil(currentWeekStart.getDate() / 7)}주
          </span>
          <button onClick={nextWeek} className="p-2 hover:bg-gray-200 rounded-lg">
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        {/* 요일 레이블 */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500">
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-blue-500">토</div>
          <div className="text-red-500">일</div>
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const disabled = isDateDisabled(date);
            const selected = isDateSelected(date);
            const inRange = isDateInRange(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={disabled}
                className={`
                  aspect-square rounded-xl text-base font-medium transition-all
                  ${disabled ? 'bg-red-50 text-red-300 cursor-not-allowed' : 'bg-gray-50 text-gray-700 hover:bg-gray-200 hover:scale-105'}
                  ${selected ? 'bg-blue-600 text-white scale-110 shadow-lg' : ''}
                  ${inRange ? 'bg-blue-100 text-blue-700' : ''}
                  ${isToday && !selected ? 'ring-2 ring-blue-600' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {/* 선택 정보 */}
        {checkIn && (
          <div className="space-y-3">
            <div className="bg-blue-50 border-2 border-blue-600 rounded-xl p-4 text-center">
              <div className="text-xs text-blue-600 mb-1">선택한 날짜</div>
              <div className="text-lg font-bold text-blue-900">
                {checkIn.getMonth() + 1}/{checkIn.getDate()}
                {!isDayTrip && checkOut && ` ~ ${checkOut.getMonth() + 1}/${checkOut.getDate()}`}
                {!isDayTrip && !checkOut && ' (체크아웃 선택)'}
              </div>
              {!isDayTrip && checkOut && (
                <div className="text-sm text-blue-600 mt-1">
                  {getNights()}박 {getNights() + 1}일
                </div>
              )}
              {isDayTrip && (
                <div className="text-sm text-blue-600 mt-1">
                  당일치기
                </div>
              )}
            </div>

            {/* 당일치기 체크박스 */}
            <label className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-xl cursor-pointer border-2 border-orange-200 hover:bg-orange-100 transition-colors">
              <input
                type="checkbox"
                checked={isDayTrip}
                onChange={(e) => {
                  setIsDayTrip(e.target.checked);
                  if (e.target.checked) {
                    setCheckOut(null);
                  }
                }}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="font-semibold text-gray-900">당일치기로 예약</span>
            </label>
          </div>
        )}

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            onClick={handleClose}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!checkIn || (!isDayTrip && !checkOut)}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            수정 완료
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReservationEditModal;
