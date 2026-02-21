import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AVAILABLE_APPS } from '../../config/apps';

/**
 * 앱 전환 드롭다운 컴포넌트
 *
 * 슈퍼앱 내에서 여러 앱(시즌방, 카풀 등) 간 전환을 제공합니다.
 */
const AppSwitcher = ({ currentApp, onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentAppData = AVAILABLE_APPS[currentApp];
  const availableApps = Object.values(AVAILABLE_APPS).filter(app => app.enabled);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (appId) => {
    onSwitch(appId);
    setIsOpen(false);
  };

  if (!currentAppData) {
    return null;
  }

  const CurrentIcon = currentAppData.icon;

  return (
    <div ref={dropdownRef} className="relative">
      {/* 현재 앱 표시 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all"
        style={{ minWidth: '120px' }}
      >
        <CurrentIcon className="w-5 h-5 text-white" />
        <span className="font-semibold text-white text-sm">{currentAppData.name}</span>
        <ChevronDown
          className="w-4 h-4 text-white/70 ml-auto transition-transform"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden min-w-[220px] z-50">
          {availableApps.map((app) => {
            const AppIcon = app.icon;
            const isSelected = currentApp === app.id;

            return (
              <button
                key={app.id}
                onClick={() => handleSelect(app.id)}
                className={`w-full px-4 py-3 flex items-start gap-3 transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <AppIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  isSelected ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <div className="text-left flex-1">
                  <div className={`font-semibold text-sm ${
                    isSelected ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {app.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {app.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppSwitcher;
