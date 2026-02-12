import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Info, Save, MoreHorizontal, X, ArrowLeftRight, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { AVAILABLE_FEATURES, MAX_BOTTOM_NAV_ITEMS } from '../utils/features';
import { canManageSpace } from '../utils/permissions';

export default function FeaturesManagePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSpace } = useStore();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [swapMode, setSwapMode] = useState(false);

  // 권한 체크
  useEffect(() => {
    if (!user || !selectedSpace) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    const spaceId = selectedSpace.id || selectedSpace.spaceId;
    const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);

    if (!userSpaceData || !canManageSpace(userSpaceData.userType)) {
      alert('접근 권한이 없습니다. 매니저만 접근 가능합니다.');
      navigate('/space/manage');
      return;
    }

    loadFeatures();
  }, [user, selectedSpace, navigate]);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const config = await spaceSettingsService.getFeaturesConfig(spaceId);
      setFeatures(config);
    } catch (error) {
      console.error('기능 설정 로드 실패:', error);
      alert('기능 설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (featureId) => {
    if (AVAILABLE_FEATURES[featureId].isDefault) {
      alert('일정은 기본 기능으로 비활성화할 수 없습니다.');
      return;
    }

    const isCurrentlyEnabled = features[featureId]?.enabled;

    setFeatures(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        enabled: !isCurrentlyEnabled,
        showInBottomNav: !isCurrentlyEnabled ? false : prev[featureId]?.showInBottomNav
      }
    }));
    setHasChanges(true);
  };

  // 슬롯 클릭
  const handleSlotClick = (index, featureId) => {
    if (!featureId || featureId === 'more') return;

    if (swapMode && selectedSlot !== null && selectedSlot !== index) {
      // 교환 모드: 두 슬롯의 기능을 교환
      handleSwapSlots(selectedSlot, index);
      setSwapMode(false);
      setSelectedSlot(null);
    } else {
      // 선택 모드
      setSelectedSlot(selectedSlot === index ? null : index);
      setSwapMode(false);
    }
  };

  // 위치 바꾸기 모드 활성화
  const handleStartSwap = () => {
    setSwapMode(true);
  };

  // 두 슬롯 교환
  const handleSwapSlots = (index1, index2) => {
    const feature1 = bottomNavSlots[index1];
    const feature2 = bottomNavSlots[index2];

    if (!feature1 || feature1 === 'more') return;

    const updatedFeatures = { ...features };

    // feature1의 order 변경
    if (feature1) {
      updatedFeatures[feature1] = {
        ...updatedFeatures[feature1],
        order: index2 + 1
      };
    }

    // feature2가 있으면 order 변경, 없으면 feature1을 해당 위치로
    if (feature2 && feature2 !== 'more') {
      updatedFeatures[feature2] = {
        ...updatedFeatures[feature2],
        order: index1 + 1
      };
    }

    setFeatures(updatedFeatures);
    setHasChanges(true);
  };

  // 슬롯에서 제거
  const handleRemoveFromSlot = (featureId) => {
    setFeatures(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        showInBottomNav: false
      }
    }));
    setSelectedSlot(null);
    setSwapMode(false);
    setHasChanges(true);
  };

  // 기능을 하단 메뉴에 추가
  const handleAddToBottomNav = (featureId) => {
    if (features[featureId]?.showInBottomNav) return;

    const currentBottomNavCount = bottomNavFeatures.length;
    if (currentBottomNavCount >= MAX_BOTTOM_NAV_ITEMS) {
      alert(`하단 메뉴는 최대 ${MAX_BOTTOM_NAV_ITEMS}개까지만 설정할 수 있습니다.`);
      return;
    }

    setFeatures(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        showInBottomNav: true,
        order: currentBottomNavCount + 1
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      await spaceSettingsService.updateFeaturesConfig(
        spaceId,
        features,
        user.id,
        user.displayName
      );

      setHasChanges(false);
      alert('기능 설정이 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 활성화된 기능을 순서대로 정렬
  const enabledFeatures = Object.entries(features)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => {
      const orderA = a[1].order || 999;
      const orderB = b[1].order || 999;
      if (orderA !== orderB) return orderA - orderB;
      return a[0].localeCompare(b[0]);
    })
    .map(([id]) => id);

  // 비활성화된 기능
  const disabledFeatures = Object.keys(AVAILABLE_FEATURES)
    .filter(id => !features[id]?.enabled);

  // 하단 메뉴에 표시할 기능들 (최대 4개)
  const bottomNavFeatures = enabledFeatures
    .filter(id => features[id]?.showInBottomNav)
    .slice(0, MAX_BOTTOM_NAV_ITEMS);

  // 하단 메뉴 슬롯 배열 (4개 슬롯 + 더보기)
  const bottomNavSlots = [...bottomNavFeatures];
  while (bottomNavSlots.length < MAX_BOTTOM_NAV_ITEMS) {
    bottomNavSlots.push(null); // 빈 슬롯
  }
  bottomNavSlots.push('more'); // 더보기는 항상 마지막

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/30 sticky top-0 z-10 shadow-lg">
        <div className="w-full max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/space/manage')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white truncate">추가 기능 관리</h1>
              <p className="text-sm text-slate-300 truncate">하단 메뉴를 구성하세요</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 하단 메뉴 슬롯 (클릭 기반) */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">하단 메뉴 구성</h2>
            <span className="ml-auto text-sm font-medium text-blue-400">
              {bottomNavFeatures.length} / {MAX_BOTTOM_NAV_ITEMS}
            </span>
          </div>

          {/* 슬롯 (클릭 기반) */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {bottomNavSlots.map((featureId, index) => {
              const isMore = featureId === 'more';
              const feature = featureId && !isMore ? AVAILABLE_FEATURES[featureId] : null;
              const Icon = feature?.icon;
              const isEmpty = !featureId;
              const isSelected = selectedSlot === index;
              const isSwapTarget = swapMode && selectedSlot !== null && selectedSlot !== index && !isEmpty && !isMore;

              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleSlotClick(index, featureId)}
                    disabled={isEmpty || isMore}
                    className={`w-full h-20 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all ${
                      isMore
                        ? 'bg-slate-600/30 border-slate-500 cursor-default'
                        : isEmpty
                        ? 'border-dashed bg-slate-700/20 border-slate-600/50 text-slate-500'
                        : isSelected
                        ? 'bg-purple-500/30 border-purple-500 text-purple-300 ring-2 ring-purple-500/50'
                        : isSwapTarget
                        ? 'bg-green-500/20 border-green-500 text-green-300 cursor-pointer hover:bg-green-500/30'
                        : 'bg-blue-500/20 border-blue-500 text-blue-300 hover:bg-blue-500/30 cursor-pointer'
                    }`}
                  >
                    {isMore ? (
                      <>
                        <MoreHorizontal className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-slate-400">더보기</span>
                      </>
                    ) : feature ? (
                      <>
                        <Icon className="w-5 h-5 mb-1" />
                        <span>{feature.name}</span>
                        {isSwapTarget && (
                          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
                            <ArrowLeftRight className="w-6 h-6 text-green-400" />
                          </div>
                        )}
                      </>
                    ) : (
                      <span>빈 슬롯</span>
                    )}
                  </button>

                  {/* 선택된 슬롯의 메뉴 */}
                  {isSelected && !swapMode && (
                    <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 min-w-[120px]">
                      <button
                        onClick={handleStartSwap}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center gap-2 rounded-t-lg"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                        위치 바꾸기
                      </button>
                      <button
                        onClick={() => handleRemoveFromSlot(featureId)}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 rounded-b-lg"
                      >
                        <X className="w-4 h-4" />
                        제거
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-blue-300/80">
            {swapMode
              ? '✨ 교환할 위치를 선택하세요'
              : '💡 슬롯을 클릭하여 위치 변경 또는 제거'
            }
          </p>

          {swapMode && (
            <button
              onClick={() => { setSwapMode(false); setSelectedSlot(null); }}
              className="mt-3 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium"
            >
              취소
            </button>
          )}
        </div>

        {/* 사용 가능한 기능 */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-600/30 bg-slate-800/50">
            <h2 className="text-base font-bold text-white">사용 가능한 기능</h2>
            <p className="text-xs text-slate-400 mt-0.5">클릭하여 하단 메뉴에 추가하세요</p>
          </div>

          <div className="p-5 space-y-2">
            {enabledFeatures.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">활성화된 기능이 없습니다</p>
            ) : (
              enabledFeatures.map((featureId) => {
                const feature = AVAILABLE_FEATURES[featureId];
                const config = features[featureId];
                const Icon = feature.icon;
                const inBottomNav = config?.showInBottomNav;

                return (
                  <div
                    key={featureId}
                    className="bg-slate-700/50 border border-slate-600/30 rounded-lg p-3 transition-all hover:bg-slate-700/70"
                  >
                    <div className="flex items-center gap-3">
                      {/* 아이콘 */}
                      <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${feature.color}-400`} />
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{feature.name}</h3>
                          {feature.isDefault && (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-600/50 text-slate-300 rounded">
                              필수
                            </span>
                          )}
                          {inBottomNav && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                              하단 메뉴
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{feature.description}</p>
                      </div>

                      {/* 버튼들 */}
                      <div className="flex gap-2">
                        {!inBottomNav && (
                          <button
                            onClick={() => handleAddToBottomNav(featureId)}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            추가
                          </button>
                        )}
                        {!feature.isDefault && (
                          <button
                            onClick={() => handleToggleFeature(featureId)}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            비활성화
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 비활성화된 기능 */}
        {disabledFeatures.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-600/30 bg-slate-800/50">
              <h2 className="text-base font-bold text-white">비활성화된 기능</h2>
              <p className="text-xs text-slate-400 mt-0.5">클릭하여 활성화할 수 있습니다</p>
            </div>

            <div className="p-5 space-y-2">
              {disabledFeatures.map((featureId) => {
                const feature = AVAILABLE_FEATURES[featureId];
                const Icon = feature.icon;

                return (
                  <button
                    key={featureId}
                    onClick={() => handleToggleFeature(featureId)}
                    className="w-full bg-slate-700/30 border border-slate-600/30 rounded-lg p-3 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/10 group-hover:bg-${feature.color}-500/20 flex items-center justify-center flex-shrink-0 transition-colors`}>
                        <Icon className={`w-5 h-5 text-${feature.color}-400/50 group-hover:text-${feature.color}-400 transition-colors`} />
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <h3 className="text-sm font-semibold text-slate-400 group-hover:text-white transition-colors">
                          {feature.name}
                        </h3>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                          {feature.description}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-xs font-medium text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        + 활성화
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        {hasChanges && (
          <div className="sticky bottom-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>변경사항 저장</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-2">사용 안내</p>
              <ul className="space-y-1.5 text-blue-200/80 text-xs">
                <li>• 슬롯을 클릭하여 위치 변경 또는 제거</li>
                <li>• "위치 바꾸기" 선택 후 다른 슬롯 클릭으로 교환</li>
                <li>• 기능 카드의 "추가" 버튼으로 하단 메뉴에 추가</li>
                <li>• 하단 메뉴에 없는 기능은 "더보기"에서 접근 가능</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
