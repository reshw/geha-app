// src/components/settings/SettlementScheduleSettings.jsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, Save } from 'lucide-react';

const SettlementScheduleSettings = ({ spaceId, settings, onSave }) => {
  const [scheduleSettings, setScheduleSettings] = useState({
    enabled: false,
    frequency: 'weekly', // 'weekly', 'monthly', 'yearly'
    weeklyDay: 1, // 0=일요일, 1=월요일, ..., 6=토요일
    monthlyDay: 1, // 1-31
    yearlyMonth: 1, // 1-12
    yearlyDay: 1, // 1-31
    time: '18:00', // HH:mm
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setScheduleSettings(prev => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings]);

  const handleToggleEnabled = () => {
    setScheduleSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleFrequencyChange = (frequency) => {
    setScheduleSettings(prev => ({
      ...prev,
      frequency
    }));
  };

  const handleSave = async () => {
    // 유효성 검사
    if (scheduleSettings.enabled) {
      const [hours, minutes] = scheduleSettings.time.split(':');
      if (!hours || !minutes || parseInt(hours) > 23 || parseInt(minutes) > 59) {
        alert('올바른 시간을 입력해주세요 (00:00 ~ 23:59)');
        return;
      }

      if (scheduleSettings.frequency === 'monthly') {
        if (scheduleSettings.monthlyDay < 1 || scheduleSettings.monthlyDay > 31) {
          alert('올바른 날짜를 입력해주세요 (1 ~ 31일)');
          return;
        }
      }

      if (scheduleSettings.frequency === 'yearly') {
        if (scheduleSettings.yearlyMonth < 1 || scheduleSettings.yearlyMonth > 12) {
          alert('올바른 월을 입력해주세요 (1 ~ 12월)');
          return;
        }
        if (scheduleSettings.yearlyDay < 1 || scheduleSettings.yearlyDay > 31) {
          alert('올바른 날짜를 입력해주세요 (1 ~ 31일)');
          return;
        }
      }
    }

    setSaving(true);
    try {
      await onSave(scheduleSettings);
      alert('정산 자동화 설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const weekDays = [
    { value: 0, label: '일요일' },
    { value: 1, label: '월요일' },
    { value: 2, label: '화요일' },
    { value: 3, label: '수요일' },
    { value: 4, label: '목요일' },
    { value: 5, label: '금요일' },
    { value: 6, label: '토요일' },
  ];

  // 다음 실행 시간 계산
  const getNextRunTime = () => {
    if (!scheduleSettings.enabled) return null;

    const now = new Date();
    const [hours, minutes] = scheduleSettings.time.split(':');
    let nextRun = new Date();
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (scheduleSettings.frequency === 'weekly') {
      const currentDay = now.getDay();
      const targetDay = scheduleSettings.weeklyDay;
      let daysToAdd = targetDay - currentDay;

      // 이미 지난 경우 다음 주
      if (daysToAdd < 0 || (daysToAdd === 0 && now >= nextRun)) {
        daysToAdd += 7;
      }

      nextRun.setDate(now.getDate() + daysToAdd);
    } else if (scheduleSettings.frequency === 'monthly') {
      nextRun.setDate(scheduleSettings.monthlyDay);

      // 이미 지난 경우 다음 달
      if (now >= nextRun) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
    } else if (scheduleSettings.frequency === 'yearly') {
      nextRun.setMonth(scheduleSettings.yearlyMonth - 1);
      nextRun.setDate(scheduleSettings.yearlyDay);

      // 이미 지난 경우 내년
      if (now >= nextRun) {
        nextRun.setFullYear(nextRun.getFullYear() + 1);
      }
    }

    return nextRun;
  };

  const nextRunTime = getNextRunTime();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">정산 자동화 설정</h2>
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
        정산을 자동으로 마감할 주기와 시간을 설정합니다. 테스트를 위해 가까운 시간으로 설정할 수 있습니다.
      </p>

      {/* 자동화 활성화 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">⚙️ 자동화 활성화</h3>
            <p className="text-sm text-gray-600">
              설정된 시간에 자동으로 정산을 마감합니다
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleSettings.enabled}
              onChange={handleToggleEnabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {scheduleSettings.enabled && (
        <>
          {/* 정산 주기 선택 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📅 정산 주기</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => handleFrequencyChange('weekly')}
                className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                  scheduleSettings.frequency === 'weekly'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                매주
              </button>
              <button
                onClick={() => handleFrequencyChange('monthly')}
                className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                  scheduleSettings.frequency === 'monthly'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                매달
              </button>
              <button
                onClick={() => handleFrequencyChange('yearly')}
                className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                  scheduleSettings.frequency === 'yearly'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                매년
              </button>
            </div>

            {/* 매주 - 요일 선택 */}
            {scheduleSettings.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  마감 요일
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day.value}
                      onClick={() => setScheduleSettings(prev => ({ ...prev, weeklyDay: day.value }))}
                      className={`p-3 rounded-lg font-semibold transition-all ${
                        scheduleSettings.weeklyDay === day.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.label.substring(0, 1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 매달 - 날짜 선택 */}
            {scheduleSettings.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  마감 날짜
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={scheduleSettings.monthlyDay}
                  onChange={(e) => setScheduleSettings(prev => ({
                    ...prev,
                    monthlyDay: parseInt(e.target.value) || 1
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  placeholder="1 ~ 31"
                />
                <p className="text-xs text-gray-500 mt-2">
                  매달 {scheduleSettings.monthlyDay}일에 정산이 마감됩니다
                </p>
              </div>
            )}

            {/* 매년 - 월/일 선택 */}
            {scheduleSettings.frequency === 'yearly' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    월
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={scheduleSettings.yearlyMonth}
                    onChange={(e) => setScheduleSettings(prev => ({
                      ...prev,
                      yearlyMonth: parseInt(e.target.value) || 1
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    placeholder="1 ~ 12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    일
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleSettings.yearlyDay}
                    onChange={(e) => setScheduleSettings(prev => ({
                      ...prev,
                      yearlyDay: parseInt(e.target.value) || 1
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    placeholder="1 ~ 31"
                  />
                </div>
                <p className="text-xs text-gray-500 col-span-2 mt-2">
                  매년 {scheduleSettings.yearlyMonth}월 {scheduleSettings.yearlyDay}일에 정산이 마감됩니다
                </p>
              </div>
            )}
          </div>

          {/* 마감 시간 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              <Clock className="w-5 h-5 inline-block mr-2" />
              마감 시간
            </h3>

            <input
              type="time"
              value={scheduleSettings.time}
              onChange={(e) => setScheduleSettings(prev => ({ ...prev, time: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
            />

            <p className="text-xs text-gray-500 mt-3">
              설정된 시간에 자동으로 정산이 마감됩니다
            </p>
          </div>

          {/* 다음 실행 시간 표시 */}
          {nextRunTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📍 다음 정산 마감 예정</h4>
              <p className="text-lg font-bold text-blue-700">
                {nextRunTime.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })} {nextRunTime.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                ⏱️ 약 {Math.ceil((nextRunTime - new Date()) / (1000 * 60 * 60))}시간 후
              </p>
            </div>
          )}

          {/* 주의사항 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• 자동 마감은 매시간 정각에 체크됩니다 (±5분 오차 가능)</li>
              <li>• 이미 마감된 정산은 다시 마감되지 않습니다</li>
              <li>• 테스트 시 10분 후 시간으로 설정하여 확인할 수 있습니다</li>
              <li>• 서버 시간 기준으로 실행되므로 시간대를 확인하세요</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default SettlementScheduleSettings;
