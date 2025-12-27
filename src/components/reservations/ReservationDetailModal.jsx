// src/components/reservations/ReservationDetailModal.jsx
import { X } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/dateUtils';

const ReservationDetailModal = ({
  isOpen,
  onClose,
  date,
  reservations,
  profiles,
  user,
  onProfileClick
}) => {
  if (!date || !reservations) return null;

  // 예약 그룹 분리: 정규 예약 vs 당일치기
  const regularReservations = reservations.filter(r => !r.isDayTrip && r.nights !== 0);
  const dayTripReservations = reservations.filter(r => r.isDayTrip || r.nights === 0);

  // 남녀 통계
  const maleCount = reservations.filter(r => profiles[r.userId]?.gender === 'male').length;
  const femaleCount = reservations.filter(r => profiles[r.userId]?.gender === 'female').length;

  // 주주/게스트 통계
  const memberTypes = ['shareholder', 'manager', 'vice-manager'];
  const shareholderCount = reservations.filter(r => memberTypes.includes(r.type)).length;
  const guestCount = reservations.filter(r => !memberTypes.includes(r.type)).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null}>
      <div className="max-h-[70vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between -mx-6 -mt-6 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {date.getMonth() + 1}월 {date.getDate()}일 예약자
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span>총 {reservations.length}명</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                남 {maleCount}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                여 {femaleCount}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              주주 {shareholderCount} · 게스트 {guestCount}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 예약 내용 */}
        <div className="space-y-4">
          {/* 정규 예약 그룹 */}
          {regularReservations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">예약자 ({regularReservations.length}명)</h4>
              <div className="space-y-2">
                {regularReservations.map((reservation, index) => {
                  const profile = profiles[reservation.userId];
                  const isMine = String(reservation.userId) === String(user.id);
                  const isMember = memberTypes.includes(reservation.type);
                  const genderColor = profile?.gender === 'female' ? 'bg-pink-50 border-pink-200' : 'bg-blue-50 border-blue-200';
                  const genderIcon = profile?.gender === 'female' ? '👩' : '👨';

                  return (
                    <div
                      key={reservation.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isMine ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100' : genderColor
                      }`}
                      onClick={() => {
                        if (isMine && onProfileClick) {
                          onProfileClick(reservation, date);
                        }
                      }}
                    >
                <div className="flex items-center gap-3">
                  {/* 프로필 사진 */}
                  <div className="flex-shrink-0">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={reservation.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                          profile?.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                        }`}
                      >
                        {reservation.name?.[0]}
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-base">
                        {reservation.name}
                      </span>
                      {isMine && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                          나
                        </span>
                      )}
                      <span className="text-lg">{genderIcon}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span className={`px-2 py-0.5 rounded-md ${
                        isMember ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      } font-medium`}>
                        {isMember ? '주주' : '게스트'}
                      </span>

                      {!isMember && reservation.hostDisplayName && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">
                            {reservation.hostDisplayName} 초대
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 순번 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">
                    {index + 1}
                  </div>
                </div>

                {/* 안내 문구 */}
                {isMine && (
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    눌러서 상세보기 및 수정
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

          {/* 당일치기 그룹 */}
          {dayTripReservations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-700 mb-2">당일치기 ({dayTripReservations.length}명)</h4>
              <div className="space-y-2">
                {dayTripReservations.map((reservation, index) => {
                  const profile = profiles[reservation.userId];
                  const isMine = String(reservation.userId) === String(user.id);
                  const isMember = memberTypes.includes(reservation.type);
                  const genderColor = profile?.gender === 'female' ? 'bg-pink-50 border-pink-200' : 'bg-blue-50 border-blue-200';
                  const genderIcon = profile?.gender === 'female' ? '👩' : '👨';

                  return (
                    <div
                      key={reservation.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isMine ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100' : genderColor
                      }`}
                      onClick={() => {
                        if (isMine && onProfileClick) {
                          onProfileClick(reservation, date);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* 프로필 사진 */}
                        <div className="flex-shrink-0">
                          {profile?.profileImage ? (
                            <img
                              src={profile.profileImage}
                              alt={reservation.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                                profile?.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                              }`}
                            >
                              {reservation.name?.[0]}
                            </div>
                          )}
                        </div>

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-base">
                              {reservation.name}
                            </span>
                            {isMine && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                나
                              </span>
                            )}
                            <span className="text-lg">{genderIcon}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <span className={`px-2 py-0.5 rounded-md ${
                              isMember ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            } font-medium`}>
                              {isMember ? '주주' : '게스트'}
                            </span>

                            {!isMember && reservation.hostDisplayName && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">
                                  {reservation.hostDisplayName} 초대
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 순번 */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm">
                          {index + 1}
                        </div>
                      </div>

                      {/* 안내 문구 */}
                      {isMine && (
                        <div className="text-xs text-gray-400 mt-2 text-center">
                          눌러서 상세보기 및 수정
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReservationDetailModal;
