/**
 * 영업용 데모 스페이스 생성 스크립트
 *
 * 실행 방법:
 * node scripts/createDemoSpace.js
 *
 * 생성되는 데이터:
 * - 데모 스페이스 (DEMO01)
 * - 샘플 사용자 15명
 * - 최근 3개월 예약 데이터
 * - 샘플 정산 데이터
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

const DEMO_SPACE_ID = 'DEMO01';
const DEMO_SPACE_NAME = '영업용 데모 라운지';

// 샘플 사용자 데이터
const sampleUsers = [
  { id: 'demo_user_001', name: '김철수', userType: 'manager' },
  { id: 'demo_user_002', name: '이영희', userType: 'vice-manager' },
  { id: 'demo_user_003', name: '박민수', userType: 'vice-manager' },
  { id: 'demo_user_004', name: '최지원', userType: 'guest' },
  { id: 'demo_user_005', name: '정하늘', userType: 'guest' },
  { id: 'demo_user_006', name: '강소라', userType: 'guest' },
  { id: 'demo_user_007', name: '윤대성', userType: 'guest' },
  { id: 'demo_user_008', name: '송미래', userType: 'guest' },
  { id: 'demo_user_009', name: '임준호', userType: 'guest' },
  { id: 'demo_user_010', name: '한지민', userType: 'guest' },
  { id: 'demo_user_011', name: '오세훈', userType: 'guest' },
  { id: 'demo_user_012', name: '백현우', userType: 'guest' },
  { id: 'demo_user_013', name: '서연아', userType: 'guest' },
  { id: 'demo_user_014', name: '노태우', userType: 'guest' },
  { id: 'demo_user_015', name: '문정희', userType: 'guest' }
];

// 날짜 헬퍼 함수
function getDateOffset(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(15, 0, 0, 0); // 체크인 시간 15:00
  return Timestamp.fromDate(date);
}

// 1. 스페이스 생성
async function createSpace() {
  console.log('🏠 데모 스페이스 생성 중...\n');

  const spaceRef = doc(db, 'spaces', DEMO_SPACE_ID);
  const spaceData = {
    name: DEMO_SPACE_NAME,
    createdAt: Timestamp.now(),
    createdBy: 'system',
    updatedAt: Timestamp.now(),

    // 데모 스페이스 플래그 (중요!)
    isDemoSpace: true,

    // 기본 설정
    accountBank: '카카오뱅크',
    accountNumber: '3333-01-1234567',
    accountHolder: '김철수',
    guestPricePerNight: 30000,

    // 정산 계좌
    accountBank_settle: '카카오뱅크',
    accountNumber_settle: '3333-01-1234567',
    accountHolder_settle: '김철수',

    // 데모 안내
    description: '🎯 이 공간은 영업용 데모 스페이스입니다. 모든 기능을 자유롭게 체험해보세요!'
  };

  await setDoc(spaceRef, spaceData);
  console.log(`✅ 스페이스 생성 완료: ${DEMO_SPACE_ID} - ${DEMO_SPACE_NAME}\n`);
}

// 2. 샘플 사용자 추가
async function createUsers() {
  console.log('👥 샘플 사용자 생성 중...\n');

  for (const user of sampleUsers) {
    const userRef = doc(db, `spaces/${DEMO_SPACE_ID}/assignedUsers`, user.id);
    const userData = {
      displayName: user.name,
      email: `${user.id}@demo.com`,
      joinedAt: Timestamp.now(),
      profileImage: '',
      status: 'active',
      userType: user.userType
    };

    await setDoc(userRef, userData);
    console.log(`  ✅ ${user.name} (${user.userType})`);
  }

  console.log(`\n✅ 총 ${sampleUsers.length}명 생성 완료\n`);
}

// 3. 샘플 예약 생성
async function createReservations() {
  console.log('📅 샘플 예약 생성 중...\n');

  const reservations = [
    // 지난 달 예약 (완료)
    {
      id: 'reserve_001',
      guestName: '김철수',
      guestId: 'demo_user_001',
      checkIn: getDateOffset(-25),
      checkOut: getDateOffset(-23),
      nights: 2,
      guests: 2,
      status: 'completed'
    },
    {
      id: 'reserve_002',
      guestName: '이영희',
      guestId: 'demo_user_002',
      checkIn: getDateOffset(-20),
      checkOut: getDateOffset(-18),
      nights: 2,
      guests: 3,
      status: 'completed'
    },
    {
      id: 'reserve_003',
      guestName: '박민수',
      guestId: 'demo_user_003',
      checkIn: getDateOffset(-15),
      checkOut: getDateOffset(-14),
      nights: 1,
      guests: 2,
      status: 'completed'
    },

    // 이번 달 예약
    {
      id: 'reserve_004',
      guestName: '최지원',
      guestId: 'demo_user_004',
      checkIn: getDateOffset(-5),
      checkOut: getDateOffset(-3),
      nights: 2,
      guests: 4,
      status: 'completed'
    },
    {
      id: 'reserve_005',
      guestName: '정하늘',
      guestId: 'demo_user_005',
      checkIn: getDateOffset(-1),
      checkOut: getDateOffset(1),
      nights: 2,
      guests: 2,
      status: 'checked-in'
    },

    // 다가오는 예약
    {
      id: 'reserve_006',
      guestName: '강소라',
      guestId: 'demo_user_006',
      checkIn: getDateOffset(3),
      checkOut: getDateOffset(5),
      nights: 2,
      guests: 3,
      status: 'confirmed'
    },
    {
      id: 'reserve_007',
      guestName: '윤대성',
      guestId: 'demo_user_007',
      checkIn: getDateOffset(7),
      checkOut: getDateOffset(9),
      nights: 2,
      guests: 2,
      status: 'confirmed'
    },
    {
      id: 'reserve_008',
      guestName: '송미래',
      guestId: 'demo_user_008',
      checkIn: getDateOffset(10),
      checkOut: getDateOffset(13),
      nights: 3,
      guests: 4,
      status: 'confirmed'
    },
    {
      id: 'reserve_009',
      guestName: '임준호',
      guestId: 'demo_user_009',
      checkIn: getDateOffset(15),
      checkOut: getDateOffset(17),
      nights: 2,
      guests: 2,
      status: 'confirmed'
    },
    {
      id: 'reserve_010',
      guestName: '한지민',
      guestId: 'demo_user_010',
      checkIn: getDateOffset(20),
      checkOut: getDateOffset(22),
      nights: 2,
      guests: 3,
      status: 'confirmed'
    }
  ];

  for (const reservation of reservations) {
    const reserveRef = doc(db, `spaces/${DEMO_SPACE_ID}/reserves`, reservation.id);
    const reserveData = {
      guestName: reservation.guestName,
      guestId: reservation.guestId,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      nights: reservation.nights,
      guests: reservation.guests,
      status: reservation.status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: 'system',
      memo: '데모 예약입니다'
    };

    await setDoc(reserveRef, reserveData);

    const checkInDate = reservation.checkIn.toDate();
    const statusEmoji =
      reservation.status === 'completed' ? '✅' :
      reservation.status === 'checked-in' ? '🏠' : '📌';

    console.log(`  ${statusEmoji} ${reservation.guestName} - ${checkInDate.toLocaleDateString()} (${reservation.nights}박)`);
  }

  console.log(`\n✅ 총 ${reservations.length}건 생성 완료\n`);
}

// 4. 샘플 정산 데이터 생성
async function createSettlements() {
  console.log('💰 샘플 정산 데이터 생성 중...\n');

  // 지난 주 정산
  const lastWeekSettlement = {
    weekId: 'settlement_001',
    weekStart: getDateOffset(-14),
    weekEnd: getDateOffset(-7),
    totalAmount: 180000,
    paidAmount: 180000,
    unpaidAmount: 0,
    status: 'completed',
    createdAt: Timestamp.now()
  };

  const lastWeekRef = doc(db, `spaces/${DEMO_SPACE_ID}/settlement`, lastWeekSettlement.weekId);
  await setDoc(lastWeekRef, lastWeekSettlement);
  console.log('  ✅ 지난 주 정산 (완료) - 180,000원');

  // 이번 주 정산
  const thisWeekSettlement = {
    weekId: 'settlement_002',
    weekStart: getDateOffset(-7),
    weekEnd: getDateOffset(0),
    totalAmount: 120000,
    paidAmount: 60000,
    unpaidAmount: 60000,
    status: 'pending',
    createdAt: Timestamp.now()
  };

  const thisWeekRef = doc(db, `spaces/${DEMO_SPACE_ID}/settlement`, thisWeekSettlement.weekId);
  await setDoc(thisWeekRef, thisWeekSettlement);
  console.log('  ✅ 이번 주 정산 (진행중) - 120,000원 (미납 60,000원)');

  console.log('\n✅ 정산 데이터 생성 완료\n');
}

// 5. 게스트 정책 생성
async function createGuestPolicies() {
  console.log('📋 게스트 정책 생성 중...\n');

  const policies = [
    {
      id: 'policy_default',
      name: '기본 정책',
      pricePerNight: 30000,
      maxConsecutiveNights: 3,
      isDefault: true,
      description: '일반 게스트를 위한 기본 정책입니다',
      createdAt: Timestamp.now()
    },
    {
      id: 'policy_vip',
      name: 'VIP 정책',
      pricePerNight: 25000,
      maxConsecutiveNights: 7,
      isDefault: false,
      description: '우수 게스트를 위한 할인 정책입니다',
      createdAt: Timestamp.now()
    }
  ];

  for (const policy of policies) {
    const policyRef = doc(db, `spaces/${DEMO_SPACE_ID}/guestPolicies`, policy.id);
    await setDoc(policyRef, policy);
    console.log(`  ✅ ${policy.name} - ${policy.pricePerNight.toLocaleString()}원/박`);
  }

  console.log('\n✅ 게스트 정책 생성 완료\n');
}

// 메인 실행 함수
async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════');
  console.log('   🎯 영업용 데모 스페이스 생성 스크립트');
  console.log('═══════════════════════════════════════════');
  console.log('\n');

  try {
    await createSpace();
    await createUsers();
    await createReservations();
    await createSettlements();
    await createGuestPolicies();

    console.log('═══════════════════════════════════════════');
    console.log('   ✨ 데모 스페이스 생성 완료!');
    console.log('═══════════════════════════════════════════');
    console.log('\n');
    console.log(`📍 스페이스 코드: ${DEMO_SPACE_ID}`);
    console.log(`📍 스페이스 이름: ${DEMO_SPACE_NAME}`);
    console.log(`📍 조인 URL: /join/${DEMO_SPACE_ID}`);
    console.log('\n');
    console.log('💡 조인 시 자동으로 부매니저 권한이 부여됩니다');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 스크립트 실행 실패:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 스크립트 실행
main();
