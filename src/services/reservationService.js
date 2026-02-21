import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc, query, where, Timestamp, orderBy, writeBatch, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDate } from '../utils/dateUtils';
import * as notificationService from './notificationService';  // ✅ named import로 변경
import expenseService from './expenseService';
import spaceSettingsService from './spaceSettingsService';

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

        // 🔒 취소된 예약은 제외 (Soft Delete 필터링)
        if (data.status === 'canceled') {
          return;
        }

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
  
  /**
   * 중복 예약 체크 (Firebase 직접 조회)
   * @param {string} spaceId - 공간 ID
   * @param {string} userId - 사용자 ID
   * @param {Date} checkIn - 체크인 날짜
   * @param {Date} checkOut - 체크아웃 날짜
   * @param {string} excludeReservationId - 제외할 예약 ID (수정 시 자기 자신 제외)
   * @returns {Promise<boolean>} - 중복 여부 (true: 중복 있음, false: 중복 없음)
   */
  async checkDuplicateReservation(spaceId, userId, checkIn, checkOut, excludeReservationId = null) {
    try {
      console.log('🔍 중복 예약 체크 시작 (같은 사용자만)');
      console.log('userId:', userId);
      console.log('날짜 범위:', checkIn, '~', checkOut);

      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);

      // 겹치는 예약 조회: checkIn < existingCheckOut AND checkOut > existingCheckIn
      const q = query(
        reservesRef,
        where('checkIn', '<', Timestamp.fromDate(checkOut)),
        where('checkOut', '>', Timestamp.fromDate(checkIn))
      );

      const snapshot = await getDocs(q);

      console.log('📋 조회된 예약 수:', snapshot.size);

      // 같은 userId이면서 취소되지 않은 예약 중 겹치는 것이 있는지 확인
      let hasDuplicate = false;
      let duplicateInfo = null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // 자기 자신 제외
        if (excludeReservationId && docSnap.id === excludeReservationId) {
          return;
        }

        // 취소된 예약은 제외
        if (data.status === 'canceled') {
          return;
        }

        // 🔑 같은 userId인지 확인 (다른 사람은 OK)
        if (String(data.userId) !== String(userId)) {
          return;
        }

        // 중복 발견 (같은 사람이 날짜 겹침)
        hasDuplicate = true;
        duplicateInfo = {
          id: docSnap.id,
          name: data.name,
          checkIn: data.checkIn.toDate(),
          checkOut: data.checkOut.toDate()
        };
      });

      if (hasDuplicate) {
        console.log('⚠️ 중복 예약 발견 (같은 사용자):', duplicateInfo);
      } else {
        console.log('✅ 중복 예약 없음');
      }

      return { hasDuplicate, duplicateInfo };
    } catch (error) {
      console.error('❌ 중복 체크 에러:', error);
      throw error;
    }
  }

  async createReservation(spaceId, reservationData) {
    try {
      console.log('📝 createReservation 시작');
      console.log('spaceId:', spaceId);
      console.log('reservationData:', reservationData);

      // 🔒 중복 예약 체크 (Firebase 직접 조회, 같은 사용자만)
      const { hasDuplicate, duplicateInfo } = await this.checkDuplicateReservation(
        spaceId,
        reservationData.userId,
        reservationData.checkIn,
        reservationData.checkOut
      );

      if (hasDuplicate) {
        const duplicateCheckIn = duplicateInfo.checkIn;
        const duplicateCheckOut = duplicateInfo.checkOut;
        throw new Error(
          `이미 예약이 있습니다.\n` +
          `기존 예약: ${duplicateInfo.name} (${duplicateCheckIn.getMonth() + 1}/${duplicateCheckIn.getDate()} ~ ${duplicateCheckOut.getMonth() + 1}/${duplicateCheckOut.getDate()})`
        );
      }

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
        gender: reservationData.gender || '',  // 성별 정보
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

      // 📊 dailyStats 업데이트 (캘린더 최적화)
      await this.updateDailyStats(
        spaceId,
        reservationData.checkIn,
        reservationData.checkOut,
        {
          userId: reservationData.userId,
          gender: reservationData.gender,
          type: reservationData.type
        },
        +1 // 생성
      );

      // 📝 이력 저장 (생성 이벤트)
      try {
        const historyRef = collection(db, 'spaces', spaceId, 'reserves', docId, 'history');
        await addDoc(historyRef, {
          timestamp: Timestamp.now(),
          changedBy: String(reservationData.userId),
          action: 'created',
          snapshot: {
            checkIn: dataToSave.checkIn,
            checkOut: dataToSave.checkOut,
            nights: dataToSave.nights,
            isDayTrip: dataToSave.isDayTrip,
            name: dataToSave.name,
            type: dataToSave.type
          }
        });
        console.log('✅ 생성 이력 저장 완료');
      } catch (historyError) {
        console.error('⚠️ 이력 저장 실패 (예약은 완료됨):', historyError);
      }

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

      // 💰 게스트 예약 시 자동 입금 생성
      if (reservationData.type === 'guest') {
        try {
          const guestPolicy = await spaceSettingsService.getGuestPolicy(spaceId);

          if (guestPolicy?.guestPricePerNight && reservationData.nights > 0) {
            await expenseService.createAutoGuestIncome(spaceId, {
              ...reservationData,
              reservationId: docId,
              hostId: reservationData.hostId || reservationData.userId,
              hostDisplayName: reservationData.hostDisplayName || '운영진'
            }, guestPolicy);

            console.log('✅ 게스트 입금 자동 생성 완료');
          } else {
            console.log('ℹ️ 게스트 요금 설정 없음 또는 당일치기 (자동 입금 생성 건너뜀)');
          }
        } catch (incomeError) {
          console.error('⚠️ 게스트 입금 생성 실패 (예약은 완료됨):', incomeError);
        }
      }

      return { docId, ...dataToSave };
    } catch (error) {
      console.error('❌ createReservation 에러:', error);
      throw error;
    }
  }
  
  async cancelReservation(spaceId, reservationId, userId, cancelReason = '') {
    if (!spaceId || !reservationId) {
      throw new Error('spaceId 또는 reservationId가 없습니다.');
    }

    if (!userId) {
      throw new Error('취소 처리를 위해 사용자 정보가 필요합니다.');
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

      // 이미 취소된 예약인지 확인
      if (reserveData.status === 'canceled') {
        throw new Error('이미 취소된 예약입니다.');
      }

      // 체크인 날짜 가져오기
      const checkInDate = reserveData.checkIn?.toDate();
      if (!checkInDate) {
        throw new Error('예약 날짜 정보가 올바르지 않습니다.');
      }

      // 1. 예약 날짜가 현재 시간보다 이전인지 확인
      if (checkInDate < now) {
        throw new Error('이미 지난 예약은 취소할 수 없습니다.');
      }

      // 2. 체크인 완료된 예약인지 확인
      if (reserveData.status === 'checked-in') {
        throw new Error('이미 체크인이 완료된 예약은 취소할 수 없습니다.');
      }

      // 📝 이력 저장 (취소 전 상태 스냅샷)
      try {
        const historyRef = collection(db, 'spaces', spaceId, 'reserves', reservationId, 'history');

        // 방어적 코딩: 존재하는 필드만 저장
        const snapshot = {
          checkIn: reserveData.checkIn,
          checkOut: reserveData.checkOut,
          status: reserveData.status || 'active',
          name: reserveData.name
        };

        // 선택적 필드 추가
        if ('nights' in reserveData) snapshot.nights = reserveData.nights;
        if ('isDayTrip' in reserveData) snapshot.isDayTrip = reserveData.isDayTrip;
        if ('type' in reserveData) snapshot.type = reserveData.type;
        if ('userId' in reserveData) snapshot.userId = reserveData.userId;

        await addDoc(historyRef, {
          timestamp: Timestamp.now(),
          changedBy: String(userId),
          action: 'canceled',
          snapshot,
          cancelReason: cancelReason || ''
        });
        console.log('✅ 취소 이력 저장 완료');
      } catch (historyError) {
        console.error('⚠️ 이력 저장 실패 (취소는 진행됨):', historyError);
      }

      // ✅ 검증 통과 - Soft Delete (status만 변경, 데이터는 보존)
      await setDoc(reserveRef, {
        status: 'canceled',
        canceledAt: Timestamp.now(),
        canceledBy: String(userId),
        cancelReason: cancelReason || '',
        updatedAt: Timestamp.now()
      }, { merge: true });

      console.log('✅ 예약 취소 완료 (Soft Delete):', reservationId, {
        canceledBy: userId,
        canceledAt: new Date().toISOString()
      });

      // 📊 dailyStats 업데이트 (캘린더 최적화) - 카운트 감소
      await this.updateDailyStats(
        spaceId,
        reserveData.checkIn.toDate(),
        reserveData.checkOut.toDate(),
        {
          userId: reserveData.userId,
          gender: reserveData.gender,
          type: reserveData.type
        },
        -1 // 취소
      );

      // 💰 게스트 예약 취소 시 연결된 입금 반려
      if (reserveData.type === 'guest') {
        try {
          await expenseService.rejectLinkedIncome(spaceId, reservationId, {
            rejecterId: String(userId),
            rejecterName: userName
          });
          console.log('✅ 연결된 입금 반려 완료');
        } catch (incomeError) {
          console.error('⚠️ 연결된 입금 반려 실패:', incomeError);
        }
      }

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
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // 원본 체크인/체크아웃 날짜 확인
      const originalCheckIn = existingData.checkIn?.toDate();
      const originalCheckOut = existingData.checkOut?.toDate();

      if (!originalCheckIn || !originalCheckOut) {
        throw new Error('예약 날짜 정보가 올바르지 않습니다.');
      }

      // 날짜만 비교 (시간 부분 무시)
      const originalCheckInDate = new Date(originalCheckIn);
      originalCheckInDate.setHours(0, 0, 0, 0);

      const originalCheckOutDate = new Date(originalCheckOut);
      originalCheckOutDate.setHours(0, 0, 0, 0);

      // 🔒 보안 검증 1: 완전히 끝난 예약은 수정 불가
      if (originalCheckOutDate < now) {
        throw new Error('이미 종료된 예약은 수정할 수 없습니다.');
      }

      // 🔒 보안 검증 2: 진행 중인 예약은 시작일 변경 불가 (퇴실일은 자유롭게 변경 가능)
      if (originalCheckInDate < now) {
        const newCheckIn = updateData.checkIn;
        const newCheckInDate = new Date(newCheckIn);
        newCheckInDate.setHours(0, 0, 0, 0);

        // 시작일이 다르면 차단
        if (originalCheckInDate.getTime() !== newCheckInDate.getTime()) {
          throw new Error('이미 시작된 예약의 시작일은 변경할 수 없습니다.');
        }
      }

      // 🔒 중복 예약 체크 (Firebase 직접 조회, 같은 사용자만, 자기 자신 제외)
      const { hasDuplicate, duplicateInfo } = await this.checkDuplicateReservation(
        spaceId,
        existingData.userId,
        updateData.checkIn,
        updateData.checkOut,
        reservationId  // 자기 자신은 제외
      );

      if (hasDuplicate) {
        const duplicateCheckIn = duplicateInfo.checkIn;
        const duplicateCheckOut = duplicateInfo.checkOut;
        throw new Error(
          `이미 예약이 있습니다.\n` +
          `기존 예약: ${duplicateInfo.name} (${duplicateCheckIn.getMonth() + 1}/${duplicateCheckIn.getDate()} ~ ${duplicateCheckOut.getMonth() + 1}/${duplicateCheckOut.getDate()})`
        );
      }

      // 📝 이력 저장 (수정 전 상태 스냅샷)
      try {
        const historyRef = collection(db, 'spaces', spaceId, 'reserves', reservationId, 'history');
        
        // 방어적 코딩: 존재하는 필드만 저장
        const snapshot = {
          checkIn: existingData.checkIn,
          checkOut: existingData.checkOut,
          name: existingData.name
        };
        
        // 선택적 필드 추가
        if ('nights' in existingData) snapshot.nights = existingData.nights;
        if ('isDayTrip' in existingData) snapshot.isDayTrip = existingData.isDayTrip;
        if ('type' in existingData) snapshot.type = existingData.type;
        if ('status' in existingData) snapshot.status = existingData.status;
        
        // changes 객체 안전하게 구성
        const changes = {
          checkIn: {
            before: existingData.checkIn?.toDate?.() ? existingData.checkIn.toDate().toISOString() : String(existingData.checkIn),
            after: updateData.checkIn.toISOString()
          },
          checkOut: {
            before: existingData.checkOut?.toDate?.() ? existingData.checkOut.toDate().toISOString() : String(existingData.checkOut),
            after: updateData.checkOut.toISOString()
          }
        };
        
        // nights 변경 사항이 있으면 추가
        if ('nights' in existingData || 'nights' in updateData) {
          changes.nights = {
            before: existingData.nights ?? 0,
            after: updateData.nights ?? 0
          };
        }
        
        await addDoc(historyRef, {
          timestamp: Timestamp.now(),
          changedBy: String(updateData.userId || 'unknown'),
          action: 'updated',
          snapshot,
          changes
        });
        console.log('✅ 수정 이력 저장 완료');
      } catch (historyError) {
        console.error('⚠️ 이력 저장 실패 (수정은 진행됨):', historyError);
      }

      // 업데이트할 데이터 준비
      const dataToUpdate = {
        checkIn: Timestamp.fromDate(updateData.checkIn),
        checkOut: Timestamp.fromDate(updateData.checkOut),
        nights: updateData.nights ?? 0,
        isDayTrip: updateData.isDayTrip ?? false,
        updatedAt: Timestamp.now(),
        updatedBy: String(updateData.userId || 'unknown')
      };

      // 메모가 전달된 경우 업데이트
      if ('memo' in updateData) {
        dataToUpdate.memo = updateData.memo || '';
      }

      // 예약 문서 업데이트
      await setDoc(reserveRef, dataToUpdate, { merge: true });

      // 📊 dailyStats 업데이트 (기존 날짜 제거 + 새 날짜 추가)
      // 1. 기존 날짜에서 제거
      await this.updateDailyStats(
        spaceId,
        originalCheckIn,
        originalCheckOut,
        {
          userId: existingData.userId,
          gender: existingData.gender,
          type: existingData.type
        },
        -1 // 제거
      );

      // 2. 새 날짜에 추가
      await this.updateDailyStats(
        spaceId,
        updateData.checkIn,
        updateData.checkOut,
        {
          userId: existingData.userId,
          gender: existingData.gender,
          type: existingData.type
        },
        +1 // 추가
      );

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
      console.log('기간:', startDate, '~', endDate);

      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);

      let q;

      if (startDate) {
        // checkIn 필드로만 필터링 (Firebase 제약 회피)
        // checkOut은 클라이언트에서 필터링
        const start = Timestamp.fromDate(startDate);

        q = query(
          reservesRef,
          where('checkIn', '>=', start),
          orderBy('checkIn', 'asc')
        );
      } else {
        // 전체 조회
        q = query(reservesRef, orderBy('checkIn', 'desc'));
      }

      const snapshot = await getDocs(q);

      console.log('📋 Firebase에서 조회된 예약 수:', snapshot.size);

      const reservations = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // 🔒 취소된 예약은 제외 (Soft Delete 필터링)
        if (data.status === 'canceled') {
          return;
        }

        if (!data.checkIn || !data.checkOut) {
          return;
        }

        const checkIn = data.checkIn.toDate();
        const checkOut = data.checkOut.toDate();

        // 클라이언트 측 기간 필터링 (날짜 겹침 체크)
        if (startDate && endDate) {
          // checkIn이 endDate보다 늦거나, checkOut이 startDate보다 이르면 제외
          if (checkIn > endDate || checkOut < startDate) {
            return;
          }
        }

        reservations.push({
          id: docSnap.id,
          ...data,
          checkIn,
          checkOut
        });
      });

      console.log('✅ 필터링 후 예약 수:', reservations.length);

      return reservations;
    } catch (error) {
      console.error('❌ getAllReservations 에러:', error);
      return [];
    }
  }

  // 🆕 취소된 예약 조회 (관리자용 - 취소 이력 확인)
  async getCanceledReservations(spaceId, startDate = null, endDate = null) {
    try {
      console.log('📊 취소 예약 조회 시작, spaceId:', spaceId);

      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);

      let q;

      if (startDate && endDate) {
        // 기간 필터링
        const start = Timestamp.fromDate(startDate);
        const end = Timestamp.fromDate(endDate);

        q = query(
          reservesRef,
          where('status', '==', 'canceled'),
          where('canceledAt', '>=', start),
          where('canceledAt', '<=', end),
          orderBy('canceledAt', 'desc')
        );
      } else {
        // 전체 조회
        q = query(
          reservesRef,
          where('status', '==', 'canceled'),
          orderBy('canceledAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);

      console.log('📋 취소된 예약 수:', snapshot.size);

      const canceledReservations = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (!data.checkIn || !data.checkOut) {
          return;
        }

        canceledReservations.push({
          id: docSnap.id,
          ...data,
          checkIn: data.checkIn.toDate(),
          checkOut: data.checkOut.toDate(),
          canceledAt: data.canceledAt?.toDate() || null
        });
      });

      return canceledReservations;
    } catch (error) {
      console.error('❌ getCanceledReservations 에러:', error);
      return [];
    }
  }

  // 📜 특정 예약의 변경 이력 조회
  async getReservationHistory(spaceId, reservationId) {
    try {
      console.log('📜 예약 이력 조회:', reservationId);

      const historyRef = collection(db, 'spaces', spaceId, 'reserves', reservationId, 'history');
      const q = query(historyRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      console.log('📋 이력 수:', snapshot.size);

      const history = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        history.push({
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate() || null
        });
      });

      return history;
    } catch (error) {
      console.error('❌ getReservationHistory 에러:', error);
      return [];
    }
  }

  // ===== Daily Stats (캘린더 최적화) =====

  /**
   * 예약 생성/취소 시 dailyStats 업데이트 (Batch)
   * @param {string} spaceId - 스페이스 ID
   * @param {Date} checkIn - 체크인 날짜
   * @param {Date} checkOut - 체크아웃 날짜
   * @param {object} userData - { userId, gender, type }
   * @param {number} delta - +1 (생성) 또는 -1 (취소)
   */
  async updateDailyStats(spaceId, checkIn, checkOut, userData, delta = 1) {
    try {
      const batch = writeBatch(db);
      const dates = [];

      // 체크인부터 체크아웃 전날까지
      let current = new Date(checkIn);
      const lastDay = new Date(checkOut);
      lastDay.setDate(lastDay.getDate() - 1);

      while (current <= lastDay) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
      }

      // 각 날짜의 dailyStats 업데이트
      for (const dateStr of dates) {
        const statsRef = doc(db, `spaces/${spaceId}/dailyStats`, dateStr);

        // increment 사용 (없으면 생성, 있으면 증감)
        const updateData = {
          date: dateStr,
          totalCount: increment(delta),
          updatedAt: Timestamp.now()
        };

        // 성별 카운트
        if (userData.gender === 'male') {
          updateData.maleCount = increment(delta);
        } else if (userData.gender === 'female') {
          updateData.femaleCount = increment(delta);
        }

        // 게스트/멤버 카운트
        const memberTypes = ['shareholder', 'manager', 'vice-manager'];
        if (memberTypes.includes(userData.type)) {
          updateData.memberCount = increment(delta);
        } else {
          updateData.guestCount = increment(delta);
        }

        batch.set(statsRef, updateData, { merge: true });

        // userIds 배열 관리 (내 예약 확인용)
        // Note: increment로는 배열 관리 불가, 별도 로직 필요 시 transaction 사용
      }

      await batch.commit();
      console.log(`✅ dailyStats 업데이트 완료 (${dates.length}일, delta: ${delta})`);
    } catch (error) {
      console.error('❌ dailyStats 업데이트 실패:', error);
      // 실패해도 예약은 유지 (dailyStats는 보조 데이터)
    }
  }

  /**
   * 월간 dailyStats 조회 (캘린더용)
   * @param {string} spaceId - 스페이스 ID
   * @param {Date} monthStart - 월 시작일
   * @returns {object} - { "2026-02-12": { totalCount, maleCount, ... }, ... }
   */
  async getDailyStats(spaceId, monthStart) {
    try {
      // 월의 첫째 주 월요일부터 6주치
      const firstOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
      const day = firstOfMonth.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const firstMonday = new Date(firstOfMonth);
      firstMonday.setDate(firstOfMonth.getDate() + diff);

      const dates = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(firstMonday);
        date.setDate(firstMonday.getDate() + i);
        dates.push(formatDate(date));
      }

      // 병렬로 dailyStats 조회
      const statsPromises = dates.map(dateStr =>
        getDoc(doc(db, `spaces/${spaceId}/dailyStats`, dateStr))
      );

      const statsSnaps = await Promise.all(statsPromises);

      const statsData = {};
      statsSnaps.forEach((snap, index) => {
        if (snap.exists()) {
          statsData[dates[index]] = {
            totalCount: snap.data().totalCount || 0,
            maleCount: snap.data().maleCount || 0,
            femaleCount: snap.data().femaleCount || 0,
            guestCount: snap.data().guestCount || 0,
            memberCount: snap.data().memberCount || 0
          };
        }
      });

      console.log(`✅ dailyStats 조회 완료: ${Object.keys(statsData).length}개 날짜`);
      return statsData;
    } catch (error) {
      console.error('❌ dailyStats 조회 실패:', error);
      return {};
    }
  }

  /**
   * 특정 사용자의 월간 예약 조회 (내 예약 확인용)
   * @param {string} spaceId - 스페이스 ID
   * @param {string} userId - 사용자 ID
   * @param {Date} startDate - 시작 날짜
   * @param {Date} endDate - 종료 날짜
   * @returns {object} - { "2026-02-12": [reservation], ... }
   */
  async getUserReservationsForMonth(spaceId, userId, startDate, endDate) {
    try {
      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);

      const q = query(
        reservesRef,
        where('userId', '==', String(userId)),
        where('checkIn', '<=', Timestamp.fromDate(endDate)),
        where('checkOut', '>=', Timestamp.fromDate(startDate)),
        orderBy('checkIn', 'asc')
      );

      const snapshot = await getDocs(q);

      const reserveData = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // 취소된 예약 제외
        if (data.status === 'canceled') {
          return;
        }

        if (!data.checkIn || !data.checkOut) {
          return;
        }

        const checkIn = data.checkIn.toDate();
        const checkOut = data.checkOut.toDate();

        // 당일치기 처리
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

      console.log(`✅ 사용자 예약 조회 완료: ${Object.keys(reserveData).length}개 날짜`);
      return reserveData;
    } catch (error) {
      console.error('❌ getUserReservationsForMonth 에러:', error);
      return {};
    }
  }

  /**
   * 특정 날짜의 모든 예약 조회 (날짜 클릭 시 상세 정보용)
   * @param {string} spaceId - 스페이스 ID
   * @param {Date} date - 조회할 날짜
   * @returns {Array} - 해당 날짜의 예약 배열
   */
  async getReservationsForDate(spaceId, date) {
    try {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);

      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);

      const q = query(
        reservesRef,
        where('checkIn', '<=', Timestamp.fromDate(dateEnd)),
        where('checkOut', '>', Timestamp.fromDate(dateStart)),
        orderBy('checkIn', 'asc')
      );

      const snapshot = await getDocs(q);

      const reservations = [];
      const userIds = new Set();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // 취소된 예약 제외
        if (data.status === 'canceled') {
          return;
        }

        if (!data.checkIn || !data.checkOut) {
          return;
        }

        const checkIn = data.checkIn.toDate();
        const checkOut = data.checkOut.toDate();

        // 🔍 체크아웃 당일은 숙박일이 아님 (체크인 ~ 체크아웃 전날까지만 숙박)
        const targetDateStr = formatDate(date);
        const checkOutDateStr = formatDate(checkOut);

        // 당일치기가 아닌 경우, 체크아웃 당일은 제외
        if (!data.isDayTrip && data.nights !== 0) {
          if (targetDateStr === checkOutDateStr) {
            return; // 체크아웃 당일은 숙박 안 함
          }
        }

        userIds.add(data.userId);

        reservations.push({
          id: docSnap.id,
          ...data,
          checkIn,
          checkOut,
          isCheckIn: checkIn.toDateString() === date.toDateString()
        });
      });

      console.log(`✅ 날짜별 예약 조회 완료: ${reservations.length}개`);
      return { reservations, userIds: Array.from(userIds) };
    } catch (error) {
      console.error('❌ getReservationsForDate 에러:', error);
      return { reservations: [], userIds: [] };
    }
  }

  /**
   * 🔧 마이그레이션: 예약에 gender 정보 채우기 (users 컬렉션에서 조회)
   * @param {string} spaceId - 스페이스 ID
   */
  async migrateReservationGender(spaceId) {
    try {
      console.log('🔄 예약 gender 마이그레이션 시작...');

      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);
      const q = query(reservesRef, where('status', '!=', 'canceled'));
      const snapshot = await getDocs(q);

      console.log(`📋 전체 예약 수: ${snapshot.size}`);

      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // 이미 gender가 있으면 스킵
        if (data.gender) {
          skippedCount++;
          continue;
        }

        if (!data.userId) {
          console.warn(`⚠️ userId 없음: ${docSnap.id}`);
          errorCount++;
          continue;
        }

        try {
          // users 컬렉션에서 gender 조회
          const userDocRef = doc(db, 'users', String(data.userId));
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            console.warn(`⚠️ 사용자 없음: ${data.userId}`);
            errorCount++;
            continue;
          }

          const userData = userDoc.data();
          const gender = userData.gender;

          if (!gender) {
            console.warn(`⚠️ gender 없음 (user: ${data.userId})`);
            errorCount++;
            continue;
          }

          // 예약에 gender 추가
          await setDoc(docSnap.ref, { gender }, { merge: true });
          updatedCount++;

          if (updatedCount % 10 === 0) {
            console.log(`✅ ${updatedCount}개 업데이트 완료...`);
          }
        } catch (err) {
          console.error(`❌ 예약 ${docSnap.id} 업데이트 실패:`, err);
          errorCount++;
        }
      }

      console.log(`🎉 gender 마이그레이션 완료!`);
      console.log(`  ✅ 업데이트: ${updatedCount}개`);
      console.log(`  ⏭️ 스킵: ${skippedCount}개 (이미 gender 있음)`);
      console.log(`  ❌ 오류: ${errorCount}개`);

      return { success: true, updatedCount, skippedCount, errorCount };
    } catch (error) {
      console.error('❌ gender 마이그레이션 실패:', error);
      throw error;
    }
  }

  /**
   * 🔧 마이그레이션: 기존 예약 데이터로 dailyStats 채우기 (최근 3개월 + 앞으로 3개월)
   * @param {string} spaceId - 스페이스 ID
   */
  async migrateDailyStats(spaceId) {
    try {
      console.log('🔄 dailyStats 마이그레이션 시작...');

      // 1️⃣ 기존 dailyStats 전체 삭제 (초기화)
      console.log('🗑️ 기존 dailyStats 삭제 중...');
      const statsRef = collection(db, `spaces/${spaceId}/dailyStats`);
      const existingStats = await getDocs(statsRef);

      if (existingStats.size > 0) {
        const deleteBatch = writeBatch(db);
        let deleteCount = 0;

        existingStats.forEach((docSnap) => {
          deleteBatch.delete(docSnap.ref);
          deleteCount++;

          // Firestore batch는 최대 500개 제한
          if (deleteCount >= 500) {
            console.log('⚠️ 500개 초과로 분할 삭제 필요 (첫 500개만 삭제됨)');
          }
        });

        await deleteBatch.commit();
        console.log(`✅ 기존 dailyStats ${deleteCount}개 삭제 완료`);
      } else {
        console.log('ℹ️ 삭제할 기존 dailyStats 없음');
      }

      // 2️⃣ 3개월 전부터 3개월 후까지 예약 조회
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      endDate.setHours(23, 59, 59, 999);

      const reservesRef = collection(db, `spaces/${spaceId}/reserves`);
      const q = query(
        reservesRef,
        where('checkIn', '>=', Timestamp.fromDate(startDate)),
        where('checkIn', '<=', Timestamp.fromDate(endDate)),
        where('status', '!=', 'canceled'),
        orderBy('checkIn', 'asc')
      );

      const snapshot = await getDocs(q);

      console.log(`📋 처리할 예약 수 (최근 6개월): ${snapshot.size}`);

      // 3️⃣ 새로 dailyStats 생성
      let count = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        if (!data.checkIn || !data.checkOut) {
          continue;
        }

        await this.updateDailyStats(
          spaceId,
          data.checkIn.toDate(),
          data.checkOut.toDate(),
          {
            userId: data.userId,
            gender: data.gender,
            type: data.type
          },
          +1
        );

        count++;
        if (count % 10 === 0) {
          console.log(`✅ ${count}/${snapshot.size} 예약 처리 완료`);
        }
      }

      console.log(`🎉 마이그레이션 완료! 총 ${count}개 예약 처리`);
      return { success: true, count };
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error);
      throw error;
    }
  }
}

export default new ReservationService();