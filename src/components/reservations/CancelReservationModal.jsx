// src/components/reservation/CancelReservationModal.jsx
import Modal from '../common/Modal';
import { formatDate } from '../../utils/dateUtils';

const getNights = (checkIn, checkOut) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diff = outDate.getTime() - inDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const CancelReservationModal = ({ isOpen, onClose, reservation, onConfirm }) => {
  if (!reservation) return null;

  const nights = getNights(reservation.checkIn, reservation.checkOut);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="예약 취소">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 border text-sm text-gray-700 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">체크인</span>
            <span className="font-semibold">{formatDate(new Date(reservation.checkIn))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">체크아웃</span>
            <span className="font-semibold">{formatDate(new Date(reservation.checkOut))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">숙박</span>
            <span className="font-semibold">{nights}박</span>
          </div>

          {/* 게스트면 초대자 표시 (있을 때만) */}
          {reservation.hostDisplayName && reservation.type === 'guest' && (
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-500">초대자</span>
              <span className="font-semibold">{reservation.hostDisplayName}</span>
            </div>
          )}
        </div>

        <div className="text-center text-gray-800 font-medium">
          정말 이 예약을 취소할까요?
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            아니오
          </button>
          <button
            onClick={() => onConfirm(reservation)}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600"
          >
            예약 취소
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CancelReservationModal;
