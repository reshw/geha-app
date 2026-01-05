import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Order ID 생성 (타임스탬프 기반)
 * 형식: YYYY-MM-DDTHHMM
 * 예: 2026-01-03T1430
 */
const generateOrderId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}${minutes}`;
};

const bartenderService = {
  // ============================================
  // 메뉴 관리
  // ============================================

  /**
   * 스페이스의 모든 메뉴 조회
   */
  async getMenus(spaceId) {
    try {
      console.log('🍸 메뉴 목록 조회:', spaceId);

      const menuRef = collection(db, 'spaces', spaceId, 'BartenderMenu');
      const q = query(menuRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const menus = [];
      snapshot.forEach((doc) => {
        menus.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      console.log('✅ 메뉴 목록 조회 완료:', menus.length);
      return menus;
    } catch (error) {
      console.error('❌ 메뉴 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 판매 가능한 메뉴만 조회
   */
  async getAvailableMenus(spaceId) {
    try {
      console.log('🍸 판매 가능한 메뉴 조회:', spaceId);

      const menuRef = collection(db, 'spaces', spaceId, 'BartenderMenu');
      const q = query(
        menuRef,
        where('available', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const menus = [];
      snapshot.forEach((doc) => {
        menus.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      console.log('✅ 판매 가능한 메뉴 조회 완료:', menus.length);
      return menus;
    } catch (error) {
      console.error('❌ 판매 가능한 메뉴 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 메뉴 조회
   */
  async getMenuById(spaceId, menuId) {
    try {
      console.log('🍸 메뉴 상세 조회:', { spaceId, menuId });

      const menuRef = doc(db, 'spaces', spaceId, 'BartenderMenu', menuId);
      const snapshot = await getDoc(menuRef);

      if (!snapshot.exists()) {
        throw new Error('메뉴를 찾을 수 없습니다.');
      }

      const data = {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        updatedAt: snapshot.data().updatedAt?.toDate(),
      };

      console.log('✅ 메뉴 상세 조회 완료');
      return data;
    } catch (error) {
      console.error('❌ 메뉴 상세 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 메뉴 생성
   * @param {string} spaceId - 스페이스 ID
   * @param {Object} menuData - 메뉴 데이터
   * @param {string} menuData.menuName - 메뉴명
   * @param {number} menuData.price - 가격
   * @param {string} menuData.category - 카테고리
   * @param {string} menuData.description - 설명 (선택)
   * @param {string} menuData.imageUrl - 이미지 URL (선택)
   * @param {string} menuData.createdBy - 생성자 ID
   * @param {string} menuData.createdByName - 생성자 이름
   */
  async createMenu(spaceId, menuData) {
    try {
      console.log('🍸 메뉴 생성:', { spaceId, menuData });

      const { menuName, price, category, description, imageUrl, createdBy, createdByName } = menuData;

      const now = new Date();
      const createdAt = Timestamp.fromDate(now);

      const menuRef = collection(db, 'spaces', spaceId, 'BartenderMenu');
      const newMenuData = {
        menuName: menuName,
        price: price,
        category: category,
        description: description || '',
        imageUrl: imageUrl || '',
        available: true,
        createdAt: createdAt,
        createdBy: createdBy,
        createdByName: createdByName,
        updatedAt: null,
        updatedBy: null,
        updatedByName: null,
      };

      const docRef = await addDoc(menuRef, newMenuData);

      console.log('✅ 메뉴 생성 완료:', docRef.id);
      return { id: docRef.id, ...newMenuData, createdAt: now };
    } catch (error) {
      console.error('❌ 메뉴 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 메뉴 수정
   */
  async updateMenu(spaceId, menuId, menuData) {
    try {
      console.log('🍸 메뉴 수정:', { spaceId, menuId, menuData });

      const { menuName, price, category, description, imageUrl, updatedBy, updatedByName } = menuData;

      const now = new Date();
      const updatedAt = Timestamp.fromDate(now);

      const menuRef = doc(db, 'spaces', spaceId, 'BartenderMenu', menuId);

      await updateDoc(menuRef, {
        menuName: menuName,
        price: price,
        category: category,
        description: description || '',
        imageUrl: imageUrl || '',
        updatedAt: updatedAt,
        updatedBy: updatedBy,
        updatedByName: updatedByName,
      });

      console.log('✅ 메뉴 수정 완료');
      return true;
    } catch (error) {
      console.error('❌ 메뉴 수정 실패:', error);
      throw error;
    }
  },

  /**
   * 메뉴 삭제
   */
  async deleteMenu(spaceId, menuId) {
    try {
      console.log('🍸 메뉴 삭제:', { spaceId, menuId });

      const menuRef = doc(db, 'spaces', spaceId, 'BartenderMenu', menuId);
      await deleteDoc(menuRef);

      console.log('✅ 메뉴 삭제 완료');
      return true;
    } catch (error) {
      console.error('❌ 메뉴 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 메뉴 판매 가능 여부 토글
   */
  async toggleMenuAvailability(spaceId, menuId) {
    try {
      console.log('🍸 메뉴 판매 가능 여부 토글:', { spaceId, menuId });

      const menuRef = doc(db, 'spaces', spaceId, 'BartenderMenu', menuId);
      const menuSnap = await getDoc(menuRef);

      if (!menuSnap.exists()) {
        throw new Error('메뉴를 찾을 수 없습니다.');
      }

      const currentAvailability = menuSnap.data().available;
      await updateDoc(menuRef, {
        available: !currentAvailability,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      console.log('✅ 메뉴 판매 가능 여부 토글 완료:', !currentAvailability);
      return !currentAvailability;
    } catch (error) {
      console.error('❌ 메뉴 판매 가능 여부 토글 실패:', error);
      throw error;
    }
  },

  // ============================================
  // 주문 관리
  // ============================================

  /**
   * 스페이스의 모든 주문 조회
   */
  async getOrders(spaceId) {
    try {
      console.log('🍸 주문 목록 조회:', spaceId);

      const orderRef = collection(db, 'spaces', spaceId, 'BartenderOrder');
      const q = query(orderRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        });
      });

      console.log('✅ 주문 목록 조회 완료:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ 주문 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 주문 상세 조회
   */
  async getOrderById(spaceId, orderId) {
    try {
      console.log('🍸 주문 상세 조회:', { spaceId, orderId });

      const orderRef = doc(db, 'spaces', spaceId, 'BartenderOrder', orderId);
      const snapshot = await getDoc(orderRef);

      if (!snapshot.exists()) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      const data = {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
      };

      console.log('✅ 주문 상세 조회 완료');
      return data;
    } catch (error) {
      console.error('❌ 주문 상세 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 주문 생성
   * @param {string} spaceId - 스페이스 ID
   * @param {Object} orderData - 주문 데이터
   * @param {string} orderData.userId - 주문자 ID
   * @param {string} orderData.userName - 주문자 이름
   * @param {Array} orderData.items - 주문 항목 배열
   * @param {string} orderData.items[].menuId - 메뉴 ID
   * @param {string} orderData.items[].menuName - 메뉴명
   * @param {number} orderData.items[].price - 단가
   * @param {number} orderData.items[].quantity - 수량
   * @param {string} orderData.memo - 메모 (선택)
   */
  async createOrder(spaceId, orderData) {
    try {
      console.log('🍸 주문 생성:', { spaceId, orderData });

      const { userId, userName, items, memo } = orderData;

      // ID 생성 (현재 시각 기준)
      const now = new Date();
      const orderId = generateOrderId(now);
      const createdAt = Timestamp.fromDate(now);

      // 총액 계산
      const totalAmount = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // 주문 문서 생성
      const orderRef = doc(db, 'spaces', spaceId, 'BartenderOrder', orderId);
      const newOrderData = {
        userId: userId,
        userName: userName,
        createdAt: createdAt,
        memo: memo || '',
        items: items.map(item => ({
          menuId: item.menuId,
          menuName: item.menuName,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        totalAmount: totalAmount,
        status: 'completed',
      };

      await setDoc(orderRef, newOrderData);

      console.log('✅ 주문 생성 완료:', orderId);

      // 이메일 알림 발송
      try {
        console.log('📧 바텐더 주문 이메일 발송 시작...');

        // 스페이스 정보 가져오기
        const spaceDocRef = doc(db, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceDocRef);
        const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};

        // 이메일 알림 설정 가져오기
        const emailSettingsRef = doc(db, `spaces/${spaceId}/settings`, 'email');
        const emailSettingsDoc = await getDoc(emailSettingsRef);
        const emailSettings = emailSettingsDoc.exists() ? emailSettingsDoc.data() : null;

        console.log('이메일 알림 설정:', emailSettings);

        if (emailSettings?.bartender_order?.enabled && emailSettings.bartender_order.recipients.length > 0) {
          console.log('📧 바텐더 주문 이메일 발송 시작');

          const emailResponse = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'bartender_order',
              userName: userName,
              orderedAt: now,
              totalAmount: totalAmount,
              items: newOrderData.items,
              memo: memo,
              spaceName: spaceData.name || '라운지',
              recipients: {
                to: emailSettings.bartender_order.recipients[0],
                cc: emailSettings.bartender_order.recipients.slice(1)
              }
            })
          });

          const emailResult = await emailResponse.json();
          console.log('✅ 바텐더 주문 이메일 발송 결과:', emailResult);
        } else {
          console.log('ℹ️ 바텐더 주문 이메일 알림이 비활성화되어 있거나 수신자 없음');
        }
      } catch (emailError) {
        console.error('⚠️ 바텐더 주문 이메일 발송 실패 (주문은 완료됨):', emailError);
      }

      return { id: orderId, ...newOrderData, createdAt: now };
    } catch (error) {
      console.error('❌ 주문 생성 실패:', error);
      throw error;
    }
  },
};

export default bartenderService;
