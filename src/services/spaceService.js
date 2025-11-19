// src/services/spaceService.js
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

class SpaceService {
  // ----- 1) 스페이스 코드로 스페이스 존재 여부 확인 -----
  async getSpaceByCode(spaceCode) {
    try {
      const spaceRef = doc(db, 'spaces', spaceCode);
      const spaceSnap = await getDoc(spaceRef);
      
      if (!spaceSnap.exists()) {
        return null;
      }
      
      return {
        id: spaceSnap.id,
        ...spaceSnap.data()
      };
    } catch (error) {
      console.error('[SpaceService] getSpaceByCode 실패:', error);
      throw error;
    }
  }

  // ----- 2) 사용자가 이미 해당 스페이스에 가입되어 있는지 확인 -----
  async checkUserInSpace(userId, spaceId) {
    try {
      const userSpaceRef = doc(db, `users/${userId}/spaceAccess`, spaceId);
      const userSpaceSnap = await getDoc(userSpaceRef);
      return userSpaceSnap.exists();
    } catch (error) {
      console.error('[SpaceService] checkUserInSpace 실패:', error);
      return false;
    }
  }

  // ----- 3) 스페이스에 사용자 추가 (양방향) -----
  async joinSpace(userId, spaceId, userData) {
    try {
      // userId를 문자열로 변환
      const userIdStr = String(userId);
      const spaceIdStr = String(spaceId);
      const now = new Date().toISOString();
      
      console.log('🔵 [joinSpace] 시작:', { userIdStr, spaceIdStr, userData });
      
      // 스페이스 정보 가져오기
      const space = await this.getSpaceByCode(spaceIdStr);
      if (!space) {
        throw new Error('존재하지 않는 방입니다.');
      }

      // 이미 가입되어 있는지 확인
      const alreadyJoined = await this.checkUserInSpace(userIdStr, spaceIdStr);
      if (alreadyJoined) {
        console.log('⚠️ [joinSpace] 이미 가입됨:', userIdStr);
        return { alreadyJoined: true };
      }

      // 1) users/{userId}/spaceAccess/{spaceId} 생성
      const userSpaceRef = doc(db, `users/${userIdStr}/spaceAccess`, spaceIdStr);
      const userSpaceData = {
        joinedAt: now,
        order: 0, // 기본값, 나중에 사용자가 변경 가능
        spaceName: space.name || spaceIdStr,
        status: 'active',
        updatedAt: now,
        userType: 'guest' // 기본 guest로 가입
      };
      
      await setDoc(userSpaceRef, userSpaceData);
      console.log('✅ [joinSpace] users/{userId}/spaceAccess 생성:', userSpaceData);

      // 2) spaces/{spaceId}/assignedUsers/{userId} 생성
      const spaceUserRef = doc(db, `spaces/${spaceIdStr}/assignedUsers`, userIdStr);
      const spaceUserData = {
        displayName: userData.displayName || '',
        email: userData.email || '',
        joinedAt: now,
        profileImage: userData.profileImage || '',
        status: 'active',
        userType: 'guest'
      };
      
      await setDoc(spaceUserRef, spaceUserData);
      console.log('✅ [joinSpace] spaces/{spaceId}/assignedUsers 생성:', spaceUserData);

      console.log(`✅ [joinSpace] 완료: 사용자 ${userIdStr}가 스페이스 ${spaceIdStr}에 가입`);
      return { success: true };
    } catch (error) {
      console.error('❌ [SpaceService] joinSpace 실패:', error);
      throw error;
    }
  }

  // ----- 4) 사용자의 모든 스페이스 목록 가져오기 -----
  async getUserSpaces(userId) {
    try {
      const spaceAccessRef = collection(db, `users/${userId}/spaceAccess`);
      const snapshot = await getDocs(spaceAccessRef);
      
      const spaces = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📦 spaceAccess 문서:', doc.id, data);
        spaces.push({
          id: doc.id, // spaceId
          spaceId: doc.id, // 호환성을 위해 둘 다 추가
          spaceName: data.spaceName || '',
          userType: data.userType || 'guest',
          order: data.order || 0,
          status: data.status || 'active',
          joinedAt: data.joinedAt || '',
          updatedAt: data.updatedAt || ''
        });
      });
      
      // order 기준으로 정렬
      spaces.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('✅ getUserSpaces 결과:', spaces);
      return spaces;
    } catch (error) {
      console.error('[SpaceService] getUserSpaces 실패:', error);
      return [];
    }
  }
  // ----- 5) 스페이스 순서 업데이트 -----
  async updateSpaceOrder(userId, spaces) {
    try {
      const updates = spaces.map(async (space, index) => {
        const spaceId = space.id || space.spaceId;
        const userSpaceRef = doc(db, `users/${userId}/spaceAccess`, spaceId);
        await setDoc(userSpaceRef, { order: index }, { merge: true });
      });
      
      await Promise.all(updates);
      console.log('✅ 스페이스 순서 업데이트 완료');
    } catch (error) {
      console.error('[SpaceService] updateSpaceOrder 실패:', error);
      throw error;
    }
  }
}

export default new SpaceService();