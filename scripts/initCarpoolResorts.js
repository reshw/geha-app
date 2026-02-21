/**
 * 카풀 스키장 초기 데이터 생성 스크립트
 *
 * 실행 방법:
 * node scripts/initCarpoolResorts.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// Firebase 초기화
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 초기 스키장 데이터
const resorts = [
  {
    id: 'phoenix',
    name: '휘닉스파크',
    nameEn: 'Phoenix Park',
    location: '강원도 평창군',
    distance: 150, // 서울 기준 km
    recommendedCost: 15000, // 편도 기준
    popularDepartures: ['강남', '잠실', '홍대', '수원', '인천'],
    active: true,
    order: 1
  },
  {
    id: 'vivaldi',
    name: '대명비발디',
    nameEn: 'Vivaldi Park',
    location: '강원도 홍천군',
    distance: 80, // 서울 기준 km
    recommendedCost: 8000, // 편도 기준
    popularDepartures: ['강남', '잠실', '홍대', '의정부'],
    active: true,
    order: 2
  }
];

async function initResorts() {
  console.log('🏔️ 스키장 초기 데이터 생성 시작...\n');

  for (const resort of resorts) {
    try {
      const resortRef = doc(db, 'carpool_resorts', resort.id);
      await setDoc(resortRef, {
        ...resort,
        createdAt: Timestamp.now()
      });
      console.log(`✅ ${resort.name} (${resort.id}) - 생성 완료`);
      console.log(`   위치: ${resort.location}`);
      console.log(`   거리: ${resort.distance}km`);
      console.log(`   권장 비용: ${resort.recommendedCost.toLocaleString()}원\n`);
    } catch (error) {
      console.error(`❌ ${resort.name} 생성 실패:`, error.message);
    }
  }

  console.log('✨ 스키장 초기 데이터 생성 완료!');
  process.exit(0);
}

// 스크립트 실행
initResorts().catch((error) => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});
