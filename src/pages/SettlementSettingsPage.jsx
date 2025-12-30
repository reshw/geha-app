import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, DollarSign, CreditCard, User, Building, Save, Info, AlertCircle } from 'lucide-react';

export default function SettlementSettingsPage() {
  const navigate = useNavigate();
  const { user, selectedSpace } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    accountBank_settle: '',
    accountNumber_settle: '',
    accountHolder_settle: '',
  });

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
      alert('접근 권한이 없습니다. (매니저 이상만 접근 가능)');
      navigate('/');
      return;
    }

    loadSettlementAccount();
  }, [user, selectedSpace, navigate]);

  const loadSettlementAccount = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const data = await spaceSettingsService.getSettlementAccount(spaceId);

      setFormData({
        accountBank_settle: data.accountBank_settle || '',
        accountNumber_settle: data.accountNumber_settle || '',
        accountHolder_settle: data.accountHolder_settle || '',
      });
    } catch (error) {
      console.error('정산 계좌 정보 로드 실패:', error);
      // 에러가 발생해도 빈 값으로 계속 진행
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // 유효성 검사
    if (!formData.accountBank_settle?.trim()) {
      alert('은행명을 입력해주세요.');
      return;
    }

    if (!formData.accountNumber_settle?.trim()) {
      alert('계좌번호를 입력해주세요.');
      return;
    }

    if (!formData.accountHolder_settle?.trim()) {
      alert('예금주를 입력해주세요.');
      return;
    }

    const confirmed = window.confirm(
      '정산 계좌 정보를 저장하시겠습니까?\n\n저장 후 정산 알림톡에 이 계좌 정보가 사용됩니다.'
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      await spaceSettingsService.updateSettlementAccount(
        spaceId,
        {
          accountBank_settle: formData.accountBank_settle.trim(),
          accountNumber_settle: formData.accountNumber_settle.trim(),
          accountHolder_settle: formData.accountHolder_settle.trim(),
        },
        user.id,
        user.displayName || user.name
      );

      alert('정산 계좌 정보가 저장되었습니다!');
      await loadSettlementAccount();
    } catch (error) {
      console.error('정산 계좌 정보 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
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
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                정산 계좌 관리
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                {selectedSpace?.spaceName || selectedSpace?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-2">정산 계좌 안내</p>
              <ul className="space-y-1 text-blue-200/80">
                <li>• 정산 알림톡에 사용될 계좌 정보를 설정합니다.</li>
                <li>• 게스트 시스템 계좌와 별도로 관리되어 운영상 혼동을 방지합니다.</li>
                <li>• 매니저 이상만 수정할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-semibold mb-2">게스트 계좌와의 차이점</p>
              <ul className="space-y-1 text-yellow-200/80">
                <li>• <strong>게스트 계좌</strong>: 게스트 예약 시 입금 안내용</li>
                <li>• <strong>정산 계좌</strong>: 주주/매니저 정산 시 송금 안내용</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 정산 계좌 정보 */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            정산 계좌 정보
          </h2>

          <div className="space-y-4">
            {/* 은행명 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                은행명
              </label>
              <input
                type="text"
                value={formData.accountBank_settle}
                onChange={(e) => handleInputChange('accountBank_settle', e.target.value)}
                placeholder="예: 카카오뱅크"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                계좌번호
              </label>
              <input
                type="text"
                value={formData.accountNumber_settle}
                onChange={(e) => handleInputChange('accountNumber_settle', e.target.value)}
                placeholder="예: 7942-24-38529"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* 예금주 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                예금주
              </label>
              <input
                type="text"
                value={formData.accountHolder_settle}
                onChange={(e) => handleInputChange('accountHolder_settle', e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 shadow-lg mb-6">
          <h3 className="text-sm font-bold text-slate-300 mb-3">정산 알림톡 미리보기</h3>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30 text-sm space-y-2">
            <p className="text-slate-200">
              <strong>입금 계좌:</strong> {formData.accountBank_settle || '(은행명)'} {formData.accountNumber_settle || '(계좌번호)'}
            </p>
            <p className="text-slate-200">
              <strong>예금주:</strong> {formData.accountHolder_settle || '(예금주)'}
            </p>
            <p className="text-xs text-slate-400 mt-3">
              * 실제 정산 알림톡에서는 이 계좌로 정산금을 송금하도록 안내됩니다.
            </p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>저장하기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
