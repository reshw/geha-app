// src/services/tourService.js
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

const tourService = {
  /**
   * 사용자가 완료한 투어 목록 가져오기
   */
  async getCompletedTours(userId) {
    try {
      const userTourRef = doc(db, 'users', userId, 'app', 'tours');
      const userTourSnap = await getDoc(userTourRef);

      if (userTourSnap.exists()) {
        return userTourSnap.data().completedTours || [];
      }
      return [];
    } catch (error) {
      console.error('투어 목록 조회 실패:', error);
      return [];
    }
  },

  /**
   * 투어를 완료로 표시
   */
  async markTourAsCompleted(userId, tourId) {
    try {
      const userTourRef = doc(db, 'users', userId, 'app', 'tours');
      const userTourSnap = await getDoc(userTourRef);

      if (userTourSnap.exists()) {
        // 문서가 있으면 업데이트
        await updateDoc(userTourRef, {
          completedTours: arrayUnion(tourId),
          lastUpdated: new Date(),
        });
      } else {
        // 문서가 없으면 생성
        await setDoc(userTourRef, {
          completedTours: [tourId],
          lastUpdated: new Date(),
        });
      }

      console.log('투어 완료 저장:', tourId);
    } catch (error) {
      console.error('투어 완료 저장 실패:', error);
      throw error;
    }
  },

  /**
   * 투어 리셋 (다시 보기)
   */
  async resetTour(userId, tourId) {
    try {
      const userTourRef = doc(db, 'users', userId, 'app', 'tours');
      await updateDoc(userTourRef, {
        completedTours: arrayRemove(tourId),
        lastUpdated: new Date(),
      });

      console.log('투어 리셋:', tourId);
    } catch (error) {
      console.error('투어 리셋 실패:', error);
      throw error;
    }
  },
};

export default tourService;
