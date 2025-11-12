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
    const data = JSON.parse(event.body);

    // 필수 필드 검증
    const required = ['name', 'phone', 'checkIn', 'checkOut'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 날짜 계산
    const checkinDate = new Date(data.checkIn);
    const checkoutDate = new Date(data.checkOut);
    const nights = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const days = nights + 1;
    const cost = nights * 30000;

    // 계좌 정보
    const accountInfo = process.env.ALIGO_ACCOUNT || '카카오뱅크 7979-38-83356 양석환';

    // 날짜 포맷팅
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}년 ${month}월 ${day}일`;
    };

    // HTML 이메일 템플릿 (PHP 템플릿과 동일)
    const htmlContent = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4a90e2; color: white; padding: 15px; margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #2c3e50; border-bottom: 2px solid #4a90e2; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px; border: 1px solid #ddd; }
            th { background: #f8f9fa; text-align: left; width: 35%; }
            .highlight { background: #e8f4fe; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin:0;">게스트 예약 안내</h2>
            </div>
            
            <div class="section">
                <div class="section-title">예약 정보</div>
                <table>
                    <tr>
                        <th>입실일</th>
                        <td>${formatDate(checkinDate)}</td>
                    </tr>
                    <tr>
                        <th>퇴실일</th>
                        <td>${formatDate(checkoutDate)}</td>
                    </tr>
                    <tr class="highlight">
                        <th>숙박 기간</th>
                        <td>${nights}박 ${days}일</td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">게스트 정보</div>
                <table>
                    <tr>
                        <th>이름</th>
                        <td>${data.name}</td>
                    </tr>
                    <tr>
                        <th>연락처</th>
                        <td>${data.phone}</td>
                    </tr>
                    <tr>
                        <th>성별</th>
                        <td>${data.gender || '-'}</td>
                    </tr>
                    <tr>
                        <th>생년</th>
                        <td>${data.birthYear || '-'}</td>
                    </tr>
                    <tr>
                        <th>초대 주주</th>
                        <td>${data.hostDisplayName || '-'}</td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">이용료 정보</div>
                <table>
                    <tr class="highlight">
                        <th>총 이용료</th>
                        <td>${cost.toLocaleString()}원 (3만원/1박)</td>
                    </tr>
                    <tr>
                        <th>계좌 정보</th>
                        <td>${accountInfo}</td>
                    </tr>
                </table>
            </div>
            
            ${data.memo ? `
            <div class="section">
                <div class="section-title">메모</div>
                <p>${data.memo}</p>
            </div>
            ` : ''}
        </div>
    </body>
    </html>`;

    // 이메일 발송
    const result = await resend.emails.send({
      from: 'noreply@lunagarden.co.kr',
      to: 'reshw@naver.com', // PHP에서 사용하던 수신자
      subject: `[${data.spaceName || '조강308호'}] 새로운 게스트 예약`,
      html: htmlContent
    });

    console.log('Email sent:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        email: {
          success: true,
          message: '이메일이 발송되었습니다.',
          id: result.id
        }
      })
    };

  } catch (error) {
    console.error('Email send error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        email: {
          success: false,
          message: '이메일 발송에 실패했습니다.'
        },
        error: error.message 
      })
    };
  }
};
