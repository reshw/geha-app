// netlify/functions/firebase-loader.js
// Firebase Admin 초기화 - 환경 변수 대신 파일 사용

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

let adminApp;
let db;

function getFirebaseApp() {
  if (adminApp) {
    return { adminApp, db };
  }

  try {
    // 1. 환경 변수에서 시도 (개발 환경)
    const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
    if (serviceAccountB64) {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountB64, 'base64').toString('utf-8')
      );
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
      db = getFirestore(adminApp);
      console.log('✅ Firebase initialized from environment variable');
      return { adminApp, db };
    }

    // 2. 파일에서 시도 (프로덕션)
    const credentialPath = path.join(__dirname, 'firebase-credentials.json');
    if (fs.existsSync(credentialPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf-8'));
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
      db = getFirestore(adminApp);
      console.log('✅ Firebase initialized from file');
      return { adminApp, db };
    }

    // 3. 실패
    throw new Error('Firebase credentials not found - set FIREBASE_SERVICE_ACCOUNT_JSON_B64 or add firebase-credentials.json');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
}

module.exports = { getFirebaseApp };
