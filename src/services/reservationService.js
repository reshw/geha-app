import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDate } from '../utils/dateUtils';
import notificationService from './notificationService';

class ReservationService {
  async getReservations(spaceId, currentWeekStart) {
    try {
      console.log('🔍 예약 조회 시작, spaceId:', spaceId);
      
      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);
      
      // 현재 주 시작일 기준으로 앞뒤 1주씩 (총 3주 범위)
      const startDate = new Date(currentWeekStart);
      startDate.setDate(startDate.getDate() - 7); // 1주 전
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 20); // 현재주 7일 + 뒤 2주 (13일)
      endDate.setHours(23, 59, 59, 999);
      
      console.log('📅 쿼리 범위:', {
        start: startDate.toLocaleDateString('ko-KR'),
        end: endDate.toLocaleDateString('ko-KR'),
        currentWeek: currentWeekStart.toLocaleDateString('ko-KR')
      });
      
      // checkIn <= endDate AND checkOut >= startDate 범위의 예약만 조회
      const q = query(
        reservesRef,
        where('checkIn', '<=', Timestamp.fromDate(endDate)),
        where('checkOut', '>=', Timestamp.fromDate(startDate)),
        orderBy('checkIn', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      console.log('📋 reserves 문서 수:', snapshot.size);
      
      const reserveData = {};
      const userIds = new Set();
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // checkIn, checkOut이 존재하고 Timestamp인지 확인
        if (!data.checkIn || !data.checkOut) {
          console.warn('⚠️ checkIn/checkOut 없음:', docSnap.id);
          return;
        }
        
        if (typeof data.checkIn.toDate !== 'function' || typeof data.checkOut.toDate !== 'function') {
          console.warn('⚠️ Timestamp 아님:', docSnap.id);
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
      });
      
      console.log('✅ 날짜별 예약 생성 완료:', Object.keys(reserveData).length, '개 날짜');
      
      return { reservations: reserveData, userIds: Array.from(userIds) };
    } catch (error) {
      console.error('❌ getReservations 에러:', error);
      return { reservations: {}, userIds: [] };
    }
  }
  
  async createReservation(spaceId, reservationData) {
    try {
      console.log('📝 createReservation 시작');
      console.log('spaceId:', spaceId);
      console.log('reservationData:', reservationData);
      
      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);
      
      // 체크인 날짜 기준 문서 ID 생성 (관리자 편의성)
      const checkInDate = reservationData.checkIn;
      const now = new Date();
      
      // YYYYMMDD_HHMMSS_랜덤4자리
      const docId = `${checkInDate.getFullYear()}${String(checkInDate.getMonth() + 1).padStart(2, '0')}${String(checkInDate.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}_${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      
      console.log('생성된 문서 ID (체크인일 기준):', docId);
      
      const dataToSave = {
        userId: String(reservationData.userId),  // 문자열로 변환
        name: reservationData.name,
        type: reservationData.type,
        checkIn: Timestamp.fromDate(reservationData.checkIn),
        checkOut: Timestamp.fromDate(reservationData.checkOut),
        nights: reservationData.nights || 1,
        memo: reservationData.memo || '',
        phone: reservationData.phone || '',
        hostDisplayName: reservationData.hostDisplayName || '',  // 초대자 이름
        hostId: reservationData.hostId || '',  // 초대자 ID
        status: 'active',
        createdAt: Timestamp.now()
      };
      
      console.log('💾 Firebase에 저장할 데이터:', dataToSave);
      
      await setDoc(doc(reservesRef, docId), dataToSave);
      
      console.log('✅ Firebase 저장 완료!');
      
      // 🔥 알림 발송 추가 (이메일 + 알림톡)
      try {
        console.log('📧 알림 발송 시작...');
        
        // Firebase에서 알림톡 설정 가져오기
        const alimtalkDocRef = doc(db, 'spaces', spaceId, 'settings', 'alimtalk');
        const alimtalkDoc = await getDoc(alimtalkDocRef);
        const alimtalkData = alimtalkDoc.exists() ? alimtalkDoc.data() : {};
        const alimtalkEnabled = alimtalkData.enabled === true; // enabled 필드 확인
        
        // 스페이스 이름 가져오기
        const spaceDocRef = doc(db, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceDocRef);
        const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};
        
        console.log('알림톡 활성화 여부:', alimtalkEnabled);
        console.log('알림톡 설정 데이터:', alimtalkData);
        
        console.log('알림톡 활성화 여부:', alimtalkEnabled);
        console.log('알림톡 설정 데이터:', alimtalkData);
        
        const notificationData = {
          ...reservationData,
          spaceName: spaceData.name || '조강308호',
          hostDisplayName: reservationData.hostDisplayName || ''
        };
        
        const result = await notificationService.sendReservationConfirm(
          notificationData,
          { alimtalkEnabled }
        );
        
        console.log('📬 알림 발송 결과:', result);
      } catch (notifyError) {
        // 알림 실패해도 예약은 성공으로 처리
        console.error('⚠️ 알림 발송 실패 (예약은 완료됨):', notifyError);
      }
      
      return { docId, ...dataToSave };
    } catch (error) {
      console.error('❌ createReservation 에러:', error);
      throw error;
    }
  }
  
  async cancelReservation(spaceId, reservationId) {
    await deleteDoc(doc(db, `spaces/${spaceId}/reserves`, reservationId));
  }
}

export default new ReservationService();