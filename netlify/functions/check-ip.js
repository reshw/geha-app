const axios = require('axios');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 외부 서비스로 현재 IP 확인
    const response = await axios.get('https://api.ipify.org?format=json');
    const ip = response.data.ip;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ip: ip,
        message: `현재 Netlify Functions IP: ${ip}`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
