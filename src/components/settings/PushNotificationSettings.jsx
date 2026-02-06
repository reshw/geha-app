import { useState } from 'react';
import { Bell, BellOff, AlertCircle, Smartphone, Send } from 'lucide-react';
import { usePushNotification } from '../../hooks/usePushNotification';
import { isPWAInstalled, shouldShowIOSInstallGuide, markIOSInstallGuideSeen } from '../../utils/pushUtils';

const PushNotificationSettings = () => {
  const {
    isSubscribed,
    isLoading,
    permission,
    settings,
    subscribe,
    unsubscribe,
    updateSettings,
    sendTest,
    isSupported,
    isIOSSupported
  } = usePushNotification();

  const [showIOSGuide, setShowIOSGuide] = useState(shouldShowIOSInstallGuide());

  const handleToggle = async () => {
    if (isSubscribed) {
      if (window.confirm('푸시 알림을 비활성화하시겠습니까?')) {
        await unsubscribe();
      }
    } else {
      await subscribe();
    }
  };

  const handleTypeToggle = (type) => {
    const newSettings = {
      ...settings,
      types: {
        ...settings.types,
        [type]: !settings.types[type]
      }
    };
    updateSettings(newSettings);
  };

  const closeIOSGuide = () => {
    setShowIOSGuide(false);
    markIOSInstallGuideSeen();
  };

  // 푸시 알림 미지원 (단, iOS는 별도 체크)
  if (!isSupported && !isIOSSupported) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3 text-gray-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
        </div>
      </div>
    );
  }

  // iOS PWA 설치 안내
  if (showIOSGuide) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              iOS에서 푸시 알림을 받으려면
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 mb-4 list-decimal list-inside">
              <li>Safari 하단의 <strong>공유</strong> 버튼 탭</li>
              <li><strong>홈 화면에 추가</strong> 선택</li>
              <li>추가 후 홈 화면 아이콘으로 앱 실행</li>
              <li>이 페이지에서 푸시 알림 활성화</li>
            </ol>
            <button
              onClick={closeIOSGuide}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              알겠습니다
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 푸시 알림 활성화/비활성화 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">푸시 알림</h3>
              <p className="text-sm text-gray-600">
                {isSubscribed ? '활성화됨' : '비활성화됨'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={isLoading || permission === 'denied'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '처리 중...' : isSubscribed ? '비활성화' : '활성화'}
          </button>
        </div>

        {permission === 'denied' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              알림 권한이 차단되었습니다. 브라우저 설정에서 알림 권한을 허용해주세요.
            </p>
          </div>
        )}

        {isSubscribed && !isPWAInstalled() && isIOSSupported && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-blue-800">
              iOS에서 푸시 알림을 받으려면 홈 화면에 앱을 추가해야 합니다.
            </p>
          </div>
        )}

        {/* 테스트 버튼 */}
        {isSubscribed && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={sendTest}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {isLoading ? '발송 중...' : '테스트 알림 보내기'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              푸시 알림이 정상 작동하는지 테스트합니다
            </p>
          </div>
        )}
      </div>

      {/* 알림 유형별 설정 */}
      {isSubscribed && settings && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">알림 유형 선택</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">예약 알림</span>
              <input
                type="checkbox"
                checked={settings.types.reservation}
                onChange={() => handleTypeToggle('reservation')}
                className="w-5 h-5 text-blue-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">정산 알림</span>
              <input
                type="checkbox"
                checked={settings.types.settlement}
                onChange={() => handleTypeToggle('settlement')}
                className="w-5 h-5 text-blue-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">운영비 알림</span>
              <input
                type="checkbox"
                checked={settings.types.expense}
                onChange={() => handleTypeToggle('expense')}
                className="w-5 h-5 text-blue-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">칭찬 알림</span>
              <input
                type="checkbox"
                checked={settings.types.praise}
                onChange={() => handleTypeToggle('praise')}
                className="w-5 h-5 text-blue-600"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default PushNotificationSettings;
