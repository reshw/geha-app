class NotificationService {
  /**
   * 예약 확정시 알림 발송 (이메일 + 알림톡)
   */
  async sendReservationConfirm(reservationData, managers = []) {
    const results = {
      email: null,
      alimtalk: null
    };

    // 날짜 포맷팅
    const checkInStr = this.formatDate(reservationData.checkIn);
    const checkOutStr = this.formatDate(reservationData.checkOut);

    try {
      // 1. 이메일 발송
      const emailResponse = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reservation_confirm',
          reservationData: {
            ...reservationData,
            checkIn: checkInStr,
            checkOut: checkOutStr
          },
          managers
        })
      });

      results.email = await emailResponse.json();
      console.log('📧 이메일 발송 결과:', results.email);
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      results.email = { success: false, error: error.message };
    }

    // 2. 알림톡 발송 (전화번호가 있을 경우만)
    if (reservationData.phone) {
      try {
        const message = `[${reservationData.spaceName}] 예약이 완료되었습니다.

이름: ${reservationData.name}
체크인: ${checkInStr}
체크아웃: ${checkOutStr}
숙박일: ${reservationData.nights}박

즐거운 시간 되세요!`;

        const alimtalkResponse = await fetch('/.netlify/functions/send-alimtalk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: reservationData.phone,
            message,
            reservationData: {
              ...reservationData,
              checkIn: checkInStr,
              checkOut: checkOutStr
            }
          })
        });

        results.alimtalk = await alimtalkResponse.json();
        console.log('💬 알림톡 발송 결과:', results.alimtalk);
      } catch (error) {
        console.error('알림톡 발송 실패:', error);
        results.alimtalk = { success: false, error: error.message };
      }
    }

    return results;
  }

  /**
   * 날짜 포맷팅 헬퍼
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
   * Manager 이메일 목록 가져오기
   */
  async getManagerEmails(spaceId) {
    // TODO: Firebase에서 manager/vice-manager 이메일 가져오기
    // 현재는 하드코딩 (나중에 구현)
    return [];
  }
}

export default new NotificationService();
