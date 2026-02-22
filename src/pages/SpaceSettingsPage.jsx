import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, Save, AlertCircle, Info } from 'lucide-react';
import EmailNotificationSettings from '../components/settings/EmailNotificationSettings';
import TierNameEditor from '../components/settings/TierNameEditor';
import PermissionMatrixEditor from '../components/settings/PermissionMatrixEditor';

export default function SpaceSettingsPage() {
  const navigate = useNavigate();
  const { user, selectedSpace, setSelectedSpace } = useStore();
  const [spaceName, setSpaceName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [emailSettings, setEmailSettings] = useState(null);
  const [praiseStatsPermission, setPraiseStatsPermission] = useState('manager_only');
  const [originalPraiseStatsPermission, setOriginalPraiseStatsPermission] = useState('manager_only');
  const [financePermission, setFinancePermission] = useState('vice_manager_up');
  const [originalFinancePermission, setOriginalFinancePermission] = useState('vice_manager_up');
  const [currency, setCurrency] = useState('KRW');
  const [originalCurrency, setOriginalCurrency] = useState('KRW');
  const [seasonOutEnabled, setSeasonOutEnabled] = useState(true);
  const [originalSeasonOutEnabled, setOriginalSeasonOutEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 커스텀 등급 시스템 모달
  const [showTierNameEditor, setShowTierNameEditor] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);

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

  // 변경사항 감지
  useEffect(() => {
    const nameChanged = spaceName !== originalName && spaceName.trim() !== '';
    const praisePermissionChanged = praiseStatsPermission !== originalPraiseStatsPermission;
    const financePermissionChanged = financePermission !== originalFinancePermission;
    const currencyChanged = currency !== originalCurrency;
    const seasonOutChanged = seasonOutEnabled !== originalSeasonOutEnabled;
    setHasChanges(nameChanged || praisePermissionChanged || financePermissionChanged || currencyChanged || seasonOutChanged);
  }, [spaceName, originalName, praiseStatsPermission, originalPraiseStatsPermission, financePermission, originalFinancePermission, currency, originalCurrency, seasonOutEnabled, originalSeasonOutEnabled]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      // 스페이스 기본 설정
      const settings = await spaceSettingsService.getSpaceSettings(spaceId);
      const currentName = settings.name || selectedSpace.spaceName || '';
      setSpaceName(currentName);
      setOriginalName(currentName);

      const currentCurrency = settings.currency || 'KRW';
      setCurrency(currentCurrency);
      setOriginalCurrency(currentCurrency);

      const currentSeasonOutEnabled = settings.seasonOutEnabled ?? true;
      setSeasonOutEnabled(currentSeasonOutEnabled);
      setOriginalSeasonOutEnabled(currentSeasonOutEnabled);

      // 칭찬 통계 권한 설정
      const praisePermission = await spaceSettingsService.getPraiseStatsPermission(spaceId);
      setPraiseStatsPermission(praisePermission);
      setOriginalPraiseStatsPermission(praisePermission);

      // 재정 관리 권한 설정
      const financePermission = await spaceSettingsService.getFinancePermission(spaceId);
      setFinancePermission(financePermission);
      setOriginalFinancePermission(financePermission);

      // 이메일 알림 설정
      const emailSettingsData = await spaceSettingsService.getEmailSettings(spaceId);
      setEmailSettings(emailSettingsData);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이메일 설정 저장 핸들러
  const handleEmailSettingsSave = async (newSettings) => {
    const spaceId = selectedSpace.id || selectedSpace.spaceId;
    await spaceSettingsService.updateEmailSettings(spaceId, newSettings, user.id);
    setEmailSettings(newSettings);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    const trimmedName = spaceName.trim();
    if (trimmedName.length === 0) {
      alert('스페이스 이름을 입력해주세요.');
      return;
    }

    if (trimmedName.length > 50) {
      alert('스페이스 이름은 50자 이내로 입력해주세요.');
      return;
    }

    const nameChanged = spaceName !== originalName;
    const praisePermissionChanged = praiseStatsPermission !== originalPraiseStatsPermission;
    const financePermissionChanged = financePermission !== originalFinancePermission;
    const currencyChanged = currency !== originalCurrency;
    const seasonOutChanged = seasonOutEnabled !== originalSeasonOutEnabled;

    let confirmMessage = '';
    const changes = [];
    if (nameChanged) changes.push(`스페이스 이름: "${trimmedName}"`);
    if (praisePermissionChanged) changes.push('칭찬 통계 권한 변경');
    if (financePermissionChanged) changes.push('재정 관리 권한 변경');
    if (currencyChanged) changes.push(`정산 통화 변경: ${currency === 'JPY' ? '엔화 (¥)' : '원화 (₩)'}`);
    if (seasonOutChanged) changes.push(`시즌아웃 기능: ${seasonOutEnabled ? '활성화' : '비활성화'}`);

    if (changes.length > 0) {
      confirmMessage = `다음 설정을 변경하시겠습니까?\n\n${changes.map(c => `- ${c}`).join('\n')}\n\n모든 멤버에게 변경사항이 즉시 반영됩니다.`;
    }

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      setSaving(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      // 스페이스 이름 변경
      if (nameChanged) {
        await spaceSettingsService.updateSpaceName(spaceId, trimmedName, user.id);

        // Zustand 스토어의 selectedSpace 업데이트
        setSelectedSpace({
          ...selectedSpace,
          spaceName: trimmedName,
          name: trimmedName
        });

        setOriginalName(trimmedName);
        setSpaceName(trimmedName);
      }

      // 칭찬 통계 권한 변경
      if (praisePermissionChanged) {
        await spaceSettingsService.updatePraiseStatsPermission(
          spaceId,
          praiseStatsPermission,
          user.id,
          user.displayName
        );
        setOriginalPraiseStatsPermission(praiseStatsPermission);
      }

      // 재정 관리 권한 변경
      if (financePermissionChanged) {
        await spaceSettingsService.updateFinancePermission(
          spaceId,
          financePermission,
          user.id,
          user.displayName
        );
        setOriginalFinancePermission(financePermission);
      }

      // 통화 변경
      if (currencyChanged) {
        await spaceSettingsService.updateCurrency(spaceId, currency, user.id);
        setOriginalCurrency(currency);
        setSelectedSpace({ ...selectedSpace, currency });
      }

      // 시즌아웃 기능 변경
      if (seasonOutChanged) {
        await spaceSettingsService.updateSeasonOutEnabled(spaceId, seasonOutEnabled, user.id);
        setOriginalSeasonOutEnabled(seasonOutEnabled);
        setSelectedSpace({ ...selectedSpace, seasonOutEnabled });
      }

      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('변경사항을 취소하시겠습니까?');
      if (!confirmed) return;
    }
    navigate('/space/manage');
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
        <div className="w-full max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white truncate">스페이스 설정</h1>
              <p className="text-sm text-slate-300 truncate">기본 정보 및 권한 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 설정 폼 */}
      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 기본 설정 섹션 */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-600/30 bg-slate-800/50">
            <h2 className="text-base font-bold text-white">기본 설정</h2>
            <p className="text-xs text-slate-400 mt-0.5">스페이스 기본 정보를 관리합니다</p>
          </div>

          <div className="p-5 space-y-5">
            {/* 스페이스 이름 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                스페이스 이름
              </label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="예: 조강308호"
                maxLength={50}
                disabled={saving}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
              />
              <p className="mt-2 text-xs text-slate-400">
                {spaceName.length}/50자 • 모든 멤버에게 표시됩니다
              </p>
            </div>
          </div>
        </div>

        {/* 권한 설정 섹션 */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-600/30 bg-slate-800/50">
            <h2 className="text-base font-bold text-white">권한 설정</h2>
            <p className="text-xs text-slate-400 mt-0.5">기능별 접근 권한을 설정합니다</p>
          </div>

          <div className="p-5 space-y-5">
            {/* 칭찬 통계 권한 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                칭찬 통계 권한
              </label>
              <select
                value={praiseStatsPermission}
                onChange={(e) => setPraiseStatsPermission(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23cbd5e1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="manager_only">매니저만</option>
                <option value="vice_manager_up">부매니저 이상</option>
                <option value="all_members">전체 멤버</option>
              </select>
              <p className="mt-2 text-xs text-slate-400">
                칭찬 페이지의 통계 탭을 볼 수 있는 권한
              </p>
            </div>

            {/* 재정 관리 권한 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                재정 관리 권한 (입금/지출)
              </label>
              <select
                value={financePermission}
                onChange={(e) => setFinancePermission(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23cbd5e1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="manager_only">매니저만</option>
                <option value="vice_manager_up">부매니저 이상</option>
                <option value="all_members">전체 멤버</option>
              </select>
              <p className="mt-2 text-xs text-slate-400">
                입금 및 지출 내역 조회/등록 권한을 설정합니다
              </p>
            </div>

            {/* 정산 통화 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                정산 통화
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23cbd5e1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="KRW">원화 (₩)</option>
                <option value="JPY">엔화 (¥)</option>
              </select>
              <p className="mt-2 text-xs text-slate-400">
                정산 페이지의 금액 단위로 사용됩니다
              </p>
            </div>

            {/* 시즌아웃 기능 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  시즌아웃 날짜 기능
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  멤버들이 시즌아웃 날짜를 등록할 수 있는 기능
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeasonOutEnabled(!seasonOutEnabled)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  seasonOutEnabled ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    seasonOutEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 커스텀 등급 시스템 */}
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-500/30 bg-purple-900/30">
            <h2 className="text-base font-bold text-white">
              등급 및 권한 관리
            </h2>
            <p className="text-xs text-purple-300 mt-0.5">
              스페이스 회원 등급명과 기능별 세부 권한을 설정합니다
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-purple-200">
                💡 각 스페이스마다 고유한 등급명과 세부 권한을 설정할 수 있습니다.
              </p>
            </div>

              {/* 등급 이름 편집 */}
              <div>
                <button
                  onClick={() => setShowTierNameEditor(true)}
                  className="w-full px-4 py-3 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">등급 이름 편집</div>
                    <div className="text-xs text-blue-300 mt-0.5">
                      매니저, 부매니저, 주주, 게스트 등의 이름 변경
                    </div>
                  </div>
                  <span className="text-2xl">✏️</span>
                </button>
              </div>

              {/* 권한 매트릭스 편집 */}
              <div>
                <button
                  onClick={() => setShowPermissionMatrix(true)}
                  className="w-full px-4 py-3 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">권한 설정</div>
                    <div className="text-xs text-purple-300 mt-0.5">
                      기능별 세부 액션 권한 설정 (조회/생성/승인/삭제 등)
                    </div>
                  </div>
                  <span className="text-2xl">🛡️</span>
                </button>
              </div>
          </div>
        </div>

        {/* 변경사항 안내 */}
        {hasChanges && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300 min-w-0 flex-1">
                <p className="font-medium mb-1">변경사항이 있습니다</p>
                <p className="text-yellow-200/80">
                  저장하지 않으면 변경사항이 사라집니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-slate-600/50 hover:bg-slate-600/70 active:bg-slate-600/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>저장</span>
              </>
            )}
          </button>
        </div>

        {/* 이메일 알림 설정 */}
        {emailSettings && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-600/30 bg-slate-800/50">
              <h2 className="text-base font-bold text-white">알림 설정</h2>
              <p className="text-xs text-slate-400 mt-0.5">이메일 알림 수신자를 관리합니다</p>
            </div>
            <div className="p-5">
              <EmailNotificationSettings
                spaceId={selectedSpace.id || selectedSpace.spaceId}
                settings={emailSettings}
                onSave={handleEmailSettingsSave}
              />
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              설정 안내
            </p>
            <ul className="space-y-1.5 text-blue-200/80 text-xs ml-6">
              <li>• 모든 설정은 즉시 반영되며 전체 멤버에게 적용됩니다</li>
              <li>• 스페이스 이름은 앱 전체에 표시됩니다</li>
              <li>• 권한 설정으로 기능별 접근을 제어할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 커스텀 등급 모달들 */}
      {showTierNameEditor && (
        <TierNameEditor
          spaceId={selectedSpace.id || selectedSpace.spaceId}
          onClose={() => setShowTierNameEditor(false)}
        />
      )}

      {showPermissionMatrix && (
        <PermissionMatrixEditor
          spaceId={selectedSpace.id || selectedSpace.spaceId}
          onClose={() => setShowPermissionMatrix(false)}
        />
      )}
    </div>
  );
}
