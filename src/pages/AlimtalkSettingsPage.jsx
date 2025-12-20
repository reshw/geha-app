import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, Bell, BellOff, Info, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AlimtalkSettingsPage() {
  const navigate = useNavigate();
  const { user, selectedSpace } = useStore();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
      const data = await spaceSettingsService.getAlimtalkSettings(spaceId);
      setSettings(data);
    } catch (error) {
      console.error('알림톡 설정 로드 실패:', error);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 활성화 신청
  const handleRequestActivation = async () => {
    const confirmed = window.confirm(
      '알림톡 활성화를 신청하시겠습니까?\n\n슈퍼 관리자의 승인 후 활성화됩니다.'
    );
    if (!confirmed) return;

    try {
      setProcessing(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);

      await spaceSettingsService.requestAlimtalkActivation(
        spaceId,
        user.id,
        user.displayName || user.name,
        userSpaceData?.userType || 'manager',
        selectedSpace.spaceName || selectedSpace.name
      );

      alert('알림톡 활성화 신청이 완료되었습니다.\n\n슈퍼 관리자의 승인을 기다려주세요.');
      await loadSettings();
    } catch (error) {
      console.error('알림톡 활성화 신청 실패:', error);
      alert('신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 비활성화
  const handleDeactivate = async () => {
    const confirmed = window.confirm(
      '알림톡을 비활성화하시겠습니까?\n\n예약 완료 시 알림톡이 발송되지 않습니다.'
    );
    if (!confirmed) return;

    try {
      setProcessing(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);

      await spaceSettingsService.deactivateAlimtalk(
        spaceId,
        user.id,
        user.displayName || user.name,
        userSpaceData?.userType || 'manager'
      );

      alert('알림톡이 비활성화되었습니다.');
      await loadSettings();
    } catch (error) {
      console.error('알림톡 비활성화 실패:', error);
      alert('비활성화에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 상태별 UI 정보
  const getStatusInfo = () => {
    if (!settings) return null;

    switch (settings.status) {
      case 'approved':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-400',
          bgColor: 'bg-green-500/10 border-green-500/30',
          textColor: 'text-green-300',
          title: '✓ 알림톡 활성화됨',
          description: '예약 완료 시 게스트에게 알림톡이 자동으로 발송됩니다.',
          showButton: true,
          buttonText: '비활성화',
          buttonAction: handleDeactivate,
          buttonColor: 'from-red-500 to-red-600'
        };
      
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10 border-yellow-500/30',
          textColor: 'text-yellow-300',
          title: '⏳ 승인 대기 중',
          description: '슈퍼 관리자의 승인을 기다리고 있습니다. 승인 후 활성화됩니다.',
          showButton: false
        };
      
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/30',
          textColor: 'text-red-300',
          title: '✗ 신청 거부됨',
          description: settings.rejectionReason || '알림톡 활성화 신청이 거부되었습니다.',
          showButton: true,
          buttonText: '다시 신청하기',
          buttonAction: handleRequestActivation,
          buttonColor: 'from-blue-500 to-blue-600'
        };
      
      default: // inactive
        return {
          icon: BellOff,
          iconColor: 'text-slate-400',
          bgColor: 'bg-slate-500/10 border-slate-500/30',
          textColor: 'text-slate-300',
          title: '✗ 알림톡 비활성화됨',
          description: '예약 완료 시 알림톡이 발송되지 않습니다. 활성화를 신청하세요.',
          showButton: true,
          buttonText: '활성화 신청',
          buttonAction: handleRequestActivation,
          buttonColor: 'from-green-500 to-green-600'
        };
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

  const statusInfo = getStatusInfo();

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
            {/* 현재 상태 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusInfo && (
                  <statusInfo.icon className={`w-6 h-6 ${statusInfo.iconColor}`} />
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
            </div>

            {/* 상태 표시 */}
            {statusInfo && (
              <div className={`rounded-lg p-4 ${statusInfo.bgColor}`}>
                <p className={`font-medium ${statusInfo.textColor}`}>
                  {statusInfo.title}
                </p>
                <p className={`text-sm mt-1 ${statusInfo.textColor.replace('300', '200/80')}`}>
                  {statusInfo.description}
                </p>
              </div>
            )}

            {/* 신청/승인 정보 */}
            {settings?.requestedAt && (
              <div className="text-xs text-slate-400 pt-4 border-t border-slate-600/30 space-y-1">
                <p>
                  신청일: {settings.requestedAt.toDate?.().toLocaleString('ko-KR') || '알 수 없음'}
                </p>
                {settings.requestedBy && (
                  <p>신청자: {settings.requestedBy.displayName}</p>
                )}
                {settings.approvedAt && settings.approvedBy && (
                  <>
                    <p>승인일: {settings.approvedAt.toDate?.().toLocaleString('ko-KR')}</p>
                    <p>승인자: {settings.approvedBy.displayName}</p>
                  </>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            {statusInfo?.showButton && (
              <button
                onClick={statusInfo.buttonAction}
                disabled={processing}
                className={`w-full px-6 py-4 bg-gradient-to-r ${statusInfo.buttonColor} hover:opacity-90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    <span>{statusInfo.buttonText}</span>
                  </>
                )}
              </button>
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
                <li>• 알림톡 활성화는 슈퍼 관리자의 승인이 필요합니다.</li>
                <li>• 승인 후 예약 완료 시 게스트에게 자동으로 발송됩니다.</li>
                <li>• 알림톡에는 예약 정보와 입금 계좌가 포함됩니다.</li>
                <li>• 비활성화는 즉시 처리되며, 언제든 다시 신청할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 승인 대기 중 추가 안내 */}
        {settings?.status === 'pending' && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-1">⏳ 승인 처리 중</p>
                <p className="text-yellow-200/80">
                  슈퍼 관리자가 신청을 검토하고 있습니다. 승인되면 자동으로 활성화됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}