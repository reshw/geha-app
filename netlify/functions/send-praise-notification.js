// netlify/functions/send-praise-notification.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { 
      spaceId, 
      spaceName, 
      userName, 
      originalText, 
      refinedText, 
      eventDate 
    } = JSON.parse(event.body);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea; }
          .label { font-size: 12px; color: #666; font-weight: bold; margin-bottom: 5px; }
          .value { font-size: 16px; color: #333; margin-bottom: 15px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✨ 새로운 칭찬이 등록되었습니다</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">관리자 승인이 필요합니다</p>
          </div>
          <div class="content">
            <div class="card">
              <div class="label">라운지</div>
              <div class="value">${spaceName}</div>
              
              <div class="label">작성자</div>
              <div class="value">${userName}</div>
              
              <div class="label">날짜</div>
              <div class="value">${eventDate}</div>
            </div>

            <div class="card">
              <div class="label">원본 텍스트 (주어 제거됨)</div>
              <div class="value" style="background: #f0f0f0; padding: 15px; border-radius: 6px;">
                ${originalText}
              </div>
            </div>

            <div class="card">
              <div class="label">AI 정제된 게시용 텍스트</div>
              <div class="value" style="background: #e8f5e9; padding: 15px; border-radius: 6px; color: #2e7d32;">
                ${refinedText}
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://geha-app.netlify.app/praise" class="button">
                관리자 페이지에서 승인하기
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>이 이메일은 게하 앱에서 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
새로운 칭찬이 등록되었습니다

라운지: ${spaceName}
작성자: ${userName}
날짜: ${eventDate}

[원본]
${originalText}

[게시용]
${refinedText}

관리자 페이지에서 승인해주세요:
https://geha-app.netlify.app/praise
    `;

    const data = await resend.emails.send({
      from: 'geha-app@resend.dev',
      to: 'reshw@naver.com',
      subject: `[게하] 새로운 칭찬 등록 - ${userName}`,
      html: htmlContent,
      text: textContent
    });

    console.log('✅ 이메일 발송 성공:', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        messageId: data.id 
      })
    };

  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
}