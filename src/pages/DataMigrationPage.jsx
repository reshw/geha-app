import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { ArrowLeft, Database, Users, Calendar } from 'lucide-react';
import reservationService from '../services/reservationService';
import BottomNav from '../components/common/BottomNav';

export default function DataMigrationPage() {
  const navigate = useNavigate();
  const { selectedSpace } = useStore();
  const [migrating, setMigrating] = useState({
    gender: false,
    dailyStats: false
  });

  const spaceId = selectedSpace?.id || selectedSpace?.spaceId;

  const handleMigrateGender = async () => {
    if (!window.confirm('예약 데이터에 성별 정보를 채웁니다.\n\n이 작업은 시간이 걸릴 수 있습니다.\n계속하시겠습니까?')) {
      return;
    }

    setMigrating(prev => ({ ...prev, gender: true }));
    try {
      const result = await reservationService.migrateReservationGender(spaceId);
      alert(`✅ Gender 마이그레이션 완료!\n\n업데이트: ${result.updatedCount}개\n스킵: ${result.skippedCount}개\n오류: ${result.errorCount}개`);
    } catch (error) {
      console.error('❌ Gender 마이그레이션 실패:', error);
      alert('❌ 마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setMigrating(prev => ({ ...prev, gender: false }));
    }
  };

  const handleMigrateDailyStats = async () => {
    if (!window.confirm('캘린더 통계 데이터를 초기화하고 재생성합니다.\n\n이 작업은 시간이 걸릴 수 있습니다.\n계속하시겠습니까?')) {
      return;
    }

    setMigrating(prev => ({ ...prev, dailyStats: true }));
    try {
      const result = await reservationService.migrateDailyStats(spaceId);
      alert(`✅ 캘린더 통계 마이그레이션 완료!\n\n총 ${result.count}개 예약 처리됨`);
    } catch (error) {
      console.error('❌ 통계 마이그레이션 실패:', error);
      alert('❌ 마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setMigrating(prev => ({ ...prev, dailyStats: false }));
    }
  };

  const migrations = [
    {
      id: 'gender',
      title: '예약 성별 정보 채우기',
      description: 'users 컬렉션에서 성별 정보를 가져와 예약 데이터에 추가합니다.',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      onClick: handleMigrateGender,
      isLoading: migrating.gender
    },
    {
      id: 'dailyStats',
      title: '캘린더 통계 초기화',
      description: '캘린더 일별 통계를 재생성합니다. (성별, 게스트 카운트 등)',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      onClick: handleMigrateDailyStats,
      isLoading: migrating.dailyStats
    }
  ];

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
            <div>
              <h1 className="text-xl font-bold text-white">데이터 마이그레이션</h1>
              <p className="text-sm text-slate-300">{selectedSpace?.spaceName || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 마이그레이션 카드 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {migrations.map((migration) => {
            const Icon = migration.icon;
            return (
              <button
                key={migration.id}
                onClick={migration.onClick}
                disabled={migration.isLoading || migrating.gender || migrating.dailyStats}
                className="w-full bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${migration.color} flex items-center justify-center shadow-lg`}>
                    {migration.isLoading ? (
                      <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {migration.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {migration.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-300">
              <p className="font-medium mb-2">마이그레이션 안내</p>
              <ul className="space-y-1 text-amber-200/80">
                <li>• 마이그레이션 중에는 다른 작업을 진행하지 마세요.</li>
                <li>• 데이터 양에 따라 시간이 걸릴 수 있습니다.</li>
                <li>• 문제 발생 시 개발자에게 문의해주세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
