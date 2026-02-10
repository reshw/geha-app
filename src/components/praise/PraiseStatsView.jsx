// components/praise/PraiseStatsView.jsx
import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Calendar, TrendingUp } from 'lucide-react';
import praiseService from '../../services/praiseService';

export default function PraiseStatsView({ spaceId }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(4); // 기본 4개월

  useEffect(() => {
    if (spaceId) {
      loadStats();
    }
  }, [spaceId, period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const startDate = new Date(today);
      startDate.setMonth(today.getMonth() - period);
      startDate.setHours(0, 0, 0, 0);

      console.log('📊 통계 기간:', startDate, '~', today);

      const data = await praiseService.getReporterStats(spaceId, startDate, today);
      setStats(data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-600" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-500" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return <div className="w-5 h-5 flex items-center justify-center text-xs font-bold">{rank}</div>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-500';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-700';
  };

  const totalCount = stats.reduce((sum, stat) => sum + stat.reportCount, 0);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">통계를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 space-y-6">
      {/* 헤더 & 기간 필터 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">제보자 통계</h2>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={4}>최근 4개월</option>
            <option value={3}>최근 3개월</option>
            <option value={2}>최근 2개월</option>
            <option value={1}>최근 1개월</option>
          </select>
        </div>

        {/* 총 제보 건수 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">총 제보 건수</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">{totalCount}건</div>
          <div className="text-xs text-blue-600 mt-1">{stats.length}명이 참여했습니다</div>
        </div>
      </div>

      {/* 제보자 순위 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">제보자 순위</h2>
        </div>

        {stats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>아직 칭찬이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((stat, index) => {
              const rank = index + 1;

              return (
                <div
                  key={stat.userId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* 순위 아이콘 */}
                  <div className="flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* 프로필 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {stat.profileImage ? (
                      <img
                        src={stat.profileImage}
                        alt={stat.userName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {stat.userName?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <span className="font-semibold text-gray-900 truncate">
                      {stat.userName}
                    </span>
                  </div>

                  {/* 제보 건수 */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getRankColor(rank)}`}>
                      {stat.reportCount}건
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
