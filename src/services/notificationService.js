/**
 * 알림 서비스 (NHN Cloud 카카오 알림톡)
 *
 * 기존 Solapi 코드를 NHN Cloud로 전환
 */

import spaceSettingsService from './spaceSettingsService';

const NOTIFICATION_API_URL = '/api/send-notification';

/**
 * 예약 확인 알림 발송 (타입별 분기)
 * - 게스트(guest): 알림톡 발송
 * - 주주/매니저/부매니저: 알림 없음
 */
export async function sendReservationConfirm(reservationData, options = {}) {
  try {
    console.log('📨 예약 확인 알림 발송 체크:', {
      type: reservationData.type,
      alimtalkEnabled: options.alimtalkEnabled
    });

    // 게스트인 경우만 알림톡 발송
    if (reservationData.type === 'guest') {
      if (!options.alimtalkEnabled) {
        console.log('⚠️ 알림톡 비활성화 상태 - 발송 건너뜀');
        return { success: true, skipped: true, reason: 'alimtalk_disabled' };
      }
      
      return await sendGuestConfirmation(reservationData);
    }
    
    // 주주/매니저/부매니저는 알림 없음
    console.log('ℹ️ 주주/매니저 예약 - 알림 발송 안 함');
    return { success: true, skipped: true, reason: 'not_guest' };
    
  } catch (error) {
    console.error('❌ 예약 확인 알림 발송 실패:', error);
    // 알림 실패해도 예약은 성공으로 처리되도록 throw하지 않음
    return { success: false, error: error.message };
  }
}

/**
 * 게스트 예약 확인 알림톡 발송
 */
export async function sendGuestConfirmation(reservationData) {
  try {
    console.log('📨 게스트 예약 확인 알림톡 발송 시작:', reservationData);

    // 필수 데이터 검증
    if (!reservationData.phone) {
      throw new Error('전화번호가 없습니다.');
    }

    if (!reservationData.name) {
      throw new Error('예약자 이름이 없습니다.');
    }

    if (!reservationData.spaceId) {
      throw new Error('스페이스 ID가 없습니다.');
    }

    // 게스트 정책 정보 가져오기 (계좌 정보 + 1박 요금)
    let guestPolicy;
    try {
      guestPolicy = await spaceSettingsService.getGuestPolicy(reservationData.spaceId);
    } catch (error) {
      console.warn('게스트 정책 조회 실패, 기본값 사용:', error);
      guestPolicy = {
        accountBank: '카카오뱅크',
        accountNumber: '7942-24-38529',
        accountHolder: '이수진',
        guestPricePerNight: 30000
      };
    }

    // 날짜 포맷팅 (YYYY-MM-DD)
    const checkIn = formatDate(reservationData.checkIn);
    const checkOut = formatDate(reservationData.checkOut);

    // 박수 계산
    const nights = calculateNights(reservationData.checkIn, reservationData.checkOut);
    const days = nights + 1;

    // 금액 계산 (동적 1박 요금 사용)
    const pricePerNight = guestPolicy.guestPricePerNight || 30000;
    const cost = nights * pricePerNight;
    const pricePerNightper10000 = pricePerNight / 10000;

    // 라운지명 (전달받거나 기본값)
    const loungeName = reservationData.spaceName || '조강308호';

    // 계좌 정보 (게스트 정책에서 가져옴)
    const accountBank = guestPolicy.accountBank;
    const accountNumber = guestPolicy.accountNumber;
    const accountHolder = guestPolicy.accountHolder;

    // 현관번호 = 휴대폰 뒷자리 4자리
    // 예: 010-1234-5678 → "5678" 전달 → 템플릿에서 "567811*" 표시
    const doorNumber = extractPhoneLast4Digits(reservationData.phone);

    console.log('📋 알림톡 발송 데이터:', {
      name: reservationData.name,
      phone: reservationData.phone,
      loungeName,
      checkIn,
      checkOut,
      nights,
      days,
      cost,
      pricePerNightper10000,
      accountBank,
      accountNumber,
      accountHolder,
      doorNumber,
    });

    // 서버리스 함수 호출
    const response = await fetch(NOTIFICATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'guest_confirmation',
        reservationData: {
          name: reservationData.name,
          phone: reservationData.phone,
          loungeName,
          checkIn,
          checkOut,
          nights,
          days,
          cost,
          pricePerNightper10000,
          accountBank,      // 변경
          accountNumber,    // 추가
          accountHolder,    // 추가
          doorNumber,
        },
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '알림톡 발송 실패');
    }

    console.log('✅ 게스트 예약 확인 알림톡 발송 완료:', result);
    return result;

  } catch (error) {
    console.error('❌ 게스트 예약 확인 알림톡 발송 실패:', error);
    throw error;
  }
}

