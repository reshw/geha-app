// pages/SlopesPage.jsx
import { ExternalLink, Mountain } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginOverlay from '../components/auth/LoginOverlay';

export default function SlopesPage() {
  const { isLoggedIn } = useAuth();

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
            
            <a
              href="https://phoenixhnr.co.kr/m/static/pyeongchang/snowpark/slope-lift?tabId=3"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <ExternalLink size={16} />
              새창으로
            </a>
          </div>
        </div>
      </header>

      {/* iframe */}
      <div className="max-w-[720px] mx-auto">
        <iframe
          src="https://phoenixhnr.co.kr/m/static/pyeongchang/snowpark/slope-lift?tabId=3"
          className="w-full border-0"
          style={{ height: 'calc(100vh - 140px)' }}
          title="휘닉스 파크 슬로프 현황"
          loading="lazy"
        />
      </div>

      {/* 안내 */}
      <div className="max-w-[720px] mx-auto px-4 py-3 bg-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-800 text-center">
          💡 실시간 슬로프 현황은 휘닉스 파크 공식 홈페이지에서 제공됩니다
        </p>
      </div>
    </div>
  );
}