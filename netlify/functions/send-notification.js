/**
 * NHN Cloud 카카오 알림톡 발송 Netlify Function
 *
 * 설정: config.json에서 읽음
 */

const fetch = require('node-fetch');
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

    // config에서 필드 가져오기
    const {
      nhn: {
        apiUrl: NHN_API_URL,
        appkey: NHN_APPKEY,
        secretKey: NHN_SECRET_KEY,
        senderKey: NHN_SENDER_KEY,
        templateGuestConfirm: NHN_TEMPLATE_GUEST_CONFIRM,
      }
    } = config;

    // 환경변수 체크
    console.log('🔍 설정 확인:', {
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
    const { type, reservationData, settlementData } = data;

    let templateCode;
    let templateParams = {};
    let recipientNo;

    switch (type) {
      case 'guest_confirmation':
        templateCode = NHN_TEMPLATE_GUEST_CONFIRM;
        templateParams = createGuestConfirmationParams(reservationData);
        recipientNo = reservationData.phone;
        break;

      case 'settlement_receive':
        templateCode = 'JH8637'; // 받을 돈 템플릿
        templateParams = createSettlementReceiveParams(settlementData);
        recipientNo = settlementData.phone;
        console.log('📞 정산 받을 돈 알림 발송:', {
          name: settlementData.name,
          phone: recipientNo,
          balance: settlementData.balance
        });
        break;

      case 'settlement_pay':
        templateCode = 'JH8638'; // 낼 돈 템플릿
        templateParams = createSettlementPayParams(settlementData);
        recipientNo = settlementData.phone;
        console.log('📞 정산 낼 돈 알림 발송:', {
          name: settlementData.name,
          phone: recipientNo,
          balance: settlementData.balance
        });
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
      recipientNo,
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
 * 한국 시간대(UTC+9)로 날짜 포맷팅하는 헬퍼 함수
 */
function formatDateKorea(dateInput) {
  if (!dateInput) return '';
  
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const seoulTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  
  const year = seoulTime.getFullYear();
  const month = String(seoulTime.getMonth() + 1).padStart(2, '0');
  const day = String(seoulTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

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
    pricePerNightper10000,
    accountBank,      // 변경: accountInfo → accountBank
    accountNumber,    // 추가
    accountHolder,    // 추가
    doorNumber  // 전화번호 뒷자리 4자리
  } = data;

  // NHN Cloud 템플릿 변수명에 맞춰 매핑
  const params = {
    '성명': name,
    '라운지명': loungeName,
    '입실일': formatDateKorea(checkIn),  // UTC+9 적용
    '퇴실일': formatDateKorea(checkOut),  // UTC+9 적용
    '박수': String(nights),
    '단가': pricePerNightper10000, // 1박 요금 (만원 단위)
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
 * 정산 완료 - 받을 돈 템플릿 파라미터 생성 (JH8637)
 * 변수: 성명, 라운지명, 받을금액, 납부금액, 사용금액, 매니저연락처
 */
function createSettlementReceiveParams(data) {
  const {
    name,
    loungeName,
    balance,
    totalPaid,
    totalOwed,
    managerPhone
  } = data;

  const params = {
    '성명': name,
    '라운지명': loungeName,
    '받을금액': balance.toLocaleString(),
    '납부금액': totalPaid.toLocaleString(),
    '사용금액': totalOwed.toLocaleString(),
    '매니저연락처': managerPhone,
  };

  console.log('🏷️ 정산 받을 돈 템플릿 파라미터 (JH8637):', params);

  return params;
}

/**
 * 정산 완료 - 낼 돈 템플릿 파라미터 생성 (JH8638)
 * 변수: 성명, 라운지명, 정산금액, 납부금액, 사용금액, 매니저연락처, 은행명, 계좌번호, 예금주명
 */
function createSettlementPayParams(data) {
  const {
    name,
    loungeName,
    balance,
    totalPaid,
    totalOwed,
    managerPhone,
    accountBank,
    accountNumber,
    accountHolder
  } = data;

  const params = {
    '성명': name,
    '라운지명': loungeName,
    '정산금액': balance.toLocaleString(),
    '납부금액': totalPaid.toLocaleString(),
    '사용금액': totalOwed.toLocaleString(),
    '매니저연락처': managerPhone,
    '은행명': accountBank,
    '계좌번호': accountNumber,
    '예금주명': accountHolder,
  };

  console.log('🏷️ 정산 낼 돈 템플릿 파라미터 (JH8638):', params);

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