import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

class SpaceService {
  async getUserSpaces(userId) {
    try {
      console.log('🔍 spaceAccess 조회 시작, userId:', userId);
      
      const spaceAccessRef = collection(db, `users/${userId}/spaceAccess`);
      const spaceAccessSnap = await getDocs(spaceAccessRef);
      
      console.log('📋 spaceAccess 문서 수:', spaceAccessSnap.size);
      
      const spaces = [];
      for (const accessDoc of spaceAccessSnap.docs) {
        console.log('  - spaceCode:', accessDoc.id, 'data:', accessDoc.data());
        
        const spaceDoc = await getDoc(doc(db, 'spaces', accessDoc.id));
        if (spaceDoc.exists()) {
          const spaceData = {
            id: spaceDoc.id,
            ...spaceDoc.data(),
            userType: accessDoc.data().userType,
            order: accessDoc.data().order || 0
          };
          console.log('  ✅ space 로드:', spaceData);
          spaces.push(spaceData);
        } else {
          console.log('  ❌ space 문서 없음:', accessDoc.id);
        }
      }
      
      // order 순으로 정렬
      spaces.sort((a, b) => a.order - b.order);
      
      console.log('✅ 최종 spaces:', spaces);
      return spaces;
    } catch (error) {
      console.error('❌ getUserSpaces 에러:', error);
      return [];
    }
  }
  
  async getSpaceByCode(spaceCode) {
    const spaceDoc = await getDoc(doc(db, 'spaces', spaceCode));
    if (!spaceDoc.exists()) {
      throw new Error('존재하지 않는 스페이스입니다');
    }
    return { id: spaceDoc.id, ...spaceDoc.data() };
  }
  
  async joinSpace(userId, spaceId) {
    await setDoc(doc(db, `users/${userId}/spaceAccess`, spaceId), {
      userType: 'guest',
      joinedAt: new Date().toISOString()
    });
    
    return await this.getSpaceByCode(spaceId);
  }
}

export default new SpaceService();
