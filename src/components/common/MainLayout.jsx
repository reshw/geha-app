// components/common/MainLayout.jsx
import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import BottomNav from './BottomNav';
import GlobalHeader from './GlobalHeader';

export default function MainLayout() {
  const { user } = useAuth();
  const { setSpaces, setSelectedSpace } = useStore();
  const hasInitialized = useRef(false);

  // 스페이스 로드 (한 번만, 모든 페이지에서 공유)
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user?.id || hasInitialized.current) return;

      try {
        const spaces = await spaceService.getUserSpaces(user.id); // lightweight=true (기본값)
        setSpaces(spaces);

        // 스페이스가 있으면 마지막 선택 또는 첫 번째 선택
        if (spaces.length > 0) {
          const lastSelectedId = localStorage.getItem('lastSelectedSpaceId');
          const lastSpace = spaces.find(s => s.id === lastSelectedId);
          const spaceToSelect = lastSpace || spaces.find(s => s.order === 0) || spaces[0];
          setSelectedSpace(spaceToSelect);
        }

        hasInitialized.current = true;
      } catch (error) {
        console.error('❌ 스페이스 로드 실패:', error);
      }
    };

    loadSpaces();
  }, [user, setSpaces, setSelectedSpace]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 전역 헤더 - 스페이스 선택 */}
      <GlobalHeader />

      {/* 페이지 컨텐츠 */}
      <Outlet />

      {/* 하단 네비게이션 - 모든 페이지에 공통 적용 */}
      <BottomNav />
    </div>
  );
}