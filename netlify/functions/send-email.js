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

    // type에 따라 다른 이메일 생성
    const type = data.type || 'guest_reservation';

    let emailContent;
    if (type === 'guest_reservation') {
      emailContent = generateGuestReservationEmail(data);
    } else if (type === 'praise') {
      emailContent = generatePraiseEmail(data);
    } else if (type === 'settlement') {
      emailContent = generateSettlementEmail(data);
    } else if (type === 'expense') {
      emailContent = generateExpenseEmail(data);
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    // 수신자 설정 (기본 수신자 + CC)
    const to = data.recipients?.to || 'reshw@naver.com';
    const cc = data.recipients?.cc || [];

    // 이메일 발송
    const result = await resend.emails.send({
      from: 'noreply@lunagarden.co.kr',
      to: to,
      cc: cc.length > 0 ? cc : undefined,
      subject: emailContent.subject,
      html: emailContent.html
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

/**
 * 게스트 예약 이메일 생성
 */
function generateGuestReservationEmail(data) {
  const checkinDate = new Date(data.checkIn);
  const checkoutDate = new Date(data.checkOut);
  const nights = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  const days = nights + 1;
  const cost = nights * (data.pricePerNight || 30000);

  // 날짜 포맷팅 (YYMMDD)
  const formatDateShort = (date) => {
    const year = String(date.getFullYear()).slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // 날짜 포맷팅 (전체)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  const accountInfo = data.accountInfo || process.env.ALIGO_ACCOUNT || '카카오뱅크 7979-38-83356 양석환';
  const spaceName = data.spaceName || '조강308호';

  // 제목: [라운지명] 게스트 ㅇㅇㅇ 예약(251224-251225)
  const subject = `[${spaceName}] 게스트 ${data.name} 예약(${formatDateShort(checkinDate)}-${formatDateShort(checkoutDate)})`;

  // HTML 이메일 템플릿 (Inline CSS)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🏠 게스트 예약 안내</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">${spaceName}</p>
            </td>
          </tr>

          <!-- 예약 정보 -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📅 예약 정보</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <td style="width: 35%; font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">입실일</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${formatDate(checkinDate)}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">퇴실일</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${formatDate(checkoutDate)}</td>
                </tr>
                <tr style="background-color: #e8f4fe;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0;">숙박 기간</td>
                  <td style="color: #333333; font-weight: 700;">${nights}박 ${days}일</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 게스트 정보 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 10px;">👤 게스트 정보</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <td style="width: 35%; font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">이름</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.name}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">연락처</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.phone}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">성별</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.gender || '-'}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">생년</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.birthYear || '-'}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0;">초대 주주</td>
                  <td style="color: #333333;">${data.hostDisplayName || '-'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 이용료 정보 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💰 이용료 정보</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #e8f4fe;">
                  <td style="width: 35%; font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">총 이용료</td>
                  <td style="color: #333333; font-weight: 700; font-size: 18px; border-bottom: 1px solid #e0e0e0;">${cost.toLocaleString()}원 (3만원/1박)</td>
                </tr>
                <tr style="background-color: #ffffff;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0;">계좌 정보</td>
                  <td style="color: #333333;">${accountInfo}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.memo ? `
          <!-- 메모 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📝 메모</h2>
              <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; border-left: 4px solid #667eea;">
                <p style="margin: 0; color: #555555; line-height: 1.6;">${data.memo}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 13px;">이 이메일은 자동으로 발송되었습니다.</p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 13px;">문의사항은 ${spaceName}로 연락 부탁드립니다.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * PRAISE 접수 이메일 생성
 */
function generatePraiseEmail(data) {
  const spaceName = data.spaceName || '라운지';
  const eventDate = new Date(data.eventDate);

  // 날짜 포맷팅
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  const subject = `[${spaceName}] 칭찬 접수: ${data.userName} - ${data.category}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🌟 칭찬 접수</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">${spaceName}</p>
            </td>
          </tr>

          <!-- 칭찬 정보 -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #ffd89b; padding-bottom: 10px;">📋 칭찬 정보</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <td style="width: 35%; font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">작성자</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.userName}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">카테고리</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.category}</td>
                </tr>
                ${data.itemName ? `
                <tr style="background-color: #f9f9f9;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">물품명</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.itemName}</td>
                </tr>
                ` : ''}
                <tr style="background-color: ${data.itemName ? '#ffffff' : '#f9f9f9'};">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0;">날짜</td>
                  <td style="color: #333333;">${formatDate(eventDate)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 칭찬 내용 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #ffd89b; padding-bottom: 10px;">💬 원본 내용</h2>
              <div style="background-color: #fffbf5; padding: 20px; border-radius: 6px; border-left: 4px solid #ffd89b;">
                <p style="margin: 0; color: #555555; line-height: 1.8; white-space: pre-wrap;">${data.originalText}</p>
              </div>
            </td>
          </tr>

          ${data.refinedText ? `
          <!-- 다듬은 내용 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #ffd89b; padding-bottom: 10px;">✨ 다듬은 내용</h2>
              <div style="background-color: #f0f8ff; padding: 20px; border-radius: 6px; border-left: 4px solid #4a90e2;">
                <p style="margin: 0; color: #555555; line-height: 1.8; white-space: pre-wrap;">${data.refinedText}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${data.imageUrl ? `
          <!-- 이미지 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #ffd89b; padding-bottom: 10px;">📷 첨부 이미지</h2>
              <div style="text-align: center;">
                <img src="${data.imageUrl}" alt="칭찬 이미지" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 13px;">이 이메일은 자동으로 발송되었습니다.</p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 13px;">관리자 페이지에서 칭찬을 승인하거나 거부할 수 있습니다.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * 공금정산 접수 이메일 생성
 */
function generateSettlementEmail(data) {
  const spaceName = data.spaceName || '라운지';
  const submittedAt = new Date(data.submittedAt);

  // 날짜 포맷팅
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  const subject = `[${spaceName}] 정산 접수: ${data.paidByName} - ${data.totalAmount.toLocaleString()}원`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">💰 영수증 제출</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">${spaceName} - 주차 정산</p>
            </td>
          </tr>

          <!-- 영수증 정보 -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #11998e; padding-bottom: 10px;">📋 영수증 정보</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <td style="width: 35%; font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">납부자</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.paidByName}</td>
                </tr>
                ${data.submittedByName && data.paidByName !== data.submittedByName ? `
                <tr style="background-color: #ffffff;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">등록자</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.submittedByName}</td>
                </tr>
                ` : ''}
                <tr style="background-color: ${data.submittedByName && data.paidByName !== data.submittedByName ? '#f9f9f9' : '#ffffff'};">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">제출 시간</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${formatDateTime(submittedAt)}</td>
                </tr>
                <tr style="background-color: #e8f8f5;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0;">총 금액</td>
                  <td style="color: #11998e; font-weight: 700; font-size: 18px;">${data.totalAmount.toLocaleString()}원</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 항목 목록 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #11998e; padding-bottom: 10px;">🛒 지출 항목</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                ${data.items.map((item, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${item.itemName}</td>
                  <td style="color: #333333; text-align: right; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${item.amount.toLocaleString()}원 (${item.splitAmong.length}명 분담)</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          ${data.memo ? `
          <!-- 메모 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #11998e; padding-bottom: 10px;">📝 메모</h2>
              <div style="background-color: #f0f8ff; padding: 16px; border-radius: 6px; border-left: 4px solid #11998e;">
                <p style="margin: 0; color: #555555; line-height: 1.6;">${data.memo}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${data.imageUrl ? `
          <!-- 영수증 이미지 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #11998e; padding-bottom: 10px;">📷 영수증 이미지</h2>
              <div style="text-align: center;">
                <img src="${data.imageUrl}" alt="영수증" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 13px;">이 이메일은 자동으로 발송되었습니다.</p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 13px;">정산 페이지에서 자세한 내용을 확인할 수 있습니다.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * 운영비 청구 접수 이메일 생성
 */
function generateExpenseEmail(data) {
  const spaceName = data.spaceName || '라운지';
  const createdAt = new Date(data.createdAt);

  // 날짜 포맷팅
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  const subject = `[${spaceName}] 운영비 청구: ${data.userName} - ${data.totalAmount.toLocaleString()}원`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">💸 운영비 청구 접수</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">${spaceName}</p>
            </td>
          </tr>

          <!-- 청구 정보 -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #f093fb; padding-bottom: 10px;">📋 청구 정보</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <td style="width: 35%; font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">청구자</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${data.userName}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">사용일</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${formatDate(new Date(data.usedAt))}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">청구 제출</td>
                  <td style="color: #333333; border-bottom: 1px solid #e0e0e0;">${formatDateTime(createdAt)}</td>
                </tr>
                <tr style="background-color: #ffe8f5;">
                  <td style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0;">총 청구액</td>
                  <td style="color: #f5576c; font-weight: 700; font-size: 18px;">${data.totalAmount.toLocaleString()}원</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 항목 목록 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #f093fb; padding-bottom: 10px;">🛒 청구 항목</h2>
              <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <th style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; text-align: left;">품목</th>
                  <th style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; text-align: center;">단가</th>
                  <th style="font-weight: 600; color: #555555; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; text-align: center;">수량</th>
                  <th style="font-weight: 600; color: #555555; border-bottom: 1px solid #e0e0e0; text-align: right;">금액</th>
                </tr>
                ${data.items.map((item, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                  <td style="color: #333333; border-right: 1px solid #e0e0e0; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${item.itemName}${item.itemSpec ? ` (${item.itemSpec})` : ''}</td>
                  <td style="color: #333333; text-align: center; border-right: 1px solid #e0e0e0; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${item.itemPrice.toLocaleString()}원</td>
                  <td style="color: #333333; text-align: center; border-right: 1px solid #e0e0e0; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${item.itemQty}</td>
                  <td style="color: #333333; text-align: right; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${item.total.toLocaleString()}원</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          ${data.memo ? `
          <!-- 메모 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #f093fb; padding-bottom: 10px;">📝 청구 사유</h2>
              <div style="background-color: #fff5f8; padding: 16px; border-radius: 6px; border-left: 4px solid #f5576c;">
                <p style="margin: 0; color: #555555; line-height: 1.6; white-space: pre-wrap;">${data.memo}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${data.imageUrl ? `
          <!-- 증빙 이미지 -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: 600; border-bottom: 2px solid #f093fb; padding-bottom: 10px;">📷 증빙 자료</h2>
              <div style="text-align: center;">
                <img src="${data.imageUrl}" alt="증빙 자료" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 13px;">이 이메일은 자동으로 발송되었습니다.</p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 13px;">운영비 페이지에서 청구를 승인하거나 거부할 수 있습니다.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
