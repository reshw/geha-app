import { useState, useEffect } from 'react';
import { X, Save, Shield } from 'lucide-react';
import tierService from '../../services/tierService';
import useStore from '../../store/useStore';

/**
 * 권한 매트릭스 편집 컴포넌트
 * 테스트 스페이스 (jwbIZM)에서만 사용
 */
const PermissionMatrixEditor = ({ spaceId, onClose }) => {
  const { user, setTierConfig } = useStore();

  const [permissions, setPermissions] = useState(null);
  const [tierNames, setTierNames] = useState(null);
  const [saving, setSaving] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadTierConfig();
  }, [spaceId]);

  const loadTierConfig = async () => {
    try {
      const config = await tierService.getTierConfig(spaceId);
      if (config) {
        setPermissions(config.permissions);
        setTierNames(config.tierNames);
      }
    } catch (error) {
      console.error('등급 설정 로드 실패:', error);
    }
  };

  const handlePermissionChange = (feature, action, value) => {
    setPermissions(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [action]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Firestore 업데이트
      await tierService.updatePermissions(
        spaceId,
        permissions,
        user.id,
        user.displayName || user.name
      );

      // Zustand 캐시 업데이트
      const updatedConfig = await tierService.getTierConfig(spaceId);
      setTierConfig(spaceId, updatedConfig);

      alert('권한 설정이 저장되었습니다');
      onClose();
    } catch (error) {
      console.error('권한 설정 저장 실패:', error);
      alert('저장에 실패했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!permissions || !tierNames) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-2xl p-6">
          <p className="text-white">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 등급 옵션 (낮은 레벨부터)
  const tierOptions = [
    { value: 'c1', label: tierNames.c1 || '게스트' },
    { value: 'c2', label: tierNames.c2 || '주주' },
    { value: 'vice-master', label: tierNames['vice-master'] || '부매니저' },
    { value: 'master', label: tierNames.master || '매니저' }
  ];

  // 기능별 액션 정의
  const features = [
    {
      key: 'finance',
      icon: '💰',
      name: '재정 관리',
      actions: [
        { key: 'view', label: '조회' },
        { key: 'createIncome', label: '입금 등록' },
        { key: 'createExpense', label: '지출 등록' },
        { key: 'approve', label: '승인' },
        { key: 'delete', label: '삭제' }
      ]
    },
    {
      key: 'praise',
      icon: '👏',
      name: '칭찬 기능',
      actions: [
        { key: 'view', label: '조회' },
        { key: 'create', label: '제보' },
        { key: 'viewStats', label: '통계 보기' },
        { key: 'approve', label: '승인' },
        { key: 'delete', label: '삭제' }
      ]
    },
    {
      key: 'reservation',
      icon: '📅',
      name: '예약 관리',
      actions: [
        { key: 'create', label: '예약 생성' },
        { key: 'createPast', label: '과거 날짜 예약' },
        { key: 'cancelOwn', label: '본인 취소' },
        { key: 'cancelAny', label: '타인 취소' },
        { key: 'viewStats', label: '통계 보기' }
      ]
    },
    {
      key: 'settlement',
      icon: '💳',
      name: '정산 관리',
      actions: [
        { key: 'view', label: '조회' },
        { key: 'createBill', label: '정산 생성' },
        { key: 'approveBill', label: '승인' },
        { key: 'delete', label: '삭제' }
      ]
    },
    {
      key: 'space',
      icon: '⚙️',
      name: '스페이스 관리',
      actions: [
        { key: 'manageMembers', label: '멤버 관리' },
        { key: 'changeSettings', label: '설정 변경' },
        { key: 'transferOwnership', label: '소유권 이전' },
        { key: 'deleteMember', label: '멤버 삭제' }
      ]
    },
    {
      key: 'bartender',
      icon: '🍺',
      name: '바텐더 관리',
      actions: [
        { key: 'view', label: '조회' },
        { key: 'order', label: '주문' },
        { key: 'manageMenu', label: '메뉴 관리' },
        { key: 'viewOrders', label: '주문 내역 보기' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-slate-800/95 backdrop-blur-sm px-6 py-4 border-b border-slate-700/50 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white">권한 설정</h2>
            <p className="text-sm text-slate-400 mt-1">기능별로 필요한 최소 등급을 설정합니다</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-purple-300">
                각 기능의 액션별로 필요한 최소 등급을 설정할 수 있습니다.
              </p>
              <p className="text-xs text-purple-400 mt-1">
                매니저는 모든 권한 설정과 관계없이 항상 전체 접근 권한을 가집니다.
              </p>
            </div>
          </div>

          {/* 기능별 권한 설정 */}
          {features.map(feature => (
            <div
              key={feature.key}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30"
            >
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <span>{feature.icon}</span>
                <span>{feature.name}</span>
              </h4>

              <div className="space-y-3">
                {feature.actions.map(action => (
                  <div key={action.key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300 min-w-[120px]">{action.label}</span>
                    <select
                      value={permissions[feature.key]?.[action.key] || 'master'}
                      onChange={(e) => handlePermissionChange(feature.key, action.key, e.target.value)}
                      className="flex-1 max-w-xs px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23cbd5e1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      {tierOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} 이상
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3 z-10">
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
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrixEditor;
