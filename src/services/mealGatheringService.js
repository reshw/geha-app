import { doc, setDoc, getDoc, getDocs, collection, query, where, Timestamp, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDate } from '../utils/dateUtils';

/**
 * 식사 모임 관리 서비스
 * spaces/{spaceId}/mealGatherings/{gatheringId}
 */
class MealGatheringService {
  /**
   * 모임 생성
   * @param {string} spaceId - 스페이스 ID
   * @param {object} gatheringData - 모임 데이터
   */
  async createGathering(spaceId, gatheringData) {
    if (!spaceId) {
      throw new Error('spaceId가 필요합니다');
    }

    try {
      const gatheringsRef = collection(db, 'spaces', spaceId, 'mealGatherings');

      // 문서 ID 생성: date_mealType_timestamp
      const timestamp = Date.now();
      const docId = `${gatheringData.date}_${gatheringData.mealType}_${timestamp}`;

      const dataToSave = {
        date: gatheringData.date,
        mealType: gatheringData.mealType, // "lunch" | "dinner"
        title: gatheringData.title || '식사 모임',
        hostId: gatheringData.hostId,
        hostName: gatheringData.hostName,
        departureTime: gatheringData.departureTime || '',
        location: gatheringData.location || '',
        participants: gatheringData.participants || [gatheringData.hostId], // 주최자 자동 참여
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(doc(gatheringsRef, docId), dataToSave);

      console.log('✅ 모임 생성 성공:', docId);
      return { id: docId, ...dataToSave };
    } catch (error) {
      console.error('❌ 모임 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 날짜의 모든 모임 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
   */
  async getGatheringsByDate(spaceId, dateStr) {
    try {
      const gatheringsRef = collection(db, 'spaces', spaceId, 'mealGatherings');
      const q = query(gatheringsRef, where('date', '==', dateStr));
      const snapshot = await getDocs(q);

      const gatherings = {
        lunch: [],
        dinner: []
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        const gathering = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };

        if (data.mealType === 'lunch') {
          gatherings.lunch.push(gathering);
        } else if (data.mealType === 'dinner') {
          gatherings.dinner.push(gathering);
        }
      });

      return gatherings;
    } catch (error) {
      console.error('❌ 모임 조회 실패:', error);
      return { lunch: [], dinner: [] };
    }
  }

  /**
   * 여러 날짜의 모임 일괄 조회
   * @param {string} spaceId - 스페이스 ID
   * @param {string[]} dateStrings - 날짜 문자열 배열
   */
  async getGatheringsByDateRange(spaceId, dateStrings) {
    try {
      if (!dateStrings || dateStrings.length === 0) return {};

      const gatheringsRef = collection(db, 'spaces', spaceId, 'mealGatherings');

      // Firestore 'in' 쿼리는 최대 10개까지만 가능
      const chunks = [];
      for (let i = 0; i < dateStrings.length; i += 10) {
        chunks.push(dateStrings.slice(i, i + 10));
      }

      const allGatherings = {};

      for (const chunk of chunks) {
        const q = query(gatheringsRef, where('date', 'in', chunk));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
          const data = doc.data();
          const dateStr = data.date;

          if (!allGatherings[dateStr]) {
            allGatherings[dateStr] = { lunch: [], dinner: [] };
          }

          const gathering = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
          };

          if (data.mealType === 'lunch') {
            allGatherings[dateStr].lunch.push(gathering);
          } else if (data.mealType === 'dinner') {
            allGatherings[dateStr].dinner.push(gathering);
          }
        });
      }

      return allGatherings;
    } catch (error) {
      console.error('❌ 모임 범위 조회 실패:', error);
      return {};
    }
  }

  /**
   * 모임 참여
   * @param {string} spaceId - 스페이스 ID
   * @param {string} gatheringId - 모임 ID
   * @param {string} userId - 사용자 ID
   */
  async joinGathering(spaceId, gatheringId, userId) {
    try {
      const gatheringRef = doc(db, 'spaces', spaceId, 'mealGatherings', gatheringId);

      await updateDoc(gatheringRef, {
        participants: arrayUnion(userId),
        updatedAt: Timestamp.now()
      });

      console.log('✅ 모임 참여 성공:', gatheringId, userId);
    } catch (error) {
      console.error('❌ 모임 참여 실패:', error);
      throw error;
    }
  }

  /**
   * 모임 참여 취소
   * @param {string} spaceId - 스페이스 ID
   * @param {string} gatheringId - 모임 ID
   * @param {string} userId - 사용자 ID
   */
  async leaveGathering(spaceId, gatheringId, userId) {
    try {
      const gatheringRef = doc(db, 'spaces', spaceId, 'mealGatherings', gatheringId);

      await updateDoc(gatheringRef, {
        participants: arrayRemove(userId),
        updatedAt: Timestamp.now()
      });

      console.log('✅ 모임 참여 취소 성공:', gatheringId, userId);
    } catch (error) {
      console.error('❌ 모임 참여 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 모임 삭제
   * @param {string} spaceId - 스페이스 ID
   * @param {string} gatheringId - 모임 ID
   */
  async deleteGathering(spaceId, gatheringId) {
    try {
      const gatheringRef = doc(db, 'spaces', spaceId, 'mealGatherings', gatheringId);
      await deleteDoc(gatheringRef);

      console.log('✅ 모임 삭제 성공:', gatheringId);
    } catch (error) {
      console.error('❌ 모임 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 모임 수정
   * @param {string} spaceId - 스페이스 ID
   * @param {string} gatheringId - 모임 ID
   * @param {object} updates - 수정할 데이터
   */
  async updateGathering(spaceId, gatheringId, updates) {
    try {
      const gatheringRef = doc(db, 'spaces', spaceId, 'mealGatherings', gatheringId);

      await updateDoc(gatheringRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      console.log('✅ 모임 수정 성공:', gatheringId);
    } catch (error) {
      console.error('❌ 모임 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자가 특정 날짜에 참여한 모임 타입 확인
   * @param {object} gatheringsByDate - 날짜별 모임 데이터
   * @param {string} userId - 사용자 ID
   * @returns {object} { lunch: boolean, dinner: boolean }
   */
  getUserMealStatus(gatheringsByDate, userId) {
    if (!gatheringsByDate) {
      return { lunch: false, dinner: false };
    }

    const lunchGatherings = gatheringsByDate.lunch || [];
    const dinnerGatherings = gatheringsByDate.dinner || [];

    const hasLunch = lunchGatherings.some(g => g.participants?.includes(userId));
    const hasDinner = dinnerGatherings.some(g => g.participants?.includes(userId));

    return {
      lunch: hasLunch,
      dinner: hasDinner
    };
  }
}

export default new MealGatheringService();
