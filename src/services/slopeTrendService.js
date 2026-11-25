// services/slopeTrendService.js
// 슬로프/리프트 오픈현황 추이 조회 — 별도 API(api-phoenispark-bp-slopes)를 호출한다.
// 주소는 VITE_SLOPES_API_URL (예: https://api-phoenispark-bp-slopes.<계정>.workers.dev)

const BASE = (import.meta.env.VITE_SLOPES_API_URL || 'http://localhost:8787').replace(/\/+$/, '');

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`슬로프 API 오류 (HTTP ${res.status})`);
  return res.json();
}

/** 최신 스냅샷(슬로프·리프트 상세 포함). 데이터가 없으면 null */
export const getCurrentSlopes = () => get('/api/current');

/** 최근 N 영업일의 일별 최대 오픈 수 (오래된 순) */
export const getDailySlopeTrend = async (days = 14) => {
  const data = await get(`/api/daily?days=${days}`);
  return data?.days ?? [];
};

/** 특정 영업일의 시간대별 숫자 (오래된 순) */
export const getSlopeDay = async (bizDay) => {
  const data = await get(`/api/day/${bizDay}`);
  return data?.snapshots ?? [];
};
