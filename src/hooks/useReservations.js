import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import reservationService from '../services/reservationService';
import authService from '../services/authService';

export const useReservations = (spaceId, currentWeekStart) => {
  const { reservations, setReservations, addProfiles, invalidateCalendarCache } = useStore();
  const [loading, setLoading] = useState(false);
  
  const fetchReservations = useCallback(async () => {
    if (!spaceId || !currentWeekStart) return;

    setLoading(true);
    try {
      // 현재 주 + 이전 주 + 다음 주 (총 3주) 로드
      const prevWeekStart = new Date(currentWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);

      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);

      // 3주치 데이터를 병렬로 로드
      const [prevWeekResult, currentWeekResult, nextWeekResult] = await Promise.all([
        reservationService.getReservations(spaceId, prevWeekStart),
        reservationService.getReservations(spaceId, currentWeekStart),
        reservationService.getReservations(spaceId, nextWeekStart)
      ]);

      // 3주치 데이터 병합
      const allReservations = {
        ...prevWeekResult.reservations,
        ...currentWeekResult.reservations,
        ...nextWeekResult.reservations
      };

      // 중복 제거된 userIds
      const allUserIds = Array.from(new Set([
        ...prevWeekResult.userIds,
        ...currentWeekResult.userIds,
        ...nextWeekResult.userIds
      ]));

      setReservations(allReservations);

      // 프로필 가져오기 (실패해도 계속 진행)
      if (allUserIds.length > 0) {
        try {
          const profiles = await authService.getUserProfiles(allUserIds);
          addProfiles(profiles);
        } catch (error) {
          // 프로필 로드 실패 시 조용히 무시 (예약은 name 필드 사용)
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [spaceId, currentWeekStart, setReservations, addProfiles]);
  
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);
  
  const createReservation = async (reservationData) => {
    await reservationService.createReservation(spaceId, reservationData);
    invalidateCalendarCache(); // 캘린더 캐시 무효화
    await fetchReservations();
  };

  const cancelReservation = async (reservationId, userId, cancelReason = '') => {
    await reservationService.cancelReservation(spaceId, reservationId, userId, cancelReason);
    invalidateCalendarCache(); // 캘린더 캐시 무효화
    await fetchReservations();
  };
  
  return { reservations, loading, createReservation, cancelReservation, refresh: fetchReservations };
};
