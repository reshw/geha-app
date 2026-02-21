// components/carpool/CarpoolCreateModal.jsx
import { useState, useEffect } from 'react';
import { X, Car, MapPin, Calendar, Clock, DollarSign, Package, ArrowLeftRight, Save, FolderOpen, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import carpoolPresetService from '../../services/carpoolPresetService';
import { useAuth } from '../../hooks/useAuth';

const CarpoolCreateModal = ({ isOpen, onClose, onSubmit, resortName }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    type: 'offer',
    departureDate: '',
    departureTime: '',
    departureLocation: '',
    direction: 'toResort', // toResort | fromResort
    cost: '',
    hasEquipment: false,
    equipmentCost: '',
    memo: ''
  });

  const [errors, setErrors] = useState({});
  const [presets, setPresets] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  // 출발지 프리셋 (4개로 축소)
  const popularLocations = ['강남', '잠실', '홍대', '수원'];

  // 프리셋 로드
  useEffect(() => {
    if (isOpen && user?.id) {
      loadPresets();
    }
  }, [isOpen, user?.id]);

  const loadPresets = async () => {
    try {
      const data = await carpoolPresetService.getUserPresets(user.id);
      setPresets(data);
    } catch (error) {
      console.error('프리셋 로드 실패:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // 방향 전환
  const toggleDirection = () => {
    setFormData(prev => ({
      ...prev,
      direction: prev.direction === 'toResort' ? 'fromResort' : 'toResort'
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.departureDate) {
      newErrors.departureDate = '날짜를 선택해주세요';
    } else {
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
      newErrors.cost = '카풀비용을 입력해주세요';
    }

    if (formData.hasEquipment && (!formData.equipmentCost || formData.equipmentCost <= 0)) {
      newErrors.equipmentCost = '장비 요금을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const submitData = {
      ...formData,
      departureDate: new Date(formData.departureDate),
      cost: parseInt(formData.cost, 10),
      equipmentCost: formData.hasEquipment ? parseInt(formData.equipmentCost, 10) : 0,
      kakaoId: user?.kakaoId || user?.id || 'unknown',
      destination: resortName
    };

    await onSubmit(submitData);
    handleClose();
  };

  // 프리셋 저장
  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('프리셋 이름을 입력하세요');
      return;
    }

    try {
      await carpoolPresetService.savePreset(user.id, {
        name: presetName,
        ...formData
      });
      alert('프리셋이 저장되었습니다');
      setPresetName('');
      loadPresets();
    } catch (error) {
      alert('프리셋 저장에 실패했습니다');
    }
  };

  // 프리셋 불러오기
  const handleLoadPreset = async (preset) => {
    setFormData({
      type: preset.type,
      departureDate: '',
      departureTime: '',
      departureLocation: preset.departureLocation,
      direction: preset.direction,
      cost: preset.cost.toString(),
      hasEquipment: preset.hasEquipment,
      equipmentCost: preset.equipmentCost?.toString() || '',
      memo: preset.memo
    });

    await carpoolPresetService.updateLastUsed(user.id, preset.id);
    setShowPresets(false);
  };

  // 프리셋 삭제
  const handleDeletePreset = async (presetId) => {
    if (!window.confirm('이 프리셋을 삭제하시겠습니까?')) return;

    try {
      await carpoolPresetService.deletePreset(user.id, presetId);
      loadPresets();
    } catch (error) {
      alert('프리셋 삭제에 실패했습니다');
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'offer',
      departureDate: '',
      departureTime: '',
      departureLocation: '',
      direction: 'toResort',
      cost: '',
      hasEquipment: false,
      equipmentCost: '',
      memo: ''
    });
    setErrors({});
    setShowPresets(false);
    setPresetName('');
    onClose();
  };

  // 방향 레이블
  const getLocationLabel = () => {
    if (formData.direction === 'toResort') {
      return { left: formData.departureLocation || '출발지', right: resortName };
    } else {
      return { left: resortName, right: formData.departureLocation || '목적지' };
    }
  };

  const locationLabel = getLocationLabel();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="600px">
      <div className="bg-white rounded-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-green-600" />
            카풀 등록
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="프리셋 불러오기"
            >
              <FolderOpen className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 프리셋 목록 */}
        {showPresets && presets.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="text-sm font-semibold text-blue-900 mb-2">저장된 프리셋</div>
            <div className="space-y-2">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center gap-2 bg-white rounded-lg p-2">
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 text-left text-sm hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    <div className="font-semibold text-gray-900">{preset.name}</div>
                    <div className="text-xs text-gray-500">
                      {preset.departureLocation} · {preset.cost?.toLocaleString()}원
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

          {/* 방향 (좌우 전환) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              방향 *
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {formData.direction === 'toResort' ? '출발' : '도착'}
                </div>
                <div className="font-bold text-gray-900">{locationLabel.left}</div>
              </div>

              <button
                onClick={toggleDirection}
                className="p-3 bg-green-600 hover:bg-green-700 rounded-full text-white transition-all shadow-md"
                title="방향 전환"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>

              <div className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {formData.direction === 'toResort' ? '도착' : '출발'}
                </div>
                <div className="font-bold text-gray-900">{locationLabel.right}</div>
              </div>
            </div>
          </div>

          {/* 출발지/목적지 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {formData.direction === 'toResort' ? '출발지' : '목적지'} *
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
              placeholder="직접 입력"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.departureLocation ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.departureLocation && (
              <p className="mt-1 text-sm text-red-600">{errors.departureLocation}</p>
            )}
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

          {/* 카풀비용 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              카풀비용 *
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
          </div>

          {/* 장비 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
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
                type="number"
                value={formData.equipmentCost}
                onChange={(e) => handleChange('equipmentCost', e.target.value)}
                placeholder="장비 요금 (예: 5000)"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.equipmentCost ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            {errors.equipmentCost && (
              <p className="mt-1 text-sm text-red-600">{errors.equipmentCost}</p>
            )}
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

          {/* 프리셋 저장 */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              프리셋으로 저장 (선택)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="프리셋 이름"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleSavePreset}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold text-blue-700 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                저장
              </button>
            </div>
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
