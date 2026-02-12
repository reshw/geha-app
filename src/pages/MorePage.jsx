// src/pages/MorePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings2,
  Share2,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import spaceService from '../services/spaceService';
import { AVAILABLE_FEATURES } from '../utils/features';
import { canManageSpace } from '../utils/permissions';
import { USER_TYPE_LABELS } from '../utils/constants';
import LoginOverlay from '../components/auth/LoginOverlay';

const MorePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const { selectedSpace, spaces, setSpaces, setSelectedSpace } = useStore();
  const [featuresConfig, setFeaturesConfig] = useState({});
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  useEffect(() => {
    if (selectedSpace) {
      loadFeaturesConfig();
    }
  }, [selectedSpace]);

  const loadFeaturesConfig = async () => {
    try {
      setLoadingFeatures(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const config = await spaceSettingsService.getFeaturesConfig(spaceId);
      setFeaturesConfig(config);
    } catch (error) {
      console.error('기능 설정 로드 실패:', error);
    } finally {
      setLoadingFeatures(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  const handleShare = async () => {
    const spaceId = selectedSpace?.id || selectedSpace?.spaceId;

    if (!spaceId) {
      alert('스페이스 ID를 찾을 수 없습니다');
      return;
    }

    const inviteLink = `${window.location.origin}/join/${spaceId}`;

    // 모바일 대응: textarea를 사용한 복사
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 최신 브라우저
        await navigator.clipboard.writeText(inviteLink);
        alert('초대 링크가 복사되었습니다!');
      } else {
        // 구형 브라우저/모바일 대응
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        alert('초대 링크가 복사되었습니다!');
      }
    } catch (err) {
      console.error('복사 실패:', err);
      // 복사 실패 시 링크 직접 표시
      setTimeout(() => {
        alert(`이 링크를 복사하세요:\n${inviteLink}`);
      }, 100);
    }
  };

  const handleLeaveSpace = async () => {
    if (!selectedSpace) {
      alert('스페이스를 선택해주세요.');
      return;
    }

    const spaceName = selectedSpace.spaceName || selectedSpace.name || '이 스페이스';

    if (window.confirm(`정말 "${spaceName}"에서 나가시겠습니까?\n\n스페이스에서 나가면 다시 초대받아야 합니다.`)) {
      try {
        const spaceId = selectedSpace.id || selectedSpace.spaceId;
        await spaceService.leaveSpace(user.id, spaceId);

        // 전역 상태에서 해당 스페이스 제거
        const updatedSpaces = spaces.filter(s => (s.id || s.spaceId) !== spaceId);
        setSpaces(updatedSpaces);

        // 다른 스페이스가 있으면 첫 번째 스페이스 선택, 없으면 null
        if (updatedSpaces.length > 0) {
          setSelectedSpace(updatedSpaces[0]);
        } else {
          setSelectedSpace(null);
        }

        alert('스페이스에서 나갔습니다.');
      } catch (error) {
        console.error('❌ 방 나가기 실패:', error);
        alert('스페이스 나가기에 실패했습니다.');
      }
    }
  };

  // 메뉴 아이템 컴포넌트
  const MenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => {
    const colorClass = variant === 'danger' ? 'text-red-600 hover:bg-red-50 active:bg-red-100' :
                      variant === 'admin' ? 'text-purple-700 hover:bg-purple-50 active:bg-purple-100' :
                      'text-gray-700 hover:bg-blue-50 active:bg-blue-100';
    const iconBgClass = variant === 'danger' ? 'bg-red-50' :
                       variant === 'admin' ? 'bg-purple-50' :
                       'bg-blue-50';
    const iconColorClass = variant === 'danger' ? 'text-red-600' :
                          variant === 'admin' ? 'text-purple-600' :
                          'text-blue-600';

    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 transition-all hover:shadow-md hover:border-transparent ${colorClass}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}>
            <Icon className={`w-5 h-5 ${iconColorClass}`} />
          </div>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-24">
      {/* 메뉴 섹션 */}
      <div className="px-4 pt-6 space-y-8 pb-4">
        {/* 스페이스 메뉴 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-4">
            스페이스
          </h3>

          <MenuItem
            icon={Share2}
            label="초대 코드 공유"
            onClick={handleShare}
          />

          {/* 스페이스 관리 (vice-manager, manager만) */}
          {selectedSpace?.userType && canManageSpace(selectedSpace.userType) && (
            <MenuItem
              icon={Settings2}
              label="스페이스 관리"
              onClick={() => navigate('/space/manage')}
            />
          )}
        </div>

        {/* 추가 기능 메뉴 (활성화된 기능만 표시) */}
        {!loadingFeatures && (() => {
          // 활성화된 기능을 순서대로 정렬
          const enabledFeatures = Object.entries(featuresConfig)
            .filter(([_, config]) => config.enabled)
            .sort((a, b) => {
              const orderA = a[1].order || 999;
              const orderB = b[1].order || 999;
              if (orderA !== orderB) return orderA - orderB;
              return a[0].localeCompare(b[0]);
            })
            .map(([id]) => id);

          if (enabledFeatures.length === 0) return null;

          return (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-4">
                추가 기능
              </h3>

              {enabledFeatures.map((featureId) => {
                const feature = AVAILABLE_FEATURES[featureId];
                if (!feature) return null;

                const Icon = feature.icon;

                return (
                  <MenuItem
                    key={featureId}
                    icon={Icon}
                    label={feature.name}
                    onClick={() => navigate(feature.path)}
                  />
                );
              })}
            </div>
          );
        })()}

        {/* 방 나가기 */}
        <div className="space-y-3">
          <MenuItem
            icon={LogOut}
            label="방 나가기"
            onClick={handleLeaveSpace}
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
};

export default MorePage;
