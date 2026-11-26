import { withNetlifyEvent } from '../lib/withNetlifyEvent.js';
import fetch from 'node-fetch';

const handler = async (event) => {
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

    // 카페24로 요청 전달 (쿠키 자동 처리)
    console.log('🌐 카페24 API 호출 중...');
    
    const requestOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(data),
      redirect: 'follow'  // 리다이렉트 자동 추적
    };

    let response = await fetch('https://lunagarden.co.kr/guest/send_alimtalk.php', requestOptions);
    
    // CUPID 쿠키 체크 - HTML 응답이면 쿠키 포함해서 재시도
    let responseText = await response.text();
    
    if (responseText.includes('CUPID') && responseText.includes('ckattempt=1')) {
      console.log('🍪 CUPID 쿠키 감지 - 재시도 중...');
      
      // Set-Cookie 헤더에서 쿠키 추출
      const cookies = response.headers.raw()['set-cookie'];
      let cookieHeader = '';
      
      if (cookies) {
        cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
        console.log('🍪 쿠키 설정:', cookieHeader);
      }
      
      // 쿠키 포함해서 재시도
      requestOptions.headers['Cookie'] = cookieHeader;
      response = await fetch('https://lunagarden.co.kr/guest/send_alimtalk.php?ckattempt=1', requestOptions);
      responseText = await response.text();
      
      console.log('🔄 재시도 응답 상태:', response.status);
    }

    console.log('📥 카페24 응답:', {
      status: response.status,
      statusText: response.statusText,
      bodyStart: responseText.substring(0, 100)
    });

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패');
      console.error('응답 내용:', responseText.substring(0, 500));
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          alimtalk: {
            success: false,
            message: '카페24 서버 응답 오류',
            error: 'Invalid JSON response',
            rawResponse: responseText.substring(0, 200)
          }
        })
      };
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
export default withNetlifyEvent(handler);
