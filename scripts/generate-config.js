#!/usr/bin/env node
// scripts/generate-config.js
// 빌드 타임에 환경 변수에서 config.json 생성
// config.json은 .gitignore에 있어서 커밋 안 됨

const fs = require('fs');
const path = require('path');

const config = {
  resend: {
    apiKey: process.env.RESEND_API_KEY || ''
  },
  nhn: {
    apiUrl: process.env.NHN_API_URL || 'https://api-alimtalk.cloud.toast.com',
    appkey: process.env.NHN_APPKEY || '',
    secretKey: process.env.NHN_SECRET_KEY || '',
    senderKey: process.env.NHN_SENDER_KEY || '',
    plusFriendId: process.env.NHN_PLUS_FRIEND_ID || '@jh308',
    templateGuestConfirm: process.env.NHN_TEMPLATE_GUEST_CONFIRM || 'JH8636'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  }
};

const configPath = path.join(__dirname, '..', 'netlify', 'functions', 'config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ config.json generated from environment variables');
