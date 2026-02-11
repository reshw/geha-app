// components/common/GlobalHeader.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCog, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import SpaceDropdown from '../space/SpaceDropdown';
import CreateSpaceModal from '../space/CreateSpaceModal';
import UserTypeBadge from './UserTypeBadge';

const GlobalHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    spaces,
    selectedSpace,
    setSpaces,
    setSelectedSpace,
    updateSpaceOrder,
    removeSpace
  } = useStore();

  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [toast, setToast] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const hasInitializedSpace = useRef(false);

  // 스페이스 로드
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user?.id || hasInitializedSpace.current) return;

      try {
        const loadedSpaces = await spaceService.getUserSpaces(user.id);
        setSpaces(loadedSpaces);
        hasInitializedSpace.current = true;
      } catch (error) {
        console.error('❌ 스페이스 로드 실패:', error);
      }
    };

    loadSpaces();
  }, [user, setSpaces]);

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

  // 스페이스 생성 제출
  const handleSubmitCreateSpace = async (spaceData) => {
    setIsCreatingSpace(true);
    try {
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

  // 로그인하지 않았거나 스페이스가 없으면 표시하지 않음
  if (!user || !spaces || spaces.length === 0) {
    return null;
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-gradient-to-br from-blue-700 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 스페이스 드롭다운 */}
            <div className="flex-1 max-w-xs">
              <SpaceDropdown
                spaces={spaces}
                selectedSpace={selectedSpace}
                onSelect={setSelectedSpace}
                onReorder={handleSpaceReorder}
                onCreateSpace={handleCreateSpace}
              />
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
      {showCreateSpaceModal && (
        <CreateSpaceModal
          onClose={() => setShowCreateSpaceModal(false)}
          onSubmit={handleSubmitCreateSpace}
          isSubmitting={isCreatingSpace}
        />
      )}

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
