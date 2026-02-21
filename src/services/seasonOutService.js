import { db } from '../config/firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

/**
 * 시즌 아웃 서비스
 * 각 멤버가 "시즌 마지막으로 짐 빼는 날"을 등록하고 공유하는 기능
 */
class SeasonOutService {
  /**
   * 내 시즌아웃 등록/수정
   * 문서 ID = userId (유저당 1개, 덮어쓰기)
   */
  async setSeasonOut(spaceId, userId, { name, date, season, note = '' }) {
    if (!spaceId || !userId) throw new Error('spaceId 또는 userId가 없습니다.');

    const ref = doc(db, 'spaces', spaceId, 'seasonOuts', userId);
    const data = {
      userId,
      name,
      date: Timestamp.fromDate(date),
      season,
      note: note.trim(),
      updatedAt: Timestamp.now()
    };

    await setDoc(ref, data);
    return data;
  }

  /**
   * 내 시즌아웃 조회
   */
  async getUserSeasonOut(spaceId, userId) {
    if (!spaceId || !userId) return null;

    const ref = doc(db, 'spaces', spaceId, 'seasonOuts', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      ...data,
      id: snap.id,
      date: data.date?.toDate() || null
    };
  }

  /**
   * 특정 시즌의 전체 시즌아웃 조회 (날짜 오름차순)
   */
  async getSeasonOuts(spaceId, season) {
    if (!spaceId) return [];

    const colRef = collection(db, 'spaces', spaceId, 'seasonOuts');
    const q = query(colRef, where('season', '==', season), orderBy('date', 'asc'));

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
      date: d.data().date?.toDate() || null
    }));
  }

  /**
   * 내 시즌아웃 삭제
   */
  async deleteSeasonOut(spaceId, userId) {
    if (!spaceId || !userId) throw new Error('spaceId 또는 userId가 없습니다.');

    const ref = doc(db, 'spaces', spaceId, 'seasonOuts', userId);
    await deleteDoc(ref);
  }

  // ─── 대청소 날 (방장 전용) ───────────────────────────────────────────────

  /**
   * 대청소 날 설정/수정 (방장만 가능)
   * spaces/{spaceId}/settings/cleanupDay 에 저장
   */
  async setCleanupDay(spaceId, { season, date, setBy, setByName, note = '' }) {
    if (!spaceId) throw new Error('spaceId가 없습니다.');
    const ref = doc(db, 'spaces', spaceId, 'settings', 'cleanupDay');
    await setDoc(ref, {
      season,
      date: Timestamp.fromDate(date),
      setBy,
      setByName,
      note: note.trim(),
      setAt: Timestamp.now()
    });
  }

  /**
   * 대청소 날 조회
   */
  async getCleanupDay(spaceId) {
    if (!spaceId) return null;
    const ref = doc(db, 'spaces', spaceId, 'settings', 'cleanupDay');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return { ...data, date: data.date?.toDate() || null };
  }

  /**
   * 대청소 날 삭제 (방장만 가능)
   */
  async deleteCleanupDay(spaceId) {
    if (!spaceId) throw new Error('spaceId가 없습니다.');
    const ref = doc(db, 'spaces', spaceId, 'settings', 'cleanupDay');
    await deleteDoc(ref);
  }

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * 현재 시즌 계산 (11월~3월 기준)
   * 예: 2025년 11월 ~ 2026년 3월 → "2025-2026"
   */
  getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1~12
    const year = now.getFullYear();

    // 11월~12월이면 현재연도-다음연도
    // 1월~3월이면 전년도-현재연도
    if (month >= 11) {
      return `${year}-${year + 1}`;
    } else if (month <= 3) {
      return `${year - 1}-${year}`;
    } else {
      // 비시즌 (4~10월): 다가오는 시즌
      return `${year}-${year + 1}`;
    }
  }

  /**
   * 현재 시즌 기간 반환
   */
  getCurrentSeasonDates() {
    const season = this.getCurrentSeason();
    const [startYear, endYear] = season.split('-').map(Number);
    return {
      season,
      start: new Date(startYear, 10, 1),  // 11월 1일
      end: new Date(endYear, 2, 31)        // 3월 31일
    };
  }
}

const seasonOutService = new SeasonOutService();
export default seasonOutService;
