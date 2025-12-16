/**
 * 알림 서비스 (NHN Cloud 카카오 알림톡)
 * 
 * 기존 Solapi 코드를 NHN Cloud로 전환
 */

const NETLIFY_FUNCTION_URL = '/.netlify/functions/send-notification';

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

    // 날짜 포맷팅 (YYYY-MM-DD)
    const checkIn = formatDate(reservationData.checkIn);
    const checkOut = formatDate(reservationData.checkOut);

    // 박수 계산
    const nights = calculateNights(reservationData.checkIn, reservationData.checkOut);
    const days = nights + 1;

    // 금액 계산 (1박 30,000원)
    const cost = nights * 30000;

    // 라운지명 (전달받거나 기본값)
    const loungeName = reservationData.spaceName || '조강308호';

    // 계좌 정보 (분리된 필드로 전달받거나 기본값)
    const accountBank = reservationData.accountBank || '카카오뱅크';
    const accountNumber = reservationData.accountNumber || '7942-24-38529';
    const accountHolder = reservationData.accountHolder || '이수진';

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
      accountBank,
      accountNumber,
      accountHolder,
      doorNumber,
    });

    // Netlify Function 호출
    const response = await fetch(NETLIFY_FUNCTION_URL, {
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
 * 전화번호 포맷팅 (하이픈 추가)
 */
export function formatPhoneNumber(phone) {
  // 하이픈 제거
  const cleaned = phone.replace(/-/g, '');

  // 010-XXXX-XXXX 형식으로 변환
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
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