/**
 * 체크인 당일 출입 안내 알림톡 발송
 * (비밀번호 포함)
 */
export async function sendCheckinGuide(reservationData, password) {
  try {
    console.log('📨 체크인 안내 알림톡 발송 시작:', reservationData);

    // TODO: 체크인 안내 템플릿이 준비되면 구현
    console.warn('⚠️ 체크인 안내 템플릿이 아직 등록되지 않았습니다.');

    // 임시: 콘솔에만 출력
    console.log('🔑 현관 비밀번호:', password);

    return {
      success: true,
      message: '체크인 안내는 수동으로 발송해주세요.',
    };

  } catch (error) {
    console.error('❌ 체크인 안내 알림톡 발송 실패:', error);
    throw error;
  }
}

/**
 * 예약 취소 알림톡 발송
 */
export async function sendCancellationNotice(reservationData) {
  try {
    console.log('📨 예약 취소 알림톡 발송 시작:', reservationData);

    // TODO: 예약 취소 템플릿이 준비되면 구현
    console.warn('⚠️ 예약 취소 템플릿이 아직 등록되지 않았습니다.');

    return {
      success: true,
      message: '예약 취소 알림은 수동으로 발송해주세요.',
    };

  } catch (error) {
    console.error('❌ 예약 취소 알림톡 발송 실패:', error);
    throw error;
  }
}

/**
 * 정산 완료 알림톡 발송
 * 각 참여자에게 개별적으로 정산 결과 전송
 * - balance > 0: 받을 돈 있음 (JH8637)
 * - balance < 0: 낼 돈 있음 (JH8638)
 * - balance === 0: 알림 발송 안 함
 */
