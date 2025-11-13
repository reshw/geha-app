class NotificationService {
  constructor() {
    this.sendingInProgress = new Set(); // 발송 중인 예약 추적
  }

  /**
   * 예약 확정시 알림 발송 (이메일 + 알림톡 분리)
   * - 이메일: Netlify Functions
   * - 알림톡: 카페24 PHP (고정 IP)
   */
  async sendReservationConfirm(reservationData, options = {}) {
    // 중복 발송 방지
    const reservationKey = `${reservationData.name}_${reservationData.checkIn}_${reservationData.checkOut}`;
    
    if (this.sendingInProgress.has(reservationKey)) {
      console.log('⏭️ 이미 발송 중 - 스킵');
      return { success: true, email: { success: true, message: '발송 중' }, alimtalk: { success: null } };
    }
    
    this.sendingInProgress.add(reservationKey);
    
    const {
      alimtalkEnabled = true,  // 기본값: 알림톡 활성화
      managers = []
    } = options;

    const results = {
      success: true,
      email: { success: false, message: '발송 안 함' },
      alimtalk: { success: null, message: '알림톡 기능이 비활성화되어 있습니다.' }
    };

    try {
      // 날짜 포맷팅 (YYYY-MM-DD)
      const checkInStr = this.formatDateSimple(reservationData.checkIn);
      const checkOutStr = this.formatDateSimple(reservationData.checkOut);

      // 공통 데이터
      const commonData = {
        name: reservationData.name,
        phone: reservationData.phone,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        gender: reservationData.gender,
        birthYear: reservationData.birthYear,
        hostDisplayName: reservationData.hostDisplayName,
        spaceName: reservationData.spaceName || '조강308호',
        memo: reservationData.memo
      };

      // === 1. 이메일 발송 (Netlify Functions) ===
      try {
        console.log('📧 이메일 발송 시작 (Netlify)...');
        console.log('📧 이메일 데이터:', commonData);
        
        const emailResponse = await fetch('/.netlify/functions/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(commonData)
        });

        const emailResult = await emailResponse.json();
        results.email = emailResult.email || emailResult;
        
        console.log('📧 이메일 발송 결과:', results.email);
      } catch (emailError) {
        console.error('❌ 이메일 발송 실패:', emailError);
        results.email = {
          success: false,
          message: '이메일 발송 실패',
          error: emailError.message
        };
      }

      // === 2. 알림톡 발송 (카페24 PHP via Netlify Proxy) - alimtalkEnabled가 true일 때만 ===
      if (alimtalkEnabled) {
        try {
          console.log('💬 알림톡 발송 시작 (Netlify 프록시 경유)...');
          
          // Netlify Functions 프록시를 통해 카페24 호출 (CORS 우회)
          const proxyUrl = '/.netlify/functions/send-alimtalk-proxy';
          
          const alimtalkResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...commonData,
              alimtalkEnabled: true  // PHP에서 실제 발송하도록
            })
          });

          const alimtalkResult = await alimtalkResponse.json();
          results.alimtalk = alimtalkResult.alimtalk || alimtalkResult;
          
          console.log('💬 알림톡 발송 결과:', results.alimtalk);
        } catch (alimtalkError) {
          console.error('❌ 알림톡 발송 실패:', alimtalkError);
          results.alimtalk = {
            success: false,
            message: '알림톡 발송 실패',
            error: alimtalkError.message
          };
        }
      }

      // 전체 성공 여부 판단 (이메일만 성공해도 OK)
      results.success = results.email.success;

      return results;

    } catch (error) {
      console.error('❌ 알림 발송 전체 실패:', error);
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