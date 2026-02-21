// pages/CarpoolCreatePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Car, MapPin, Calendar, Clock, DollarSign, Package, ArrowLeftRight, Save, FolderOpen, Trash2, ChevronLeft, Sparkles } from 'lucide-react';
import carpoolPresetService from '../services/carpoolPresetService';
import carpoolService from '../services/carpoolService';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import { LOCATION_REGIONS, REGION_ORDER, POPULAR_LOCATIONS, getRegionByLocation } from '../config/locations';

const CarpoolCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedResort } = useStore();

  const [formData, setFormData] = useState({
    type: 'offer',
    departureDate: '',
    departureTime: '',
    timeNegotiable: false,
    departureLocation: '',
    departureRegion: '', // 권역 정보
    direction: 'toResort',
    cost: '',
    hasEquipment: false,
    equipmentCost: '',
    memo: ''
  });

  const [errors, setErrors] = useState({});
  const [presets, setPresets] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegionSelector, setShowRegionSelector] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPresets();
    }
  }, [user?.id]);

  const loadPresets = async () => {
    try {
      const data = await carpoolPresetService.getUserPresets(user.id);
      setPresets(data);
    } catch (error) {
      console.error('프리셋 로드 실패:', error);
    }
  };

  const handleChange = (field, value) => {
    const updates = { [field]: value };

    // 장소 선택 시 권역 자동 설정
    if (field === 'departureLocation') {
      const region = getRegionByLocation(value);
      if (region) {
        updates.departureRegion = region.id;
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // 장소 선택 (권역 버튼에서)
  const handleLocationSelect = (location, regionId) => {
    setFormData(prev => ({
      ...prev,
      departureLocation: location,
      departureRegion: regionId
    }));
    setShowRegionSelector(false);
    if (errors.departureLocation) {
      setErrors(prev => ({ ...prev, departureLocation: null }));
    }
  };

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

    if (!formData.timeNegotiable && !formData.departureTime) {
      newErrors.departureTime = '시간을 선택하거나 협의가능을 체크해주세요';
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

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        departureDate: new Date(formData.departureDate),
        departureTime: formData.timeNegotiable ? '협의가능' : formData.departureTime,
        cost: parseInt(formData.cost, 10),
        equipmentCost: formData.hasEquipment ? parseInt(formData.equipmentCost, 10) : 0,
        kakaoId: user?.kakaoId || user?.id || 'unknown',
        destination: selectedResort?.name || '스키장',
        resortId: selectedResort?.id,
        resortName: selectedResort?.name,
        userId: user.id,
        userName: user.displayName,
        userProfileImage: user.profileImage || ''
      };

      await carpoolService.createCarpoolPost(submitData);
      alert('카풀이 등록되었습니다');
      navigate(-1);
    } catch (error) {
      console.error('카풀 등록 실패:', error);
      alert('카풀 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleLoadPreset = async (preset) => {
    // 권역 정보 복원 (저장되어 있으면 사용, 없으면 장소로부터 추론)
    const region = preset.departureRegion || getRegionByLocation(preset.departureLocation)?.id || '';

    setFormData({
      type: preset.type,
      departureDate: '',
      departureTime: '',
      timeNegotiable: preset.timeNegotiable || false,
      departureLocation: preset.departureLocation,
      departureRegion: region,
      direction: preset.direction,
      cost: preset.cost.toString(),
      hasEquipment: preset.hasEquipment,
      equipmentCost: preset.equipmentCost?.toString() || '',
      memo: preset.memo
    });

    await carpoolPresetService.updateLastUsed(user.id, preset.id);
    setShowPresets(false);
  };

  const handleDeletePreset = async (presetId) => {
    if (!window.confirm('이 프리셋을 삭제하시겠습니까?')) return;

    try {
      await carpoolPresetService.deletePreset(user.id, presetId);
      loadPresets();
    } catch (error) {
      alert('프리셋 삭제에 실패했습니다');
    }
  };

  const getLocationLabel = () => {
    if (formData.direction === 'toResort') {
      return { left: formData.departureLocation || '출발지', right: selectedResort?.name || '스키장' };
    } else {
      return { left: selectedResort?.name || '스키장', right: formData.departureLocation || '목적지' };
    }
  };

  const locationLabel = getLocationLabel();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-green-600 via-green-600 to-emerald-700 shadow-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Car className="w-6 h-6" />
              카풀 등록
            </h1>
            <div className="w-10" />
          </div>

          {/* 프리셋 불러오기 버튼 */}
          {presets.length > 0 && (
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
            >
              <FolderOpen className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white">자주쓰는거 불러오기</span>
              <span className="ml-auto px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                {presets.length}개
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* 프리셋 목록 */}
        {showPresets && presets.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg animate-slideDown">
            <div className="flex items-center gap-2 text-blue-900 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">저장된 프리셋</span>
            </div>
            <div className="space-y-2">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all">
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 text-left hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${preset.type === 'offer' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      {preset.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
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

        {/* 타입 선택 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 bg-green-500 rounded-full" />
            타입 선택
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleChange('type', 'offer')}
              className={`relative px-5 py-4 rounded-xl font-bold transition-all ${
                formData.type === 'offer'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formData.type === 'offer' && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}
              제공
            </button>
            <button
              onClick={() => handleChange('type', 'request')}
              className={`relative px-5 py-4 rounded-xl font-bold transition-all ${
                formData.type === 'request'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formData.type === 'request' && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}
              요청
            </button>
          </div>
        </div>

        {/* 방향 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 bg-green-500 rounded-full" />
            방향 설정
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="text-xs text-gray-500 mb-1 font-semibold">
                {formData.direction === 'toResort' ? '🚗 출발' : '🏁 도착'}
              </div>
              <div className="font-bold text-gray-900 text-lg">{locationLabel.left}</div>
            </div>

            <button
              onClick={toggleDirection}
              className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl text-white transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <ArrowLeftRight className="w-6 h-6" />
            </button>

            <div className="flex-1 px-4 py-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="text-xs text-gray-500 mb-1 font-semibold">
                {formData.direction === 'toResort' ? '🏁 도착' : '🚗 출발'}
              </div>
              <div className="font-bold text-gray-900 text-lg">{locationLabel.right}</div>
            </div>
          </div>
        </div>

        {/* 출발지/목적지 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            {formData.direction === 'toResort' ? '출발지' : '목적지'}
          </div>

          {/* 선택된 장소 표시 또는 선택 버튼 */}
          {formData.departureLocation ? (
            <div className="mb-3">
              <div className={`px-5 py-4 rounded-xl border-2 bg-gradient-to-br ${
                formData.departureRegion ? LOCATION_REGIONS[formData.departureRegion]?.color : 'from-green-500 to-emerald-600'
              } text-white shadow-md`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-80 mb-1">
                      {formData.departureRegion && LOCATION_REGIONS[formData.departureRegion]?.emoji}{' '}
                      {formData.departureRegion && LOCATION_REGIONS[formData.departureRegion]?.name}
                    </div>
                    <div className="text-lg font-bold">{formData.departureLocation}</div>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, departureLocation: '', departureRegion: '' }));
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRegionSelector(!showRegionSelector)}
              className="w-full px-5 py-4 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-white font-bold shadow-md transition-all mb-3"
            >
              📍 지역 선택하기
            </button>
          )}

          {/* 인기 장소 (빠른 선택) */}
          {!formData.departureLocation && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2 font-semibold">⚡ 인기 장소</div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_LOCATIONS.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationSelect(location, getRegionByLocation(location)?.id)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-all"
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 권역 선택 패널 */}
          {showRegionSelector && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {REGION_ORDER.map(regionId => {
                const region = LOCATION_REGIONS[regionId];
                return (
                  <div key={regionId} className={`${region.bgColor} ${region.borderColor} border-2 rounded-xl p-3`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{region.emoji}</span>
                      <span className="font-bold text-gray-900">{region.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {region.locations.map(location => (
                        <button
                          key={location}
                          onClick={() => handleLocationSelect(location, regionId)}
                          className={`px-3 py-2 rounded-lg font-semibold transition-all bg-white hover:shadow-md`}
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 직접 입력 */}
          <div className="mt-3">
            <input
              type="text"
              value={formData.departureLocation}
              onChange={(e) => handleChange('departureLocation', e.target.value)}
              placeholder="또는 직접 입력"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                errors.departureLocation ? 'border-red-500' : 'border-gray-200'
              }`}
            />
          </div>

          {errors.departureLocation && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.departureLocation}
            </p>
          )}
        </div>

        {/* 날짜/시간 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            날짜 & 시간
          </div>
          <div className="space-y-3">
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => handleChange('departureDate', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                errors.departureDate ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.departureDate && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.departureDate}
              </p>
            )}

            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => handleChange('departureTime', e.target.value)}
                disabled={formData.timeNegotiable}
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  formData.timeNegotiable ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.departureTime ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>

            <label className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.timeNegotiable}
                onChange={(e) => handleChange('timeNegotiable', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-blue-900">시간 협의가능</span>
            </label>

            {errors.departureTime && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.departureTime}
              </p>
            )}
          </div>
        </div>

        {/* 비용 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            카풀비용
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₩</span>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
              placeholder="15000"
              className={`w-full pl-10 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold transition-all ${
                errors.cost ? 'border-red-500' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.cost && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.cost}
            </p>
          )}
        </div>

        {/* 장비 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={formData.hasEquipment}
              onChange={(e) => handleChange('hasEquipment', e.target.checked)}
              className="w-6 h-6 rounded-lg border-gray-300 text-green-600 focus:ring-green-500"
            />
            <Package className="w-5 h-5 text-green-600" />
            <span className="text-base font-bold text-gray-900">
              장비 가능
            </span>
          </label>

          {formData.hasEquipment && (
            <div className="pl-9 animate-slideDown">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₩</span>
                <input
                  type="number"
                  value={formData.equipmentCost}
                  onChange={(e) => handleChange('equipmentCost', e.target.value)}
                  placeholder="5000"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                    errors.equipmentCost ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.equipmentCost && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errors.equipmentCost}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 메모 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-sm font-bold text-gray-700 mb-3">
            메모 (선택)
          </div>
          <textarea
            value={formData.memo}
            onChange={(e) => handleChange('memo', e.target.value)}
            placeholder="추가 정보를 입력하세요 (예: 중간 정차, 짐 개수 등)"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* 프리셋 저장 카드 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-2 text-amber-900 mb-3">
            <Save className="w-5 h-5" />
            <span className="font-bold">자주쓰는 카풀 저장</span>
            <Sparkles className="w-4 h-4 ml-auto" />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="프리셋 이름 (예: 주말 강남출발)"
              className="flex-1 px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSavePreset}
              className="px-5 py-3 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-20">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                등록 중...
              </>
            ) : (
              <>
                <Car className="w-5 h-5" />
                등록하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarpoolCreatePage;
