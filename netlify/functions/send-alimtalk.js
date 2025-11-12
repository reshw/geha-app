const axios = require('axios');

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
    const { phoneNumber, message, reservationData } = JSON.parse(event.body);

    // 전화번호 포맷 정리 (010-1234-5678 -> 01012345678)
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Aligo API 호출
    const response = await axios.post(
      'https://kakaoapi.aligo.in/akv10/alimtalk/send/',
      new URLSearchParams({
        apikey: process.env.ALIGO_API_KEY,
        userid: process.env.ALIGO_USER_ID,
        senderkey: process.env.ALIGO_SENDER_KEY,
        tpl_code: process.env.ALIGO_TPL_CODE,
        sender: process.env.ALIGO_SENDER,
        receiver_1: cleanNumber,
        recvname_1: reservationData.name,
        subject_1: `[${reservationData.spaceName}] 예약 확인`,
        message_1: message
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Alimtalk response:', response.data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: response.data.code === 0,
        data: response.data
      })
    };
  } catch (error) {
    console.error('Alimtalk send error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
