import { db } from '../config/firebase';
import {
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore';

/**
 * 카풀 서비스
 *
 * reservationService 패턴을 재사용하여 카풀 포스트 CRUD 관리
 */
class CarpoolService {
  /**
   * 카풀 포스트 조회 (필터링 지원)
   */
  async getCarpoolPosts(resortId, filters = {}) {
    try {
      if (!resortId) {
        throw new Error('resortId가 없습니다.');
      }

      const postsRef = collection(db, 'carpool_posts');
      let q = query(
        postsRef,
        where('resortId', '==', resortId),
        where('status', 'in', ['recruiting', 'waiting_payment', 'confirmed']),
        orderBy('departureDate', 'asc'),
        limit(100) // 최대 100개
      );

      const snapshot = await getDocs(q);
      let posts = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          departureDate: data.departureDate?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null
        });
      });

      // 클라이언트 사이드 필터링 (Firestore 제약 우회)
      posts = this.applyClientFilters(posts, filters);

      return posts;
    } catch (error) {
      console.error('❌ [CarpoolService] getCarpoolPosts 실패:', error);
      return [];
    }
  }

  /**
   * 클라이언트 사이드 필터링
   */
  applyClientFilters(posts, filters) {
    let filtered = [...posts];

    // 타입 필터 (offer/request)
    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    // 날짜 필터
    if (filters.date) {
      const targetDate = new Date(filters.date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      filtered = filtered.filter(p => {
        if (!p.departureDate) return false;
        return p.departureDate >= targetDate && p.departureDate < nextDate;
      });
    }

    // 출발지 필터
    if (filters.departureLocation) {
      filtered = filtered.filter(p =>
        p.departureLocation?.includes(filters.departureLocation)
      );
    }

    // 장비 필터
    if (filters.hasEquipment !== undefined && filters.hasEquipment !== null) {
      filtered = filtered.filter(p => p.hasEquipment === filters.hasEquipment);
    }

    return filtered;
  }

  /**
   * 카풀 포스트 생성
   */
  async createCarpoolPost(postData) {
    try {
      const postsRef = collection(db, 'carpool_posts');
      const now = Timestamp.now();

      const newPost = {
        type: postData.type || 'offer',
        resortId: postData.resortId,
        resortName: postData.resortName,
        departureDate: Timestamp.fromDate(postData.departureDate),
        departureTime: postData.departureTime,
        departureLocation: postData.departureLocation,
        destination: postData.destination,
        direction: postData.direction || 'toResort', // toResort | fromResort (왕복 제거)
        cost: postData.cost || 0,
        hasEquipment: postData.hasEquipment || false,
        equipmentCost: postData.equipmentCost || 0,
        kakaoId: postData.kakaoId,
        memo: postData.memo || '',
        status: 'recruiting',
        userId: postData.userId,
        userName: postData.userName,
        userProfileImage: postData.userProfileImage || '',
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(postsRef, newPost);
      console.log(`✅ [CarpoolService] 카풀 포스트 생성 완료: ${docRef.id}`);

      return { id: docRef.id, ...newPost };
    } catch (error) {
      console.error('❌ [CarpoolService] createCarpoolPost 실패:', error);
      throw error;
    }
  }

  /**
   * 카풀 포스트 수정
   */
  async updateCarpoolPost(postId, updates) {
    try {
      if (!postId) {
        throw new Error('postId가 없습니다.');
      }

      const postRef = doc(db, 'carpool_posts', postId);
      await setDoc(postRef, {
        ...updates,
        updatedAt: Timestamp.now()
      }, { merge: true });

      console.log(`✅ [CarpoolService] 카풀 포스트 수정 완료: ${postId}`);
    } catch (error) {
      console.error('❌ [CarpoolService] updateCarpoolPost 실패:', error);
      throw error;
    }
  }

  /**
   * 카풀 포스트 상태 변경
   */
  async updateCarpoolStatus(postId, status) {
    try {
      await this.updateCarpoolPost(postId, { status });
      console.log(`✅ [CarpoolService] 상태 변경 완료: ${postId} -> ${status}`);
    } catch (error) {
      console.error('❌ [CarpoolService] updateCarpoolStatus 실패:', error);
      throw error;
    }
  }

  /**
   * 카풀 포스트 취소 (Soft Delete)
   */
  async cancelCarpoolPost(postId, userId) {
    try {
      if (!postId || !userId) {
        throw new Error('postId 또는 userId가 없습니다.');
      }

      // 권한 확인
      const postRef = doc(db, 'carpool_posts', postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        throw new Error('존재하지 않는 포스트입니다.');
      }

      const postData = postSnap.data();
      if (postData.userId !== userId) {
        throw new Error('권한이 없습니다.');
      }

      await this.updateCarpoolStatus(postId, 'canceled');
      console.log(`✅ [CarpoolService] 카풀 포스트 취소 완료: ${postId}`);
    } catch (error) {
      console.error('❌ [CarpoolService] cancelCarpoolPost 실패:', error);
      throw error;
    }
  }

  /**
   * 내 카풀 포스트 조회
   */
  async getMyCarpoolPosts(userId) {
    try {
      if (!userId) {
        throw new Error('userId가 없습니다.');
      }

      const postsRef = collection(db, 'carpool_posts');
      const q = query(
        postsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const posts = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          departureDate: data.departureDate?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null
        });
      });

      return posts;
    } catch (error) {
      console.error('❌ [CarpoolService] getMyCarpoolPosts 실패:', error);
      return [];
    }
  }

  /**
   * 특정 카풀 포스트 조회
   */
  async getCarpoolPostById(postId) {
    try {
      if (!postId) {
        throw new Error('postId가 없습니다.');
      }

      const postRef = doc(db, 'carpool_posts', postId);
      const snapshot = await getDoc(postRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      return {
        id: snapshot.id,
        ...data,
        departureDate: data.departureDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || null
      };
    } catch (error) {
      console.error('❌ [CarpoolService] getCarpoolPostById 실패:', error);
      return null;
    }
  }

  /**
   * geha 평판 정보 추가 (선택적)
   */
  async enrichWithReputation(posts, praiseService) {
    try {
      if (!posts || posts.length === 0) return posts;
      if (!praiseService) return posts; // praiseService가 없으면 그대로 반환

      // 중복 제거된 userId 목록
      const userIds = [...new Set(posts.map(p => p.userId))];

      // 병렬로 평판 정보 조회
      const reputations = await Promise.all(
        userIds.map(async userId => {
          try {
            const praises = await praiseService.getUserPraises(userId);
            return {
              userId,
              totalPraises: praises?.length || 0
            };
          } catch (error) {
            console.warn(`⚠️ 평판 조회 실패 (${userId}):`, error.message);
            return { userId, totalPraises: 0 };
          }
        })
      );

      // 평판 정보 맵 생성
      const reputationMap = {};
      reputations.forEach(r => {
        reputationMap[r.userId] = r;
      });

      // 포스트에 평판 정보 추가
      return posts.map(post => ({
        ...post,
        gehaReputation: reputationMap[post.userId] || { totalPraises: 0 }
      }));
    } catch (error) {
      console.error('❌ [CarpoolService] enrichWithReputation 실패:', error);
      return posts; // 실패해도 원본 데이터 반환
    }
  }
}

const carpoolService = new CarpoolService();
export default carpoolService;
