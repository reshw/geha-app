import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, Bell, BellOff, Info } from 'lucide-react';

export default function AlimtalkSettingsPage() {
  const navigate = useNavigate();
  const { user, selectedSpace } = useStore();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 권한 체크 및 초기 데이터 로드
  useEffect(() => {
    if (!user || !selectedSpace) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    const spaceId = selectedSpace.id || selectedSpace.spaceId;
    const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);
    
    if (!userSpaceData || !canManageSpace(userSpaceData.userType)) {
      alert('접근 권한이 없습니다.');
      navigate('/');
      return;
    }

    loadSettings();
  }, [user, selectedSpace, navigate]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const settings = await spaceSettingsService.getAlimtalkSettings(spaceId);
      
      setEnabled(settings.enabled ?? true);
      
      if (settings.updatedAt) {
        const updatedDate = settings.updatedAt.toDate?.() || new Date(settings.updatedAt);
        setLastUpdated({
          date: updatedDate,
          by: settings.updatedBy?.displayName || '알 수 없음'
        });
      }
    } catch (error) {
      console.error('알림톡 설정 로드 실패:', error);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newValue) => {
    const message = newValue
      ? '알림톡을 활성화하시겠습니까?\n\n예약 완료 시 게스트에게 알림톡이 자동으로 발송됩니다.'
      : '알림톡을 비활성화하시겠습니까?\n\n예약 완료 시 알림톡이 발송되지 않습니다.';

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    try {
      setSaving(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);

      await spaceSettingsService.updateAlimtalkSettings(
        spaceId,
        newValue,
        user.id,
        user.displayName || user.name,
        userSpaceData?.userType || 'manager'
      );

      setEnabled(newValue);
      setLastUpdated({
        date: new Date(),
        by: user.displayName || user.name
      });

      alert(newValue ? '알림톡이 활성화되었습니다.' : '알림톡이 비활성화되었습니다.');
    } catch (error) {
      console.error('알림톡 설정 변경 실패:', error);
      alert('설정 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/30 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/space/manage')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">알림톡 설정</h1>
              <p className="text-sm text-slate-300">{selectedSpace?.spaceName || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 설정 카드 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 shadow-lg">
          <div className="space-y-6">
            {/* 알림톡 토글 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {enabled ? (
                  <Bell className="w-6 h-6 text-green-400" />
                ) : (
                  <BellOff className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    알림톡 발송
                  </h3>
                  <p className="text-sm text-slate-400">
                    예약 완료 시 게스트에게 자동 발송
                  </p>
                </div>
              </div>

              {/* 토글 스위치 */}
              <button
                onClick={() => handleToggle(!enabled)}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 ${
                  enabled ? 'bg-green-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 상태 표시 */}
            <div className={`rounded-lg p-4 ${
              enabled
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-slate-500/10 border border-slate-500/30'
            }`}>
              <p className={`font-medium ${
                enabled ? 'text-green-300' : 'text-slate-300'
              }`}>
                {enabled ? '✓ 알림톡 활성화됨' : '✗ 알림톡 비활성화됨'}
              </p>
              <p className={`text-sm mt-1 ${
                enabled ? 'text-green-200/80' : 'text-slate-400'
              }`}>
                {enabled
                  ? '예약 완료 시 게스트에게 알림톡이 자동으로 발송됩니다.'
                  : '예약 완료 시 알림톡이 발송되지 않습니다. 필요시 수동으로 연락하세요.'
                }
              </p>
            </div>

            {/* 마지막 변경 정보 */}
            {lastUpdated && (
              <div className="text-xs text-slate-400 pt-4 border-t border-slate-600/30">
                <p>
                  마지막 변경: {lastUpdated.date.toLocaleString('ko-KR')}
                </p>
                <p>변경자: {lastUpdated.by}</p>
              </div>
            )}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-2">💡 알림톡 안내</p>
              <ul className="space-y-1 text-blue-200/80">
                <li>• 알림톡은 예약이 완료되면 자동으로 게스트에게 발송됩니다.</li>
                <li>• 알림톡에는 예약 정보와 입금 계좌가 포함됩니다.</li>
                <li>• 비활성화하면 예약 완료 시 알림톡이 발송되지 않습니다.</li>
                <li>• 관리자(reshw@naver.com)에게는 항상 이메일이 발송됩니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 테스트 발송 안내 (향후 기능) */}
        <div className="mt-4 bg-slate-700/30 border border-slate-600/30 rounded-xl p-4">
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-300">💬 테스트 발송</span>
            <br />
            알림톡 테스트 발송 기능은 향후 업데이트 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
