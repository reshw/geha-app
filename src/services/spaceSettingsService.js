import { doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 스페이스 기본 설정 서비스
 */
const spaceSettingsService = {
  /**
   * 스페이스 이름 업데이트
   * spaces/{spaceId} 문서의 name 필드와
   * 모든 멤버의 users/{userId}/spaceAccess/{spaceId} 문서의 spaceName 필드를 동기화
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

      // 2. 모든 멤버의 spaceAccess 업데이트
      const assignedUsersRef = collection(db, `spaces/${spaceId}/assignedUsers`);
      const snapshot = await getDocs(assignedUsersRef);
      
      console.log(`📋 ${snapshot.size}명의 멤버 spaceAccess 업데이트 시작`);

      // Batch로 모든 멤버의 spaceAccess 동시 업데이트
      const batch = writeBatch(db);
      
      snapshot.forEach((userDoc) => {
        const userSpaceRef = doc(db, `users/${userDoc.id}/spaceAccess`, spaceId);
        batch.update(userSpaceRef, {
          spaceName: newName,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log('✅ 모든 멤버의 spaceAccess 업데이트 완료');

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
          enabled: false,
          status: 'inactive', // inactive, pending, approved, rejected
          updatedAt: null,
          updatedBy: null,
          requestedAt: null,
          requestedBy: null,
          approvedAt: null,
          approvedBy: null
        };
      }

      return alimtalkDoc.data();
    } catch (error) {
      console.error('❌ 알림톡 설정 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 알림톡 활성화 신청
   */
  async requestAlimtalkActivation(spaceId, userId, userName, userType, spaceName) {
    try {
      console.log('📝 알림톡 활성화 신청 시작:', { spaceId, userId });

      // 1. 알림톡 설정 업데이트 (pending 상태로)
      const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');
      
      const settingsData = {
        enabled: false,
        status: 'pending',
        requestedAt: new Date(),
        requestedBy: {
          id: userId,
          displayName: userName,
          userType: userType
        },
        updatedAt: new Date()
      };

      await setDoc(alimtalkRef, settingsData, { merge: true });

      // 2. admin_requests 컬렉션에 신청 기록 추가
      const requestsRef = collection(db, 'admin_requests');
      await addDoc(requestsRef, {
        type: 'alimtalk_activation',
        spaceId: spaceId,
        spaceName: spaceName,
        status: 'pending',
        requestedBy: {
          id: userId,
          displayName: userName,
          userType: userType
        },
        requestedAt: new Date(),
        processedAt: null,
        processedBy: null,
        rejectionReason: null
      });

      console.log('✅ 알림톡 활성화 신청 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 알림톡 활성화 신청 실패:', error);
      throw error;
    }
  },

  /**
   * 알림톡 비활성화 (즉시 처리)
   */
  async deactivateAlimtalk(spaceId, userId, userName, userType) {
    try {
      console.log('📝 알림톡 비활성화 시작:', { spaceId, userId });

      const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');
      
      const settingsData = {
        enabled: false,
        status: 'inactive',
        updatedAt: new Date(),
        updatedBy: {
          id: userId,
          displayName: userName,
          userType: userType
        }
      };

      await setDoc(alimtalkRef, settingsData, { merge: true });

      console.log('✅ 알림톡 비활성화 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 알림톡 비활성화 실패:', error);
      throw error;
    }
  },

  /**
   * 슈퍼 어드민: 알림톡 신청 승인
   */
  async approveAlimtalkRequest(requestId, spaceId, adminId, adminName) {
    try {
      console.log('✅ 알림톡 신청 승인 시작:', { requestId, spaceId, adminId });

      // 1. 신청 문서 업데이트
      const requestRef = doc(db, 'admin_requests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        processedAt: new Date(),
        processedBy: {
          id: adminId,
          displayName: adminName
        }
      });

      // 2. 알림톡 설정 활성화
      const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');
      await updateDoc(alimtalkRef, {
        enabled: true,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: {
          id: adminId,
          displayName: adminName
        }
      });

      console.log('✅ 알림톡 신청 승인 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 알림톡 신청 승인 실패:', error);
      throw error;
    }
  },

  /**
   * 슈퍼 어드민: 알림톡 신청 거부
   */
  async rejectAlimtalkRequest(requestId, spaceId, adminId, adminName, reason) {
    try {
      console.log('❌ 알림톡 신청 거부 시작:', { requestId, spaceId, adminId });

      // 1. 신청 문서 업데이트
      const requestRef = doc(db, 'admin_requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: new Date(),
        processedBy: {
          id: adminId,
          displayName: adminName
        },
        rejectionReason: reason
      });

      // 2. 알림톡 설정 거부 상태로
      const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');
      await updateDoc(alimtalkRef, {
        enabled: false,
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date()
      });

      console.log('✅ 알림톡 신청 거부 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 알림톡 신청 거부 실패:', error);
      throw error;
    }
  },

  /**
   * 슈퍼 어드민: 대기 중인 알림톡 신청 목록 조회
   */
  async getPendingAlimtalkRequests() {
    try {
      const requestsRef = collection(db, 'admin_requests');
      const q = query(
        requestsRef,
        where('type', '==', 'alimtalk_activation'),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests = [];

      snapshot.forEach(doc => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return requests;
    } catch (error) {
      console.error('❌ 대기 중인 신청 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 슈퍼 어드민: 활성화된 알림톡 스페이스 목록 조회
   */
  async getActiveAlimtalkSpaces() {
    try {
      console.log('📋 활성화된 알림톡 스페이스 조회 시작');

      // 모든 스페이스 조회
      const spacesRef = collection(db, 'spaces');
      const spacesSnapshot = await getDocs(spacesRef);

      const activeSpaces = [];

      // 각 스페이스의 알림톡 설정 확인
      for (const spaceDoc of spacesSnapshot.docs) {
        const spaceId = spaceDoc.id;
        const spaceData = spaceDoc.data();

        // 알림톡 설정 조회
        const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');
        const alimtalkDoc = await getDoc(alimtalkRef);

        if (alimtalkDoc.exists()) {
          const alimtalkData = alimtalkDoc.data();

          // enabled: true인 경우만 추가
          if (alimtalkData.enabled === true) {
            activeSpaces.push({
              spaceId,
              spaceName: spaceData.name || '이름 없음',
              alimtalkSettings: alimtalkData,
              spaceData
            });
          }
        }
      }

      console.log(`✅ 활성화된 알림톡 스페이스 ${activeSpaces.length}개 발견`);

      // 승인일 기준 내림차순 정렬
      activeSpaces.sort((a, b) => {
        const aDate = a.alimtalkSettings.approvedAt?.toDate?.() || new Date(0);
        const bDate = b.alimtalkSettings.approvedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });

      return activeSpaces;
    } catch (error) {
      console.error('❌ 활성화된 알림톡 스페이스 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 슈퍼 어드민: 알림톡 강제 비활성화
   */
  async superAdminDeactivateAlimtalk(spaceId, adminId, adminName, reason) {
    try {
      console.log('🔒 슈퍼 어드민 알림톡 비활성화 시작:', { spaceId, adminId });

      const alimtalkRef = doc(db, `spaces/${spaceId}/settings`, 'alimtalk');

      const settingsData = {
        enabled: false,
        status: 'deactivated_by_admin',
        deactivatedAt: new Date(),
        deactivatedBy: {
          id: adminId,
          displayName: adminName
        },
        deactivationReason: reason,
        updatedAt: new Date()
      };

      await updateDoc(alimtalkRef, settingsData);

      console.log('✅ 슈퍼 어드민 알림톡 비활성화 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 슈퍼 어드민 알림톡 비활성화 실패:', error);
      throw error;
    }
  },

  /**
   * 게스트 정책 조회
   */
  async getGuestPolicy(spaceId) {
    try {
      console.log('📋 게스트 정책 조회:', spaceId);

      const spaceRef = doc(db, 'spaces', spaceId);
      const spaceDoc = await getDoc(spaceRef);

      if (!spaceDoc.exists()) {
        throw new Error('스페이스를 찾을 수 없습니다.');
      }

      const data = spaceDoc.data();

      return {
        accountBank: data.accountBank || '',
        accountNumber: data.accountNumber || '',
        accountHolder: data.accountHolder || '',
        guestPricePerNight: data.guestPricePerNight || 30000,
      };
    } catch (error) {
      console.error('❌ 게스트 정책 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 게스트 정책 업데이트
   */
  async updateGuestPolicy(spaceId, policyData, userId, userName) {
    try {
      console.log('💾 게스트 정책 업데이트:', { spaceId, policyData });

      const spaceRef = doc(db, 'spaces', spaceId);

      const updateData = {
        accountBank: policyData.accountBank,
        accountNumber: policyData.accountNumber,
        accountHolder: policyData.accountHolder,
        guestPricePerNight: policyData.guestPricePerNight,
        guestPolicyUpdatedAt: new Date(),
        guestPolicyUpdatedBy: {
          id: userId,
          displayName: userName
        }
      };

      await updateDoc(spaceRef, updateData);

      console.log('✅ 게스트 정책 업데이트 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 게스트 정책 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 이메일 알림 설정 조회
   */
  async getEmailSettings(spaceId) {
    try {
      console.log('📧 이메일 알림 설정 조회:', spaceId);

      const emailRef = doc(db, `spaces/${spaceId}/settings`, 'email');
      const emailDoc = await getDoc(emailRef);

      if (!emailDoc.exists()) {
        // 기본값 반환 (모두 비활성화)
        return {
          reservation: {
            enabled: false,
            types: [],
            recipients: []
          },
          settlement: {
            enabled: false,
            recipients: []
          },
          praise: {
            enabled: false,
            recipients: []
          },
          expense: {
            enabled: false,
            recipients: []
          }
        };
      }

      return emailDoc.data();
    } catch (error) {
      console.error('❌ 이메일 알림 설정 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 이메일 알림 설정 업데이트
   */
  async updateEmailSettings(spaceId, settings, userId) {
    try {
      console.log('💾 이메일 알림 설정 업데이트:', { spaceId, settings });

      const emailRef = doc(db, `spaces/${spaceId}/settings`, 'email');

      const updateData = {
        ...settings,
        updatedAt: new Date(),
        updatedBy: userId
      };

      await setDoc(emailRef, updateData);

      console.log('✅ 이메일 알림 설정 업데이트 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 이메일 알림 설정 업데이트 실패:', error);
      throw error;
    }
  }
};

export default spaceSettingsService;