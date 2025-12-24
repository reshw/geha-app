// src/pages/ReservationStatsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Trophy,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Target,
  UserPlus,
  Medal
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import reservationService from '../services/reservationService';
import authService from '../services/authService';
import { formatDate } from '../utils/dateUtils';

const ReservationStatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSpace } = useStore();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [period, setPeriod] = useState('thisMonth'); // thisMonth, lastMonth, all
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (selectedSpace?.id) {
      loadData();
    }
  }, [selectedSpace?.id, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      // 기간 계산
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      let startDate = null;
      let endDate = new Date(today);

      if (period === 'thisMonth') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'lastMonth') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
      }
      // period === 'all'이면 startDate = null, endDate = today

      console.log('📊 기간:', period, startDate, endDate);

      // 예약 데이터 로드
      const allReservations = await reservationService.getAllReservations(
        spaceId,
        startDate,
        endDate
      );

      console.log('📋 로드된 예약 수:', allReservations.length);

      // 멤버 목록 조회
      const membersList = selectedSpace?.members || [];
      setMembers(membersList);

      // 프로필 조회
      const userIds = [...new Set(allReservations.map(r => r.userId))];
      const profilesData = await authService.getUserProfiles(userIds);

      setReservations(allReservations);
      setProfiles(profilesData);
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 월요일 구하기
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // 통계 계산
  const stats = useMemo(() => {
    if (!user) return null;

    // 내 예약 통계 (예약 건수가 아니라 숙박 일수로 계산)
    const myReservations = reservations.filter(r => String(r.userId) === String(user.id));
    const myStayCount = myReservations.reduce((sum, r) => sum + (r.nights || 1), 0);

    // 게스트 타입 확인 (초대된 게스트인지)
    const guestReservations = myReservations.filter(r => r.type === 'guest');
    const myGuestCount = guestReservations.length;

    // 사용자별 숙박 일수 (nights 합계)
    const userStayCount = {};
    reservations.forEach(r => {
      if (!userStayCount[r.userId]) {
        userStayCount[r.userId] = 0;
      }
      userStayCount[r.userId] += (r.nights || 1);
    });

    // 사용자별 게스트 초대 통계 (hostId 기준)
    const userGuestInvites = {}; // 초대한 게스트 수
    const userGuestInviteNights = {}; // 게스트들의 총 숙박 일수

    reservations.forEach(r => {
      if (r.type === 'guest' && r.hostId) {
        if (!userGuestInvites[r.hostId]) {
          userGuestInvites[r.hostId] = 0;
          userGuestInviteNights[r.hostId] = 0;
        }
        userGuestInvites[r.hostId]++;
        userGuestInviteNights[r.hostId] += (r.nights || 1);
      }
    });

    // 주주만 필터링 (게스트 제외)
    const shareholderMembers = members.filter(m =>
      ['shareholder', 'manager', 'vice-manager'].includes(m.userType)
    );
    const shareholderIds = shareholderMembers.map(m => m.userId);

    // 주주 랭킹 (숙박 일수 기준)
    const shareholderRanking = Object.entries(userStayCount)
      .filter(([userId]) => shareholderIds.includes(userId))
      .sort((a, b) => b[1] - a[1])
      .map(([userId, count], index) => ({
        rank: index + 1,
        userId,
        count,
        profile: profiles[userId] || {}
      }));

    // 게스트 초대 랭킹 (주주만, 숙박 일수로 정렬)
    const guestInviteRanking = Object.entries(userGuestInviteNights)
      .filter(([userId]) => shareholderIds.includes(userId))
      .sort((a, b) => b[1] - a[1]) // 숙박 일수로 정렬
      .map(([userId, nights], index) => ({
        rank: index + 1,
        userId,
        nights, // 총 숙박 일수
        count: userGuestInvites[userId] || 0, // 게스트 수
        profile: profiles[userId] || {}
      }));

    // 내 순위
    const myStayRank = shareholderRanking.findIndex(r => String(r.userId) === String(user.id)) + 1;
    const myInviteRank = guestInviteRanking.findIndex(r => String(r.userId) === String(user.id)) + 1;

    // 내가 초대한 게스트 통계
    const myInviteCount = userGuestInvites[user.id] || 0;
    const myInviteNights = userGuestInviteNights[user.id] || 0;

    return {
      myStayCount,
      myGuestCount,
      myInviteCount,
      myInviteNights,
      myStayRank: myStayRank || '-',
      myInviteRank: myInviteRank || '-',
      shareholderRanking,
      guestInviteRanking,
      totalReservations: reservations.length,
      totalShareholders: shareholderIds.length
    };
  }, [reservations, profiles, user, members]);

  const getPeriodLabel = () => {
    if (period === 'thisMonth') return '이번 달';
    if (period === 'lastMonth') return '지난 달';
    return '전체 기간';
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-500';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-700';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-600" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-500" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return <div className="w-5 h-5 flex items-center justify-center text-xs font-bold">{rank}</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <h1 className="text-xl font-bold">예약 통계</h1>
            </div>
          </div>

          {/* 기간 선택 */}
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('thisMonth')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                period === 'thisMonth'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              이번 달
            </button>
            <button
              onClick={() => setPeriod('lastMonth')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                period === 'lastMonth'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              지난 달
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                period === 'all'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              전체
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 내 통계 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">내 통계 ({getPeriodLabel()})</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">숙박 일수</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats?.myStayCount || 0}박</div>
              <div className="text-xs text-blue-600 mt-1">
                {typeof stats?.myStayRank === 'number' ? `${stats.myStayRank}위` : '순위 없음'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">게스트 초대</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {stats?.myInviteNights || 0}박
              </div>
              <div className="text-xs text-green-600 mt-1">
                {stats?.myInviteCount || 0}명 초대 · {typeof stats?.myInviteRank === 'number' ? `${stats.myInviteRank}위` : '순위 없음'}
              </div>
            </div>
          </div>
        </div>

        {/* 숙박 횟수 랭킹 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">숙박 랭킹 (주주)</h2>
          </div>

          {stats?.shareholderRanking && stats.shareholderRanking.length > 0 ? (
            <div className="space-y-2">
              {stats.shareholderRanking.slice(0, 10).map((item) => (
                <div
                  key={item.userId}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    String(item.userId) === String(user.id)
                      ? 'bg-purple-50 border-2 border-purple-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(item.rank)}
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.profile.profileImage ? (
                      <img
                        src={item.profile.profileImage}
                        alt={item.profile.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {item.profile.displayName?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <span className="font-semibold text-gray-900 truncate">
                      {item.profile.displayName || '알 수 없음'}
                    </span>
                    {String(item.userId) === String(user.id) && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">나</span>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{item.count}박</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>아직 예약 데이터가 없습니다</p>
            </div>
          )}
        </div>

        {/* 게스트 초대 랭킹 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">게스트 초대 랭킹 (주주)</h2>
          </div>

          {stats?.guestInviteRanking && stats.guestInviteRanking.length > 0 ? (
            <div className="space-y-2">
              {stats.guestInviteRanking.slice(0, 10).map((item) => (
                <div
                  key={item.userId}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    String(item.userId) === String(user.id)
                      ? 'bg-purple-50 border-2 border-purple-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(item.rank)}
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.profile.profileImage ? (
                      <img
                        src={item.profile.profileImage}
                        alt={item.profile.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">
                          {item.profile.displayName?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <span className="font-semibold text-gray-900 truncate">
                      {item.profile.displayName || '알 수 없음'}
                    </span>
                    {String(item.userId) === String(user.id) && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">나</span>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{item.nights}박</div>
                    <div className="text-xs text-gray-500">({item.count}명)</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>아직 게스트 초대 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationStatsPage;
