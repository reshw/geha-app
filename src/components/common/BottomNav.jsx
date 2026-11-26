// components/common/BottomNav.jsx
import { useState, useEffect, useCallback } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import spaceSettingsService from '../../services/spaceSettingsService';
import { AVAILABLE_FEATURES } from '../../utils/features';

export default function BottomNav() {
  const location = useLocation();
  const { currentApp, selectedSpace } = useStore();
  const [featuresConfig, setFeaturesConfig] = useState({});
  const [loading, setLoading] = useState(true);

  // 함수 정의 (useCallback으로 메모이제이션)
  const loadFeaturesConfig = useCallback(async () => {
    if (!selectedSpace) return;

    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const config = await spaceSettingsService.getFeaturesConfig(spaceId);
      setFeaturesConfig(config);
    } catch (error) {
      console.error('기능 설정 로드 실패:', error);
      // 에러 시 기본 설정 사용
      setFeaturesConfig({
        reservation: { enabled: true, showInBottomNav: true, order: 1 }
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSpace]);

  // ⚠️ IMPORTANT: 모든 hooks를 먼저 호출해야 함 (early return 전에)
  useEffect(() => {
    loadFeaturesConfig();
  }, [loadFeaturesConfig]);

  // 카풀 앱일 때는 BottomNav 숨김
  if (currentApp === 'carpool') {
    return null;
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 하단 메뉴에 표시할 기능들 (활성화 + showInBottomNav = true)
  const bottomNavFeatures = Object.entries(featuresConfig)
    .filter(([_, config]) => config.enabled && config.showInBottomNav)
    .sort((a, b) => {
      const orderA = a[1].order || 999;
      const orderB = b[1].order || 999;
      if (orderA !== orderB) return orderA - orderB;
      // order가 같으면 id로 정렬 (안정성)
      return a[0].localeCompare(b[0]);
    })
    .map(([id]) => id)
    .slice(0, 4); // 최대 4개

  if (loading) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-[600px] mx-auto flex h-16 items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-[600px] mx-auto flex">
        {/* 동적 기능 메뉴 */}
        {bottomNavFeatures.map((featureId) => {
          const feature = AVAILABLE_FEATURES[featureId];
          if (!feature) return null;

          const Icon = feature.icon;
          const path = feature.path;

          return (
            <Link
              key={featureId}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all ${
                isActive(path)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 2} />
              <span className={`text-xs ${isActive(path) ? 'font-bold' : 'font-normal'}`}>
                {feature.name}
              </span>
            </Link>
          );
        })}

        {/* 더보기 (항상 표시) */}
        <Link
          to="/more"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all ${
            isActive('/more')
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MoreHorizontal size={22} strokeWidth={isActive('/more') ? 2.5 : 2} />
          <span className={`text-xs ${isActive('/more') ? 'font-bold' : 'font-normal'}`}>
            더보기
          </span>
        </Link>
      </div>
    </nav>
  );
}