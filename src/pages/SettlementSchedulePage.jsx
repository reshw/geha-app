// src/pages/SettlementSchedulePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import LoginOverlay from '../components/auth/LoginOverlay';
import Loading from '../components/common/Loading';
import SettlementScheduleSettings from '../components/settings/SettlementScheduleSettings';
import { canManageSpace } from '../utils/permissions';

const SettlementSchedulePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // 권한 체크
  const isManager = selectedSpace?.userType && canManageSpace(selectedSpace.userType);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (!isManager) {
      alert('정산 설정 권한이 없습니다.');
      navigate('/space/manage');
      return;
    }

    loadSettings();
  }, [selectedSpace, isLoggedIn, isManager]);

  const loadSettings = async () => {
    if (!selectedSpace?.id) return;

    try {
      setLoading(true);

      const settingsRef = doc(db, 'spaces', selectedSpace.id, 'settings', 'settlement');
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data());
      } else {
        // 기본값 설정
        const defaultSettings = {
          enabled: false,
          frequency: 'weekly',
          weeklyDay: 1, // 월요일
          monthlyDay: 1,
          yearlyMonth: 1,
          yearlyDay: 1,
          time: '18:00',
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newSettings) => {
    if (!selectedSpace?.id) return;

    try {
      const settingsRef = doc(db, 'spaces', selectedSpace.id, 'settings', 'settlement');

      // Firestore에 저장
      await setDoc(settingsRef, {
        ...newSettings,
        updatedAt: new Date(),
        updatedBy: user.id,
      });

      console.log('✅ 정산 자동화 설정 저장 완료:', newSettings);

      // 로컬 state 업데이트
      setSettings(newSettings);
    } catch (error) {
      console.error('❌ 설정 저장 실패:', error);
      throw error;
    }
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  if (!isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">권한이 없습니다</h2>
          <p className="text-gray-600 mb-6">정산 설정은 매니저만 접근할 수 있습니다.</p>
          <button
            onClick={() => navigate('/space/manage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            스페이스 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/space/manage')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">정산 자동화 설정</h1>
              <p className="text-sm text-gray-600">{selectedSpace?.spaceName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 설정 컨텐츠 */}
      <div className="max-w-4xl mx-auto p-4">
        <SettlementScheduleSettings
          spaceId={selectedSpace?.id}
          settings={settings}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default SettlementSchedulePage;
