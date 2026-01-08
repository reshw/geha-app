// src/services/spaceService.js
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import adminSettingsService from './adminSettingsService';

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
      const now = Timestamp.now();  // Firebase Timestamp 사용
      
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

  // ----- 4) 사용자의 모든 스페이스 목록 가져오기 (계좌 정보 포함) -----
  async getUserSpaces(userId) {
    try {
      const spaceAccessRef = collection(db, `users/${userId}/spaceAccess`);
      const snapshot = await getDocs(spaceAccessRef);
      
      // 각 스페이스의 상세 정보를 병렬로 가져오기
      const spacePromises = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const spaceId = docSnap.id;
        
        // 스페이스 문서에서 계좌 정보 포함한 상세 정보 가져오기
        const spacePromise = getDoc(doc(db, 'spaces', spaceId)).then(spaceDoc => {
          const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};
          
          console.log('📦 [getUserSpaces] 스페이스 상세 정보:', spaceId, spaceData);
          
          // Timestamp를 Date로 변환
          const joinedAt = data.joinedAt && typeof data.joinedAt.toDate === 'function' 
            ? data.joinedAt.toDate() 
            : null;
          const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function'
            ? data.updatedAt.toDate()
            : null;
          
          return {
            id: spaceId,
            spaceId: spaceId, // 호환성을 위해 둘 다 추가
            spaceName: data.spaceName || spaceData.name || '',
            name: spaceData.name || data.spaceName || '', // 스페이스 이름
            userType: data.userType || 'guest',
            order: data.order || 0,
            status: data.status || 'active',
            joinedAt: joinedAt,
            updatedAt: updatedAt,
            // 계좌 정보 추가 (spaces/{spaceId} 문서의 필드)
            accountBank: spaceData.accountBank,
            accountNumber: spaceData.accountNumber,
            accountHolder: spaceData.accountHolder,
          };
        });
        
        spacePromises.push(spacePromise);
      });
      
      const spaces = await Promise.all(spacePromises);
      
      // order 기준으로 정렬
      spaces.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('✅ [getUserSpaces] 결과 (계좌 정보 포함):', spaces);
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

  // ----- 6) 6자리 스페이스 코드 생성 (영대소문자 + 숫자) -----
  generateSpaceCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ----- 7) 스페이스 코드 중복 체크 (spaces 컬렉션과 admin_requests 둘 다 확인) -----
  async isSpaceCodeAvailable(code) {
    try {
      // 1. spaces 컬렉션에서 확인
      const spaceRef = doc(db, 'spaces', code);
      const spaceSnap = await getDoc(spaceRef);
      if (spaceSnap.exists()) {
        return false; // 이미 사용 중
      }

      // 2. admin_requests에서 대기 중인 신청 확인
      const requestsRef = collection(db, 'admin_requests');
      const q = query(
        requestsRef,
        where('type', '==', 'space_creation'),
        where('spaceCode', '==', code),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return false; // 대기 중인 신청에서 사용 중
      }

      return true; // 사용 가능
    } catch (error) {
      console.error('[SpaceService] isSpaceCodeAvailable 실패:', error);
      throw error;
    }
  }

  // ----- 8) 중복되지 않는 스페이스 코드 생성 -----
  async generateUniqueSpaceCode(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const code = this.generateSpaceCode();
      const available = await this.isSpaceCodeAvailable(code);
      if (available) {
        console.log(`✅ 유효한 스페이스 코드 생성: ${code}`);
        return code;
      }
      console.log(`⚠️ 코드 ${code} 이미 사용 중, 재시도...`);
    }
    throw new Error('유효한 스페이스 코드를 생성할 수 없습니다. 다시 시도해주세요.');
  }

  // ----- 9) 스페이스 생성 신청 -----
  async requestSpaceCreation(userId, userName, spaceName) {
    try {
      console.log('📝 스페이스 생성 신청 시작:', { userId, userName, spaceName });

      // 1. 유니크한 스페이스 코드 생성
      const spaceCode = await this.generateUniqueSpaceCode();

      // 2. admin_requests 컬렉션에 신청 기록 추가
      const requestsRef = collection(db, 'admin_requests');
      const now = Timestamp.now();

      const requestData = {
        type: 'space_creation',
        spaceCode: spaceCode,
        spaceName: spaceName,
        status: 'pending',
        requestedBy: {
          id: userId,
          displayName: userName
        },
        requestedAt: now,
        processedAt: null,
        processedBy: null,
        rejectionReason: null
      };

      const requestDoc = await addDoc(requestsRef, requestData);

      console.log('✅ 스페이스 생성 신청 완료:', requestDoc.id);

      // 3. 슈퍼어드민에게 이메일 알림 발송 (비동기, 실패해도 전체 프로세스 중단 안함)
      adminSettingsService.sendAdminNotification('space_creation_request', {
        spaceName: spaceName,
        spaceCode: spaceCode,
        requestedBy: userName,
        requestedAt: now.toDate().toISOString()
      }).catch(err => {
        console.error('⚠️ 어드민 이메일 발송 실패 (무시):', err);
      });

      return {
        success: true,
        requestId: requestDoc.id,
        spaceCode: spaceCode
      };
    } catch (error) {
      console.error('❌ 스페이스 생성 신청 실패:', error);
      throw error;
    }
  }

  // ----- 10) 대기 중인 스페이스 생성 신청 목록 조회 (슈퍼 어드민용) -----
  async getPendingSpaceRequests() {
    try {
      const requestsRef = collection(db, 'admin_requests');
      const q = query(
        requestsRef,
        where('type', '==', 'space_creation'),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const requests = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data
        });
      });

      // 신청일 기준 내림차순 정렬
      requests.sort((a, b) => {
        const aDate = a.requestedAt?.toDate?.() || new Date(0);
        const bDate = b.requestedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });

      console.log(`✅ 대기 중인 스페이스 생성 신청 ${requests.length}건 조회`);
      return requests;
    } catch (error) {
      console.error('❌ 대기 중인 스페이스 생성 신청 조회 실패:', error);
      throw error;
    }
  }

  // ----- 11) 스페이스 생성 신청 승인 (슈퍼 어드민용) -----
  async approveSpaceCreationRequest(requestId, spaceCode, spaceName, adminId, adminName) {
    try {
      console.log('✅ 스페이스 생성 신청 승인 시작:', { requestId, spaceCode });

      const now = Timestamp.now();

      // 1. 신청 문서 읽기 (requestedBy 정보 가져오기)
      const requestRef = doc(db, 'admin_requests', requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error('신청 문서를 찾을 수 없습니다.');
      }

      const requestData = requestSnap.data();
      const requestedById = requestData.requestedBy?.id;
      const requestedByName = requestData.requestedBy?.displayName || '알 수 없음';

      if (!requestedById) {
        throw new Error('신청자 정보가 없습니다.');
      }

      // 2. spaces 컬렉션에 새 스페이스 생성
      const spaceRef = doc(db, 'spaces', spaceCode);
      const spaceData = {
        name: spaceName,
        createdAt: now,
        createdBy: adminId,
        updatedAt: now,
        // 기본 설정
        accountBank: '',
        accountNumber: '',
        accountHolder: '',
        guestPricePerNight: 30000,
        accountBank_settle: '',
        accountNumber_settle: '',
        accountHolder_settle: ''
      };

      await setDoc(spaceRef, spaceData);
      console.log('✅ 스페이스 생성 완료:', spaceCode);

      // 3. 신청자를 매니저로 등록 - users/{userId}/spaceAccess/{spaceCode}
      const userSpaceRef = doc(db, `users/${requestedById}/spaceAccess`, spaceCode);
      const userSpaceData = {
        joinedAt: now,
        order: 0,
        spaceName: spaceName,
        status: 'active',
        updatedAt: now,
        userType: 'manager' // 신청자는 매니저로 등록
      };

      await setDoc(userSpaceRef, userSpaceData);
      console.log('✅ 사용자 spaceAccess 생성 완료:', { userId: requestedById, spaceCode });

      // 4. 신청자를 매니저로 등록 - spaces/{spaceCode}/assignedUsers/{userId}
      const spaceUserRef = doc(db, `spaces/${spaceCode}/assignedUsers`, requestedById);
      const spaceUserData = {
        displayName: requestedByName,
        email: '', // 이메일 정보가 없을 수 있음
        joinedAt: now,
        profileImage: '',
        status: 'active',
        userType: 'manager' // 신청자는 매니저로 등록
      };

      await setDoc(spaceUserRef, spaceUserData);
      console.log('✅ 스페이스 assignedUsers 생성 완료:', { spaceCode, userId: requestedById });

      // 5. 신청 문서 업데이트
      await updateDoc(requestRef, {
        status: 'approved',
        processedAt: now,
        processedBy: {
          id: adminId,
          displayName: adminName
        }
      });

      console.log('✅ 스페이스 생성 및 매니저 등록 완료:', { spaceCode, managerId: requestedById });

      return { success: true, spaceCode };
    } catch (error) {
      console.error('❌ 스페이스 생성 신청 승인 실패:', error);
      throw error;
    }
  }

  // ----- 12) 스페이스 생성 신청 거부 (슈퍼 어드민용) -----
  async rejectSpaceCreationRequest(requestId, adminId, adminName, reason) {
    try {
      console.log('❌ 스페이스 생성 신청 거부 시작:', { requestId });

      const requestRef = doc(db, 'admin_requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: Timestamp.now(),
        processedBy: {
          id: adminId,
          displayName: adminName
        },
        rejectionReason: reason
      });

      console.log('✅ 스페이스 생성 신청 거부 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 스페이스 생성 신청 거부 실패:', error);
      throw error;
    }
  }
}

export default new SpaceService();