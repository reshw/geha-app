#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 환경 변수에서 설정값 읽기 (AWS 4KB 제한 대비)
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

// 2. config.json 생성 (Netlify Functions용)
const targetDir = path.join(__dirname, '..', 'netlify', 'functions');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const configPath = path.join(targetDir, 'config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ config.json 생성 완료');

// 3. sw.js 보안 경고 해결 (파일 내 실제 키를 환경 변수로 치환)
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');

  // Firebase 키들을 환경변수로 치환 (GitHub에는 실제 키가 없어야 함)
  swContent = swContent.replace(/apiKey:\s*".*"/, `apiKey: "${process.env.FIREBASE_API_KEY || ''}"`);
  swContent = swContent.replace(/authDomain:\s*".*"/, `authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}"`);
  swContent = swContent.replace(/projectId:\s*".*"/, `projectId: "${process.env.FIREBASE_PROJECT_ID || ''}"`);
  swContent = swContent.replace(/messagingSenderId:\s*".*"/, `messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}"`);
  swContent = swContent.replace(/appId:\s*".*"/, `appId: "${process.env.FIREBASE_APP_ID || ''}"`);

  fs.writeFileSync(swPath, swContent);
  console.log('✅ sw.js 보안 키 치환 완료');
}