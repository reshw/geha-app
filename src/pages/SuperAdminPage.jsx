import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import spaceService from '../services/spaceService';
import adminSettingsService from '../services/adminSettingsService';
import { ArrowLeft, CheckCircle, XCircle, Clock, Shield, AlertTriangle, List, Trash2, Home, Mail, Save } from 'lucide-react';

// 슈퍼 어드민 사용자 ID 목록
const SUPER_ADMIN_IDS = [
  '3828221463', // 양석환
  // 필요시 추가
];

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState('alimtalk-pending'); // 'alimtalk-pending' | 'alimtalk-active' | 'space-pending'
  const [requests, setRequests] = useState([]);
  const [activeSpaces, setActiveSpaces] = useState([]);
  const [spaceRequests, setSpaceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [spaceCreationNotifications, setSpaceCreationNotifications] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

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

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRequests(),
        loadActiveSpaces(),
        loadSpaceRequests(),
        loadAdminSettings()
      ]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const settings = await adminSettingsService.getAdminEmailSettings();
      setAdminEmail(settings.adminEmail || '');
      setSpaceCreationNotifications(settings.spaceCreationNotifications !== false);
    } catch (error) {
      console.error('어드민 설정 로드 실패:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await spaceSettingsService.getPendingAlimtalkRequests();
      setRequests(data);
    } catch (error) {
      console.error('신청 목록 로드 실패:', error);
      throw error;
    }
  };

  const loadActiveSpaces = async () => {
    try {
      const data = await spaceSettingsService.getActiveAlimtalkSpaces();
      setActiveSpaces(data);
    } catch (error) {
      console.error('활성 스페이스 로드 실패:', error);
      throw error;
    }
  };

  const loadSpaceRequests = async () => {
    try {
      const data = await spaceService.getPendingSpaceRequests();
      setSpaceRequests(data);
    } catch (error) {
      console.error('방 생성 신청 로드 실패:', error);
      throw error;
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
      await loadData();
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 비활성화
  const handleDeactivate = async (space) => {
    const reason = window.prompt(
      `${space.spaceName}의 알림톡을 비활성화하시겠습니까?\n\n비활성화 사유를 입력하세요:`
    );

    if (reason === null) return; // 취소
    if (!reason.trim()) {
      alert('비활성화 사유를 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      await spaceSettingsService.superAdminDeactivateAlimtalk(
        space.spaceId,
        user.id,
        user.displayName || user.name,
        reason.trim()
      );

      alert('알림톡이 비활성화되었습니다.');
      await loadData();
    } catch (error) {
      console.error('비활성화 실패:', error);
      alert('비활성화에 실패했습니다. 다시 시도해주세요.');
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
      await loadData();
    } catch (error) {
      console.error('거부 실패:', error);
      alert('거부에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 방 생성 신청 승인
  const handleApproveSpace = async (request) => {
    const confirmed = window.confirm(
      `${request.spaceName} 방 생성을 승인하시겠습니까?\n\n방 코드: ${request.spaceCode}`
    );
    if (!confirmed) return;

    try {
      setProcessing(true);
      await spaceService.approveSpaceCreationRequest(
        request.id,
        request.spaceCode,
        request.spaceName,
        user.id,
        user.displayName || user.name
      );

      alert(`방 생성이 승인되었습니다.\n방 코드: ${request.spaceCode}`);
      await loadData();
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 방 생성 신청 거부
  const handleRejectSpace = async (request) => {
    const reason = window.prompt(
      `${request.spaceName} 방 생성 신청을 거부하시겠습니까?\n\n거부 사유를 입력하세요:`
    );

    if (reason === null) return; // 취소
    if (!reason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      await spaceService.rejectSpaceCreationRequest(
        request.id,
        user.id,
        user.displayName || user.name,
        reason.trim()
      );

      alert('방 생성 신청이 거부되었습니다.');
      await loadData();
    } catch (error) {
      console.error('거부 실패:', error);
      alert('거부에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 어드민 이메일 설정 저장
  const handleSaveAdminSettings = async () => {
    try {
      setSavingSettings(true);
      await adminSettingsService.updateAdminEmailSettings({
        adminEmail: adminEmail.trim(),
        spaceCreationNotifications
      });
      alert('어드민 설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSavingSettings(false);
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

      {/* 탭 메뉴 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setActiveTab('alimtalk-pending')}
            className={`py-3 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'alimtalk-pending'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5" />
              <span className="text-xs">알림톡 대기</span>
              {requests.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {requests.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('alimtalk-active')}
            className={`py-3 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'alimtalk-active'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <List className="w-5 h-5" />
              <span className="text-xs">알림톡 활성</span>
              {activeSpaces.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {activeSpaces.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('space-pending')}
            className={`py-3 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'space-pending'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Home className="w-5 h-5" />
              <span className="text-xs">방 생성 대기</span>
              {spaceRequests.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {spaceRequests.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* 알림톡 대기 중인 신청 탭 */}
        {activeTab === 'alimtalk-pending' && (
          <div>
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
          </div>
        )}

        {/* 알림톡 활성화된 스페이스 탭 */}
        {activeTab === 'alimtalk-active' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <List className="w-5 h-5" />
                <span className="font-medium">활성화된 스페이스 {activeSpaces.length}개</span>
              </div>
            </div>

            {activeSpaces.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-600/30 rounded-xl p-8 text-center">
                <List className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">활성화된 알림톡이 없습니다</p>
                <p className="text-sm text-slate-400 mt-2">
                  알림톡 활성화 신청이 승인되면 여기에 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSpaces.map((space) => (
                  <div
                    key={space.spaceId}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* 스페이스 정보 */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {space.spaceName}
                        </h3>

                        <div className="space-y-1 text-sm text-slate-300">
                          <p>
                            <span className="text-slate-400">승인자:</span>{' '}
                            {space.alimtalkSettings.approvedBy?.displayName || '알 수 없음'}
                          </p>
                          <p>
                            <span className="text-slate-400">승인일:</span>{' '}
                            {space.alimtalkSettings.approvedAt?.toDate?.().toLocaleString('ko-KR') || '알 수 없음'}
                          </p>
                          <p>
                            <span className="text-slate-400">신청자:</span>{' '}
                            {space.alimtalkSettings.requestedBy?.displayName || '알 수 없음'}
                          </p>
                          <p>
                            <span className="text-slate-400">스페이스 ID:</span>{' '}
                            <code className="bg-slate-900/50 px-2 py-0.5 rounded text-xs">
                              {space.spaceId}
                            </code>
                          </p>
                        </div>
                      </div>

                      {/* 비활성화 버튼 */}
                      <div>
                        <button
                          onClick={() => handleDeactivate(space)}
                          disabled={processing}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>비활성화</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 방 생성 대기 탭 */}
        {activeTab === 'space-pending' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Home className="w-5 h-5" />
                <span className="font-medium">대기 중인 방 생성 신청 {spaceRequests.length}건</span>
              </div>
            </div>

            {spaceRequests.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-600/30 rounded-xl p-8 text-center">
                <Home className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">대기 중인 방 생성 신청이 없습니다</p>
                <p className="text-sm text-slate-400 mt-2">
                  새로운 방 생성 신청이 들어오면 여기에 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {spaceRequests.map((request) => (
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
                            <span className="text-slate-400">신청일:</span>{' '}
                            {request.requestedAt?.toDate?.().toLocaleString('ko-KR') || '알 수 없음'}
                          </p>
                          <p>
                            <span className="text-slate-400">생성될 방 코드:</span>{' '}
                            <code className="bg-slate-900/50 px-2 py-0.5 rounded text-xs text-purple-300">
                              {request.spaceCode}
                            </code>
                          </p>
                        </div>
                      </div>

                      {/* 승인/거부 버튼 */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApproveSpace(request)}
                          disabled={processing}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>승인</span>
                        </button>

                        <button
                          onClick={() => handleRejectSpace(request)}
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
          </div>
        )}

        {/* 어드민 이메일 설정 */}
        <div className="mt-8 bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">어드민 알림 설정</h2>
          </div>

          <div className="space-y-4">
            {/* 이메일 주소 입력 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                알림 수신 이메일 주소
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                방 생성 신청 등 중요한 알림을 받을 이메일 주소를 입력하세요.
              </p>
            </div>

            {/* 방 생성 신청 알림 토글 */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-300">방 생성 신청 알림</p>
                <p className="text-xs text-slate-400">새로운 방 생성 신청 시 이메일로 알림을 받습니다.</p>
              </div>
              <button
                onClick={() => setSpaceCreationNotifications(!spaceCreationNotifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  spaceCreationNotifications ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    spaceCreationNotifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSaveAdminSettings}
              disabled={savingSettings}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? '저장 중...' : '설정 저장'}</span>
            </button>
          </div>
        </div>

        {/* 안내 */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium mb-2">⚠️ 슈퍼 관리자 안내</p>
              {activeTab === 'alimtalk-pending' ? (
                <ul className="space-y-1 text-yellow-200/80">
                  <li>• 승인 시 해당 스페이스의 알림톡이 즉시 활성화됩니다.</li>
                  <li>• 거부 시 사유를 입력해야 하며, 신청자가 확인할 수 있습니다.</li>
                  <li>• 승인/거부된 신청은 목록에서 사라집니다.</li>
                  <li>• 거부된 경우에도 재신청이 가능합니다.</li>
                </ul>
              ) : activeTab === 'alimtalk-active' ? (
                <ul className="space-y-1 text-yellow-200/80">
                  <li>• 활성화된 스페이스의 알림톡 발송 상태를 확인할 수 있습니다.</li>
                  <li>• 비활성화 시 사유를 입력해야 하며, 즉시 알림톡이 중단됩니다.</li>
                  <li>• 비활성화 후에도 재신청이 가능합니다.</li>
                  <li>• 승인일과 신청자 정보를 확인할 수 있습니다.</li>
                </ul>
              ) : (
                <ul className="space-y-1 text-yellow-200/80">
                  <li>• 승인 시 방이 즉시 생성되며 신청자에게 알림이 갑니다.</li>
                  <li>• 신청자는 생성된 방의 최초 매니저로 자동 배정됩니다.</li>
                  <li>• 거부 시 사유를 입력해야 하며, 거부된 경우에도 재신청이 가능합니다.</li>
                  <li>• 생성될 방 코드는 자동으로 생성되며 중복 체크가 완료되었습니다.</li>
                </ul>
              )}
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