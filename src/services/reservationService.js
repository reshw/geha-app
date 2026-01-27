import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDate } from '../utils/dateUtils';
import * as notificationService from './notificationService';  // ✅ named import로 변경

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

        // 당일치기 처리 (nights === 0 또는 isDayTrip === true)
        if (data.nights === 0 || data.isDayTrip) {
          const dateStr = formatDate(checkIn);

          if (!reserveData[dateStr]) {
            reserveData[dateStr] = [];
          }

          reserveData[dateStr].push({
            id: docSnap.id,
            ...data,
            checkIn,
            checkOut,
            isCheckIn: true,
            isDayTrip: true
          });

          return;
        }

        // 체크인부터 체크아웃 전날까지 (기존 숙박 로직)
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
        nights: reservationData.nights ?? 1,  // 0 허용 (당일치기)
        isDayTrip: reservationData.nights === 0,  // 당일치기 플래그
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

        // 스페이스 정보 가져오기 (이름, 계좌번호)
        const spaceDocRef = doc(db, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceDocRef);
        const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};

        // 이메일 알림 설정 가져오기
        const emailSettingsRef = doc(db, 'spaces', spaceId, 'settings', 'email');
        const emailSettingsDoc = await getDoc(emailSettingsRef);
        const emailSettings = emailSettingsDoc.exists() ? emailSettingsDoc.data() : null;

        console.log('알림톡 활성화 여부:', alimtalkEnabled);
        console.log('알림톡 설정 데이터:', alimtalkData);
        console.log('스페이스 데이터:', spaceData);
        console.log('이메일 알림 설정:', emailSettings);

        const notificationData = {
          ...reservationData,
          spaceId: spaceId,  // ← notificationService에서 게스트 정책 조회에 필요
          spaceName: spaceData.name || '조강308호',
          hostDisplayName: reservationData.hostDisplayName || ''
        };

        // 알림톡 발송
        const result = await notificationService.sendReservationConfirm(
          notificationData,
          { alimtalkEnabled }
        );

        console.log('📬 알림톡 발송 결과:', result);

        // 이메일 발송
        if (emailSettings?.reservation?.enabled) {
          const reservationType = reservationData.type; // 'guest', 'shareholder', 'manager', 'vice-manager'
          const shouldSendEmail = emailSettings.reservation.types.includes(reservationType);

          if (shouldSendEmail && emailSettings.reservation.recipients.length > 0) {
            console.log(`📧 이메일 발송 시작 (${reservationType} 예약)`);

            try {
              const emailResponse = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'guest_reservation',
                  reservationType: reservationType, // 실제 예약 타입 전달 (guest, shareholder, manager, vice-manager)
                  name: reservationData.name,
                  phone: reservationData.phone,
                  checkIn: reservationData.checkIn,
                  checkOut: reservationData.checkOut,
                  gender: reservationData.gender,
                  birthYear: reservationData.birthYear,
                  hostDisplayName: reservationData.hostDisplayName,
                  memo: reservationData.memo,
                  spaceName: spaceData.name || '조강308호',
                  accountInfo: spaceData.accountBank && spaceData.accountNumber
                    ? `${spaceData.accountBank} ${spaceData.accountNumber} ${spaceData.accountHolder}`
                    : undefined,
                  recipients: {
                    to: emailSettings.reservation.recipients[0],
                    cc: emailSettings.reservation.recipients.slice(1)
                  }
                })
              });

              const emailResult = await emailResponse.json();
              console.log('✅ 이메일 발송 결과:', emailResult);
            } catch (emailError) {
              console.error('⚠️ 이메일 발송 실패 (예약은 완료됨):', emailError);
            }
          } else {
            console.log(`ℹ️ 이메일 발송 건너뜀: ${reservationType} 타입이 설정에 포함되지 않음 또는 수신자 없음`);
          }
        } else {
          console.log('ℹ️ 이메일 알림이 비활성화되어 있음');
        }
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
    if (!spaceId || !reservationId) {
      throw new Error('spaceId 또는 reservationId가 없습니다.');
    }

    const reserveRef = doc(db, 'spaces', spaceId, 'reserves', reservationId);

    try {
      // 🔒 취소 가능 여부 검증 (백엔드 레벨)
      const reserveDoc = await getDoc(reserveRef);

      if (!reserveDoc.exists()) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      const reserveData = reserveDoc.data();
      const now = new Date();

      // 체크인 날짜 가져오기
      const checkInDate = reserveData.checkIn?.toDate();
      if (!checkInDate) {
        throw new Error('예약 날짜 정보가 올바르지 않습니다.');
      }

      // 1. 예약 날짜가 현재 시간보다 이전인지 확인
      if (checkInDate < now) {
        throw new Error('이미 지난 예약은 취소할 수 없습니다.');
      }

      // 2. 체크인 완료된 예약인지 확인 (status === 'checked-in' 또는 기타 체크인 상태)
      if (reserveData.status === 'checked-in') {
        throw new Error('이미 체크인이 완료된 예약은 취소할 수 없습니다.');
      }

      // ✅ 검증 통과 - 예약 삭제
      await deleteDoc(reserveRef);
      console.log('✅ 예약 취소 완료:', reservationId);

      return { success: true };
    } catch (error) {
      console.error('❌ 예약 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 예약 수정 (체크인/체크아웃 날짜 변경)
   */
  async updateReservation(spaceId, reservationId, updateData) {
    if (!spaceId || !reservationId) {
      throw new Error('spaceId 또는 reservationId가 없습니다.');
    }

    const reserveRef = doc(db, 'spaces', spaceId, 'reserves', reservationId);

    try {
      // 기존 예약 정보 조회
      const reserveDoc = await getDoc(reserveRef);
      if (!reserveDoc.exists()) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      const existingData = reserveDoc.data();

      // 업데이트할 데이터 준비
      const dataToUpdate = {
        checkIn: Timestamp.fromDate(updateData.checkIn),
        checkOut: Timestamp.fromDate(updateData.checkOut),
        nights: updateData.nights ?? 0,
        isDayTrip: updateData.isDayTrip ?? false,
        updatedAt: Timestamp.now()
      };

      // 예약 문서 업데이트
      await setDoc(reserveRef, dataToUpdate, { merge: true });

      console.log('✅ 예약 수정 성공:', reservationId);
      return { success: true };
    } catch (error) {
      console.error('❌ 예약 수정 실패:', error);
      throw error;
    }
  }

  // 통계용: 전체 예약 데이터 조회 (기간 필터링 가능)
  async getAllReservations(spaceId, startDate = null, endDate = null) {
    try {
      console.log('📊 통계용 예약 조회 시작, spaceId:', spaceId);

      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);

      let q;

      if (startDate && endDate) {
        // 기간 필터링
        const start = Timestamp.fromDate(startDate);
        const end = Timestamp.fromDate(endDate);

        q = query(
          reservesRef,
          where('checkIn', '<=', end),
          where('checkOut', '>=', start),
          orderBy('checkIn', 'desc')
        );
      } else {
        // 전체 조회
        q = query(reservesRef, orderBy('checkIn', 'desc'));
      }

      const snapshot = await getDocs(q);

      console.log('📋 조회된 예약 수:', snapshot.size);

      const reservations = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (!data.checkIn || !data.checkOut) {
          return;
        }

        reservations.push({
          id: docSnap.id,
          ...data,
          checkIn: data.checkIn.toDate(),
          checkOut: data.checkOut.toDate()
        });
      });

      return reservations;
    } catch (error) {
      console.error('❌ getAllReservations 에러:', error);
      return [];
    }
  }
}

export default new ReservationService();