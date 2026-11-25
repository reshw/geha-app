// components/slopes/SlopeTrend.jsx
// 슬로프/리프트 오픈 추이 (SVG 라인차트, 외부 차트 라이브러리 없음)
import { useEffect, useState } from 'react';
import { getCurrentSlopes, getDailySlopeTrend, getSlopeDay } from '../../services/slopeTrendService';

const RANGES = [
  { days: 7, label: '7일' },
  { days: 14, label: '14일' },
  { days: 30, label: '30일' },
  { days: 120, label: '시즌' }
];

const COLORS = { slope: '#3b82f6', lift: '#f97316' };

// x: 문자열 라벨 배열, series: [{ name, color, values }]
function LineChart({ labels, series, height = 180, yMaxMin = 4 }) {
  const W = 640;
  const padL = 28;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = height - padT - padB;

  const maxVal = Math.max(yMaxMin, ...series.flatMap((s) => s.values));
  const n = labels.length;
  const x = (i) => padL + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v) => padT + innerH - (v / maxVal) * innerH;

  const ticks = [0, Math.round(maxVal / 2), maxVal];
  const labelStep = Math.max(1, Math.ceil(n / 6));

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{t}</text>
        </g>
      ))}
      {labels.map((l, i) =>
        i % labelStep === 0 || i === n - 1 ? (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="#9ca3af">{l}</text>
        ) : null
      )}
      {series.map((s) => (
        <g key={s.name}>
          <polyline
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
          {s.values.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={n > 40 ? 0 : 3} fill={s.color}>
              <title>{`${labels[i]} ${s.name} ${v}`}</title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}

function Legend() {
  return (
    <div className="flex gap-4 text-xs text-gray-600 mb-1">
      <span className="flex items-center gap-1"><i className="inline-block w-3 h-1 rounded" style={{ background: COLORS.slope }} />슬로프</span>
      <span className="flex items-center gap-1"><i className="inline-block w-3 h-1 rounded" style={{ background: COLORS.lift }} />리프트</span>
    </div>
  );
}

export default function SlopeTrend() {
  const [days, setDays] = useState(14);
  const [latest, setLatest] = useState(null);
  const [daily, setDaily] = useState([]);
  const [dayShots, setDayShots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 현재 상태 + 일별 추이 (기간 변경 시 다시 조회)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getCurrentSlopes(), getDailySlopeTrend(days)])
      .then(([current, dailyRows]) => {
        if (cancelled) return;
        setLatest(current);
        setDaily(dailyRows);
        setSelectedDay((prev) =>
          prev && dailyRows.some((d) => d.bizDay === prev)
            ? prev
            : dailyRows.length ? dailyRows[dailyRows.length - 1].bizDay : null
        );
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [days]);

  // 선택한 날의 시간대별 변화
  useEffect(() => {
    if (!selectedDay) { setDayShots([]); return undefined; }
    let cancelled = false;
    getSlopeDay(selectedDay)
      .then((rows) => !cancelled && setDayShots(rows))
      .catch(() => !cancelled && setDayShots([]));
    return () => { cancelled = true; };
  }, [selectedDay]);

  const mmdd = (d) => d.slice(5).replace('-', '/');

  return (
    <div className="max-w-[720px] mx-auto px-4 py-4 space-y-4">
      {/* 기간 선택 */}
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              days === r.days ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-sm text-gray-500 py-10">불러오는 중...</p>}
      {error && <p className="text-center text-sm text-red-500 py-10">불러오기 실패: {error}</p>}

      {!loading && !error && !latest && (
        <p className="text-center text-sm text-gray-500 py-10">
          아직 수집된 데이터가 없어요. 매시간(06~23시) 자동으로 쌓여요.
        </p>
      )}

      {!loading && !error && latest && (
        <>
          {/* 현재 상태 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-bold text-gray-900">현재 오픈</h2>
              <span className="text-xs text-gray-500">{latest.date} {latest.time} 기준</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 rounded-lg py-2">
                <p className="text-2xl font-bold text-blue-600">{latest.slopeDayOpen}<span className="text-sm text-gray-500">/{latest.slopeTotal}</span></p>
                <p className="text-xs text-gray-600">슬로프(주간)</p>
              </div>
              <div className="bg-orange-50 rounded-lg py-2">
                <p className="text-2xl font-bold text-orange-600">{latest.liftDayOpen}<span className="text-sm text-gray-500">/{latest.liftTotal}</span></p>
                <p className="text-xs text-gray-600">리프트(주간)</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-2">
                <p className="text-2xl font-bold text-gray-700">{(latest.slopeOpenLengthM / 1000).toFixed(1)}<span className="text-sm text-gray-500">km</span></p>
                <p className="text-xs text-gray-600">오픈 연장</p>
              </div>
            </div>
            {(latest.slopeNightOpen > 0 || latest.liftNightOpen > 0) && (
              <p className="text-xs text-gray-500 mt-2">야간: 슬로프 {latest.slopeNightOpen} · 리프트 {latest.liftNightOpen}</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              {latest.slopes.filter((s) => s.dayOpen || s.nightOpen).map((s) => s.name).join(', ') || '오픈한 슬로프 없음'}
            </p>
            {latest.lifts.filter((l) => l.note).length > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {latest.lifts.filter((l) => l.note).map((l) => `${l.name}: ${l.note}`).join(' · ')}
              </p>
            )}
          </section>

          {/* 일별 추이 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-bold text-gray-900 mb-1">일별 최대 오픈 수 (주간)</h2>
            <Legend />
            <LineChart
              labels={daily.map((d) => mmdd(d.bizDay))}
              series={[
                { name: '슬로프', color: COLORS.slope, values: daily.map((d) => d.slopeDayMax) },
                { name: '리프트', color: COLORS.lift, values: daily.map((d) => d.liftDayMax) }
              ]}
            />
          </section>

          {/* 하루 중 변화 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900">하루 중 변화</h2>
              <select
                value={selectedDay || ''}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
              >
                {daily.map((d) => (
                  <option key={d.bizDay} value={d.bizDay}>{d.bizDay}</option>
                ))}
              </select>
            </div>
            <Legend />
            <LineChart
              labels={dayShots.map((s) => s.time)}
              series={[
                { name: '슬로프', color: COLORS.slope, values: dayShots.map((s) => (s.slopeDayOpen || 0) + (s.slopeNightOpen || 0)) },
                { name: '리프트', color: COLORS.lift, values: dayShots.map((s) => (s.liftDayOpen || 0) + (s.liftNightOpen || 0)) }
              ]}
            />
          </section>

          {/* 일별 표 */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
            <h2 className="font-bold text-gray-900 mb-2">일별 요약</h2>
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-200">
                  <th className="py-1 text-left">날짜</th>
                  <th>슬로프(주)</th>
                  <th>슬로프(야)</th>
                  <th>리프트(주)</th>
                  <th>리프트(야)</th>
                  <th>연장(km)</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().map((d) => (
                  <tr key={d.bizDay} className="border-b border-gray-100">
                    <td className="py-1 text-left">{mmdd(d.bizDay)}</td>
                    <td>{d.slopeDayMax}</td>
                    <td>{d.slopeNightMax}</td>
                    <td>{d.liftDayMax}</td>
                    <td>{d.liftNightMax}</td>
                    <td>{(d.openLengthMax / 1000).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
