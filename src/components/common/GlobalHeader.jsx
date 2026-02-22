// components/common/GlobalHeader.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCog, FileText, LogOut, ShieldCheck, TestTube } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import resortService from '../../services/resortService';
import tierService from '../../services/tierService';
import spaceSettingsService from '../../services/spaceSettingsService';
import AppSwitcher from './AppSwitcher';
import SpaceDropdown from '../space/SpaceDropdown';
import ResortDropdown from '../carpool/ResortDropdown';
import CreateSpaceModal from '../space/CreateSpaceModal';
import UserTypeBadge from './UserTypeBadge';

const GlobalHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    currentApp,
    setCurrentApp,
    spaces,
    selectedSpace,
    setSpaces,
    setSelectedSpace,
    setTierConfig,
    updateSpaceOrder,
    removeSpace,
    resorts,
    selectedResort,
    setResorts,
    setSelectedResort,
    updateResortOrder
  } = useStore();

  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [toast, setToast] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // 디버깅: 카풀 앱 상태 확인
  useEffect(() => {
    if (currentApp === 'carpool') {
      console.log('🔍 [GlobalHeader] 카풀 앱 상태:', {
        currentApp,
        resorts,
        selectedResort,
        resortsLength: resorts?.length
      });
    }
  }, [currentApp, resorts, selectedResort]);

  // 스페이스 로드는 WeeklyList에서만 처리 (중복 제거)

  // 스페이스 선택 시 tierConfig 자동 로드
  const handleSelectSpace = async (space) => {
    setSelectedSpace(space);

    const spaceId = space?.id || space?.spaceId;
    if (spaceId) {
      try {
        const [tierConfig, spaceSettings] = await Promise.all([
          tierService.getTierConfig(spaceId),
          spaceSettingsService.getSpaceSettings(spaceId),
        ]);
        setTierConfig(spaceId, tierConfig);
        // spaces/{spaceId}의 설정값을 Zustand에 병합
        const updates = {};
        if (spaceSettings?.currency) updates.currency = spaceSettings.currency;
        updates.seasonOutEnabled = spaceSettings?.seasonOutEnabled ?? true;
        setSelectedSpace({ ...space, ...updates });
      } catch (error) {
        console.error('⚠️ 스페이스 설정 로드 실패:', error);
      }
    }
  };

  // 스페이스 순서 변경
  const handleSpaceReorder = async (updatedSpaces) => {
    try {
      await spaceService.updateSpaceOrder(user.id, updatedSpaces);
      updateSpaceOrder(updatedSpaces);
    } catch (error) {
      console.error('❌ 스페이스 순서 변경 실패:', error);
    }
  };

  // 스페이스 생성 신청
  const handleCreateSpace = () => {
    setShowCreateSpaceModal(true);
  };

  // 스키장 선택
  const handleSelectResort = async (resort) => {
    setSelectedResort(resort);
    // 마지막 방문 업데이트
    if (resort?.id) {
      try {
        await resortService.updateLastVisited(user?.id, resort.id);
      } catch (error) {
        console.error('⚠️ 스키장 방문 기록 실패:', error);
      }
    }
  };

  // 스키장 순서 변경
  const handleResortReorder = async (updatedResorts) => {
    try {
      await resortService.updateResortOrder(user.id, updatedResorts);
      updateResortOrder(updatedResorts);
    } catch (error) {
      console.error('❌ 스키장 순서 변경 실패:', error);
    }
  };

  // 스키장 추가 (추후 구현)
  const handleAddResort = () => {
    alert('스키장 추가 기능은 준비 중입니다.');
  };

  // 스페이스 생성 제출
  const handleSubmitCreateSpace = async (spaceNameOrData) => {
    setIsCreatingSpace(true);
    try {
      // 문자열이면 객체로 변환
      const spaceData = typeof spaceNameOrData === 'string'
        ? { spaceName: spaceNameOrData }
        : spaceNameOrData;

      const newSpace = await spaceService.createSpace(user.id, spaceData);

      // 새 스페이스를 전역 상태에 추가하고 자동 선택
      const updatedSpaces = [...spaces, newSpace];
      setSpaces(updatedSpaces);
      setSelectedSpace(newSpace);

      setShowCreateSpaceModal(false);
      setToast({ message: '스페이스가 생성되었습니다', type: 'success' });
    } catch (error) {
      console.error('❌ 스페이스 생성 실패:', error);
      setToast({ message: '스페이스 생성에 실패했습니다', type: 'error' });
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // 앱 전환 핸들러
  const handleAppSwitch = (appId) => {
    setCurrentApp(appId);
    // 앱 전환 시 메인 페이지로 이동
    navigate('/');
  };

  // 로그인하지 않았거나 컨텍스트(스페이스/스키장)가 없으면 표시하지 않음
  const hasContext = currentApp === 'geha'
    ? (spaces && spaces.length > 0)
    : (resorts && resorts.length > 0);

  if (!user || !hasContext) {
    // 카풀 앱인데 스키장이 없는 경우는 일단 표시 (나중에 자동 추가)
    if (!user) return null;
    if (currentApp === 'carpool') {
      // 카풀 앱은 스키장이 없어도 헤더 표시 (초기화 로직이 있음)
    } else if (!hasContext) {
      return null;
    }
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-gradient-to-br from-blue-700 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 앱 전환 + 컨텍스트 선택 */}
            <div className="flex items-center gap-3 flex-1">
              {/* 앱 전환 드롭다운 - TODO: 베타 완료 후 다시 활성화 */}
              {false && (
                <AppSwitcher
                  currentApp={currentApp}
                  onSwitch={handleAppSwitch}
                />
              )}

              {/* 컨텍스트 드롭다운 (스페이스 or 스키장) */}
              {currentApp === 'geha' && spaces && spaces.length > 0 && (
                <div className="flex-1 max-w-xs">
                  <SpaceDropdown
                    spaces={spaces}
                    selectedSpace={selectedSpace}
                    onSelect={handleSelectSpace}
                    onReorder={handleSpaceReorder}
                    onCreateSpace={handleCreateSpace}
                  />
                </div>
              )}

              {currentApp === 'carpool' && resorts && resorts.length > 0 && (
                <div className="flex-1 max-w-xs">
                  <ResortDropdown
                    resorts={resorts}
                    selectedResort={selectedResort}
                    onSelect={handleSelectResort}
                    onReorder={handleResortReorder}
                    onAddResort={handleAddResort}
                  />
                </div>
              )}
            </div>

            {/* 오른쪽: 프로필 메뉴 */}
            <div className="flex items-center gap-2">
              {user?.profileImage && (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-9 h-9 rounded-full ring-2 ring-white/30 hover:ring-white/50 transition-all"
                  >
                    <img
                      src={user.profileImage}
                      alt={user.displayName || user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </button>

                  {/* 프로필 드롭다운 */}
                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden min-w-[220px]">
                        {/* 사용자 정보 */}
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="font-semibold text-gray-900">
                            {user.displayName || user.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {selectedSpace?.userType && (
                              <UserTypeBadge userType={selectedSpace.userType} size="xs" />
                            )}
                          </div>
                        </div>

                        {/* 메뉴 아이템 */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              alert('개인정보 수정 기능은 준비 중입니다.');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                          >
                            <UserCog className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">개인정보 수정</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/terms');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                          >
                            <FileText className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">이용약관</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/privacy');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-3"
                          >
                            <FileText className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">개인정보처리방침</span>
                          </button>

                          {/* 슈퍼어드민 메뉴 */}
                          {user?.isSuperAdmin && (
                            <>
                              <div className="border-t border-gray-100 mt-2 pt-2">
                                <button
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    navigate('/super-admin');
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors text-purple-600 flex items-center gap-3"
                                >
                                  <ShieldCheck className="w-5 h-5" />
                                  <span className="font-medium">슈퍼어드민</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    navigate('/test-data');
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors text-purple-600 flex items-center gap-3"
                                >
                                  <TestTube className="w-5 h-5" />
                                  <span className="font-medium">테스트 데이터</span>
                                </button>
                              </div>
                            </>
                          )}

                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                if (window.confirm('로그아웃 하시겠습니까?')) {
                                  logout();
                                  navigate('/');
                                }
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-red-600 flex items-center gap-3"
                            >
                              <LogOut className="w-5 h-5" />
                              <span className="font-medium">로그아웃</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 스페이스 생성 모달 */}
      <CreateSpaceModal
        isOpen={showCreateSpaceModal}
        onClose={() => setShowCreateSpaceModal(false)}
        onSubmit={handleSubmitCreateSpace}
        isLoading={isCreatingSpace}
      />

      {/* 토스트 알림 */}
      {toast && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-[99999] px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slideDown max-w-[90vw]"
          style={{
            top: 'max(20px, env(safe-area-inset-top, 20px))',
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white'
          }}
        >
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default GlobalHeader;
