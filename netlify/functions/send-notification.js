/**
 * NHN Cloud 카카오 알림톡 발송 Netlify Function
 * 
 * 환경변수 필요:
 * - NHN_APPKEY
 * - NHN_SECRET_KEY
 * - NHN_API_URL
 * - NHN_PLUS_FRIEND_ID
 * - NHN_SENDER_KEY
 * - NHN_TEMPLATE_GUEST_CONFIRM
 */

const fetch = require('node-fetch');

exports.handler = async (event) => {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('📨 알림톡 발송 요청:', JSON.stringify(data, null, 2));

    // 필수 환경변수 확인
    const {
      NHN_APPKEY,
      NHN_SECRET_KEY,
      NHN_API_URL,
      NHN_SENDER_KEY,
      NHN_TEMPLATE_GUEST_CONFIRM,
    } = process.env;

    // 환경변수 체크
    console.log('🔍 환경변수 확인:', {
      NHN_APPKEY: NHN_APPKEY ? '✅ 설정됨' : '❌ 없음',
      NHN_SECRET_KEY: NHN_SECRET_KEY ? '✅ 설정됨' : '❌ 없음',
      NHN_API_URL: NHN_API_URL || '❌ 없음',
      NHN_SENDER_KEY: NHN_SENDER_KEY ? '✅ 설정됨' : '❌ 없음',
      NHN_TEMPLATE_GUEST_CONFIRM: NHN_TEMPLATE_GUEST_CONFIRM || '❌ 없음',
    });

    if (!NHN_APPKEY || !NHN_SECRET_KEY || !NHN_API_URL || !NHN_SENDER_KEY || !NHN_TEMPLATE_GUEST_CONFIRM) {
      const missing = [];
      if (!NHN_APPKEY) missing.push('NHN_APPKEY');
      if (!NHN_SECRET_KEY) missing.push('NHN_SECRET_KEY');
      if (!NHN_API_URL) missing.push('NHN_API_URL');
      if (!NHN_SENDER_KEY) missing.push('NHN_SENDER_KEY');
      if (!NHN_TEMPLATE_GUEST_CONFIRM) missing.push('NHN_TEMPLATE_GUEST_CONFIRM');
      
      const errorMsg = `환경변수가 설정되지 않았습니다: ${missing.join(', ')}`;
      console.error('❌', errorMsg);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: errorMsg,
        }),
      };
    }

    // 알림톡 타입별 처리
    const { type, reservationData } = data;

    let templateCode;
    let templateParams = {};

    switch (type) {
      case 'guest_confirmation':
        templateCode = NHN_TEMPLATE_GUEST_CONFIRM;
        templateParams = createGuestConfirmationParams(reservationData);
        break;

      // 추가 템플릿 타입들...
      // case 'guest_checkin':
      // case 'reservation_cancelled':
      
      default:
        throw new Error(`알 수 없는 알림톡 타입: ${type}`);
    }

    // NHN Cloud API 호출
    const response = await sendNhnAlimtalk({
      appKey: NHN_APPKEY,
      secretKey: NHN_SECRET_KEY,
      apiUrl: NHN_API_URL,
      senderKey: NHN_SENDER_KEY,
      templateCode,
      recipientNo: reservationData.phone,
      templateParams,
    });

    console.log('✅ 알림톡 발송 성공:', response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '알림톡이 발송되었습니다.',
        response,
      }),
    };

  } catch (error) {
    console.error('❌ 알림톡 발송 실패:', error);
    console.error('❌ 에러 스택:', error.stack);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || '알림톡 발송 중 오류가 발생했습니다.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};

/**
 * 게스트 예약 확인 템플릿 파라미터 생성
 */
function createGuestConfirmationParams(data) {
  const { 
    name, 
    loungeName,
    checkIn, 
    checkOut, 
    nights, 
    days, 
    cost, 
    accountBank,      // 변경: accountInfo → accountBank
    accountNumber,    // 추가
    accountHolder,    // 추가
    doorNumber  // 전화번호 뒷자리 4자리
  } = data;

  // NHN Cloud 템플릿 변수명에 맞춰 매핑
  const params = {
    '성명': name,
    '라운지명': loungeName,
    '입실일': checkIn,
    '퇴실일': checkOut,
    '박수': String(nights),
    '일수': String(days),
    '비용': cost.toLocaleString(),
    '은행명': accountBank,        // 변경
    '계좌번호': accountNumber,    // 추가
    '예금주': accountHolder,      // 추가
    '도어번호': doorNumber,  // 예: "8626" → 템플릿에서 "862611*" 표시
  };

  console.log('🏷️ 템플릿 파라미터:', params);

  return params;
}

/**
 * NHN Cloud 알림톡 API 호출
 */
async function sendNhnAlimtalk({
  appKey,
  secretKey,
  apiUrl,
  senderKey,
  templateCode,
  recipientNo,
  templateParams,
}) {
  const url = `${apiUrl}/alimtalk/v2.3/appkeys/${appKey}/messages`;

  // 전화번호 포맷팅 (국가코드, 하이픈, 공백 제거 후 숫자만)
  let formattedPhone = recipientNo.replace(/[\s\-+]/g, ''); // 공백, 하이픈, + 제거
  
  // +82로 시작하면 0으로 변환
  if (formattedPhone.startsWith('82')) {
    formattedPhone = '0' + formattedPhone.slice(2);
  }
  
  console.log('📞 전화번호 포맷팅:', {
    원본: recipientNo,
    변환: formattedPhone
  });

  const payload = {
    senderKey,
    templateCode,
    requestDate: '', // 즉시 발송
    senderGroupingKey: `geha_${Date.now()}`,
    recipientList: [
      {
        recipientNo: formattedPhone,
        templateParameter: templateParams,
        // 재발송 기능 일시 비활성화 (테스트용)
        // resendParameter: {
        //   isResend: true,
        //   resendType: 'SMS',
        //   resendTitle: '조강308호',
        //   resendContent: createFallbackSms(templateParams),
        // },
      },
    ],
  };

  console.log('📤 NHN API 요청:', {
    url,
    templateCode,
    recipientNo: formattedPhone,
    params: templateParams,
    senderKey,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Key': secretKey,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log('📥 NHN API 응답:', {
      status: response.status,
      statusText: response.statusText,
      result: JSON.stringify(result, null, 2)
    });

    if (!response.ok) {
      console.error('❌ NHN API 에러 상세:', {
        status: response.status,
        statusText: response.statusText,
        header: result.header,
        body: result.body
      });
      throw new Error(
        `NHN API 오류 (${response.status}): ${result.header?.resultMessage || result.message || '알 수 없는 오류'}`
      );
    }

    return result;
  } catch (error) {
    console.error('❌ NHN API 호출 중 에러:', error);
    throw error;
  }
}

/**
 * 알림톡 실패 시 대체 SMS 내용
 */
function createFallbackSms(params) {
  return `[${params.라운지명} 예약 확인]
${params.성명}님
입실일: ${params.입실일}
퇴실일: ${params.퇴실일}
숙박: ${params.박수}박
요금: ${params.비용}원
계좌: ${params.어카운트번호}
도어번호: ${params.도어번호}11*`;
}