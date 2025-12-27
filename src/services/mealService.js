import { doc, setDoc, getDoc, getDocs, collection, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDate } from '../utils/dateUtils';

/**
 * 식사 정보 관리 서비스 (예약과 독립적)
 * spaces/{spaceId}/meals/{userId}_{date}
 */
class MealService {
  /**
   * 식사 상태 업데이트 또는 생성
   * @param {string} spaceId - 스페이스 ID
   * @param {string} userId - 사용자 ID
   * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
   * @param {object} mealData - { lunch: boolean, dinner: boolean }
   * @param {string} userName - 사용자 이름 (선택)
   */
  async updateMealStatus(spaceId, userId, dateStr, mealData, userName = '') {
    if (!spaceId || !userId || !dateStr) {
      throw new Error('spaceId, userId, dateStr이 필요합니다');
    }

    const mealId = `${userId}_${dateStr}`;
    const mealRef = doc(db, 'spaces', spaceId, 'meals', mealId);

    try {
      // 기존 데이터 확인
      const mealDoc = await getDoc(mealRef);
      const existingData = mealDoc.exists() ? mealDoc.data() : {};

      const dataToSave = {
        userId,
        date: dateStr,
        lunch: mealData.lunch ?? false,
        dinner: mealData.dinner ?? false,
        userName: userName || existingData.userName || '',
        updatedAt: Timestamp.now(),
        ...(!mealDoc.exists() && { createdAt: Timestamp.now() })
      };

      await setDoc(mealRef, dataToSave, { merge: true });

      console.log('✅ 식사 정보 저장 성공:', mealId);
      return dataToSave;
    } catch (error) {
      console.error('❌ 식사 정보 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 날짜의 모든 식사 정보 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
   */
  async getMealsByDate(spaceId, dateStr) {
    try {
      const mealsRef = collection(db, 'spaces', spaceId, 'meals');
      const q = query(mealsRef, where('date', '==', dateStr));
      const snapshot = await getDocs(q);

      const meals = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        meals[data.userId] = {
          lunch: data.lunch,
          dinner: data.dinner,
          userName: data.userName,
          updatedAt: data.updatedAt
        };
      });

      return meals;
    } catch (error) {
      console.error('❌ 식사 정보 조회 실패:', error);
      return {};
    }
  }

  /**
   * 특정 사용자의 특정 날짜 식사 정보 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string} userId - 사용자 ID
   * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
   */
  async getMealByUserAndDate(spaceId, userId, dateStr) {
    try {
      const mealId = `${userId}_${dateStr}`;
      const mealRef = doc(db, 'spaces', spaceId, 'meals', mealId);
      const mealDoc = await getDoc(mealRef);

      if (mealDoc.exists()) {
        return mealDoc.data();
      }
      return null;
    } catch (error) {
      console.error('❌ 식사 정보 조회 실패:', error);
      return null;
    }
  }

  /**
   * 여러 날짜의 식사 정보 일괄 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string[]} dateStrings - 날짜 문자열 배열
   */
  async getMealsByDateRange(spaceId, dateStrings) {
    try {
      if (!dateStrings || dateStrings.length === 0) return {};

      const mealsRef = collection(db, 'spaces', spaceId, 'meals');
      const q = query(mealsRef, where('date', 'in', dateStrings.slice(0, 10))); // Firestore 'in' 제한 10개
      const snapshot = await getDocs(q);

      const mealsByDate = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!mealsByDate[data.date]) {
          mealsByDate[data.date] = {};
        }
        mealsByDate[data.date][data.userId] = {
          lunch: data.lunch,
          dinner: data.dinner,
          userName: data.userName,
          updatedAt: data.updatedAt
        };
      });

      return mealsByDate;
    } catch (error) {
      console.error('❌ 식사 정보 범위 조회 실패:', error);
      return {};
    }
  }
}

export default new MealService();
