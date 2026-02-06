/**
 * Firebase Service Account 자격증명 파일 생성
 * 빌드 시 환경변수에서 디코드하여 파일로 저장
 */

const fs = require('fs');
const path = require('path');

const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;

if (!serviceAccountB64) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON_B64 환경변수가 없습니다.');
  process.exit(1);
}

try {
  // Base64 디코드
  const serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf-8');

  // 파일로 저장
  const outputPath = path.join(__dirname, '../netlify/functions/firebase-service-account.json');
  fs.writeFileSync(outputPath, serviceAccountJson, 'utf-8');

  console.log('✅ Firebase Service Account 파일 생성 완료:', outputPath);
} catch (error) {
  console.error('❌ Firebase Service Account 파일 생성 실패:', error);
  process.exit(1);
}
