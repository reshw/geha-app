import { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/dateUtils';

/**
 * 예약 수정 모달
 * - 입실일/아웃일을 date picker로 개별 수정
 * - 과거 날짜 선택 시 확인 요청
 */
const ReservationEditModal = ({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  existingReservations = {}
}) => {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isDayTrip, setIsDayTrip] = useState(false);
  const [showPastDateConfirm, setShowPastDateConfirm] = useState(false);
  const [pendingCheckInDate, setPendingCheckInDate] = useState('');

  // 기존 예약 정보로 초기화
  useEffect(() => {
    if (reservation && isOpen) {
      const checkIn = reservation.checkIn?.toDate?.() || reservation.checkIn;
      const checkOut = reservation.checkOut?.toDate?.() || reservation.checkOut;

      // YYYY-MM-DD 형식으로 변환
      setCheckInDate(formatDate(checkIn));
      setCheckOutDate(formatDate(checkOut));
      setIsDayTrip(reservation.isDayTrip || reservation.nights === 0);
    }
  }, [reservation, isOpen]);

  // 과거 날짜인지 확인
  const isPastDate = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  // 입실일 변경 핸들러
  const handleCheckInChange = (e) => {
    const newDate = e.target.value;

    if (isPastDate(newDate)) {
      // 과거 날짜인 경우 확인 모달 표시
      setPendingCheckInDate(newDate);
      setShowPastDateConfirm(true);
    } else {
      setCheckInDate(newDate);

      // 당일치기가 아니고 아웃일이 입실일보다 이르면 조정
      if (!isDayTrip && checkOutDate && newDate >= checkOutDate) {
        const nextDay = new Date(newDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(formatDate(nextDay));
      }
    }
  };

  // 과거 날짜 확인 후 적용
  const confirmPastDate = () => {
    setCheckInDate(pendingCheckInDate);
    setShowPastDateConfirm(false);
    setPendingCheckInDate('');

    // 당일치기가 아니고 아웃일이 입실일보다 이르면 조정
    if (!isDayTrip && checkOutDate && pendingCheckInDate >= checkOutDate) {
      const nextDay = new Date(pendingCheckInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(formatDate(nextDay));
    }
  };

  // 과거 날짜 취소
  const cancelPastDate = () => {
    setShowPastDateConfirm(false);
    setPendingCheckInDate('');
  };

  // 아웃일 변경 핸들러
  const handleCheckOutChange = (e) => {
    const newDate = e.target.value;
    setCheckOutDate(newDate);
  };

  // 당일치기 토글
  const handleDayTripToggle = (e) => {
    const checked = e.target.checked;
    setIsDayTrip(checked);

    if (checked && checkInDate) {
      // 당일치기 활성화 시 아웃일을 입실일과 동일하게
      setCheckOutDate(checkInDate);
    } else if (!checked && checkInDate) {
      // 당일치기 비활성화 시 아웃일을 입실일 다음날로
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(formatDate(nextDay));
    }
  };

  // 저장 핸들러
  const handleSave = () => {
    // 종료된 예약은 저장 불가
    if (isEnded) {
      alert('이미 종료된 예약은 수정할 수 없습니다.');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      alert('입실일과 아웃일을 모두 선택해주세요.');
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (!isDayTrip && checkIn >= checkOut) {
      alert('아웃일은 입실일보다 이후여야 합니다.');
      return;
    }

    // 박수 계산
    let nights = 0;
    if (isDayTrip) {
      nights = 0;
    } else {
      const timeDiff = checkOut - checkIn;
      nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    onConfirm({
      checkIn,
      checkOut,
      nights,
      isDayTrip
    });
  };

  if (!isOpen || !reservation) return null;

  // 현재 예약 정보
  const currentCheckIn = reservation.checkIn?.toDate?.() || reservation.checkIn;
  const currentCheckOut = reservation.checkOut?.toDate?.() || reservation.checkOut;

  // 🔒 예약 상태 확인
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const originalCheckInDate = new Date(currentCheckIn);
  originalCheckInDate.setHours(0, 0, 0, 0);

  const originalCheckOutDate = new Date(currentCheckOut);
  originalCheckOutDate.setHours(0, 0, 0, 0);

  const isStarted = originalCheckInDate < now; // 이미 시작됨
  const isEnded = originalCheckOutDate < now;  // 완전히 종료됨

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="예약 수정">
        <div className="space-y-6">
          {/* 완전히 종료된 예약 경고 */}
          {isEnded && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-900 mb-1">수정 불가</div>
                <div className="text-xs text-red-700">
                  이미 종료된 예약은 수정할 수 없습니다.
                </div>
              </div>
            </div>
          )}

          {/* 현재 예약 정보 */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-blue-900 mb-2">현재 예약</div>
            <div className="text-lg font-bold text-gray-900 mb-1">{reservation.name}</div>
            <div className="text-sm text-gray-600">
              {currentCheckIn.getMonth() + 1}/{currentCheckIn.getDate()} ~ {currentCheckOut.getMonth() + 1}/{currentCheckOut.getDate()}
              {reservation.isDayTrip || reservation.nights === 0 ? (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold">
                  당일치기
                </span>
              ) : (
                <span className="ml-2 text-gray-500">
                  ({reservation.nights}박 {reservation.nights + 1}일)
                </span>
              )}
            </div>
          </div>

          {/* 입실일 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              입실일
              {isStarted && (
                <span className="text-xs text-gray-500 font-normal">(수정 불가)</span>
              )}
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={handleCheckInChange}
              disabled={isStarted || isEnded}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              title={isStarted ? '이미 시작된 예약의 시작일은 변경할 수 없습니다' : ''}
            />
            {isStarted && (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                이미 시작된 예약의 시작일은 변경할 수 없습니다
              </div>
            )}
            {!isStarted && checkInDate && isPastDate(checkInDate) && (
              <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                과거 날짜입니다
              </div>
            )}
          </div>

          {/* 아웃일 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              아웃일
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={handleCheckOutChange}
              disabled={isDayTrip || isEnded}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {isDayTrip && (
              <div className="mt-2 text-xs text-gray-500">
                당일치기 예약은 아웃일이 입실일과 동일합니다
              </div>
            )}
          </div>

          {/* 당일치기 옵션 */}
          <div>
            <label className={`flex items-center gap-3 p-4 bg-orange-50 rounded-xl border-2 border-orange-200 ${!isEnded ? 'cursor-pointer hover:bg-orange-100 transition-colors' : 'opacity-50 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={isDayTrip}
                onChange={handleDayTripToggle}
                disabled={isEnded}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-900">당일치기 예약</span>
                <div className="text-xs text-gray-600 mt-0.5">
                  입실일과 아웃일이 동일한 예약입니다
                </div>
              </div>
            </label>
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isEnded}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </div>
      </Modal>

      {/* 과거 날짜 확인 모달 */}
      {showPastDateConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[70]" onClick={cancelPastDate} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-[71] p-6 w-[380px] max-w-[90vw]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">과거 날짜 선택</h3>
                <p className="text-sm text-gray-600 mt-0.5">과거 날짜입니다</p>
              </div>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-700 mb-2">선택한 입실일:</div>
              <div className="text-lg font-bold text-gray-900">
                {new Date(pendingCheckInDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              이 날짜가 맞나요? 계속하시겠습니까?
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={cancelPastDate}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmPastDate}
                className="px-4 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ReservationEditModal;
