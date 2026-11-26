// Netlify 스타일 핸들러(event => { statusCode, headers, body })를
// Vercel Node 함수((req, res) => ...)로 감싸는 어댑터.
// 기존 함수 본문을 거의 수정하지 않고 Vercel로 옮기기 위한 용도.

/**
 * @param {(event: object) => Promise<{statusCode?: number, headers?: object, body?: string}>} handler
 * @param {{ cron?: boolean }} [options] cron: true면 Vercel Cron 인증(CRON_SECRET)을 요구
 */
export function withNetlifyEvent(handler, options = {}) {
  return async function vercelHandler(req, res) {
    if (options.cron) {
      const secret = process.env.CRON_SECRET;
      if (!secret) {
        res.status(500).json({ error: 'CRON_SECRET is not configured' });
        return;
      }
      if (req.headers.authorization !== `Bearer ${secret}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }

    let body = req.body;
    if (Buffer.isBuffer(body)) {
      body = body.toString('utf8');
    } else if (body !== undefined && body !== null && typeof body !== 'string') {
      // Vercel이 JSON 본문을 객체로 파싱해 주므로, 기존 JSON.parse(event.body) 호환을 위해 다시 문자열화
      body = JSON.stringify(body);
    }

    const event = {
      httpMethod: req.method,
      headers: req.headers,
      queryStringParameters: req.query || {},
      body: body ?? null,
      isBase64Encoded: false,
    };

    try {
      const result = (await handler(event, {})) || {};
      const { statusCode = 200, headers = {}, body: out = '' } = result;

      for (const [key, value] of Object.entries(headers)) {
        res.setHeader(key, value);
      }
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.status(statusCode).send(out);
    } catch (error) {
      console.error('Unhandled function error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
