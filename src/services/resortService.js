import { db } from '../config/firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

/**
 * 스키장 관리 서비스
 *
 * spaceService 패턴을 재사용하여 사용자별 스키장 접근 관리
 */
class ResortService {
  /**
   * 전체 스키장 목록 조회 (활성화된 것만)
   */
  async getAllResorts() {
    try {
      const resortsRef = collection(db, 'carpool_resorts');
      const q = query(resortsRef, where('active', '==', true), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);

      const resorts = [];
      snapshot.forEach(doc => {
        resorts.push({ id: doc.id, ...doc.data() });
      });

      return resorts;
    } catch (error) {
      console.error('❌ [ResortService] getAllResorts 실패:', error);
      return [];
    }
  }

  /**
   * 특정 스키장 정보 조회
   */
  async getResortById(resortId) {
    try {
      const resortRef = doc(db, 'carpool_resorts', resortId);
      const snapshot = await getDoc(resortRef);

      if (!snapshot.exists()) {
        return null;
      }

      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      console.error(`❌ [ResortService] getResortById(${resortId}) 실패:`, error);
      return null;
    }
  }

  /**
   * 사용자의 스키장 목록 조회
   * (users/{userId}/resortAccess 서브컬렉션)
   * carpool_resorts의 전체 정보와 병합하여 반환
   */
  async getUserResorts(userId) {
    try {
      if (!userId) return [];

      const resortAccessRef = collection(db, `users/${userId}/resortAccess`);
      const snapshot = await getDocs(resortAccessRef);

      const resortAccessList = [];
      snapshot.forEach(doc => {
        resortAccessList.push({ id: doc.id, ...doc.data() });
      });

      // carpool_resorts에서 전체 스키장 정보 가져와서 병합
      const enrichedResorts = await Promise.all(
        resortAccessList.map(async (access) => {
          const resortData = await this.getResortById(access.resortId || access.id);
          return {
            ...resortData, // carpool_resorts의 전체 정보 (name, distance, etc.)
            ...access, // resortAccess의 정보 (order, lastVisited, etc.)
            id: access.id // resortId를 id로 유지
          };
        })
      );

      // order 기준으로 정렬
      enrichedResorts.sort((a, b) => (a.order || 0) - (b.order || 0));

      console.log('✅ [ResortService] getUserResorts 결과:', enrichedResorts);
      return enrichedResorts;
    } catch (error) {
      console.error(`❌ [ResortService] getUserResorts(${userId}) 실패:`, error);
      return [];
    }
  }

  /**
   * 사용자에게 스키장 추가
   */
  async addResortToUser(userId, resortId) {
    try {
      if (!userId || !resortId) {
        throw new Error('userId 또는 resortId가 없습니다.');
      }

      // carpool_resorts에서 스키장 정보 조회
      const resort = await this.getResortById(resortId);
      if (!resort) {
        throw new Error(`존재하지 않는 스키장: ${resortId}`);
      }

      // 현재 사용자의 스키장 개수 조회 (order 결정용)
      const currentResorts = await this.getUserResorts(userId);
      const nextOrder = currentResorts.length;

      // users/{userId}/resortAccess/{resortId} 생성
      const resortAccessRef = doc(db, `users/${userId}/resortAccess`, resortId);
      await setDoc(resortAccessRef, {
        resortId,
        resortName: resort.name,
        order: nextOrder,
        lastVisited: Timestamp.now(),
        favorited: false,
        status: 'active'
      });

      console.log(`✅ [ResortService] 스키장 추가 완료: ${userId} -> ${resort.name}`);

      // getUserResorts와 동일한 형식으로 반환
      return {
        ...resort, // carpool_resorts의 전체 정보
        id: resortId,
        resortId,
        resortName: resort.name,
        order: nextOrder,
        lastVisited: Timestamp.now(),
        favorited: false,
        status: 'active'
      };
    } catch (error) {
      console.error('❌ [ResortService] addResortToUser 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 스키장 순서 변경
   * (드래그&드롭 재정렬용)
   */
  async updateResortOrder(userId, resorts) {
    try {
      if (!userId || !resorts || resorts.length === 0) {
        throw new Error('userId 또는 resorts가 없습니다.');
      }

      // 각 스키장의 order 업데이트
      const promises = resorts.map((resort, index) => {
        const resortAccessRef = doc(db, `users/${userId}/resortAccess`, resort.id);
        return setDoc(resortAccessRef, { order: index }, { merge: true });
      });

      await Promise.all(promises);
      console.log(`✅ [ResortService] 스키장 순서 변경 완료: ${userId}`);
    } catch (error) {
      console.error('❌ [ResortService] updateResortOrder 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자에게서 스키장 제거
   */
  async removeResortFromUser(userId, resortId) {
    try {
      if (!userId || !resortId) {
        throw new Error('userId 또는 resortId가 없습니다.');
      }

      const resortAccessRef = doc(db, `users/${userId}/resortAccess`, resortId);
      await setDoc(resortAccessRef, { status: 'removed' }, { merge: true });

      console.log(`✅ [ResortService] 스키장 제거 완료: ${userId} -> ${resortId}`);
    } catch (error) {
      console.error('❌ [ResortService] removeResortFromUser 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 마지막 방문 스키장 업데이트
   */
  async updateLastVisited(userId, resortId) {
    try {
      if (!userId || !resortId) return;

      const resortAccessRef = doc(db, `users/${userId}/resortAccess`, resortId);
      await setDoc(resortAccessRef, {
        lastVisited: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error('❌ [ResortService] updateLastVisited 실패:', error);
    }
  }

  /**
   * 비용 가이드 자동 계산
   * (거리 기반: 10km당 1,000원)
   */
  calculateRecommendedCost(distance) {
    if (!distance || distance <= 0) return 0;

    // 10km당 1,000원
    const costPerKm = 100;
    const cost = Math.round((distance * costPerKm) / 1000) * 1000; // 천원 단위 반올림

    return cost;
  }

  /**
   * 초기 스키장 자동 추가
   * (최초 카풀 앱 진입 시 호출)
   */
  async initUserResorts(userId) {
    try {
      if (!userId) {
        throw new Error('userId가 없습니다.');
      }

      // 이미 스키장이 있는지 확인
      const existingResorts = await this.getUserResorts(userId);
      if (existingResorts.length > 0) {
        console.log(`ℹ️ [ResortService] 사용자에게 이미 스키장이 있습니다: ${userId}`);
        return existingResorts;
      }

      // 샘플 스키장 2개 자동 추가
      console.log(`🎿 [ResortService] 초기 스키장 자동 추가 시작: ${userId}`);
      await this.addResortToUser(userId, 'phoenix');
      await this.addResortToUser(userId, 'vivaldi');

      // 재조회
      const resorts = await this.getUserResorts(userId);
      console.log(`✅ [ResortService] 초기 스키장 ${resorts.length}개 추가 완료`);

      return resorts;
    } catch (error) {
      console.error('❌ [ResortService] initUserResorts 실패:', error);
      throw error;
    }
  }
}

const resortService = new ResortService();
export default resortService;
