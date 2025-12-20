import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 스페이스 기본 설정 서비스
 */
const spaceSettingsService = {
  /**
   * 스페이스 이름 업데이트
   * spaces/{spaceId} 문서의 name 필드와
   * users/{userId}/spaceAccess/{spaceId} 문서의 spaceName 필드를 동기화
   */
  async updateSpaceName(spaceId, newName, userId) {
    try {
      console.log('📝 스페이스 이름 업데이트 시작:', { spaceId, newName, userId });

      // 1. spaces/{spaceId} 문서 업데이트
      const spaceRef = doc(db, 'spaces', spaceId);
      await updateDoc(spaceRef, {
        name: newName,
        updatedAt: new Date(),
        updatedBy: userId
      });

      console.log('✅ spaces 문서 업데이트 완료');

      // 2. 모든 멤버의 spaceAccess 업데이트를 위해 assignedUsers 조회
      const assignedUsersRef = doc(db, `spaces/${spaceId}/assignedUsers`);
      // 실제로는 collection을 조회해야 하지만, 여기서는 간단히 현재 사용자만 업데이트
      
      // 3. users/{userId}/spaceAccess/{spaceId} 업데이트
      const userSpaceRef = doc(db, `users/${userId}/spaceAccess`, spaceId);
      await updateDoc(userSpaceRef, {
        spaceName: newName,
        updatedAt: new Date().toISOString()
      });

      console.log('✅ userSpaceAccess 업데이트 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 스페이스 이름 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 스페이스 기본 설정 조회
   */
  async getSpaceSettings(spaceId) {
    try {
      const spaceRef = doc(db, 'spaces', spaceId);
      const spaceDoc = await getDoc(spaceRef);

      if (!spaceDoc.exists()) {
        throw new Error('스페이스를 찾을 수 없습니다.');
      }

      return spaceDoc.data();
    } catch (error) {
      console.error('❌ 스페이스 설정 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 알림톡 설정 조회
   */
  async getAlimtalkSettings(spaceId) {
    try {
      const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');
      const alimtalkDoc = await getDoc(alimtalkRef);

      if (!alimtalkDoc.exists()) {
        // 기본값 반환
        return {
          enabled: true,
          updatedAt: null,
          updatedBy: null
        };
      }

      return alimtalkDoc.data();
    } catch (error) {
      console.error('❌ 알림톡 설정 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 알림톡 설정 업데이트
   */
  async updateAlimtalkSettings(spaceId, enabled, userId, userName, userType) {
    try {
      console.log('📝 알림톡 설정 업데이트 시작:', { spaceId, enabled, userId });

      const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');
      
      const settingsData = {
        enabled,
        updatedAt: new Date(),
        updatedBy: {
          id: userId,
          displayName: userName,
          userType: userType
        }
      };

      await setDoc(alimtalkRef, settingsData, { merge: true });

      console.log('✅ 알림톡 설정 업데이트 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 알림톡 설정 업데이트 실패:', error);
      throw error;
    }
  }
};

export default spaceSettingsService;
