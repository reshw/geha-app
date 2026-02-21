import { useState, useEffect, useCallback } from 'react';
import seasonOutService from '../services/seasonOutService';

export function useSeasonOut(spaceId, userId) {
  const { season } = seasonOutService.getCurrentSeasonDates();

  const [seasonOuts, setSeasonOuts] = useState([]);
  const [mySeasonOut, setMySeasonOut] = useState(null);
  const [cleanupDay, setCleanupDayState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    setError(null);
    try {
      const [all, mine, cleanup] = await Promise.all([
        seasonOutService.getSeasonOuts(spaceId, season),
        userId ? seasonOutService.getUserSeasonOut(spaceId, userId) : Promise.resolve(null),
        seasonOutService.getCleanupDay(spaceId)
      ]);
      setSeasonOuts(all);
      setMySeasonOut(mine);
      setCleanupDayState(cleanup);
    } catch (err) {
      console.error('시즌아웃 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spaceId, userId, season]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveMySeasonOut = useCallback(async ({ name, date, note }) => {
    if (!spaceId || !userId) throw new Error('spaceId 또는 userId가 없습니다.');
    await seasonOutService.setSeasonOut(spaceId, userId, { name, date, season, note });
    await loadAll();
  }, [spaceId, userId, season, loadAll]);

  const removeMySeasonOut = useCallback(async () => {
    if (!spaceId || !userId) throw new Error('spaceId 또는 userId가 없습니다.');
    await seasonOutService.deleteSeasonOut(spaceId, userId);
    setMySeasonOut(null);
    setSeasonOuts(prev => prev.filter(s => s.userId !== userId));
  }, [spaceId, userId]);

  const saveCleanupDay = useCallback(async ({ date, note, setBy, setByName }) => {
    if (!spaceId) throw new Error('spaceId가 없습니다.');
    await seasonOutService.setCleanupDay(spaceId, { season, date, setBy, setByName, note });
    await loadAll();
  }, [spaceId, season, loadAll]);

  const removeCleanupDay = useCallback(async () => {
    if (!spaceId) throw new Error('spaceId가 없습니다.');
    await seasonOutService.deleteCleanupDay(spaceId);
    setCleanupDayState(null);
  }, [spaceId]);

  return {
    seasonOuts,
    mySeasonOut,
    cleanupDay,
    loading,
    error,
    season,
    saveMySeasonOut,
    removeMySeasonOut,
    saveCleanupDay,
    removeCleanupDay,
    refresh: loadAll
  };
}
