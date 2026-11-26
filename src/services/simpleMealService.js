import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 밥X(나가서 먹어요) 서비스
 * spaces/{spaceId}/dailyMeals/{date}
 *
 * - lunchOut / dinnerOut: 그날 점심/저녁을 밖에서 먹는 사람(userId 배열)
 * - 예전 "식사 참여" 기록(lunch / dinner 필드)은 의미가 반대라 읽지 않는다.
 * - 화면에는 { lunch, dinner } 형태로 돌려준다.
 */
const FIELDS = { lunch: 'lunchOut', dinner: 'dinnerOut' };

class SimpleMealService {
  /**
   * 특정 날짜의 밖에서 먹는 사람 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
   * @returns {object} { lunch: [userId...], dinner: [userId...] }
   */
  async getMealParticipants(spaceId, dateStr) {
    try {
      const docSnap = await getDoc(doc(db, 'spaces', spaceId, 'dailyMeals', dateStr));
      const data = docSnap.exists() ? docSnap.data() : {};
      return {
        lunch: data[FIELDS.lunch] || [],
        dinner: data[FIELDS.dinner] || []
      };
    } catch (error) {
      console.error('❌ 밥X 조회 실패:', error);
      return { lunch: [], dinner: [] };
    }
  }

  /**
   * 점심/저녁 "나가서 먹어요" 토글
   * @param {'lunch'|'dinner'} mealType
   */
  async toggleMealOut(spaceId, dateStr, userId, mealType) {
    const field = FIELDS[mealType];
    if (!field) throw new Error(`알 수 없는 식사 구분: ${mealType}`);

    try {
      const docRef = doc(db, 'spaces', spaceId, 'dailyMeals', dateStr);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, { [field]: [userId], updatedAt: Timestamp.now() });
        return;
      }

      const current = docSnap.data()[field] || [];
      await updateDoc(docRef, {
        [field]: current.includes(userId) ? arrayRemove(userId) : arrayUnion(userId),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ 밥X 토글 실패:', error);
      throw error;
    }
  }

  toggleLunch(spaceId, dateStr, userId) {
    return this.toggleMealOut(spaceId, dateStr, userId, 'lunch');
  }

  toggleDinner(spaceId, dateStr, userId) {
    return this.toggleMealOut(spaceId, dateStr, userId, 'dinner');
  }

  /**
   * 여러 날짜 일괄 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string[]} dateStrings - 날짜 문자열 배열
   * @returns {object} { "2024-01-01": { lunch: [], dinner: [] }, ... }
   */
  async getMealsByDateRange(spaceId, dateStrings) {
    const results = {};
    await Promise.all(
      dateStrings.map(async (dateStr) => {
        results[dateStr] = await this.getMealParticipants(spaceId, dateStr);
      })
    );
    return results;
  }
}

export default new SimpleMealService();
