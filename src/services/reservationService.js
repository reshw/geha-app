import { collection, getDocs, addDoc, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDate } from '../utils/dateUtils';

class ReservationService {
  async getReservations(spaceId) {
    try {
      console.log('🔍 예약 조회 시작, spaceId:', spaceId);
      
      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);
      // 모든 예약 가져오기 (과거 포함)
      const snapshot = await getDocs(reservesRef);
      
      console.log('📋 reserves 문서 수:', snapshot.size);
      
      const reserveData = {};
      const userIds = new Set();
      
      snapshot.forEach((docSnap) => {
        try {
          const data = docSnap.data();
          console.log('  - 예약 문서:', docSnap.id, data);
          
          // checkIn, checkOut이 존재하고 Timestamp인지 확인
          if (!data.checkIn || !data.checkOut) {
            console.log('  ⚠️ checkIn/checkOut 없음:', docSnap.id);
            return;
          }
          
          if (typeof data.checkIn.toDate !== 'function' || typeof data.checkOut.toDate !== 'function') {
            console.log('  ⚠️ Timestamp 아님:', docSnap.id);
            return;
          }
          
          userIds.add(data.userId);
          
          const checkIn = data.checkIn.toDate();
          const checkOut = data.checkOut.toDate();
          
          // 체크인부터 체크아웃 전날까지
          let current = new Date(checkIn);
          const lastDay = new Date(checkOut);
          lastDay.setDate(lastDay.getDate() - 1);
          
          while (current <= lastDay) {
            const dateStr = formatDate(current);
            
            if (!reserveData[dateStr]) {
              reserveData[dateStr] = [];
            }
            
            reserveData[dateStr].push({
              id: docSnap.id,
              ...data,
              checkIn,
              checkOut,
              isCheckIn: current.getTime() === checkIn.getTime()
            });
            
            current.setDate(current.getDate() + 1);
          }
          
          console.log('  ✅ 예약 처리 완료:', docSnap.id);
        } catch (error) {
          console.error('  ❌ 예약 처리 에러:', docSnap.id, error);
        }
      });
      
      console.log('✅ 최종 reserveData keys:', Object.keys(reserveData));
      console.log('✅ 총 날짜 수:', Object.keys(reserveData).length);
      
      return { reservations: reserveData, userIds: Array.from(userIds) };
    } catch (error) {
      console.error('❌ getReservations 에러:', error);
      return { reservations: {}, userIds: [] };
    }
  }
  
  async createReservation(spaceId, userId, checkIn, checkOut, memo = '') {
    const reservesRef = collection(db, `spaces/${spaceId}/reserves`);
    
    await addDoc(reservesRef, {
      userId,
      checkIn: Timestamp.fromDate(checkIn),
      checkOut: Timestamp.fromDate(checkOut),
      memo,
      createdAt: Timestamp.now()
    });
  }
  
  async cancelReservation(spaceId, reservationId) {
    await deleteDoc(doc(db, `spaces/${spaceId}/reserves`, reservationId));
  }
}

export default new ReservationService();
