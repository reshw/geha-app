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

  console.log('🔄 카페24 프록시 시작');

  try {
    const data = JSON.parse(event.body);
    console.log('📨 받은 데이터:', {
      name: data.name,
      phone: data.phone,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      alimtalkEnabled: data.alimtalkEnabled
    });

    // 카페24로 요청 전달
    console.log('🌐 카페24 API 호출 중...');
    const response = await fetch('https://lunagarden.co.kr/guest/send_alimtalk.php', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Functions'
      },
      body: JSON.stringify(data),
      timeout: 30000  // 30초 타임아웃
    });

    const responseText = await response.text();
    console.log('📥 카페24 응답:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200)  // 앞 200자만
    });

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', responseText);
      throw new Error('Invalid JSON response from cafe24');
    }

    console.log('✅ 프록시 완료:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ 프록시 에러:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        alimtalk: {
          success: false,
          message: '알림톡 발송 중 오류가 발생했습니다.',
          error: error.message
        }
      })
    };
  }
};