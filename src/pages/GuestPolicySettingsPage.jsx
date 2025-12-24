import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import spaceSettingsService from '../services/spaceSettingsService';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, DollarSign, CreditCard, User, Building, Save, Info } from 'lucide-react';

export default function GuestPolicySettingsPage() {
  const navigate = useNavigate();
  const { user, selectedSpace } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    accountBank: '',
    accountNumber: '',
    accountHolder: '',
    guestPricePerNight: 30000, // 기본값 30,000원
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

    loadGuestPolicy();
  }, [user, selectedSpace, navigate]);

  const loadGuestPolicy = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      const data = await spaceSettingsService.getGuestPolicy(spaceId);

      setFormData({
        accountBank: data.accountBank || '',
        accountNumber: data.accountNumber || '',
        accountHolder: data.accountHolder || '',
        guestPricePerNight: data.guestPricePerNight || 30000,
      });
    } catch (error) {
      console.error('게스트 정책 로드 실패:', error);
      // 에러가 발생해도 기본값 사용
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
    if (!formData.accountBank?.trim()) {
      alert('은행명을 입력해주세요.');
      return;
    }

    if (!formData.accountNumber?.trim()) {
      alert('계좌번호를 입력해주세요.');
      return;
    }

    if (!formData.accountHolder?.trim()) {
      alert('예금주를 입력해주세요.');
      return;
    }

    if (!formData.guestPricePerNight || formData.guestPricePerNight <= 0) {
      alert('1박 요금을 입력해주세요.');
      return;
    }

    const confirmed = window.confirm(
      '게스트 정책을 저장하시겠습니까?\n\n저장 후 예약 시 알림톡에 반영됩니다.'
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      await spaceSettingsService.updateGuestPolicy(
        spaceId,
        {
          accountBank: formData.accountBank.trim(),
          accountNumber: formData.accountNumber.trim(),
          accountHolder: formData.accountHolder.trim(),
          guestPricePerNight: parseInt(formData.guestPricePerNight),
        },
        user.id,
        user.displayName || user.name
      );

      alert('게스트 정책이 저장되었습니다! ✅');
      await loadGuestPolicy();
    } catch (error) {
      console.error('게스트 정책 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return parseInt(value).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/space/manage')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                게스트 정책 관리
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {selectedSpace?.spaceName || selectedSpace?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">💡 게스트 정책 안내</p>
              <ul className="space-y-1 text-blue-800">
                <li>• 게스트 예약 시 안내될 계좌 정보와 1박 요금을 설정합니다.</li>
                <li>• 설정한 정보는 예약 확인 알림톡에 자동으로 포함됩니다.</li>
                <li>• 매니저 이상만 수정할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 입금 계좌 정보 */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            입금 계좌 정보
          </h2>

          <div className="space-y-4">
            {/* 은행명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                은행명
              </label>
              <input
                type="text"
                value={formData.accountBank}
                onChange={(e) => handleInputChange('accountBank', e.target.value)}
                placeholder="예: 카카오뱅크"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                계좌번호
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="예: 7942-24-38529"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 예금주 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                예금주
              </label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 게스트 요금 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            게스트 요금
          </h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1박 요금 (원)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.guestPricePerNight}
                onChange={(e) => handleInputChange('guestPricePerNight', e.target.value)}
                placeholder="30000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                원
              </span>
            </div>
            {formData.guestPricePerNight && (
              <p className="text-sm text-gray-600 mt-2">
                💰 1박당 <strong className="text-blue-600">{formatCurrency(formData.guestPricePerNight)}원</strong>
              </p>
            )}
          </div>
        </div>

        {/* 미리보기 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📱 알림톡 미리보기</h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-sm space-y-2">
            <p className="text-gray-800">
              <strong>입금 계좌:</strong> {formData.accountBank || '(은행명)'} {formData.accountNumber || '(계좌번호)'}
            </p>
            <p className="text-gray-800">
              <strong>예금주:</strong> {formData.accountHolder || '(예금주)'}
            </p>
            <p className="text-gray-800">
              <strong>1박 요금:</strong> {formatCurrency(formData.guestPricePerNight) || '30,000'}원
            </p>
            <p className="text-xs text-gray-500 mt-3">
              * 실제 알림톡에서는 숙박일수에 따라 총 금액이 자동 계산됩니다.
            </p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
