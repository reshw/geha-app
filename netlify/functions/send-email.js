const { Resend } = require('resend');

exports.handler = async (event) => {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { type, reservationData, managers } = JSON.parse(event.body);

    let emails = [];

    // 예약 확정 이메일
    if (type === 'reservation_confirm') {
      // 예약자에게
      emails.push({
        from: 'noreply@yourdomain.com',
        to: reservationData.email || reservationData.phone + '@temp.com',
        subject: `[${reservationData.spaceName}] 예약이 완료되었습니다`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">예약 완료</h2>
            <p><strong>${reservationData.name}</strong>님의 예약이 완료되었습니다.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>공간:</strong> ${reservationData.spaceName}</p>
              <p><strong>체크인:</strong> ${reservationData.checkIn}</p>
              <p><strong>체크아웃:</strong> ${reservationData.checkOut}</p>
              <p><strong>숙박일:</strong> ${reservationData.nights}박</p>
              <p><strong>유형:</strong> ${reservationData.type === 'shareholder' ? '주주' : '게스트'}</p>
            </div>
            <p>즐거운 시간 되세요!</p>
          </div>
        `
      });

      // Manager들에게 알림
      if (managers && managers.length > 0) {
        emails.push({
          from: 'noreply@yourdomain.com',
          to: managers,
          subject: `[${reservationData.spaceName}] 새 예약 알림`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">새 예약 알림</h2>
              <p>새로운 예약이 접수되었습니다.</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>예약자:</strong> ${reservationData.name}</p>
                <p><strong>유형:</strong> ${reservationData.type === 'shareholder' ? '주주' : '게스트'}</p>
                <p><strong>체크인:</strong> ${reservationData.checkIn}</p>
                <p><strong>체크아웃:</strong> ${reservationData.checkOut}</p>
                <p><strong>숙박일:</strong> ${reservationData.nights}박</p>
              </div>
            </div>
          `
        });
      }
    }

    // 이메일 발송
    const results = await Promise.all(
      emails.map(email => resend.emails.send(email))
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, results })
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
