import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Expense ID 생성 (타임스탬프 기반)
 * 형식: YYYY-MM-DDTHHMM
 * 예: 2025-01-20T0549
 */
const generateExpenseId = (date = new Date()) => {
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
   * 특정 운영비 상세 조회
   */
  async getExpense(spaceId, expenseId) {
    try {
      console.log('💰 운영비 상세 조회:', { spaceId, expenseId });
      
      const expenseRef = doc(db, 'spaces', spaceId, 'Expense', expenseId);
      const snapshot = await getDoc(expenseRef);
      
      if (!snapshot.exists()) {
        throw new Error('운영비 내역을 찾을 수 없습니다.');
      }
      
      const data = {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        usedAt: snapshot.data().usedAt?.toDate(),
        approvedAt: snapshot.data().approvedAt?.toDate(),
        rejectedAt: snapshot.data().rejectedAt?.toDate(),
      };
      
      console.log('✅ 운영비 상세 조회 완료');
      return data;
    } catch (error) {
      console.error('❌ 운영비 상세 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 운영비 청구 생성
   * @param {string} spaceId - 스페이스 ID
   * @param {Object} requestData - 청구 데이터
   * @param {string} requestData.userId - 청구자 ID
   * @param {string} requestData.userName - 청구자 이름
   * @param {Date} requestData.usedAt - 사용일자
   * @param {string} requestData.memo - 청구 사유/메모
   * @param {string} requestData.imageUrl - 증빙 이미지 URL
   * @param {Array} requestData.items - 항목 배열
   * @param {string} requestData.items[].itemName - 품목명
   * @param {number} requestData.items[].itemPrice - 단가
   * @param {number} requestData.items[].itemQty - 수량
   * @param {string} requestData.items[].itemSpec - 규격
   */
  async createExpense(spaceId, requestData) {
    try {
      console.log('💰 운영비 청구 생성:', { spaceId, requestData });
      
      const { userId, userName, usedAt, memo, items, imageUrl } = requestData;
      
      // ID 생성 (현재 시각 기준)
      const now = new Date();
      const expenseId = generateExpenseId(now);
      const createdAt = Timestamp.fromDate(now);
      const usedAtTimestamp = Timestamp.fromDate(usedAt);
      
      // 총액 계산
      const totalAmount = items.reduce((sum, item) => {
        return sum + (item.itemPrice * item.itemQty);
      }, 0);
      
      // 단일 문서로 생성
      const expenseRef = doc(db, 'spaces', spaceId, 'Expense', expenseId);
      const expenseData = {
        userId: userId,
        userName: userName,
        usedAt: usedAtTimestamp,
        createdAt: createdAt,
        memo: memo || '',
        imageUrl: imageUrl || '',
        items: items.map(item => ({
          itemName: item.itemName,
          itemPrice: item.itemPrice,
          itemQty: item.itemQty,
          itemSpec: item.itemSpec || '',
          total: item.itemPrice * item.itemQty,
        })),
        totalAmount: totalAmount,
        approved: false,
        status: 'pending',
        approvedAt: null,
        approvedBy: null,
        approvedByName: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectedByName: null,
        rejectionReason: null,
      };
      
      await setDoc(expenseRef, expenseData);

      console.log('✅ 운영비 청구 생성 완료:', expenseId);

      // 🔥 이메일 알림 발송
      try {
        console.log('📧 운영비 청구 이메일 발송 시작...');

        // 스페이스 정보 가져오기
        const spaceDocRef = doc(db, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceDocRef);
        const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};

        // 이메일 알림 설정 가져오기
        const emailSettingsRef = doc(db, `spaces/${spaceId}/settings`, 'email');
        const emailSettingsDoc = await getDoc(emailSettingsRef);
        const emailSettings = emailSettingsDoc.exists() ? emailSettingsDoc.data() : null;

        console.log('이메일 알림 설정:', emailSettings);

        if (emailSettings?.expense?.enabled && emailSettings.expense.recipients.length > 0) {
          console.log('📧 운영비 청구 이메일 발송 시작');

          const emailResponse = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'expense',
              userName: userName,
              usedAt: usedAt,
              createdAt: now,
              totalAmount: totalAmount,
              items: expenseData.items,
              memo: memo,
              imageUrl: imageUrl,
              spaceName: spaceData.name || '라운지',
              recipients: {
                to: emailSettings.expense.recipients[0],
                cc: emailSettings.expense.recipients.slice(1)
              }
            })
          });

          const emailResult = await emailResponse.json();
          console.log('✅ 운영비 청구 이메일 발송 결과:', emailResult);
        } else {
          console.log('ℹ️ 운영비 청구 이메일 알림이 비활성화되어 있거나 수신자 없음');
        }
      } catch (emailError) {
        console.error('⚠️ 운영비 청구 이메일 발송 실패 (청구 등록은 완료됨):', emailError);
      }

      return { id: expenseId, ...expenseData };
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
   * 대기중인 청구 목록 조회
   */
  async getPendingExpenses(spaceId) {
    try {
      console.log('⏳ 대기중인 청구 조회:', spaceId);
      
      const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
      const q = query(
        expenseRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const expenses = [];
      snapshot.forEach((doc) => {
        expenses.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          usedAt: doc.data().usedAt?.toDate(),
        });
      });
      
      console.log('✅ 대기중인 청구 조회 완료:', expenses.length);
      return expenses;
    } catch (error) {
      console.error('❌ 대기중인 청구 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 승인된 청구 목록 조회
   */
  async getApprovedExpenses(spaceId) {
    try {
      console.log('✅ 승인된 청구 조회:', spaceId);
      
      const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
      const q = query(
        expenseRef,
        where('status', '==', 'approved'),
        orderBy('approvedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const expenses = [];
      snapshot.forEach((doc) => {
        expenses.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          usedAt: doc.data().usedAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate(),
        });
      });
      
      console.log('✅ 승인된 청구 조회 완료:', expenses.length);
      return expenses;
    } catch (error) {
      console.error('❌ 승인된 청구 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 거부된 청구 목록 조회
   */
  async getRejectedExpenses(spaceId) {
    try {
      console.log('❌ 거부된 청구 조회:', spaceId);
      
      const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
      const q = query(
        expenseRef,
        where('status', '==', 'rejected'),
        orderBy('rejectedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const expenses = [];
      snapshot.forEach((doc) => {
        expenses.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          usedAt: doc.data().usedAt?.toDate(),
          rejectedAt: doc.data().rejectedAt?.toDate(),
        });
      });
      
      console.log('✅ 거부된 청구 조회 완료:', expenses.length);
      return expenses;
    } catch (error) {
      console.error('❌ 거부된 청구 조회 실패:', error);
      throw error;
    }
  },
};

export default expenseService;