export async function sendSettlementComplete(settlementData, options = {}) {
  try {
    console.log('💰 정산 완료 알림톡 발송 시작:', {
      spaceId: settlementData.spaceId,
      weekId: settlementData.weekId,
      participantCount: Object.keys(settlementData.participants || {}).length
    });

    // 알림톡이 비활성화된 경우 건너뛰기
    if (!options.alimtalkEnabled) {
      console.log('⚠️ 알림톡 비활성화 상태 - 정산 알림 발송 건너뜀');
      return { success: true, skipped: true, reason: 'alimtalk_disabled' };
    }

    // 스페이스 정보 가져오기 (라운지명)
    const spaceData = options.spaceData || {};
    const loungeName = spaceData.name || settlementData.spaceName || '라운지';

    // 매니저 전화번호 (필수)
    const managerPhone = settlementData.managerPhone;
    if (!managerPhone) {
      console.warn('⚠️ 매니저 전화번호가 없습니다. 정산 알림을 발송할 수 없습니다.');
      return { success: false, error: 'manager_phone_missing' };
    }

    // 정산 계좌 정보 가져오기
    let settlementAccount;
    try {
      settlementAccount = await spaceSettingsService.getSettlementAccount(settlementData.spaceId);

      // 정산 계좌가 설정되지 않은 경우 게스트 정책 계좌 사용
      if (!settlementAccount.accountBank_settle || !settlementAccount.accountNumber_settle || !settlementAccount.accountHolder_settle) {
        console.warn('⚠️ 정산 계좌 미설정, 게스트 계좌 사용');
        const guestPolicy = await spaceSettingsService.getGuestPolicy(settlementData.spaceId);
        settlementAccount = {
          accountBank_settle: guestPolicy.accountBank,
          accountNumber_settle: guestPolicy.accountNumber,
          accountHolder_settle: guestPolicy.accountHolder,
        };
      }
    } catch (error) {
      console.warn('정산 계좌 조회 실패, 기본값 사용:', error);
      settlementAccount = {
        accountBank_settle: '카카오뱅크',
        accountNumber_settle: '7942-24-38529',
        accountHolder_settle: '이수진',
      };
    }

    const results = [];
    const errors = [];
    let skippedCount = 0;

    // 참여자 목록 상세 로그
    console.log('📋 참여자 목록 상세:', Object.entries(settlementData.participants).map(([userId, p]) => ({
      userId,
      name: p.name,
      phone: p.phone || '❌ 없음',
      balance: p.balance
    })));

    // 각 참여자에게 개별 발송
    for (const [userId, participant] of Object.entries(settlementData.participants)) {
      const balance = participant.balance || 0;

      console.log(`👤 참여자 처리 중:`, {
        userId,
        name: participant.name,
        phone: participant.phone || '❌ 없음',
        balance,
        hasPhone: !!participant.phone
      });

      // balance가 0이면 스킵
      if (balance === 0) {
        console.log(`ℹ️ [${participant.name}] 정산 완료 (balance: 0) - 발송 건너뜀`);
        skippedCount++;
        continue;
      }

      // 전화번호가 없으면 스킵
      if (!participant.phone) {
        console.log(`⚠️ [${participant.name}] 전화번호 없음 - 발송 건너뜀`, {
          participantObject: participant
        });
        skippedCount++;
        continue;
      }

      try {
        // balance에 따라 type 결정
        let notificationType;
        if (balance > 0) {
          notificationType = 'settlement_receive'; // JH8637
          console.log(`📱 [${participant.name}] 받을 돈 알림 발송 (${balance.toLocaleString()}원)`);
        } else {
          notificationType = 'settlement_pay'; // JH8638
          console.log(`📱 [${participant.name}] 낼 돈 알림 발송 (${Math.abs(balance).toLocaleString()}원)`);
        }

        // 서버리스 함수 호출
        const response = await fetch(NOTIFICATION_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: notificationType,
            settlementData: {
              name: participant.name,
              phone: participant.phone,
              loungeName,
              weekId: settlementData.weekId,
              totalPaid: participant.totalPaid || 0,
              totalOwed: participant.totalOwed || 0,
              balance: Math.abs(balance),
              managerPhone,
              accountBank: settlementAccount.accountBank_settle,
              accountNumber: settlementAccount.accountNumber_settle,
              accountHolder: settlementAccount.accountHolder_settle,
            },
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log(`✅ [${participant.name}] 정산 알림 발송 성공`);
          results.push({
            userId,
            name: participant.name,
            phone: participant.phone,
            balance: participant.balance,
            type: notificationType,
            status: 'sent'
          });
        } else {
          throw new Error(result.error || '알림톡 발송 실패');
        }

      } catch (error) {
        console.error(`❌ [${participant.name}] 정산 알림 발송 실패:`, error);
        errors.push({
          userId,
          name: participant.name,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: `${results.length}명에게 정산 알림을 발송했습니다.`,
      sentCount: results.length,
      errorCount: errors.length,
      skippedCount,
      results,
      errors
    };

  } catch (error) {
    console.error('❌ 정산 완료 알림톡 발송 실패:', error);
    // 알림 실패해도 정산 완료는 성공으로 처리
    return { success: false, error: error.message };
  }
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
function formatDate(date) {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    return date.split('T')[0];
  }

  if (date?.toDate) {
    // Firestore Timestamp
    return date.toDate().toISOString().split('T')[0];
  }

  throw new Error('올바르지 않은 날짜 형식입니다.');
}

/**
 * 박수 계산
 */
function calculateNights(checkIn, checkOut) {
  const checkInDate = checkIn instanceof Date ? checkIn : new Date(checkIn);
  const checkOutDate = checkOut instanceof Date ? checkOut : new Date(checkOut);

  const diffTime = Math.abs(checkOutDate - checkInDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 전화번호 정규화 (다양한 형식 → 010-XXXX-XXXX)
 *
 * 입력 형식:
 * - +82 10-3114-8626
 * - 01031148626
 * - 010-3114-8626
 *
 * 출력: 010-3114-8626
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return null;

  // 모든 공백, 하이픈, + 제거
  let cleaned = phone.replace(/[\s\-+]/g, '');

  // +82로 시작하면 82를 0으로 변환
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.slice(2);
  }

  // 010으로 시작하는 11자리 숫자인지 확인
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }

  // 형식이 올바르지 않으면 null 반환
  console.warn('⚠️ 올바르지 않은 전화번호 형식:', phone);
  return null;
}

/**
 * 전화번호 포맷팅 (하이픈 추가)
 * @deprecated normalizePhoneNumber 사용 권장
 */
export function formatPhoneNumber(phone) {
  return normalizePhoneNumber(phone);
}

/**
 * 전화번호 뒷자리 4자리 추출
 * 현관번호용: 010-1234-5678 → "5678"
 */
function extractPhoneLast4Digits(phone) {
  // 하이픈 제거
  const cleaned = phone.replace(/-/g, '');
  
  // 뒷자리 4자리 반환
  return cleaned.slice(-4);
}