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
import * as notificationService from './notificationService';
import { normalizePhoneNumber } from './notificationService';

/**
 * 주차 ID 생성 (ISO 8601 Week)
 * 형식: YYYY-Wxx
 * 예: 2025-W51
 *
 * ISO 8601 표준:
 * - 한 주는 월요일부터 일요일까지
 * - 연도의 첫 번째 주(W01)는 그 해의 첫 번째 목요일을 포함하는 주
 * - 연말-새해 전환 시 같은 주는 같은 주차 번호를 가짐
 *   예: 2025-12-29(월) ~ 2026-01-04(일) = 2026-W01
 */
const getWeekId = (date = new Date()) => {
  const target = new Date(date.valueOf());

  // 그 주의 목요일로 이동 (ISO 8601 기준: 목요일이 속한 연도가 주차의 연도)
  const dayOfWeek = (target.getDay() + 6) % 7; // 월요일=0, 일요일=6
  target.setDate(target.getDate() - dayOfWeek + 3);

  // 해당 연도의 첫 번째 목요일 계산
  const year = target.getFullYear();
  const firstThursday = new Date(year, 0, 4); // 1월 4일은 항상 첫 주에 속함
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);

  // 첫 번째 목요일부터 경과한 주 수 계산
  const weekNumber = 1 + Math.floor((target - firstThursday) / 604800000); // 7일 = 604800000ms

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
   * 새 주차 생성 시 이전 주차가 active 상태이면 경고 반환
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

      // 새로 생성하기 전에 이전 주차 확인
      const prevWeekWarning = await this.checkPreviousWeekStatus(spaceId, weekStart);

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
        prevWeekWarning, // 이전 주차 경고 메시지
      };
    } catch (error) {
      console.error('❌ getCurrentWeekSettlement 실패:', error);
      throw error;
    }
  },

  /**
   * 이전 주차 상태 확인
   * 새 주차 생성 시 이전 주차가 active 상태이면 경고 반환
   */
  async checkPreviousWeekStatus(spaceId, currentWeekStart) {
    try {
      // 이전 주 월요일 계산
      const prevWeekStart = new Date(currentWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);

      const prevWeekId = getWeekId(prevWeekStart);
      console.log('🔍 이전 주차 확인:', prevWeekId);

      const prevSettlement = await this.getWeekSettlement(spaceId, prevWeekId);

      if (prevSettlement && prevSettlement.status === 'active') {
        const warning = {
          hasPreviousActiveWeek: true,
          prevWeekId,
          prevWeekStart: prevSettlement.weekStart,
          prevWeekEnd: prevSettlement.weekEnd,
          message: `이전 주차(${prevWeekId})가 아직 정산 완료되지 않았습니다.`,
        };
        console.warn('⚠️ 이전 주차가 active 상태:', warning);
        return warning;
      }

      return null;
    } catch (error) {
      console.error('❌ checkPreviousWeekStatus 실패:', error);
      return null;
    }
  },

  /**
   * 귀속 주차가 암묵적으로 마감되었는지 확인
   * 귀속 주차보다 미래 주차 중 하나라도 settled가 있으면 true 반환
   */
  async isImplicitlyClosed(spaceId, belongsToWeekId) {
    try {
      console.log('🔍 암묵적 마감 여부 확인:', belongsToWeekId);

      // belongsToWeekId의 날짜 계산
      const [year, week] = belongsToWeekId.split('-W').map(Number);
      const belongsDate = new Date(year, 0, 1 + (week - 1) * 7);

      // 현재 날짜
      const now = new Date();
      const currentWeekId = getWeekId(now);

      // belongsToWeekId부터 현재까지 모든 주차 확인
      const checkDate = new Date(belongsDate);
      checkDate.setDate(checkDate.getDate() + 7); // 다음 주부터 시작

      while (checkDate <= now) {
        const checkWeekId = getWeekId(checkDate);

        // 현재 주차보다 미래면 중단
        if (checkWeekId > currentWeekId) break;

        const settlement = await this.getWeekSettlement(spaceId, checkWeekId);

        if (settlement && settlement.status === 'settled') {
          console.log(`⚠️ 미래 주차(${checkWeekId})가 settled 상태 → ${belongsToWeekId}는 암묵적 마감`);
          return true;
        }

        checkDate.setDate(checkDate.getDate() + 7);
      }

      console.log(`✅ ${belongsToWeekId}는 암묵적 마감 아님`);
      return false;
    } catch (error) {
      console.error('❌ isImplicitlyClosed 확인 실패:', error);
      return false;
    }
  },

  /**
   * 특정 주차 Settlement 가져오기 (없으면 null 반환, 생성하지 않음)
   */
  async getWeekSettlement(spaceId, weekId) {
    try {
      console.log('📅 특정 주차 Settlement 조회:', { spaceId, weekId });

      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      const settlementSnap = await getDoc(settlementRef);

      if (!settlementSnap.exists()) {
        console.log('❌ Settlement 없음');
        return null;
      }

      const data = settlementSnap.data();
      console.log('✅ Settlement 발견');
      return {
        id: settlementSnap.id,
        weekId,
        ...data,
        weekStart: data.weekStart?.toDate(),
        weekEnd: data.weekEnd?.toDate(),
        createdAt: data.createdAt?.toDate(),
        settledAt: data.settledAt?.toDate(),
      };
    } catch (error) {
      console.error('❌ getWeekSettlement 실패:', error);
      throw error;
    }
  },

  /**
   * 날짜로 주차 Settlement 가져오기 (없으면 null 반환)
   */
  async getSettlementByDate(spaceId, date) {
    try {
      const weekId = getWeekId(date);
      return await this.getWeekSettlement(spaceId, weekId);
    } catch (error) {
      console.error('❌ getSettlementByDate 실패:', error);
      throw error;
    }
  },

  /**
   * 모든 Settlement 목록 가져오기 (최신순)
   */
  async getAllSettlements(spaceId) {
    try {
      console.log('📋 모든 Settlement 조회:', spaceId);

      const settlementsRef = collection(db, 'spaces', spaceId, 'settlement');
      const q = query(settlementsRef, orderBy('weekStart', 'desc'));
      const snapshot = await getDocs(q);

      const settlements = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        settlements.push({
          id: doc.id,
          weekId: doc.id,
          ...data,
          weekStart: data.weekStart?.toDate(),
          weekEnd: data.weekEnd?.toDate(),
          createdAt: data.createdAt?.toDate(),
          settledAt: data.settledAt?.toDate(),
        });
      });

      console.log('✅ Settlement 목록 조회 완료:', settlements.length);
      return settlements;
    } catch (error) {
      console.error('❌ getAllSettlements 실패:', error);
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
        belongsToDate,    // 귀속일 (YYYY-MM-DD)
      } = receiptData;

      const now = new Date();
      const receiptId = generateReceiptId(now);

      // 귀속일 처리
      let targetWeekId;
      let belongsToWeekId;
      let actualBelongsToDate = belongsToDate;

      if (belongsToDate) {
        const belongsDate = new Date(belongsToDate);
        belongsToWeekId = getWeekId(belongsDate);

        // 귀속 주차의 정산 상태 확인
        const belongsSettlement = await this.getWeekSettlement(spaceId, belongsToWeekId);

        // 1. 직접 마감 여부 확인
        const isDirectlyClosed = belongsSettlement?.status === 'settled';

        // 2. 암묵적 마감 여부 확인 (귀속 주차보다 미래에 settled가 있는지)
        const isImplicitClosed = await this.isImplicitlyClosed(spaceId, belongsToWeekId);

        if (isDirectlyClosed) {
          console.log(`⚠️ 귀속 주차(${belongsToWeekId})가 명시적으로 마감됨`);
        }

        if (isImplicitClosed) {
          console.log(`⚠️ 귀속 주차(${belongsToWeekId})가 암묵적으로 마감됨 (미래 주차 중 settled 존재)`);
        }

        if (isDirectlyClosed || isImplicitClosed) {
          // 명시적/암묵적 마감이면 현재 주차에 등록
          const currentWeekId = getWeekId(now);
          const currentSettlement = await this.getWeekSettlement(spaceId, currentWeekId);

          if (currentSettlement?.status === 'settled') {
            // 현재 주차도 마감되었으면 다음 주차로
            const nextWeekDate = new Date(now);
            nextWeekDate.setDate(nextWeekDate.getDate() + 7);
            targetWeekId = getWeekId(nextWeekDate);
            console.log(`🔜 현재 주차도 마감됨 → 다음 주차(${targetWeekId})에 등록`);
          } else {
            // 현재 주차가 active이거나 없으면 현재 주차에 등록
            targetWeekId = currentWeekId;
            console.log(`🆕 귀속 주차 마감됨 → 현재 주차(${currentWeekId})에 등록`);
          }
        } else {
          // 명시적/암묵적 마감 모두 아니면 귀속 주차에 등록
          targetWeekId = belongsToWeekId;
          console.log(`✅ 귀속 주차(${belongsToWeekId})는 마감 안됨 → 귀속 주차에 등록`);
        }
      } else {
        // 귀속일이 없으면 현재 주차에 등록
        targetWeekId = getWeekId(now);
        belongsToWeekId = targetWeekId;
        actualBelongsToDate = now.toISOString().split('T')[0];
      }
      
      // 총액 계산
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      
      // 각 항목의 1/n 계산 (올림으로 낸 사람 우대)
      const processedItems = items.map(item => ({
        itemName: item.itemName,
        amount: item.amount,
        splitAmong: item.splitAmong, // [userId, ...]
        perPerson: Math.ceil(item.amount / item.splitAmong.length),
      }));
      
      // 영수증 데이터
      const receipt = {
        id: receiptId,
        submittedBy,
        submittedByName,
        paidBy,
        paidByName,
        createdAt: Timestamp.fromDate(now),
        belongsToDate: actualBelongsToDate,  // 귀속일
        belongsToWeekId,                     // 귀속 주차 ID
        memo: memo || '',
        imageUrl: imageUrl || '',
        items: processedItems,
        totalAmount,
      };

      // Settlement > receipts 서브컬렉션에 추가
      const receiptRef = doc(db, 'spaces', spaceId, 'settlement', targetWeekId, 'receipts', receiptId);
      await setDoc(receiptRef, receipt);

      // Settlement 문서 업데이트 (참여자 목록, 총액)
      await this.updateSettlementCalculation(spaceId, targetWeekId);

      // 이메일 알림 발송
      try {
        const emailSettingsRef = doc(db, `spaces/${spaceId}/settings`, 'email');
        const emailSettingsDoc = await getDoc(emailSettingsRef);
        const emailSettings = emailSettingsDoc.exists() ? emailSettingsDoc.data() : null;

        if (emailSettings?.settlement?.enabled && emailSettings.settlement.recipients.length > 0) {
          console.log('📧 영수증 제출 이메일 발송 시작');

          // 스페이스 정보 가져오기
          const spaceDocRef = doc(db, 'spaces', spaceId);
          const spaceDoc = await getDoc(spaceDocRef);
          const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};

          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'settlement',
              paidByName,
              submittedByName,
              submittedAt: now,
              totalAmount,
              items: processedItems,
              memo,
              imageUrl,
              spaceName: spaceData.name || '라운지',
              recipients: {
                to: emailSettings.settlement.recipients[0],
                cc: emailSettings.settlement.recipients.slice(1)
              }
            })
          });

          const emailResult = await emailResponse.json();
          console.log('✅ 영수증 제출 이메일 발송 결과:', emailResult);
        } else {
          console.log('ℹ️ 영수증 제출 이메일 알림이 비활성화되어 있거나 수신자 없음');
        }
      } catch (emailError) {
        console.error('⚠️ 영수증 제출 이메일 발송 실패 (영수증 등록은 완료됨):', emailError);
      }

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
   * 영수증 수정
   */
  async updateReceipt(spaceId, weekId, receiptId, receiptData) {
    try {
      console.log('✏️ 영수증 수정:', { spaceId, weekId, receiptId, receiptData });

      const {
        paidBy,
        paidByName,
        memo,
        imageUrl,
        items,
      } = receiptData;

      // 총액 계산
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      // 각 항목의 1/n 계산 (올림으로 낸 사람 우대)
      const processedItems = items.map(item => ({
        itemName: item.itemName,
        amount: item.amount,
        splitAmong: item.splitAmong,
        perPerson: Math.ceil(item.amount / item.splitAmong.length),
      }));

      // 영수증 업데이트
      const receiptRef = doc(db, 'spaces', spaceId, 'settlement', weekId, 'receipts', receiptId);
      await updateDoc(receiptRef, {
        paidBy,
        paidByName,
        memo: memo || '',
        imageUrl: imageUrl || '',
        items: processedItems,
        totalAmount,
        updatedAt: Timestamp.now(),
      });

      // Settlement 계산 업데이트
      await this.updateSettlementCalculation(spaceId, weekId);

      console.log('✅ 영수증 수정 완료');
      return true;
    } catch (error) {
      console.error('❌ updateReceipt 실패:', error);
      throw error;
    }
  },

  /**
   * 영수증 조회 (단일)
   */
  async getReceipt(spaceId, weekId, receiptId) {
    try {
      console.log('🔍 영수증 조회:', { spaceId, weekId, receiptId });

      const receiptRef = doc(db, 'spaces', spaceId, 'settlement', weekId, 'receipts', receiptId);
      const receiptSnap = await getDoc(receiptRef);

      if (!receiptSnap.exists()) {
        throw new Error('영수증을 찾을 수 없습니다.');
      }

      const receiptData = {
        id: receiptSnap.id,
        ...receiptSnap.data(),
        createdAt: receiptSnap.data().createdAt?.toDate(),
      };

      console.log('✅ 영수증 조회 완료');
      return receiptData;
    } catch (error) {
      console.error('❌ getReceipt 실패:', error);
      throw error;
    }
  },

  /**
   * Settlement 계산 업데이트
   */
  async updateSettlementCalculation(spaceId, weekId) {
    try {
      console.log('🔄 정산 계산 업데이트:', { spaceId, weekId });

      // 🚀 멤버 정보와 영수증을 병렬로 조회 (부분 실패 허용)
      const receiptsRef = collection(db, 'spaces', spaceId, 'settlement', weekId, 'receipts');
      const [membersResult, receiptsResult] = await Promise.allSettled([
        this.getSpaceMembers(spaceId),
        getDocs(receiptsRef)
      ]);

      const members = membersResult.status === 'fulfilled' ? membersResult.value : [];
      if (receiptsResult.status === 'rejected') {
        console.error('❌ 영수증 조회 실패:', receiptsResult.reason);
        throw new Error('영수증 조회 실패');
      }
      const receiptsSnap = receiptsResult.value;

      // 멤버 맵 생성
      const memberMap = {};
      members.forEach(m => {
        memberMap[m.userId] = {
          displayName: m.displayName,
        };
      });

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
            phone: null, // 나중에 조회
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
                phone: null, // 나중에 조회
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

      // 각 참여자의 전화번호 조회 및 정규화 (users 컬렉션에서) - 병렬 처리
      console.log('📞 참여자 전화번호 조회 시작 (병렬)');
      const phoneResults = await Promise.allSettled(
        Object.keys(participants).map(async (userId) => {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const rawPhone = userData.phoneNumber;
            const normalizedPhone = normalizePhoneNumber(rawPhone);

            console.log(`📱 [${participants[userId].name}] 전화번호:`, {
              원본: rawPhone || '없음',
              정규화: normalizedPhone || '없음'
            });

            return { userId, phone: normalizedPhone };
          } else {
            console.warn(`⚠️ [${participants[userId].name}] users 문서 없음:`, userId);
            return { userId, phone: null };
          }
        })
      );

      // 조회 결과를 participants에 반영
      phoneResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          participants[result.value.userId].phone = result.value.phone;
        } else if (result.status === 'rejected') {
          const userId = Object.keys(participants)[index];
          console.error(`❌ [${participants[userId]?.name}] 전화번호 조회 실패:`, result.reason);
        }
      });

      // Settlement 문서 업데이트 (없으면 생성, 있으면 병합)
      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      await setDoc(settlementRef, {
        participants,
        totalAmount,
        updatedAt: Timestamp.now(),
      }, { merge: true });

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

      // orderBy 제거하고 일단 모든 영수증 가져오기 (클라이언트에서 정렬)
      const snapshot = await getDocs(receiptsRef);

      const receipts = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
        });
      });

      // 클라이언트에서 정렬 (귀속일 기준 내림차순, 그 다음 생성일 기준 내림차순)
      receipts.sort((a, b) => {
        const dateA = a.belongsToDate || a.createdAt?.toISOString() || '';
        const dateB = b.belongsToDate || b.createdAt?.toISOString() || '';

        if (dateA !== dateB) {
          return dateB.localeCompare(dateA); // 귀속일 내림차순
        }

        const createdA = a.createdAt?.getTime() || 0;
        const createdB = b.createdAt?.getTime() || 0;
        return createdB - createdA; // 생성일 내림차순
      });

      console.log('✅ 영수증 목록 조회 완료:', receipts.length);
      if (receipts.length > 0) {
        console.log('📄 첫 번째 영수증:', receipts[0]);
      }
      return receipts;
    } catch (error) {
      console.error('❌ getWeekReceipts 실패:', error);
      console.error('에러 상세:', error);
      throw error;
    }
  },

  /**
   * 정산 확정 (일요일 자정에 자동 실행 or 수동 실행)
   */
  async settleWeek(spaceId, weekId) {
    try {
      console.log('💰 주간 정산 확정:', { spaceId, weekId });

      // 1. 정산 계산 업데이트 (최신 전화번호 포함)
      console.log('🔄 정산 확정 전 최신 데이터 업데이트...');
      await this.updateSettlementCalculation(spaceId, weekId);

      // 2. 정산 상태 업데이트
      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      await updateDoc(settlementRef, {
        status: 'settled',
        settledAt: Timestamp.now(),
      });

      console.log('✅ 정산 확정 완료');

      // 3. 정산 결과 가져오기
      const settlementDoc = await getDoc(settlementRef);
      if (!settlementDoc.exists()) {
        console.warn('정산 문서를 찾을 수 없습니다.');
        return { success: true, notificationSent: false };
      }

      const settlementData = settlementDoc.data();
      console.log('📋 정산 데이터 확인:', {
        participantCount: Object.keys(settlementData.participants || {}).length,
        participants: Object.entries(settlementData.participants || {}).map(([userId, p]) => ({
          userId,
          name: p.name,
          phone: p.phone || '❌ 없음',
          balance: p.balance
        }))
      });

      let notificationResult = null;

      // 4. 알림톡 활성화 여부 확인 및 스페이스 정보 가져오기
      try {
        const alimtalkDocRef = doc(db, 'spaces', spaceId, 'settings', 'alimtalk');
        const alimtalkDoc = await getDoc(alimtalkDocRef);
        const alimtalkData = alimtalkDoc.exists() ? alimtalkDoc.data() : {};
        const alimtalkEnabled = alimtalkData.enabled === true;

        // 스페이스 정보 가져오기 (라운지명)
        const spaceDocRef = doc(db, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceDocRef);
        const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};

        // 매니저 전화번호 찾기 (MANAGER 권한 가진 사람)
        let managerPhone = null;
        try {
          const membersRef = collection(db, 'spaces', spaceId, 'assignedUsers');
          const membersSnap = await getDocs(membersRef);

          console.log('👥 assignedUsers 조회:', {
            spaceId,
            memberCount: membersSnap.size
          });

          let managerUserId = null;
          membersSnap.forEach((memberDoc) => {
            const memberData = memberDoc.data();
            console.log('👤 멤버 확인:', {
              userId: memberDoc.id,
              userType: memberData.userType,
              displayName: memberData.displayName
            });

            if (memberData.userType === 'manager') {
              managerUserId = memberDoc.id;
              console.log('✅ manager 발견:', managerUserId);
            }
          });

          if (managerUserId) {
            console.log('📞 users 문서 조회 시작:', managerUserId);
            const userDocRef = doc(db, 'users', managerUserId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const rawPhone = userData.phoneNumber;
              const normalizedPhone = normalizePhoneNumber(rawPhone);

              console.log('📋 users 문서 데이터:', {
                hasPhoneNumber: !!rawPhone,
                phoneNumber: rawPhone,
                정규화: normalizedPhone,
                allFields: Object.keys(userData)
              });
              managerPhone = normalizedPhone;
            } else {
              console.warn('❌ users 문서가 존재하지 않음:', managerUserId);
            }
          } else {
            console.warn('❌ MANAGER 권한을 가진 사용자를 찾을 수 없음');
          }

          console.log('👤 매니저 전화번호 최종:', managerPhone ? `✅ ${managerPhone}` : '❌ 없음');
        } catch (error) {
          console.error('⚠️ 매니저 전화번호 조회 실패:', error);
        }

        console.log('📋 알림 발송 준비:', {
          alimtalkEnabled,
          spaceName: spaceData.name,
          participantCount: Object.keys(settlementData.participants || {}).length,
          managerPhone: managerPhone ? '✅' : '❌'
        });

        // 5. 참여자들에게 정산 완료 알림 발송
        if (settlementData.participants && Object.keys(settlementData.participants).length > 0) {
          notificationResult = await notificationService.sendSettlementComplete(
            {
              spaceId,
              weekId,
              spaceName: spaceData.name,
              participants: settlementData.participants,
              managerPhone,
            },
            {
              alimtalkEnabled,
              spaceData
            }
          );

          console.log('📬 정산 완료 알림 발송 결과:', notificationResult);
        }
      } catch (notifyError) {
        // 알림 실패해도 정산 확정은 성공으로 처리
        console.error('⚠️ 정산 완료 알림 발송 실패 (정산은 완료됨):', notifyError);
        notificationResult = { success: false, error: notifyError.message };
      }

      // 6. 정산종결 상태 체크 (접수마감 직후)
      console.log('🔄 접수마감 후 정산종결 상태 체크...');
      try {
        await this.updateAllSettledStatus(spaceId, weekId);
      } catch (checkError) {
        console.error('⚠️ 정산종결 상태 체크 실패 (접수마감은 완료됨):', checkError);
      }

      return {
        success: true,
        notificationSent: notificationResult?.success || false,
        notificationResult
      };
    } catch (error) {
      console.error('❌ settleWeek 실패:', error);
      throw error;
    }
  },

  /**
   * 가장 최근의 active 상태인 정산 주차 찾기
   */
  async findLatestActiveSettlement(spaceId) {
    try {
      console.log('🔍 가장 최근 active 정산 주차 검색:', spaceId);

      const settlementsRef = collection(db, 'spaces', spaceId, 'settlement');
      const q = query(
        settlementsRef,
        where('status', '==', 'active'),
        orderBy('weekStart', 'desc')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('❌ active 정산 주차 없음');
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      console.log('✅ 최근 active 주차 발견:', doc.id);
      return {
        id: doc.id,
        weekId: doc.id,
        ...data,
        weekStart: data.weekStart?.toDate(),
        weekEnd: data.weekEnd?.toDate(),
        createdAt: data.createdAt?.toDate(),
        settledAt: data.settledAt?.toDate(),
      };
    } catch (error) {
      console.error('❌ findLatestActiveSettlement 실패:', error);
      return null;
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

  /**
   * 입금 확인 처리
   * 부매니저 이상이 특정 참여자의 입금을 확인했음을 표시
   */
  async confirmPayment(spaceId, weekId, userId) {
    try {
      console.log('💰 입금 확인 처리:', { spaceId, weekId, userId });

      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      const settlementSnap = await getDoc(settlementRef);

      if (!settlementSnap.exists()) {
        throw new Error('정산 정보를 찾을 수 없습니다.');
      }

      const settlementData = settlementSnap.data();

      if (!settlementData.participants || !settlementData.participants[userId]) {
        throw new Error('참여자를 찾을 수 없습니다.');
      }

      // 입금 확인 처리
      await updateDoc(settlementRef, {
        [`participants.${userId}.paymentConfirmed`]: true,
        [`participants.${userId}.paymentConfirmedAt`]: Timestamp.now(),
      });

      console.log('✅ 입금 확인 완료');

      // 정산종결 상태 업데이트
      await this.updateAllSettledStatus(spaceId, weekId);

      return true;
    } catch (error) {
      console.error('❌ confirmPayment 실패:', error);
      throw error;
    }
  },

  /**
   * 입금 확인 취소
   */
  async cancelPaymentConfirmation(spaceId, weekId, userId) {
    try {
      console.log('💰 입금 확인 취소:', { spaceId, weekId, userId });

      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      const settlementSnap = await getDoc(settlementRef);

      if (!settlementSnap.exists()) {
        throw new Error('정산 정보를 찾을 수 없습니다.');
      }

      const settlementData = settlementSnap.data();

      if (!settlementData.participants || !settlementData.participants[userId]) {
        throw new Error('참여자를 찾을 수 없습니다.');
      }

      // 입금 확인 취소
      await updateDoc(settlementRef, {
        [`participants.${userId}.paymentConfirmed`]: false,
        [`participants.${userId}.paymentConfirmedAt`]: null,
      });

      console.log('✅ 입금 확인 취소 완료');

      // 정산종결 상태 업데이트
      await this.updateAllSettledStatus(spaceId, weekId);

      return true;
    } catch (error) {
      console.error('❌ cancelPaymentConfirmation 실패:', error);
      throw error;
    }
  },

  /**
   * 송금 완료 처리
   * 부매니저 이상이 특정 참여자에게 송금을 완료했음을 표시
   */
  async confirmTransfer(spaceId, weekId, userId) {
    try {
      console.log('💸 송금 완료 처리:', { spaceId, weekId, userId });

      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      const settlementSnap = await getDoc(settlementRef);

      if (!settlementSnap.exists()) {
        throw new Error('정산 정보를 찾을 수 없습니다.');
      }

      const settlementData = settlementSnap.data();

      if (!settlementData.participants || !settlementData.participants[userId]) {
        throw new Error('참여자를 찾을 수 없습니다.');
      }

      // 송금 완료 처리
      await updateDoc(settlementRef, {
        [`participants.${userId}.transferCompleted`]: true,
        [`participants.${userId}.transferCompletedAt`]: Timestamp.now(),
      });

      console.log('✅ 송금 완료');

      // 정산종결 상태 업데이트
      await this.updateAllSettledStatus(spaceId, weekId);

      return true;
    } catch (error) {
      console.error('❌ confirmTransfer 실패:', error);
      throw error;
    }
  },

  /**
   * 송금 완료 취소
   */
  async cancelTransferConfirmation(spaceId, weekId, userId) {
    try {
      console.log('💸 송금 완료 취소:', { spaceId, weekId, userId });

      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      const settlementSnap = await getDoc(settlementRef);

      if (!settlementSnap.exists()) {
        throw new Error('정산 정보를 찾을 수 없습니다.');
      }

      const settlementData = settlementSnap.data();

      if (!settlementData.participants || !settlementData.participants[userId]) {
        throw new Error('참여자를 찾을 수 없습니다.');
      }

      // 송금 완료 취소
      await updateDoc(settlementRef, {
        [`participants.${userId}.transferCompleted`]: false,
        [`participants.${userId}.transferCompletedAt`]: null,
      });

      console.log('✅ 송금 완료 취소');

      // 정산종결 상태 업데이트
      await this.updateAllSettledStatus(spaceId, weekId);

      return true;
    } catch (error) {
      console.error('❌ cancelTransferConfirmation 실패:', error);
      throw error;
    }
  },

  /**
   * 모든 입금/송금 확인 여부 체크 및 정산종결 상태 업데이트
   */
  async updateAllSettledStatus(spaceId, weekId) {
    try {
      console.log('🔍 정산종결 상태 확인:', { spaceId, weekId });

      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekId);
      const settlementSnap = await getDoc(settlementRef);

      if (!settlementSnap.exists()) {
        throw new Error('정산 정보를 찾을 수 없습니다.');
      }

      const settlementData = settlementSnap.data();
      const participants = settlementData.participants || {};

      // 참여자가 없으면 종결 불가
      if (Object.keys(participants).length === 0) {
        console.log('⚠️ 참여자가 없음 - 종결 불가');
        await updateDoc(settlementRef, {
          allSettled: false,
          allSettledAt: null,
        });
        return false;
      }

      // 모든 참여자가 입금/송금 확인되었는지 체크
      let allConfirmed = true;
      const checkResults = [];

      for (const [userId, participant] of Object.entries(participants)) {
        const balance = participant.balance || 0;
        const participantName = participant.name || userId;

        // balance가 0이 아닌 경우만 확인 필요
        if (balance !== 0) {
          if (balance < 0) {
            // 낮 돈이 있으면 입금확인 필요
            const confirmed = participant.paymentConfirmed === true;
            checkResults.push({
              name: participantName,
              balance,
              type: '입금',
              confirmed,
            });
            if (!confirmed) {
              allConfirmed = false;
            }
          } else if (balance > 0) {
            // 받을 돈이 있으면 송금완료 필요
            const completed = participant.transferCompleted === true;
            checkResults.push({
              name: participantName,
              balance,
              type: '송금',
              confirmed: completed,
            });
            if (!completed) {
              allConfirmed = false;
            }
          }
        } else {
          checkResults.push({
            name: participantName,
            balance: 0,
            type: '없음',
            confirmed: true,
          });
        }
      }

      console.log('📊 정산 상태 체크 결과:', checkResults);
      console.log('✅ 정산종결 상태:', allConfirmed ? '모든 거래 완료' : '확인 대기중');

      // 정산종결 상태 업데이트
      const updateData = {
        allSettled: allConfirmed,
        allSettledAt: allConfirmed ? Timestamp.now() : null,
      };

      await updateDoc(settlementRef, updateData);

      return allConfirmed;
    } catch (error) {
      console.error('❌ updateAllSettledStatus 실패:', error);
      throw error;
    }
  },
};

// 유틸리티 함수 export
export { getWeekId, getWeekRange };

export default settlementService;