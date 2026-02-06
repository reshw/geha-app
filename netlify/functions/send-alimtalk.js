const axios = require('axios');
const fs = require('fs');
const path = require('path');

function getConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ config.json 읽기 실패:', error.message);
    return {
      nhn: {
        apiUrl: process.env.NHN_API_URL,
        appkey: process.env.NHN_APPKEY,
        secretKey: process.env.NHN_SECRET_KEY,
        senderKey: process.env.NHN_SENDER_KEY,
        plusFriendId: process.env.NHN_PLUS_FRIEND_ID,
        templateGuestConfirm: process.env.NHN_TEMPLATE_GUEST_CONFIRM
      }
    };
  }
}

const config = getConfig();

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

    // 전화번호 정제 (하이픈 등 제거)
    const phone = data.phone.replace(/[^0-9]/g, '');
    if (phone.length < 10) {
      throw new Error('Invalid phone number format');
    }

    // 날짜 계산
    const checkinDate = new Date(data.checkIn);
    const checkoutDate = new Date(data.checkOut);
    const nights = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const days = nights + 1;
    const cost = nights * 30000;

    // 현관 비밀번호 (전화번호 뒤 4자리)
    const password = phone.slice(-4);

    // 계좌 정보 (하드코딩된 기본값 사용)
    const accountInfo = '카카오뱅크 7979-38-83356 양석환';

    // 알림톡 메시지 생성 (PHP 템플릿과 동일)
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

    // 알림톡 발송 (alimtalkEnabled가 true일 때만) - NHN Cloud 사용
    let alimtalkResult = null;
    if (data.alimtalkEnabled === true) {
      const { nhn } = config;
      const response = await axios.post(
        nhn.apiUrl + '/alimtalk/v2.3/plus-friends/' + encodeURIComponent(nhn.plusFriendId) + '/messages',
        {
          plusFriendId: nhn.plusFriendId,
          templateCode: nhn.templateGuestConfirm,
          recipientList: [{
            recipientNo: phone,
            content: message
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Secret-Key': nhn.secretKey
          },
          auth: {
            username: nhn.appkey,
            password: nhn.secretKey
          }
        }
      );
      
      alimtalkResult = response.data;
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      alimtalkResult = response.data;
      console.log('Alimtalk response:', alimtalkResult);
    }

    // 응답 준비
    const result = {
      success: true,
      alimtalk: data.alimtalkEnabled === true ? {
        success: alimtalkResult?.code === 0,
        message: alimtalkResult?.code === 0 ? '알림톡이 발송되었습니다.' : '알림톡 발송에 실패했습니다.',
        detail: alimtalkResult
      } : {
        success: null,
        message: '알림톡 기능이 비활성화되어 있습니다.'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Alimtalk function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: error.message,
        debug: {
          error_type: error.constructor.name
        }
      })
    };
  }
};
