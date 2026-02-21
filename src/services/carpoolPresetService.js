import { db } from '../config/firebase';
import {
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';

/**
 * 카풀 프리셋 서비스
 *
 * 자주 사용하는 카풀 등록 정보를 저장/관리
 */
class CarpoolPresetService {
  /**
   * 사용자의 프리셋 목록 조회
   */
  async getUserPresets(userId) {
    try {
      if (!userId) return [];

      const presetsRef = collection(db, `users/${userId}/carpoolPresets`);
      const snapshot = await getDocs(presetsRef);

      const presets = [];
      snapshot.forEach(doc => {
        presets.push({ id: doc.id, ...doc.data() });
      });

      // 최근 사용 순 정렬
      presets.sort((a, b) => {
        const timeA = a.lastUsedAt?.toMillis() || 0;
        const timeB = b.lastUsedAt?.toMillis() || 0;
        return timeB - timeA;
      });

      return presets;
    } catch (error) {
      console.error('❌ [CarpoolPresetService] getUserPresets 실패:', error);
      return [];
    }
  }

  /**
   * 프리셋 저장
   */
  async savePreset(userId, presetData) {
    try {
      if (!userId) {
        throw new Error('userId가 없습니다.');
      }

      const presetId = `preset_${Date.now()}`;
      const presetRef = doc(db, `users/${userId}/carpoolPresets`, presetId);

      const preset = {
        name: presetData.name || '프리셋',
        type: presetData.type,
        direction: presetData.direction,
        departureLocation: presetData.departureLocation,
        cost: presetData.cost,
        hasEquipment: presetData.hasEquipment || false,
        equipmentCost: presetData.equipmentCost || 0,
        memo: presetData.memo || '',
        createdAt: Timestamp.now(),
        lastUsedAt: Timestamp.now()
      };

      await setDoc(presetRef, preset);
      console.log(`✅ [CarpoolPresetService] 프리셋 저장 완료: ${presetId}`);

      return { id: presetId, ...preset };
    } catch (error) {
      console.error('❌ [CarpoolPresetService] savePreset 실패:', error);
      throw error;
    }
  }

  /**
   * 프리셋 삭제
   */
  async deletePreset(userId, presetId) {
    try {
      if (!userId || !presetId) {
        throw new Error('userId 또는 presetId가 없습니다.');
      }

      const presetRef = doc(db, `users/${userId}/carpoolPresets`, presetId);
      await deleteDoc(presetRef);

      console.log(`✅ [CarpoolPresetService] 프리셋 삭제 완료: ${presetId}`);
    } catch (error) {
      console.error('❌ [CarpoolPresetService] deletePreset 실패:', error);
      throw error;
    }
  }

  /**
   * 프리셋 마지막 사용 시간 업데이트
   */
  async updateLastUsed(userId, presetId) {
    try {
      if (!userId || !presetId) return;

      const presetRef = doc(db, `users/${userId}/carpoolPresets`, presetId);
      await setDoc(presetRef, {
        lastUsedAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error('❌ [CarpoolPresetService] updateLastUsed 실패:', error);
    }
  }
}

const carpoolPresetService = new CarpoolPresetService();
export default carpoolPresetService;
