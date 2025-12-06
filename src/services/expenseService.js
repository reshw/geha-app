import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  query, 
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Expense ID 생성
 * 형식: YYYY-MM-DDTHHMM_XXXX
 * 예: 2025-01-20T0549_0001
 */
const generateExpenseId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // 랜덤 4자리
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  
  return `${year}-${month}-${day}T${hours}${minutes}_${random}`;
};

/**
 * Group ID 생성 (같은 청구 묶음용)
 * 형식: YYYY-MM-DDTHHMM
 * 예: 2025-01-20T0549
 */
const generateGroupId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}${minutes}`;
};

const expenseService = {
  /**
   * 스페이스의 모든 운영비 내역 조회
   */
  async getExpenses(spaceId) {
    try {
      console.log('💰 운영비 내역 조회:', spaceId);
      
      const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
      const q = query(expenseRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const expenses = [];
      snapshot.forEach((doc) => {
        expenses.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          usedAt: doc.data().usedAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate(),
          rejectedAt: doc.data().rejectedAt?.toDate(),
        });
      });
      
      console.log('✅ 운영비 내역 조회 완료:', expenses.length);
      return expenses;
    } catch (error) {
      console.error('❌ 운영비 내역 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 groupId의 항목들 조회
   */
  async getExpensesByGroup(spaceId, groupId) {
    try {
      console.log('📦 그룹 항목 조회:', { spaceId, groupId });
      
      const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
      const q = query(
        expenseRef, 
        where('groupId', '==', groupId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const items = [];
      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          usedAt: doc.data().usedAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate(),
          rejectedAt: doc.data().rejectedAt?.toDate(),
        });
      });
      
      console.log('✅ 그룹 항목 조회 완료:', items.length);
      return items;
    } catch (error) {
      console.error('❌ 그룹 항목 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 운영비 청구 생성 (여러 항목을 한번에)
   * @param {string} spaceId - 스페이스 ID
   * @param {Object} requestData - 청구 데이터
   * @param {string} requestData.userId - 청구자 ID
   * @param {string} requestData.userName - 청구자 이름
   * @param {Date} requestData.usedAt - 사용일자
   * @param {string} requestData.memo - 청구 사유/메모
   * @param {Array} requestData.items - 항목 배열
   * @param {string} requestData.items[].itemName - 품목명
   * @param {number} requestData.items[].itemPrice - 단가
   * @param {number} requestData.items[].itemQty - 수량
   * @param {string} requestData.items[].itemSpec - 규격
   * @param {string} requestData.items[].imageUrl - 증빙 이미지 URL
   */
  async createExpense(spaceId, requestData) {
    try {
      console.log('💰 운영비 청구 생성:', { spaceId, requestData });
      
      const { userId, userName, usedAt, memo, items } = requestData;
      
      // groupId 생성 (현재 시각 기준)
      const now = new Date();
      const groupId = generateGroupId(now);
      const createdAt = Timestamp.fromDate(now);
      const usedAtTimestamp = Timestamp.fromDate(usedAt);
      
      const batch = writeBatch(db);
      const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
      
      // 각 항목을 개별 문서로 생성
      const createdIds = [];
      for (const item of items) {
        const expenseId = generateExpenseId(now);
        const docRef = doc(expenseRef, expenseId);
        
        const expenseData = {
          UserId: userId,
          userName: userName,
          itemName: item.itemName,
          itemPrice: item.itemPrice,
          itemQty: item.itemQty,
          itemSpec: item.itemSpec || '',
          total: item.itemPrice * item.itemQty,
          imageUrl: item.imageUrl || '',
          groupId: groupId,
          createdAt: createdAt,
          usedAt: usedAtTimestamp,
          approved: false,  // 초기 상태: 대기중
          status: 'pending',
          memo: memo || '',
        };
        
        batch.set(docRef, expenseData);
        createdIds.push(expenseId);
        
        // 같은 시간에 여러 항목 생성 시 ID 충돌 방지
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      await batch.commit();
      
      console.log('✅ 운영비 청구 생성 완료:', { groupId, items: createdIds.length });
      return { groupId, items: createdIds };
    } catch (error) {
      console.error('❌ 운영비 청구 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 운영비 승인
   */
  async approveExpense(spaceId, expenseId, approverData) {
    try {
      console.log('✅ 운영비 승인:', { spaceId, expenseId, approverData });
      
      const expenseRef = doc(db, 'spaces', spaceId, 'Expense', expenseId);
      
      await updateDoc(expenseRef, {
        approved: true,
        status: 'approved',
        approvedAt: Timestamp.fromDate(new Date()),
        approvedBy: approverData.approverId,
        approvedByName: approverData.approverName,
      });
      
      console.log('✅ 운영비 승인 완료');
      return true;
    } catch (error) {
      console.error('❌ 운영비 승인 실패:', error);
      throw error;
    }
  },

  /**
   * 운영비 거부
   */
  async rejectExpense(spaceId, expenseId, rejecterData, reason) {
    try {
      console.log('❌ 운영비 거부:', { spaceId, expenseId, reason });
      
      const expenseRef = doc(db, 'spaces', spaceId, 'Expense', expenseId);
      
      await updateDoc(expenseRef, {
        approved: false,
        status: 'rejected',
        rejectedAt: Timestamp.fromDate(new Date()),
        rejectedBy: rejecterData.rejecterId,
        rejectedByName: rejecterData.rejecterName,
        rejectionReason: reason || '사유 없음',
      });
      
      console.log('✅ 운영비 거부 완료');
      return true;
    } catch (error) {
      console.error('❌ 운영비 거부 실패:', error);
      throw error;
    }
  },

  /**
   * 그룹 전체 승인 (같은 groupId의 모든 항목)
   */
  async approveGroup(spaceId, groupId, approverData) {
    try {
      console.log('✅ 그룹 전체 승인:', { spaceId, groupId });
      
      const items = await this.getExpensesByGroup(spaceId, groupId);
      const batch = writeBatch(db);
      
      const now = Timestamp.fromDate(new Date());
      
      items.forEach(item => {
        const expenseRef = doc(db, 'spaces', spaceId, 'Expense', item.id);
        batch.update(expenseRef, {
          approved: true,
          status: 'approved',
          approvedAt: now,
          approvedBy: approverData.approverId,
          approvedByName: approverData.approverName,
        });
      });
      
      await batch.commit();
      
      console.log('✅ 그룹 전체 승인 완료:', items.length);
      return true;
    } catch (error) {
      console.error('❌ 그룹 전체 승인 실패:', error);
      throw error;
    }
  },

  /**
   * 그룹 전체 거부
   */
  async rejectGroup(spaceId, groupId, rejecterData, reason) {
    try {
      console.log('❌ 그룹 전체 거부:', { spaceId, groupId });
      
      const items = await this.getExpensesByGroup(spaceId, groupId);
      const batch = writeBatch(db);
      
      const now = Timestamp.fromDate(new Date());
      
      items.forEach(item => {
        const expenseRef = doc(db, 'spaces', spaceId, 'Expense', item.id);
        batch.update(expenseRef, {
          approved: false,
          status: 'rejected',
          rejectedAt: now,
          rejectedBy: rejecterData.rejecterId,
          rejectedByName: rejecterData.rejecterName,
          rejectionReason: reason || '사유 없음',
        });
      });
      
      await batch.commit();
      
      console.log('✅ 그룹 전체 거부 완료:', items.length);
      return true;
    } catch (error) {
      console.error('❌ 그룹 전체 거부 실패:', error);
      throw error;
    }
  },

  /**
   * 대기중인 청구 그룹 목록 조회
   */
  async getPendingGroups(spaceId) {
    try {
      console.log('⏳ 대기중인 청구 조회:', spaceId);
      
      const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
      const q = query(
        expenseRef,
        where('approved', '==', false),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const groupMap = new Map();
      
      snapshot.forEach((doc) => {
        const data = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          usedAt: doc.data().usedAt?.toDate(),
        };
        
        const groupId = data.groupId;
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            groupId,
            items: [],
            totalAmount: 0,
            userName: data.userName,
            UserId: data.UserId,
            createdAt: data.createdAt,
            usedAt: data.usedAt,
            memo: data.memo,
          });
        }
        
        const group = groupMap.get(groupId);
        group.items.push(data);
        group.totalAmount += data.total;
      });
      
      const groups = Array.from(groupMap.values());
      console.log('✅ 대기중인 청구 조회 완료:', groups.length);
      
      return groups;
    } catch (error) {
      console.error('❌ 대기중인 청구 조회 실패:', error);
      throw error;
    }
  },
};

export default expenseService;