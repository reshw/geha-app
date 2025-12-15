// components/common/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 컨텐츠 */}
      <Outlet />
      
      {/* 하단 네비게이션 - 모든 페이지에 공통 적용 */}
      <BottomNav />
    </div>
  );
}