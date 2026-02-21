import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDate, formatWeekDay, getWeekDates } from '../../utils/dateUtils';
import HostSearchInput from './HostSearchInput';

const ReservationModal = ({ isOpen, onClose, onConfirm, spaceId, existingReservations = {}, user, selectedSpace }) => {
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
  const [selectedHost, setSelectedHost] = useState(null);
  const [isDayTrip, setIsDayTrip] = useState(false);
  const [memo, setMemo] = useState('');

  // 카카오 로그인 정보
  const userName = user?.displayName || user?.name || '사용자';
  
  // 디버깅: selectedSpace 확인
  useEffect(() => {
    console.log('🔍 [ReservationModal] selectedSpace:', selectedSpace);
    console.log('🔍 [ReservationModal] selectedSpace?.userType:', selectedSpace?.userType);
  }, [selectedSpace]);
  
  const memberType = selectedSpace?.userType || 'guest';
  
  // 멤버 타입별 라벨 (주주, 매니저, 부매니저는 "주주"로 표시)
  const getMemberTypeLabel = (type) => {
    const memberTypes = ['shareholder', 'manager', 'vice-manager'];
    return memberTypes.includes(type) ? '주주' : '게스트';
  };
  
  const memberTypeLabel = getMemberTypeLabel(memberType);
  const isGuest = memberType === 'guest';
  
  useEffect(() => {
    console.log('🔍 [ReservationModal] memberType:', memberType);
    console.log('🔍 [ReservationModal] memberTypeLabel:', memberTypeLabel);
    console.log('🔍 [ReservationModal] isGuest:', isGuest);
  }, [memberType, memberTypeLabel, isGuest]);

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

    // 이미 예약된 날짜 확인
    const dateStr = formatDate(date);
    const dayReservations = existingReservations[dateStr] || [];
    
    // 예약이 10개 이상이면 비활성화
    return dayReservations.length >= 10;
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
      setIsDayTrip(false); // 새로 선택 시 당일치기 체크 해제
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

  // ReservationModal.jsx의 handleConfirm 함수
  const handleConfirm = () => {
  // 당일치기 체크 시 자동으로 checkOut 설정
  const finalCheckOut = isDayTrip ? checkIn : checkOut;

  if (!checkIn) {
    alert('체크인 날짜를 선택해주세요.');
    return;
  }

  if (!isDayTrip && !checkOut) {
    alert('체크아웃 날짜를 선택하거나 당일치기를 선택해주세요.');
    return;
  }

  if (isGuest && !selectedHost) {
    alert('초대해주신 주주님을 선택해주세요.');
    return;
  }

  const nights = isDayTrip ? 0 : getNights();

  console.log('✅ [ReservationModal] 예약 확정 - type:', memberType);
  console.log('✅ [ReservationModal] isDayTrip:', isDayTrip);
  console.log('✅ [ReservationModal] nights:', nights);
  console.log('✅ [ReservationModal] selectedHost:', selectedHost);
  console.log('✅ [ReservationModal] 계좌정보:', {
    accountBank: selectedSpace?.accountBank,
    accountNumber: selectedSpace?.accountNumber,
    accountHolder: selectedSpace?.accountHolder,
  });

  onConfirm({
    userId: user?.id,
    checkIn,
    checkOut: finalCheckOut,
    name: userName,
    type: memberType,
    nights: nights,
    phone: user?.phoneNumber || '',
    hostId: selectedHost?.id || null,
    hostDisplayName: selectedHost?.displayName || null,
    spaceName: selectedSpace?.name,
    memo: memo.trim(),
    // 계좌 정보 추가
    accountBank: selectedSpace?.accountBank,
    accountNumber: selectedSpace?.accountNumber,
    accountHolder: selectedSpace?.accountHolder,
  });

  // 초기화
  setCheckIn(null);
  setCheckOut(null);
  setSelectedHost(null);
  setIsDayTrip(false);
  setMemo('');
};

  const handleClose = () => {
    setCheckIn(null);
    setCheckOut(null);
    setSelectedHost(null);
    setIsDayTrip(false);
    setMemo('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="예약하기">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">체크인/체크아웃 날짜를 선택하세요</p>

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
                    setCheckOut(null); // 당일치기 체크 시 checkOut 초기화
                  }
                }}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="font-semibold text-gray-900">당일치기로 예약</span>
            </label>
          </div>
        )}

        {/* 예약 정보 표시 */}
        {checkIn && (checkOut || isDayTrip) && (
          <div className="space-y-3 pt-2 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 (카카오 로그인)
              </label>
              <input
                type="text"
                value={userName}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed font-semibold"
                title="카카오 로그인 정보로 자동 입력됩니다"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예약 유형
              </label>
              <input
                type="text"
                value={memberTypeLabel}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed font-semibold"
                title="사용자 권한에 따라 자동으로 결정됩니다"
              />
              <p className="text-xs text-gray-500 mt-1">
                {getMemberTypeLabel(memberType) === '주주' ? '주주로 예약됩니다 (무료)' : '게스트로 예약됩니다 (유료)'}
              </p>
            </div>

            {/* 게스트인 경우 초대자 선택 필수 */}
            {isGuest && (
              <HostSearchInput
                spaceId={spaceId}
                onSelect={setSelectedHost}
                selectedHost={selectedHost}
              />
            )}

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모 <span className="text-gray-400 font-normal">(선택사항)</span>
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 늦은 도착 예정, 특별 요청사항 등"
                rows={2}
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {memo.length > 0 && (
                <p className="text-xs text-gray-400 text-right mt-1">{memo.length}/200</p>
              )}
            </div>
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
            disabled={!checkIn || (!isDayTrip && !checkOut) || (isGuest && !selectedHost)}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            예약하기
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReservationModal;