import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 커스텀 회원 등급 시스템 서비스
 * 전체 스페이스에 적용
 */

/**
 * 기본 등급 설정 생성
 */
function getDefaultTierConfig() {
  return {
    tierNames: {
      master: '매니저',
      'vice-master': '부매니저',
      c2: '주주',
      c1: '게스트',
      c3: null,
      c4: null
    },
    tierLevels: {
      master: 6,
      'vice-master': 5,
      c2: 4,
      c1: 3,
      c3: 2,
      c4: 1
    },
    permissions: {
      finance: {
        view: 'vice-master',
        createIncome: 'vice-master',
        createExpense: 'vice-master',
        approve: 'master',
        delete: 'master'
      },
      praise: {
        view: 'c1',
        create: 'c1',
        viewStats: 'master',
        approve: 'vice-master',
        delete: 'master'
      },
      settlement: {
        view: 'c2',
        createBill: 'vice-master',
        approveBill: 'master',
        delete: 'master'
      },
      reservation: {
        create: 'c1',
        createPast: 'vice-master',
        cancelOwn: 'c1',
        cancelAny: 'vice-master',
        viewStats: 'c2'
      },
      expense: {
        view: 'c2',
        create: 'vice-master',
        approve: 'master',
        delete: 'master'
      },
      space: {
        manageMembers: 'vice-master',
        changeSettings: 'master',
        transferOwnership: 'master',
        deleteMember: 'vice-master'
      },
      bartender: {
        view: 'c1',
        order: 'c1',
        manageMenu: 'vice-master',
        viewOrders: 'c2'
      }
    },
    enabledTiers: ['master', 'vice-master', 'c2', 'c1'],
    createdAt: Timestamp.now()
  };
}

const tierService = {
  /**
   * 등급 설정 로드
   * 문서가 없으면 기본값 반환
   */
  async getTierConfig(spaceId) {
    try {
      const tierRef = doc(db, `spaces/${spaceId}/settings`, 'tiers');
      const tierDoc = await getDoc(tierRef);

      if (!tierDoc.exists()) {
        // 문서 없으면 기본값 반환 (자동 생성하지 않음)
        return getDefaultTierConfig();
      }

      return tierDoc.data();
    } catch (error) {
      console.error('❌ tierConfig 로드 실패:', error);
      return getDefaultTierConfig(); // 에러 시 기본값 반환
    }
  },

  /**
   * 등급명 업데이트
   */
  async updateTierNames(spaceId, tierNames, userId, userName) {
    try {
      console.log('📝 등급명 업데이트 시작:', { spaceId, tierNames });

      const tierRef = doc(db, `spaces/${spaceId}/settings`, 'tiers');
      const tierDoc = await getDoc(tierRef);

      if (!tierDoc.exists()) {
        // 문서 없으면 기본값으로 생성
        const defaultConfig = getDefaultTierConfig();
        await setDoc(tierRef, {
          ...defaultConfig,
          tierNames,
          updatedAt: Timestamp.now(),
          updatedBy: {
            id: userId,
            displayName: userName
          }
        });
      } else {
        // 문서 있으면 tierNames만 업데이트
        await updateDoc(tierRef, {
          tierNames,
          updatedAt: Timestamp.now(),
          updatedBy: {
            id: userId,
            displayName: userName
          }
        });
      }

      console.log('✅ 등급명 업데이트 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 등급명 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 권한 설정 업데이트
   */
  async updatePermissions(spaceId, permissions, userId, userName) {
    try {
      console.log('📝 권한 설정 업데이트 시작:', { spaceId });

      const tierRef = doc(db, `spaces/${spaceId}/settings`, 'tiers');
      const tierDoc = await getDoc(tierRef);

      if (!tierDoc.exists()) {
        // 문서 없으면 기본값으로 생성
        const defaultConfig = getDefaultTierConfig();
        await setDoc(tierRef, {
          ...defaultConfig,
          permissions,
          updatedAt: Timestamp.now(),
          updatedBy: {
            id: userId,
            displayName: userName
          }
        });
      } else {
        // 문서 있으면 permissions만 업데이트
        await updateDoc(tierRef, {
          permissions,
          updatedAt: Timestamp.now(),
          updatedBy: {
            id: userId,
            displayName: userName
          }
        });
      }

      console.log('✅ 권한 설정 업데이트 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 권한 설정 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 활성 등급 업데이트 (c3/c4 활성화/비활성화)
   */
  async updateEnabledTiers(spaceId, enabledTiers, tierNames, userId, userName) {
    try {
      console.log('📝 활성 등급 업데이트 시작:', { spaceId, enabledTiers });

      const tierRef = doc(db, `spaces/${spaceId}/settings`, 'tiers');
      const tierDoc = await getDoc(tierRef);

      if (!tierDoc.exists()) {
        // 문서 없으면 기본값으로 생성
        const defaultConfig = getDefaultTierConfig();
        await setDoc(tierRef, {
          ...defaultConfig,
          enabledTiers,
          tierNames,
          updatedAt: Timestamp.now(),
          updatedBy: {
            id: userId,
            displayName: userName
          }
        });
      } else {
        // 문서 있으면 enabledTiers, tierNames 업데이트
        await updateDoc(tierRef, {
          enabledTiers,
          tierNames,
          updatedAt: Timestamp.now(),
          updatedBy: {
            id: userId,
            displayName: userName
          }
        });
      }

      console.log('✅ 활성 등급 업데이트 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 활성 등급 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 초기 tierConfig 생성
   */
  async initializeTierConfig(spaceId, userId, userName) {
    try {
      console.log('📝 tierConfig 초기화 시작:', { spaceId });

      const tierRef = doc(db, `spaces/${spaceId}/settings`, 'tiers');
      const tierDoc = await getDoc(tierRef);

      if (tierDoc.exists()) {
        console.log('⚠️ 이미 tierConfig가 존재합니다');
        return { success: true, alreadyExists: true };
      }

      const defaultConfig = getDefaultTierConfig();
      await setDoc(tierRef, {
        ...defaultConfig,
        updatedAt: Timestamp.now(),
        updatedBy: {
          id: userId,
          displayName: userName
        }
      });

      console.log('✅ tierConfig 초기화 완료');
      return { success: true, alreadyExists: false };
    } catch (error) {
      console.error('❌ tierConfig 초기화 실패:', error);
      throw error;
    }
  }
};

export default tierService;
