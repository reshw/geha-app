// src/components/settings/EmailNotificationSettings.jsx
import { useState, useEffect } from 'react';
import { Mail, Plus, X, Save } from 'lucide-react';

const EmailNotificationSettings = ({ spaceId, settings, onSave }) => {
  const [emailSettings, setEmailSettings] = useState({
    reservation: {
      enabled: false,
      types: [],
      recipients: []
    },
    settlement: {
      enabled: false,
      recipients: []
    },
    praise: {
      enabled: false,
      recipients: []
    },
    expense: {
      enabled: false,
      recipients: []
    }
  });

  const [newEmail, setNewEmail] = useState({
    reservation: '',
    settlement: '',
    praise: '',
    expense: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmailSettings(prev => ({
        reservation: {
          enabled: false,
          types: [],
          recipients: [],
          ...settings.reservation
        },
        settlement: {
          enabled: false,
          recipients: [],
          ...settings.settlement
        },
        praise: {
          enabled: false,
          recipients: [],
          ...settings.praise
        },
        expense: {
          enabled: false,
          recipients: [],
          ...settings.expense
        }
      }));
    }
  }, [settings]);

  // 예약 타입 토글
  const toggleReservationType = (type) => {
    setEmailSettings(prev => ({
      ...prev,
      reservation: {
        ...prev.reservation,
        types: prev.reservation.types.includes(type)
          ? prev.reservation.types.filter(t => t !== type)
          : [...prev.reservation.types, type]
      }
    }));
  };

  // 이메일 추가
  const addEmail = (category) => {
    const email = newEmail[category].trim();
    if (!email) return;

    // 간단한 이메일 검증
    if (!email.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setEmailSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        recipients: [...prev[category].recipients, email]
      }
    }));

    setNewEmail(prev => ({ ...prev, [category]: '' }));
  };

  // 이메일 제거
  const removeEmail = (category, email) => {
    setEmailSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        recipients: prev[category].recipients.filter(e => e !== email)
      }
    }));
  };

  // 알림 활성화 토글
  const toggleEnabled = (category) => {
    setEmailSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        enabled: !prev[category].enabled
      }
    }));
  };

  // 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(emailSettings);
      alert('이메일 알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const reservationTypeLabels = {
    guest: '게스트',
    shareholder: '주주',
    manager: '매니저',
    'vice-manager': '부매니저'
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">이메일 알림 설정</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <p className="text-sm text-gray-600">
        각 알림 유형별로 이메일 알림을 받을 수 있습니다. 설정이 없으면 기본적으로 알림이 발송되지 않습니다.
      </p>

      {/* 예약 알림 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">📅 예약 알림</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.reservation.enabled}
              onChange={() => toggleEnabled('reservation')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          예약이 등록될 때 이메일 알림을 받습니다.
        </p>

        {emailSettings.reservation.enabled && (
          <>
            {/* 예약 타입 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                알림을 받을 예약 타입
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(reservationTypeLabels).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => toggleReservationType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      emailSettings.reservation.types.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 수신자 목록 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                수신자 이메일
              </label>
              <div className="space-y-2 mb-3">
                {emailSettings.reservation.recipients.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{email}</span>
                    <button
                      onClick={() => removeEmail('reservation', email)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail.reservation}
                  onChange={(e) => setNewEmail(prev => ({ ...prev, reservation: e.target.value }))}
                  placeholder="이메일 주소 입력"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmail('reservation');
                    }
                  }}
                />
                <button
                  onClick={() => addEmail('reservation')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 공금정산 알림 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">💰 공금정산 알림</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.settlement.enabled}
              onChange={() => toggleEnabled('settlement')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          영수증이 제출될 때 이메일 알림을 받습니다.
        </p>

        {emailSettings.settlement.enabled && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              수신자 이메일
            </label>
            <div className="space-y-2 mb-3">
              {emailSettings.settlement.recipients.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{email}</span>
                  <button
                    onClick={() => removeEmail('settlement', email)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail.settlement}
                onChange={(e) => setNewEmail(prev => ({ ...prev, settlement: e.target.value }))}
                placeholder="이메일 주소 입력"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail('settlement');
                  }
                }}
              />
              <button
                onClick={() => addEmail('settlement')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 칭찬 알림 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🌟 칭찬 알림</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.praise.enabled}
              onChange={() => toggleEnabled('praise')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          칭찬이 접수될 때 이메일 알림을 받습니다.
        </p>

        {emailSettings.praise.enabled && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              수신자 이메일
            </label>
            <div className="space-y-2 mb-3">
              {emailSettings.praise.recipients.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{email}</span>
                  <button
                    onClick={() => removeEmail('praise', email)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail.praise}
                onChange={(e) => setNewEmail(prev => ({ ...prev, praise: e.target.value }))}
                placeholder="이메일 주소 입력"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail('praise');
                  }
                }}
              />
              <button
                onClick={() => addEmail('praise')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 운영비 청구 알림 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">💸 운영비 청구 알림</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.expense.enabled}
              onChange={() => toggleEnabled('expense')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          운영비 청구가 제출될 때 이메일 알림을 받습니다.
        </p>

        {emailSettings.expense.enabled && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              수신자 이메일
            </label>
            <div className="space-y-2 mb-3">
              {emailSettings.expense.recipients.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{email}</span>
                  <button
                    onClick={() => removeEmail('expense', email)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail.expense}
                onChange={(e) => setNewEmail(prev => ({ ...prev, expense: e.target.value }))}
                placeholder="이메일 주소 입력"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail('expense');
                  }
                }}
              />
              <button
                onClick={() => addEmail('expense')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailNotificationSettings;
