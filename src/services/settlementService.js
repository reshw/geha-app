// src/services/settlementService.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 주차 ID 생성 (ISO Week)
 * 형식: YYYY-Wxx
 * 예: 2025-W51
 */
const getWeekId = (date = new Date()) => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
};

/**
 * 주의 시작일/종료일 계산 (월요일~일요일)
 */
const getWeekRange = (date = new Date()) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  
  const weekStart = new Date(date.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
};

/**
 * Receipt ID 생성 (타임스탬프 기반)
 * 형식: YYYY-MM-DDTHHMM
 */
const generateReceiptId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}${minutes}${seconds}`;
};

const settlementService = {
  /**
   * 이번주 Settlement 가져오기 (없으면 생성)
   */
  async getCurrentWeekSettlement(spaceId) {
    try {
      const weekId = getWeekId();
      const { weekStart, weekEnd } = getWeekRange();
      
      console.log('📅 이번주 Settlement 조회:', { spaceId, weekId });
      
      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      const settlementSnap = await getDoc(settlementRef);
      
      // 이미 존재하면 반환
      if (settlementSnap.exists()) {
        const data = settlementSnap.data();
        console.log('✅ 기존 Settlement 발견');
        return {
          id: settlementSnap.id,
          weekId,
          ...data,
          weekStart: data.weekStart?.toDate(),
          weekEnd: data.weekEnd?.toDate(),
          createdAt: data.createdAt?.toDate(),
          settledAt: data.settledAt?.toDate(),
        };
      }
      
      // 없으면 새로 생성
      console.log('🆕 새 Settlement 생성');
      const newSettlement = {
        weekId,
        weekStart: Timestamp.fromDate(weekStart),
        weekEnd: Timestamp.fromDate(weekEnd),
        status: 'active', // active, settled
        createdAt: Timestamp.now(),
        settledAt: null,
        participants: {}, // { userId: { name, totalPaid, totalOwed, balance } }
        totalAmount: 0,
      };
      
      await setDoc(settlementRef, newSettlement);
      
      return {
        id: weekId,
        weekId,
        ...newSettlement,
        weekStart,
        weekEnd,
        createdAt: new Date(),
        settledAt: null,
      };
    } catch (error) {
      console.error('❌ getCurrentWeekSettlement 실패:', error);
      throw error;
    }
  },

  /**
   * 영수증 제출
   */
  async submitReceipt(spaceId, receiptData) {
    try {
      console.log('🧾 영수증 제출:', { spaceId, receiptData });
      
      const {
        submittedBy,      // 등록자 UID
        submittedByName,  // 등록자 이름
        paidBy,           // 실제 납부자 UID
        paidByName,       // 실제 납부자 이름
        memo,
        imageUrl,
        items,            // [{ itemName, amount, splitAmong: [userId, ...] }]
      } = receiptData;
      
      const now = new Date();
      const weekId = getWeekId(now);
      const receiptId = generateReceiptId(now);
      
      // 총액 계산
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      
      // 각 항목의 1/n 계산
      const processedItems = items.map(item => ({
        itemName: item.itemName,
        amount: item.amount,
        splitAmong: item.splitAmong, // [userId, ...]
        perPerson: Math.floor(item.amount / item.splitAmong.length),
      }));
      
      // 영수증 데이터
      const receipt = {
        id: receiptId,
        submittedBy,
        submittedByName,
        paidBy,
        paidByName,
        createdAt: Timestamp.fromDate(now),
        memo: memo || '',
        imageUrl: imageUrl || '',
        items: processedItems,
        totalAmount,
      };
      
      // Settlement > receipts 서브컬렉션에 추가
      const receiptRef = doc(db, 'spaces', spaceId, 'settlement', weekId, 'receipts', receiptId);
      await setDoc(receiptRef, receipt);
      
      // Settlement 문서 업데이트 (참여자 목록, 총액)
      await this.updateSettlementCalculation(spaceId, weekId);
      
      console.log('✅ 영수증 제출 완료:', receiptId);
      return { id: receiptId, ...receipt };
    } catch (error) {
      console.error('❌ submitReceipt 실패:', error);
      throw error;
    }
  },

  /**
   * 영수증 삭제
   */
  async deleteReceipt(spaceId, weekId, receiptId) {
    try {
      console.log('🗑️ 영수증 삭제:', { spaceId, weekId, receiptId });

      // 영수증 삭제
      const receiptRef = doc(db, 'spaces', spaceId, 'settlement', weekId, 'receipts', receiptId);
      await deleteDoc(receiptRef);

      // Settlement 계산 업데이트
      await this.updateSettlementCalculation(spaceId, weekId);

      console.log('✅ 영수증 삭제 완료');
      return true;
    } catch (error) {
      console.error('❌ deleteReceipt 실패:', error);
      throw error;
    }
  },

  /**
   * Settlement 계산 업데이트
   */
  async updateSettlementCalculation(spaceId, weekId) {
    try {
      console.log('🔄 정산 계산 업데이트:', { spaceId, weekId });

      // 멤버 정보 먼저 가져오기 (displayName만)
      const members = await this.getSpaceMembers(spaceId);
      const memberMap = {};
      members.forEach(m => {
        memberMap[m.userId] = {
          displayName: m.displayName,
        };
      });

      // 모든 영수증 가져오기
      const receiptsRef = collection(db, 'spaces', spaceId, 'settlement', weekId, 'receipts');
      const receiptsSnap = await getDocs(receiptsRef);

      const participants = {};
      let totalAmount = 0;

      receiptsSnap.forEach((doc) => {
        const receipt = doc.data();
        totalAmount += receipt.totalAmount;

        // 납부자 추가
        if (!participants[receipt.paidBy]) {
          const memberInfo = memberMap[receipt.paidBy];
          participants[receipt.paidBy] = {
            name: memberInfo?.displayName || receipt.paidByName,
            totalPaid: 0,
            totalOwed: 0,
            balance: 0,
          };
        }
        participants[receipt.paidBy].totalPaid += receipt.totalAmount;

        // 각 항목의 분담자들 처리
        receipt.items.forEach(item => {
          item.splitAmong.forEach(userId => {
            if (!participants[userId]) {
              const memberInfo = memberMap[userId];
              participants[userId] = {
                name: memberInfo?.displayName || userId,
                totalPaid: 0,
                totalOwed: 0,
                balance: 0,
              };
            }
            participants[userId].totalOwed += item.perPerson;
          });
        });
      });

      // 각 참여자의 잔액 계산 (받을 돈이면 +, 낼 돈이면 -)
      Object.keys(participants).forEach(userId => {
        const p = participants[userId];
        p.balance = p.totalPaid - p.totalOwed;
      });

      // Settlement 문서 업데이트 (profileImage는 저장하지 않음)
      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      await updateDoc(settlementRef, {
        participants,
        totalAmount,
        updatedAt: Timestamp.now(),
      });

      console.log('✅ 정산 계산 완료:', participants);
      return participants;
    } catch (error) {
      console.error('❌ updateSettlementCalculation 실패:', error);
      throw error;
    }
  },

  /**
   * 이번주 영수증 목록 조회
   */
  async getWeekReceipts(spaceId, weekId) {
    try {
      console.log('📋 영수증 목록 조회:', { spaceId, weekId });
      
      const receiptsRef = collection(db, 'spaces', spaceId, 'settlement', weekId, 'receipts');
      const q = query(receiptsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const receipts = [];
      snapshot.forEach((doc) => {
        receipts.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        });
      });
      
      console.log('✅ 영수증 목록 조회 완료:', receipts.length);
      return receipts;
    } catch (error) {
      console.error('❌ getWeekReceipts 실패:', error);
      throw error;
    }
  },

  /**
   * 정산 확정 (일요일 자정에 자동 실행 or 수동 실행)
   */
  async settleWeek(spaceId, weekId) {
    try {
      console.log('💰 주간 정산 확정:', { spaceId, weekId });
      
      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      await updateDoc(settlementRef, {
        status: 'settled',
        settledAt: Timestamp.now(),
      });
      
      console.log('✅ 정산 확정 완료');
      return true;
    } catch (error) {
      console.error('❌ settleWeek 실패:', error);
      throw error;
    }
  },

  /**
   * Space 멤버 정보 가져오기
   */
  async getSpaceMembers(spaceId) {
    try {
      console.log('👥 멤버 목록 조회:', spaceId);
      
      const membersRef = collection(db, 'spaces', spaceId, 'assignedUsers');
      const snapshot = await getDocs(membersRef);
      
      const members = [];
      snapshot.forEach((doc) => {
        members.push({
          userId: doc.id,
          ...doc.data(),
        });
      });
      
      console.log('✅ 멤버 목록 조회 완료:', members.length);
      return members;
    } catch (error) {
      console.error('❌ getSpaceMembers 실패:', error);
      throw error;
    }
  },
};

export default settlementService;