import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import reservationService from '../services/reservationService';
import authService from '../services/authService';

export const useReservations = (spaceId, currentWeekStart) => {
  const { reservations, setReservations, addProfiles } = useStore();
  const [loading, setLoading] = useState(false);
  
  const fetchReservations = useCallback(async () => {
    if (!spaceId || !currentWeekStart) return;
    
    setLoading(true);
    try {
      const { reservations: data, userIds } = await reservationService.getReservations(spaceId, currentWeekStart);
      console.log('📥 예약 데이터 store에 저장:', Object.keys(data).length, '개 날짜');
      setReservations(data);
      
      // 프로필 가져오기 (실패해도 계속 진행)
      if (userIds.length > 0) {
        try {
          const profiles = await authService.getUserProfiles(userIds);
          console.log('👥 프로필 로드:', Object.keys(profiles).length, '명');
          addProfiles(profiles);
        } catch (error) {
          console.warn('⚠️ 프로필 로드 실패 (예약은 name 필드 사용):', error.message);
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
    await fetchReservations();
  };
  
  const cancelReservation = async (reservationId) => {
    await reservationService.cancelReservation(spaceId, reservationId);
    await fetchReservations();
  };
  
  return { reservations, loading, createReservation, cancelReservation, refresh: fetchReservations };
};
