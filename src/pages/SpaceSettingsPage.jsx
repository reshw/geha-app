import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function SpaceSettingsPage() {
  const navigate = useNavigate();
  const { user, selectedSpace, setSelectedSpace } = useStore();
  const [spaceName, setSpaceName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    setHasChanges(spaceName !== originalName && spaceName.trim() !== '');
  }, [spaceName, originalName]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const settings = await spaceSettingsService.getSpaceSettings(spaceId);
      
      const currentName = settings.name || selectedSpace.spaceName || '';
      setSpaceName(currentName);
      setOriginalName(currentName);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
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

    const confirmed = window.confirm(
      `스페이스 이름을 "${trimmedName}"(으)로 변경하시겠습니까?\n\n모든 멤버에게 변경된 이름이 표시됩니다.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      
      await spaceSettingsService.updateSpaceName(spaceId, trimmedName, user.id);

      // Zustand 스토어의 selectedSpace 업데이트
      setSelectedSpace({
        ...selectedSpace,
        spaceName: trimmedName,
        name: trimmedName
      });

      setOriginalName(trimmedName);
      setSpaceName(trimmedName);
      
      alert('스페이스 이름이 변경되었습니다.');
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
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">스페이스 설정</h1>
              <p className="text-sm text-slate-300">기본 정보 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 설정 폼 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 shadow-lg">
          <div className="space-y-6">
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
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-slate-400">
                {spaceName.length}/50자 • 모든 멤버에게 표시되는 이름입니다
              </p>
            </div>

            {/* 변경사항 안내 */}
            {hasChanges && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-300">
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
                className="flex-1 px-4 py-3 bg-slate-600/50 hover:bg-slate-600/70 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-2">💡 설정 안내</p>
            <ul className="space-y-1 text-blue-200/80">
              <li>• 스페이스 이름은 앱 상단과 예약 목록에 표시됩니다.</li>
              <li>• 변경 즉시 모든 멤버에게 반영됩니다.</li>
              <li>• 50자 이내로 간결하게 작성하는 것을 권장합니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
