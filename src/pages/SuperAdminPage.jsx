import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { ArrowLeft, CheckCircle, XCircle, Clock, Shield, AlertTriangle } from 'lucide-react';

// 슈퍼 어드민 사용자 ID 목록
const SUPER_ADMIN_IDS = [
  '3828221463', // 양석환
  // 필요시 추가
];

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 슈퍼 어드민 권한 체크
  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    if (!SUPER_ADMIN_IDS.includes(user.id)) {
      alert('슈퍼 관리자만 접근할 수 있습니다.');
      navigate('/');
      return;
    }

    loadRequests();
  }, [user, navigate]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await spaceSettingsService.getPendingAlimtalkRequests();
      setRequests(data);
    } catch (error) {
      console.error('신청 목록 로드 실패:', error);
      alert('신청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 승인
  const handleApprove = async (request) => {
    const confirmed = window.confirm(
      `${request.spaceName}의 알림톡 활성화를 승인하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      setProcessing(true);
      await spaceSettingsService.approveAlimtalkRequest(
        request.id,
        request.spaceId,
        user.id,
        user.displayName || user.name
      );

      alert('알림톡 활성화가 승인되었습니다.');
      await loadRequests();
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 거부
  const handleReject = async (request) => {
    const reason = window.prompt(
      `${request.spaceName}의 알림톡 활성화를 거부하시겠습니까?\n\n거부 사유를 입력하세요:`
    );
    
    if (reason === null) return; // 취소
    if (!reason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      await spaceSettingsService.rejectAlimtalkRequest(
        request.id,
        request.spaceId,
        user.id,
        user.displayName || user.name,
        reason.trim()
      );

      alert('알림톡 활성화가 거부되었습니다.');
      await loadRequests();
    } catch (error) {
      console.error('거부 실패:', error);
      alert('거부에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">신청 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/30 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                슈퍼 관리자 페이지
              </h1>
              <p className="text-sm text-slate-300">알림톡 활성화 신청 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 신청 목록 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-5 h-5" />
            <span className="font-medium">대기 중인 신청 {requests.length}건</span>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-600/30 rounded-xl p-8 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">대기 중인 신청이 없습니다</p>
            <p className="text-sm text-slate-400 mt-2">
              새로운 알림톡 활성화 신청이 들어오면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 신청 정보 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {request.spaceName}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-slate-300">
                      <p>
                        <span className="text-slate-400">신청자:</span>{' '}
                        {request.requestedBy?.displayName || '알 수 없음'}
                      </p>
                      <p>
                        <span className="text-slate-400">권한:</span>{' '}
                        {request.requestedBy?.userType === 'manager' ? '매니저' : 
                         request.requestedBy?.userType === 'vice-manager' ? '부매니저' : '알 수 없음'}
                      </p>
                      <p>
                        <span className="text-slate-400">신청일:</span>{' '}
                        {request.requestedAt?.toDate?.().toLocaleString('ko-KR') || '알 수 없음'}
                      </p>
                      <p>
                        <span className="text-slate-400">스페이스 ID:</span>{' '}
                        <code className="bg-slate-900/50 px-2 py-0.5 rounded text-xs">
                          {request.spaceId}
                        </code>
                      </p>
                    </div>
                  </div>

                  {/* 승인/거부 버튼 */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={processing}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>승인</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(request)}
                      disabled={processing}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>거부</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium mb-2">⚠️ 슈퍼 관리자 안내</p>
              <ul className="space-y-1 text-yellow-200/80">
                <li>• 승인 시 해당 스페이스의 알림톡이 즉시 활성화됩니다.</li>
                <li>• 거부 시 사유를 입력해야 하며, 신청자가 확인할 수 있습니다.</li>
                <li>• 승인/거부된 신청은 목록에서 사라집니다.</li>
                <li>• 거부된 경우에도 재신청이 가능합니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {processing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-center">처리 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}