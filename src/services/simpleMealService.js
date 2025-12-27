import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 간단한 식사 참여 서비스
 * spaces/{spaceId}/dailyMeals/{date}
 */
class SimpleMealService {
  /**
   * 특정 날짜의 식사 참여자 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
   * @returns {object} { lunch: [userId...], dinner: [userId...] }
   */
  async getMealParticipants(spaceId, dateStr) {
    try {
      const docRef = doc(db, 'spaces', spaceId, 'dailyMeals', dateStr);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          lunch: data.lunch || [],
          dinner: data.dinner || []
        };
      }

      return { lunch: [], dinner: [] };
    } catch (error) {
      console.error('❌ 식사 참여자 조회 실패:', error);
      return { lunch: [], dinner: [] };
    }
  }

  /**
   * 점심 참여 토글
   * @param {string} spaceId - 스페이스 ID
   * @param {string} dateStr - 날짜 문자열
   * @param {string} userId - 사용자 ID
   */
  async toggleLunch(spaceId, dateStr, userId) {
    try {
      const docRef = doc(db, 'spaces', spaceId, 'dailyMeals', dateStr);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // 문서가 없으면 생성하고 추가
        await setDoc(docRef, {
          lunch: [userId],
          dinner: [],
          updatedAt: Timestamp.now()
        });
        console.log('✅ 점심 참여 (새 문서 생성):', userId);
        return;
      }

      const data = docSnap.data();
      const lunchParticipants = data.lunch || [];

      if (lunchParticipants.includes(userId)) {
        // 이미 참여 중이면 제거
        await updateDoc(docRef, {
          lunch: arrayRemove(userId),
          updatedAt: Timestamp.now()
        });
        console.log('✅ 점심 참여 취소:', userId);
      } else {
        // 참여 추가
        await updateDoc(docRef, {
          lunch: arrayUnion(userId),
          updatedAt: Timestamp.now()
        });
        console.log('✅ 점심 참여:', userId);
      }
    } catch (error) {
      console.error('❌ 점심 참여 토글 실패:', error);
      throw error;
    }
  }

  /**
   * 저녁 참여 토글
   * @param {string} spaceId - 스페이스 ID
   * @param {string} dateStr - 날짜 문자열
   * @param {string} userId - 사용자 ID
   */
  async toggleDinner(spaceId, dateStr, userId) {
    try {
      const docRef = doc(db, 'spaces', spaceId, 'dailyMeals', dateStr);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // 문서가 없으면 생성하고 추가
        await setDoc(docRef, {
          lunch: [],
          dinner: [userId],
          updatedAt: Timestamp.now()
        });
        console.log('✅ 저녁 참여 (새 문서 생성):', userId);
        return;
      }

      const data = docSnap.data();
      const dinnerParticipants = data.dinner || [];

      if (dinnerParticipants.includes(userId)) {
        // 이미 참여 중이면 제거
        await updateDoc(docRef, {
          dinner: arrayRemove(userId),
          updatedAt: Timestamp.now()
        });
        console.log('✅ 저녁 참여 취소:', userId);
      } else {
        // 참여 추가
        await updateDoc(docRef, {
          dinner: arrayUnion(userId),
          updatedAt: Timestamp.now()
        });
        console.log('✅ 저녁 참여:', userId);
      }
    } catch (error) {
      console.error('❌ 저녁 참여 토글 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 날짜의 식사 참여자 일괄 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string[]} dateStrings - 날짜 문자열 배열
   * @returns {object} { "2024-01-01": { lunch: [], dinner: [] }, ... }
   */
  async getMealsByDateRange(spaceId, dateStrings) {
    try {
      const results = {};

      // 각 날짜별로 조회
      await Promise.all(
        dateStrings.map(async (dateStr) => {
          const participants = await this.getMealParticipants(spaceId, dateStr);
          results[dateStr] = participants;
        })
      );

      return results;
    } catch (error) {
      console.error('❌ 식사 범위 조회 실패:', error);
      return {};
    }
  }
}

export default new SimpleMealService();
