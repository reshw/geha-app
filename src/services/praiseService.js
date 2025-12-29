// services/praiseService.js
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 칭찬 ID 생성
 * 형식: YYYYMMDD_HHMMSS_XXXX
 */
function generatePraiseId(eventDate) {
  const date = new Date(eventDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}_${random}`;
}

const praiseService = {
  /**
   * 칭찬 등록
   */
  async create(spaceId, data) {
    try {
      const id = generatePraiseId(data.eventDate);
      const docRef = doc(db, `spaces/${spaceId}/praises/${id}`);
      
      const praiseData = {
        id,
        userId: data.userId,
        userName: data.userName,
        animalEmoji: data.animalEmoji || '',
        nickname: data.nickname || data.userName,
        userType: data.userType,
        originalText: data.originalText,
        refinedText: data.refinedText,
        category: data.category || '기타',
        itemName: data.itemName || null,
        imageUrl: data.imageUrl || null,
        eventDate: data.eventDate,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, praiseData);
      console.log('✅ 칭찬 문서 생성:', id);

      // 이메일 알림 발송
      try {
        const emailSettingsRef = doc(db, `spaces/${spaceId}/settings`, 'email');
        const emailSettingsDoc = await getDoc(emailSettingsRef);
        const emailSettings = emailSettingsDoc.exists() ? emailSettingsDoc.data() : null;

        if (emailSettings?.praise?.enabled && emailSettings.praise.recipients.length > 0) {
          console.log('📧 칭찬 접수 이메일 발송 시작');

          // 스페이스 정보 가져오기
          const spaceDocRef = doc(db, 'spaces', spaceId);
          const spaceDoc = await getDoc(spaceDocRef);
          const spaceData = spaceDoc.exists() ? spaceDoc.data() : {};

          const emailResponse = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'praise',
              userName: data.userName,
              category: data.category,
              itemName: data.itemName,
              originalText: data.originalText,
              refinedText: data.refinedText,
              imageUrl: data.imageUrl,
              eventDate: data.eventDate,
              spaceName: spaceData.name || '라운지',
              recipients: {
                to: emailSettings.praise.recipients[0],
                cc: emailSettings.praise.recipients.slice(1)
              }
            })
          });

          const emailResult = await emailResponse.json();
          console.log('✅ 칭찬 이메일 발송 결과:', emailResult);
        } else {
          console.log('ℹ️ 칭찬 이메일 알림이 비활성화되어 있거나 수신자 없음');
        }
      } catch (emailError) {
        console.error('⚠️ 칭찬 이메일 발송 실패 (칭찬 등록은 완료됨):', emailError);
      }

      return id;
    } catch (error) {
      console.error('❌ 칭찬 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 칭찬 목록 조회
   */
  async list(spaceId, statusFilter = 'approved') {
    try {
      const praisesRef = collection(db, `spaces/${spaceId}/praises`);
      
      let q;
      if (statusFilter === 'all') {
        q = query(
          praisesRef,
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          praisesRef,
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const praises = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      console.log(`✅ 칭찬 목록 조회: ${praises.length}개 (filter: ${statusFilter})`);
      return praises;
    } catch (error) {
      console.error('❌ 칭찬 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 칭찬 승인
   */
  async approve(spaceId, praiseId, approverId) {
    try {
      const docRef = doc(db, `spaces/${spaceId}/praises/${praiseId}`);
      
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: approverId,
        updatedAt: serverTimestamp()
      });

      console.log('✅ 칭찬 승인:', praiseId);
    } catch (error) {
      console.error('❌ 칭찬 승인 실패:', error);
      throw error;
    }
  },

  /**
   * 칭찬 거부
   */
  async reject(spaceId, praiseId) {
    try {
      const docRef = doc(db, `spaces/${spaceId}/praises/${praiseId}`);
      
      await updateDoc(docRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ 칭찬 거부:', praiseId);
    } catch (error) {
      console.error('❌ 칭찬 거부 실패:', error);
      throw error;
    }
  },

  /**
   * 칭찬 수정
   */
  async update(spaceId, praiseId, updates) {
    try {
      const docRef = doc(db, `spaces/${spaceId}/praises/${praiseId}`);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ 칭찬 수정:', praiseId);
    } catch (error) {
      console.error('❌ 칭찬 수정 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 칭찬 조회
   */
  async get(spaceId, praiseId) {
    try {
      const docRef = doc(db, `spaces/${spaceId}/praises/${praiseId}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id };
      }
      return null;
    } catch (error) {
      console.error('❌ 칭찬 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 칭찬 삭제
   */
  async delete(spaceId, praiseId) {
    try {
      const docRef = doc(db, `spaces/${spaceId}/praises/${praiseId}`);
      await deleteDoc(docRef);
      
      console.log('✅ 칭찬 삭제:', praiseId);
    } catch (error) {
      console.error('❌ 칭찬 삭제 실패:', error);
      throw error;
    }
  }
};

export default praiseService;