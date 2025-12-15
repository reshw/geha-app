// components/common/BottomNav.jsx
import { Home, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-[600px] mx-auto flex">
        <Link 
          to="/" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all ${
            isActive('/') 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className={`text-xs ${isActive('/') ? 'font-bold' : 'font-normal'}`}>
            예약
          </span>
        </Link>
        
        <Link 
          to="/praise" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all ${
            isActive('/praise') 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Heart size={22} strokeWidth={isActive('/praise') ? 2.5 : 2} />
          <span className={`text-xs ${isActive('/praise') ? 'font-bold' : 'font-normal'}`}>
            칭찬
          </span>
        </Link>
      </div>
    </nav>
  );
}