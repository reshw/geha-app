import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import tierService from '../../services/tierService';
import useStore from '../../store/useStore';

/**
 * 등급 이름 편집 컴포넌트
 * 테스트 스페이스 (jwbIZM)에서만 사용
 */
const TierNameEditor = ({ spaceId, onClose }) => {
  const { user, setTierConfig } = useStore();

  const [tierNames, setTierNames] = useState({
    master: '',
    'vice-master': '',
    c2: '',
    c1: '',
    c3: '',
    c4: ''
  });

  const [enableC3C4, setEnableC3C4] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  // 초기 데이터 로드
  useEffect(() => {
    loadTierConfig();
  }, [spaceId]);

  const loadTierConfig = async () => {
    try {
      const config = await tierService.getTierConfig(spaceId);
      if (config) {
        setTierNames(config.tierNames);
        setEnableC3C4(config.enabledTiers.includes('c3') || config.enabledTiers.includes('c4'));
      }
    } catch (error) {
      console.error('등급 설정 로드 실패:', error);
    }
  };

  // 유효성 검사
  const validateTierNames = () => {
    const validationErrors = [];
    const usedNames = new Set();

    // 필수 필드 (master, vice-master, c2, c1)
    const requiredTiers = ['master', 'vice-master', 'c2', 'c1'];
    requiredTiers.forEach(tier => {
      const name = tierNames[tier]?.trim();

      // 빈 값 체크
      if (!name) {
        validationErrors.push(`${getTierLabel(tier)} 이름은 필수입니다`);
        return;
      }

      // 길이 체크
      if (name.length < 2 || name.length > 10) {
        validationErrors.push(`${getTierLabel(tier)} 이름은 2-10자여야 합니다`);
      }

      // 특수문자 체크
      if (!/^[가-힣a-zA-Z0-9\s]+$/.test(name)) {
        validationErrors.push(`${getTierLabel(tier)} 이름에 특수문자를 사용할 수 없습니다`);
      }

      // 중복 체크
      if (usedNames.has(name)) {
        validationErrors.push(`중복된 이름: ${name}`);
      }
      usedNames.add(name);
    });

    // 선택적 필드 (c3, c4)
    if (enableC3C4) {
      ['c3', 'c4'].forEach(tier => {
        const name = tierNames[tier]?.trim();
        if (name) {
          // 길이 체크
          if (name.length < 2 || name.length > 10) {
            validationErrors.push(`${getTierLabel(tier)} 이름은 2-10자여야 합니다`);
          }

          // 특수문자 체크
          if (!/^[가-힣a-zA-Z0-9\s]+$/.test(name)) {
            validationErrors.push(`${getTierLabel(tier)} 이름에 특수문자를 사용할 수 없습니다`);
          }

          // 중복 체크
          if (usedNames.has(name)) {
            validationErrors.push(`중복된 이름: ${name}`);
          }
          usedNames.add(name);
        }
      });
    }

    return validationErrors;
  };

  const getTierLabel = (tier) => {
    const labels = {
      'master': '[6] 최고 관리자',
      'vice-master': '[5] 부 관리자',
      'c2': '[4] 정회원',
      'c1': '[3] 일반회원',
      'c3': '[2] 추가 등급 1',
      'c4': '[1] 추가 등급 2'
    };
    return labels[tier] || tier;
  };

  const handleSave = async () => {
    // 유효성 검사
    const validationErrors = validateTierNames();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      // 활성화된 등급 목록 생성
      const enabledTiers = ['master', 'vice-master', 'c2', 'c1'];
      if (enableC3C4 && tierNames.c3?.trim()) {
        enabledTiers.push('c3');
      }
      if (enableC3C4 && tierNames.c4?.trim()) {
        enabledTiers.push('c4');
      }

      // 저장할 tierNames (null 값 처리)
      const finalTierNames = {
        ...tierNames,
        c3: enableC3C4 && tierNames.c3?.trim() ? tierNames.c3.trim() : null,
        c4: enableC3C4 && tierNames.c4?.trim() ? tierNames.c4.trim() : null
      };

      // Firestore 업데이트
      await tierService.updateEnabledTiers(
        spaceId,
        enabledTiers,
        finalTierNames,
        user.id,
        user.displayName || user.name
      );

      // Zustand 캐시 업데이트
      const updatedConfig = await tierService.getTierConfig(spaceId);
      setTierConfig(spaceId, updatedConfig);

      alert('등급 이름이 저장되었습니다');
      onClose();
    } catch (error) {
      console.error('등급 이름 저장 실패:', error);
      alert('저장에 실패했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-slate-800/95 backdrop-blur-sm px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">등급 이름 설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-5">
          {/* 안내 메시지 */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              각 등급의 이름을 변경할 수 있습니다. 숫자는 등급 레벨을 나타냅니다.
            </p>
          </div>

          {/* 에러 메시지 */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-300">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 필수 등급 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">필수 등급</h3>

            {['master', 'vice-master', 'c2', 'c1'].map(tier => (
              <div key={tier} className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  {getTierLabel(tier)}
                </label>
                <input
                  type="text"
                  value={tierNames[tier]}
                  onChange={(e) => setTierNames(prev => ({ ...prev, [tier]: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={tier === 'master' ? '매니저' : tier === 'vice-master' ? '부매니저' : tier === 'c2' ? '주주' : '게스트'}
                />
              </div>
            ))}
          </div>

          {/* 추가 등급 활성화 */}
          <div className="pt-4 border-t border-slate-700/50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableC3C4}
                onChange={(e) => setEnableC3C4(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-sm font-medium text-slate-300">
                추가 등급 사용 (최대 6개)
              </span>
            </label>
          </div>

          {/* 선택적 등급 */}
          {enableC3C4 && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-500/30">
              <h3 className="text-sm font-semibold text-slate-300">추가 등급 (선택)</h3>

              {['c3', 'c4'].map(tier => (
                <div key={tier} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    {getTierLabel(tier)}
                  </label>
                  <input
                    type="text"
                    value={tierNames[tier]}
                    onChange={(e) => setTierNames(prev => ({ ...prev, [tier]: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="예: 준회원"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            disabled={saving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TierNameEditor;
