import { X, Edit, Trash2 } from 'lucide-react';

/**
 * 예약 관리 모달
 * - 프로필 클릭 시 표시
 * - 예약 수정 / 예약 취소
 */
const ReservationManageModal = ({
  isOpen,
  onClose,
  reservation,
  currentDateStr,
  onEdit,
  onCancel
}) => {
  if (!isOpen || !reservation) return null;

  // dateStr을 Date 객체로 파싱 (표시용)
  const displayDate = currentDateStr ? new Date(currentDateStr) : new Date();

  const handleEdit = () => {
    onEdit(reservation);
    // onClose()는 WeeklyList의 onEdit 핸들러에서 처리
  };

  const handleCancel = () => {
    onCancel(reservation);
    onClose();
  };

  // 예약 날짜 정보
  const checkInDate = reservation.checkIn?.toDate?.() || reservation.checkIn;
  const checkOutDate = reservation.checkOut?.toDate?.() || reservation.checkOut;
  const isCheckIn = checkInDate.toDateString() === displayDate.toDateString();
  const isCheckOut = checkOutDate.toDateString() === displayDate.toDateString();
  const isDayTrip = reservation.isDayTrip || reservation.nights === 0;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                   bg-white rounded-2xl shadow-2xl z-[61] p-6 w-[440px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900">예약 관리</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 예약 정보 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                {reservation.name}
              </div>
              <div className="text-sm text-gray-600">
                {isDayTrip ? (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-semibold">
                    당일치기
                  </span>
                ) : (
                  <span className="font-medium">
                    {reservation.nights}박 {reservation.nights + 1}일
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">예약 기간</div>
              <div className="text-sm font-semibold text-gray-900">
                {checkInDate.getMonth() + 1}/{checkInDate.getDate()} ~ {checkOutDate.getMonth() + 1}/{checkOutDate.getDate()}
              </div>
            </div>
          </div>

          {/* 체크인/체크아웃 표시 */}
          <div className="flex gap-2">
            {isCheckIn && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                체크인일
              </span>
            )}
            {isCheckOut && !isDayTrip && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                체크아웃일
              </span>
            )}
          </div>
        </div>

        {/* 예약 수정 / 취소 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-colors border-2 border-blue-200"
          >
            <Edit className="w-5 h-5" />
            예약 수정
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-colors border-2 border-red-200"
          >
            <Trash2 className="w-5 h-5" />
            예약 취소
          </button>
        </div>
      </div>
    </>
  );
};

export default ReservationManageModal;
