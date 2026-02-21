// components/common/MainLayout.jsx
import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useStore from '../../store/useStore';
import spaceService from '../../services/spaceService';
import resortService from '../../services/resortService';
import BottomNav from './BottomNav';
import GlobalHeader from './GlobalHeader';

export default function MainLayout() {
  const { user } = useAuth();
  const { currentApp, setSpaces, setSelectedSpace, setResorts, setSelectedResort } = useStore();
  const hasInitializedSpaces = useRef(false);
  const hasInitializedResorts = useRef(false);

  // 스페이스 로드 (geha 앱용, 한 번만)
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user?.id || hasInitializedSpaces.current) return;

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

        hasInitializedSpaces.current = true;
      } catch (error) {
        console.error('❌ 스페이스 로드 실패:', error);
      }
    };

    loadSpaces();
  }, [user, setSpaces, setSelectedSpace]);

  // 스키장 로드 (carpool 앱용, 한 번만)
  useEffect(() => {
    const loadResorts = async () => {
      if (!user?.id || currentApp !== 'carpool' || hasInitializedResorts.current) return;

      try {
        // initUserResorts는 스키장이 없으면 자동 추가
        const resorts = await resortService.initUserResorts(user.id);
        setResorts(resorts);

        // 스키장이 있으면 마지막 선택 또는 첫 번째 선택
        if (resorts.length > 0) {
          const lastSelectedId = localStorage.getItem('lastSelectedResortId');
          const lastResort = resorts.find(r => r.id === lastSelectedId);
          const resortToSelect = lastResort || resorts.find(r => r.order === 0) || resorts[0];
          setSelectedResort(resortToSelect);
        }

        hasInitializedResorts.current = true;
        console.log('✅ 스키장 초기화 완료:', resorts.length, '개');
      } catch (error) {
        console.error('❌ 스키장 로드 실패:', error);
      }
    };

    loadResorts();
  }, [user, currentApp, setResorts, setSelectedResort]);

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