// pages/SlopesPage.jsx
import { useState } from 'react';
import { MountainSnow } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginOverlay from '../components/auth/LoginOverlay';

export default function SlopesPage() {
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('slopes'); // 'slopes' | 'video'

  const tabs = {
    slopes: {
      label: '오픈슬로프',
      url: 'https://slope.scnd.kr/phoenix'
    },
    video: {
      label: '현장영상',
      url: 'https://phoenixhnr.co.kr/page/pyeongchang/guide/operation/sketchMovie'
    }
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[720px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <MountainSnow className="text-blue-600" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">슬로프 현황</h1>
              <p className="text-sm text-gray-600">휘닉스 평창 스노우파크</p>
            </div>
          </div>
          
          {/* 탭 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('slopes')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'slopes'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              오픈슬로프
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'video'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              현장영상
            </button>
            <button
              onClick={() => window.open('https://www.snow-forecast.com/resorts/Phoenix-Park-Ski-World/6day/mid', '_blank')}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              snow-forecast
            </button>
          </div>
          
          {/* 안내 문구 */}
          <div className="mt-2">
            <p className="text-xs text-center text-gray-500">
              💡 오픈 현황은 오늘슬로프(slope.scnd.kr), 영상은 휘닉스 파크 공식 홈페이지에서 제공됩니다
            </p>
          </div>
        </div>
      </header>

      {/* iframe - 영역 최대화 */}
      <div className="max-w-[720px] mx-auto">
        <iframe
          key={activeTab}
          src={tabs[activeTab].url}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 180px - 64px)' }} // 전체 - 헤더 - BottomNav
          title={`휘닉스 파크 ${tabs[activeTab].label}`}
          loading="lazy"
        />
      </div>

      {/* BottomNav를 위한 여백 */}
      <div style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
    </div>
  );
}