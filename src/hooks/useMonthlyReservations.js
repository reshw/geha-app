// hooks/useMonthlyReservations.js
import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import reservationService from '../services/reservationService';
import authService from '../services/authService';

/**
 * 월간 캘린더용 예약 데이터 훅
 * 해당 월을 포함한 6주치 데이터를 로드합니다 (월 전체 + 이전/다음 월 일부)
 */
export const useMonthlyReservations = (spaceId, monthStart) => {
  const { reservations, setReservations, addProfiles } = useStore();
  const [loading, setLoading] = useState(false);

  const fetchReservations = useCallback(async () => {
    if (!spaceId || !monthStart) return;

    setLoading(true);
    try {
      // 월의 첫째 주 월요일 계산
      const firstOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
      const day = firstOfMonth.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const firstMonday = new Date(firstOfMonth);
      firstMonday.setDate(firstOfMonth.getDate() + diff);
      firstMonday.setHours(0, 0, 0, 0);

      // 6주치 데이터 로드 (월간 캘린더는 보통 6주 필요)
      const weeks = [];
      for (let i = 0; i < 6; i++) {
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + (i * 7));
        weeks.push(weekStart);
      }

      // 병렬로 6주치 데이터 로드
      const results = await Promise.all(
        weeks.map(weekStart => reservationService.getReservations(spaceId, weekStart))
      );

      // 모든 데이터 병합
      const allReservations = {};
      const allUserIdsSet = new Set();

      results.forEach(result => {
        Object.assign(allReservations, result.reservations);
        result.userIds.forEach(id => allUserIdsSet.add(id));
      });

      const allUserIds = Array.from(allUserIdsSet);

      console.log(`📅 월간 데이터 로드 (${monthStart.getFullYear()}년 ${monthStart.getMonth() + 1}월):`, Object.keys(allReservations).length, '개 날짜');
      setReservations(allReservations);

      // 프로필 가져오기
      if (allUserIds.length > 0) {
        try {
          const profiles = await authService.getUserProfiles(allUserIds);
          console.log('👥 프로필 로드:', Object.keys(profiles).length, '명');
          addProfiles(profiles);
        } catch (error) {
          console.warn('⚠️ 프로필 로드 실패:', error.message);
        }
      }
    } catch (error) {
      console.error('❌ 월간 예약 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [spaceId, monthStart, setReservations, addProfiles]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return { reservations, loading, refresh: fetchReservations };
};
