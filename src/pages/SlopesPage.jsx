// pages/SlopesPage.jsx
import { useState } from 'react';
import { Mountain } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginOverlay from '../components/auth/LoginOverlay';

export default function SlopesPage() {
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('slopes'); // 'slopes' or 'video'

  const tabs = {
    slopes: {
      label: '오픈슬로프',
      url: 'https://phoenixhnr.co.kr/m/static/pyeongchang/snowpark/slope-lift?tabId=3'
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[720px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mountain className="text-blue-600" size={24} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">슬로프 현황</h1>
                <p className="text-sm text-gray-600">휘닉스 평창 스노우파크</p>
              </div>
            </div>
            
            {/* 탭 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('slopes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'slopes'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                오픈슬로프
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'video'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                현장영상
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* iframe */}
      <div className="max-w-[720px] mx-auto">
        <iframe
          key={activeTab} // 탭 변경 시 iframe 리로드
          src={tabs[activeTab].url}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 140px)' }}
          title={`휘닉스 파크 ${tabs[activeTab].label}`}
          loading="lazy"
        />
      </div>

      {/* 안내 */}
      <div className="max-w-[720px] mx-auto px-4 py-3 bg-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-800 text-center">
          💡 {tabs[activeTab].label} 정보는 휘닉스 파크 공식 홈페이지에서 제공됩니다
        </p>
      </div>
    </div>
  );
}