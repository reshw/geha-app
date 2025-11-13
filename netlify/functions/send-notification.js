const { Resend } = require('resend');
const fetch = require('node-fetch');

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
    const accountInfo = process.env.ACCOUNT_INFO || '카카오뱅크 7979-38-83356 양석환';

    // === 1. 이메일 발송 (Resend API) ===
    let emailResult = { success: false, message: '이메일 발송 실패' };
    
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일`;
      };

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

      const emailResponse = await resend.emails.send({
        from: 'noreply@lunagarden.co.kr',
        to: 'reshw@naver.com',
        subject: `[${data.spaceName || '조강308호'}] 새로운 게스트 예약`,
        html: htmlContent
      });

      emailResult = {
        success: true,
        message: '이메일이 발송되었습니다.',
        id: emailResponse.id
      };
      console.log('Email sent successfully:', emailResponse.id);
      
    } catch (emailError) {
      console.error('Email send error:', emailError);
      emailResult = {
        success: false,
        message: '이메일 발송에 실패했습니다.',
        error: emailError.message
      };
    }

    // === 2. 알림톡 발송 (솔라피 API) - alimtalkEnabled가 true일 때만 ===
    let alimtalkResult = {
      success: null,
      message: '알림톡 기능이 비활성화되어 있습니다.'
    };

    if (data.alimtalkEnabled === true) {
      try {
        console.log('📱 솔라피 알림톡 발송 시작...');
        
        // 전화번호 정제
        const phone = data.phone.replace(/[^0-9]/g, '');
        const password = phone.slice(-4); // 현관 비밀번호

        // 알림톡 메시지 생성
        let message = `${data.name}님(꺄아)\n`;
        message += `조강 308 게스트 예약되었습니다.\n\n`;
        message += `[예약안내]\n`;
        message += `· 입실일 : ${data.checkIn}\n`;
        message += `· 퇴실일 : ${data.checkOut}\n`;
        message += `   - ${nights}박 ${days}일\n\n`;
        message += `[이용료]\n`;
        message += `· 게스트 비용 : ${cost.toLocaleString()}원(3만원/1박)\n`;
        message += `· ${accountInfo}\n\n`;
        message += `[현관 번호] : ${password}11*\n`;
        message += `(입실일~퇴실일에만 사용 가능합니다)`;

        if (data.memo) {
          message += `\n\n[메모]\n${data.memo}`;
        }

        // 솔라피 API 호출
        const solapiResponse = await fetch('https://api.solapi.com/messages/v4/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SOLAPI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              to: phone,
              from: process.env.SOLAPI_SENDER || '01087654321',
              text: message,
              type: 'ATA', // 알림톡
              kakaoOptions: {
                pfId: process.env.SOLAPI_PFID, // 카카오 채널 ID
                templateId: process.env.SOLAPI_TEMPLATE_ID, // 템플릿 ID
                buttons: [
                  {
                    buttonType: 'WL',
                    buttonName: '게스트 현황 보기',
                    linkMo: 'https://www.lunagarden.co.kr/guest',
                    linkPc: 'https://www.lunagarden.co.kr/guest'
                  }
                ]
              }
            }
          })
        });

        const solapiResult = await solapiResponse.json();
        console.log('솔라피 응답:', solapiResult);

        alimtalkResult = {
          success: solapiResponse.ok,
          message: solapiResponse.ok ? '알림톡이 발송되었습니다.' : '알림톡 발송에 실패했습니다.',
          detail: solapiResult
        };

      } catch (alimtalkError) {
        console.error('Alimtalk send error:', alimtalkError);
        alimtalkResult = {
          success: false,
          message: '알림톡 발송 중 오류가 발생했습니다.',
          error: alimtalkError.message
        };
      }
    }

    // === 응답 반환 ===
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email: emailResult,
        alimtalk: alimtalkResult
      })
    };

  } catch (error) {
    console.error('Notification function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message
      })
    };
  }
};