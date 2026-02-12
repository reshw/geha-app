// hooks/useMonthlyReservations.js
import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import reservationService from '../services/reservationService';
import authService from '../services/authService';
import { useAuth } from './useAuth';

/**
 * 월간 캘린더용 예약 데이터 훅 (dailyStats 최적화 버전 + 캐싱)
 * dailyStats로 집계 데이터를 로드하고, 현재 사용자의 예약만 별도 로드
 */
export const useMonthlyReservations = (spaceId, monthStart) => {
  const { user } = useAuth();
  const { addProfiles, getCachedCalendarData, setCachedCalendarData } = useStore();
  const [dailyStats, setDailyStats] = useState({});
  const [myReservations, setMyReservations] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchReservations = useCallback(async (forceRefresh = false) => {
    if (!spaceId || !monthStart || !user?.id) return;

    // 캐시 키 생성 (YYYY-MM 형식)
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

    // 캐시 확인 (강제 새로고침이 아닐 때)
    if (!forceRefresh) {
      const cached = getCachedCalendarData(spaceId, monthKey);
      if (cached) {
        console.log('✅ 캐시에서 캘린더 데이터 로드');
        setDailyStats(cached.dailyStats);
        setMyReservations(cached.myReservations);
        return;
      }
    }

    setLoading(true);
    try {
      console.log('🔍 서버에서 캘린더 데이터 로드');

      // 월의 첫째 주 월요일 계산
      const firstOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
      const day = firstOfMonth.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const firstMonday = new Date(firstOfMonth);
      firstMonday.setDate(firstOfMonth.getDate() + diff);
      firstMonday.setHours(0, 0, 0, 0);

      // 6주치 마지막 날
      const lastDay = new Date(firstMonday);
      lastDay.setDate(firstMonday.getDate() + 41);
      lastDay.setHours(23, 59, 59, 999);

      // 병렬로 데이터 로드
      const [stats, userReservations] = await Promise.all([
        reservationService.getDailyStats(spaceId, monthStart),
        reservationService.getUserReservationsForMonth(spaceId, user.id, firstMonday, lastDay)
      ]);

      setDailyStats(stats);
      setMyReservations(userReservations);

      // 캐시 저장
      setCachedCalendarData(spaceId, monthKey, {
        dailyStats: stats,
        myReservations: userReservations
      });

      // 내 프로필 추가 (내 예약 표시용)
      if (user.id) {
        addProfiles({ [user.id]: user });
      }
    } catch (error) {
      console.error('❌ 월간 예약 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [spaceId, monthStart, user, addProfiles, getCachedCalendarData, setCachedCalendarData]);

  // 특정 날짜의 전체 예약 조회 (날짜 클릭 시)
  const fetchDateReservations = useCallback(async (date) => {
    if (!spaceId) return [];

    try {
      const result = await reservationService.getReservationsForDate(spaceId, date);

      // 프로필 가져오기
      if (result.userIds.length > 0) {
        try {
          const profiles = await authService.getUserProfiles(result.userIds);
          addProfiles(profiles);
        } catch (error) {
          console.error('프로필 로드 실패:', error);
        }
      }

      return result.reservations;
    } catch (error) {
      console.error('❌ 날짜별 예약 조회 실패:', error);
      return [];
    }
  }, [spaceId, addProfiles]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return {
    dailyStats,
    myReservations,
    loading,
    refresh: () => fetchReservations(true), // 강제 새로고침
    fetchDateReservations
  };
};
