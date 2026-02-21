// components/carpool/CarpoolCreateModal.jsx
import { useState, useEffect } from 'react';
import { X, Car, MapPin, Calendar, Clock, DollarSign, Package, MessageSquare } from 'lucide-react';
import Modal from '../common/Modal';

const CarpoolCreateModal = ({ isOpen, onClose, onSubmit, resortName }) => {
  const [formData, setFormData] = useState({
    type: 'offer',
    departureDate: '',
    departureTime: '',
    departureLocation: '',
    destination: resortName || '',
    direction: 'toResort',
    cost: '',
    hasEquipment: false,
    equipmentDetails: '',
    kakaoId: '',
    memo: ''
  });

  const [errors, setErrors] = useState({});

  // 리조트명 업데이트
  useEffect(() => {
    if (resortName) {
      setFormData(prev => ({ ...prev, destination: resortName }));
    }
  }, [resortName]);

  // 출발지 프리셋
  const popularLocations = ['강남', '잠실', '홍대', '수원', '인천', '의정부', '분당', '일산'];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.departureDate) {
      newErrors.departureDate = '날짜를 선택해주세요';
    } else {
      // 과거 날짜 체크
      const selectedDate = new Date(formData.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.departureDate = '과거 날짜는 선택할 수 없습니다';
      }
    }

    if (!formData.departureTime) {
      newErrors.departureTime = '시간을 선택해주세요';
    }

    if (!formData.departureLocation.trim()) {
      newErrors.departureLocation = '출발지를 입력해주세요';
    }

    if (!formData.cost || formData.cost <= 0) {
      newErrors.cost = '비용을 입력해주세요';
    }

    if (!formData.kakaoId.trim()) {
      newErrors.kakaoId = '카카오톡 ID를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const submitData = {
      ...formData,
      departureDate: new Date(formData.departureDate),
      cost: parseInt(formData.cost, 10)
    };

    await onSubmit(submitData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: 'offer',
      departureDate: '',
      departureTime: '',
      departureLocation: '',
      destination: resortName || '',
      direction: 'toResort',
      cost: '',
      hasEquipment: false,
      equipmentDetails: '',
      kakaoId: '',
      memo: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="600px">
      <div className="bg-white rounded-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-green-600" />
            카풀 등록
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 */}
        <div className="px-6 py-6 overflow-y-auto space-y-6">
          {/* 타입 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              타입 *
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleChange('type', 'offer')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  formData.type === 'offer'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                제공
              </button>
              <button
                onClick={() => handleChange('type', 'request')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  formData.type === 'request'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                요청
              </button>
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              날짜 *
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => handleChange('departureDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.departureDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.departureDate && (
              <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>
            )}
          </div>

          {/* 시간 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              시간 *
            </label>
            <input
              type="time"
              value={formData.departureTime}
              onChange={(e) => handleChange('departureTime', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.departureTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.departureTime && (
              <p className="mt-1 text-sm text-red-600">{errors.departureTime}</p>
            )}
          </div>

          {/* 출발지 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              출발지 *
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularLocations.map((location) => (
                <button
                  key={location}
                  onClick={() => handleChange('departureLocation', location)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    formData.departureLocation === location
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.departureLocation}
              onChange={(e) => handleChange('departureLocation', e.target.value)}
              placeholder="또는 직접 입력"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.departureLocation ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.departureLocation && (
              <p className="mt-1 text-sm text-red-600">{errors.departureLocation}</p>
            )}
          </div>

          {/* 방향 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              방향 *
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleChange('direction', 'toResort')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  formData.direction === 'toResort'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                스키장 가는 길
              </button>
              <button
                onClick={() => handleChange('direction', 'fromResort')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  formData.direction === 'fromResort'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                스키장 오는 길
              </button>
              <button
                onClick={() => handleChange('direction', 'roundTrip')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  formData.direction === 'roundTrip'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                왕복
              </button>
            </div>
          </div>

          {/* 비용 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              비용 *
            </label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
              placeholder="예: 15000"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.cost ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cost && (
              <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              편도 기준 금액을 입력하세요 (왕복일 경우 왕복 총 금액)
            </p>
          </div>

          {/* 장비 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasEquipment}
                onChange={(e) => handleChange('hasEquipment', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <Package className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                장비 가능
              </span>
            </label>
            {formData.hasEquipment && (
              <input
                type="text"
                value={formData.equipmentDetails}
                onChange={(e) => handleChange('equipmentDetails', e.target.value)}
                placeholder="예: 스키 + 가방, 보드만 가능"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            )}
          </div>

          {/* 카카오톡 ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              카카오톡 ID *
            </label>
            <input
              type="text"
              value={formData.kakaoId}
              onChange={(e) => handleChange('kakaoId', e.target.value)}
              placeholder="카카오톡 오픈프로필 링크 또는 ID"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.kakaoId ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.kakaoId && (
              <p className="mt-1 text-sm text-red-600">{errors.kakaoId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              연락을 위해 필수로 입력해주세요
            </p>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              메모 (선택)
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) => handleChange('memo', e.target.value)}
              placeholder="추가 정보를 입력하세요"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl font-semibold text-white transition-all shadow-md"
          >
            등록하기
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CarpoolCreateModal;
