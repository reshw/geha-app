class NotificationService {
  /**
   * 예약 확정시 알림 발송 (이메일 + 알림톡 통합)
   */
  async sendReservationConfirm(reservationData, options = {}) {
    const {
      alimtalkEnabled = true,  // 기본값: 알림톡 활성화
      managers = []
    } = options;

    // 날짜 포맷팅 (YYYY-MM-DD)
    const checkInStr = this.formatDateSimple(reservationData.checkIn);
    const checkOutStr = this.formatDateSimple(reservationData.checkOut);

    try {
      // 통합 엔드포인트 호출 (이메일 + 알림톡 한 번에)
      const response = await fetch('/.netlify/functions/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 필수 필드
          name: reservationData.name,
          phone: reservationData.phone,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          
          // 선택 필드
          gender: reservationData.gender,
          birthYear: reservationData.birthYear,
          hostDisplayName: reservationData.hostDisplayName,
          spaceName: reservationData.spaceName || '조강308호',
          memo: reservationData.memo,
          
          // 알림톡 제어
          alimtalkEnabled
        })
      });

      const results = await response.json();
      
      console.log('📧 이메일 발송 결과:', results.email);
      console.log('💬 알림톡 발송 결과:', results.alimtalk);

      return results;
    } catch (error) {
      console.error('알림 발송 실패:', error);
      return {
        success: false,
        email: { success: false, message: '발송 실패' },
        alimtalk: { success: false, message: '발송 실패' },
        error: error.message
      };
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

  /**
   * Manager 이메일 목록 가져오기
   */
  async getManagerEmails(spaceId) {
    // TODO: Firebase에서 manager/vice-manager 이메일 가져오기
    // 현재는 하드코딩 (나중에 구현)
    return [];
  }
}

export default new NotificationService();
