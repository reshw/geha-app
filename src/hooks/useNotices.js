import { useState, useEffect, useCallback } from 'react';
import noticeService from '../services/noticeService';

export function useNotices(spaceId) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const data = await noticeService.getNotices(spaceId);
      setNotices(data);
    } catch (e) {
      console.error('공지사항 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => { load(); }, [load]);

  const addNotice = useCallback(async (data, userId, userName) => {
    await noticeService.addNotice(spaceId, data, userId, userName);
    await load();
  }, [spaceId, load]);

  const updateNotice = useCallback(async (noticeId, data) => {
    await noticeService.updateNotice(spaceId, noticeId, data);
    await load();
  }, [spaceId, load]);

  const deleteNotice = useCallback(async (noticeId) => {
    await noticeService.deleteNotice(spaceId, noticeId);
    await load();
  }, [spaceId, load]);

  return { notices, loading, addNotice, updateNotice, deleteNotice, refresh: load };
}
