class NotificationService {
  constructor() {
    this.sendingInProgress = new Set(); // 발송 중인 예약 추적
  }

  /**
   * 예약 확정시 알림 발송 (이메일 + 알림톡 통합)
   * - Netlify Functions에서 둘 다 처리
   */
  async sendReservationConfirm(reservationData, options = {}) {
    // 중복 발송 방지
    const reservationKey = `${reservationData.name}_${reservationData.checkIn}_${reservationData.checkOut}`;
    
    if (this.sendingInProgress.has(reservationKey)) {
      console.log('⏭️ 이미 발송 중 - 스킵');
      return { 
        success: true, 
        email: { success: true, message: '발송 중' }, 
        alimtalk: { success: null, message: '발송 중' } 
      };
    }
    
    this.sendingInProgress.add(reservationKey);
    
    const { alimtalkEnabled = true } = options;

    try {
      // 날짜 포맷팅 (YYYY-MM-DD)
      const checkInStr = this.formatDateSimple(reservationData.checkIn);
      const checkOutStr = this.formatDateSimple(reservationData.checkOut);

      // 공통 데이터
      const notificationData = {
        name: reservationData.name,
        phone: reservationData.phone,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        gender: reservationData.gender,
        birthYear: reservationData.birthYear,
        hostDisplayName: reservationData.hostDisplayName,
        spaceName: reservationData.spaceName || '조강308호',
        memo: reservationData.memo,
        alimtalkEnabled // 알림톡 활성화 여부
      };

      console.log('📧 통합 알림 발송 시작...');
      
      // Netlify Functions 단일 호출 (이메일 + 알림톡 둘 다 처리)
      const response = await fetch('/.netlify/functions/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });

      const results = await response.json();
      
      console.log('📬 알림 발송 결과:', results);

      return results;

    } catch (error) {
      console.error('❌ 알림 발송 실패:', error);
      return {
        success: false,
        email: { success: false, message: '발송 실패' },
        alimtalk: { success: false, message: '발송 실패' },
        error: error.message
      };
    } finally {
      // 발송 완료 후 플래그 제거 (5초 후)
      setTimeout(() => {
        this.sendingInProgress.delete(reservationKey);
      }, 5000);
    }
  }

  /**
   * 날짜 포맷팅 헬퍼 (표시용 - 요일 포함)
   */
  formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  }

  /**
   * 날짜 포맷팅 헬퍼 (API용 - YYYY-MM-DD)
   */
  formatDateSimple(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

export default new NotificationService();