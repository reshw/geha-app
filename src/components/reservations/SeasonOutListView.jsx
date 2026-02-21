import { useState } from 'react';
import { PackageOpen, ChevronDown, ChevronUp, Sparkles, PenLine } from 'lucide-react';

/**
 * 시즌아웃 목록 뷰
 * - 열고 닫기 (accordion)
 * - 제일 늦은 날 강조 (참고용)
 * - 대청소 날: 방장이 별도 결정한 날짜 표시
 */
const SeasonOutListView = ({
  seasonOuts,
  season,
  cleanupDay,
  isManager,
  onRegisterClick,
  onCleanupDayClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!season) return null;

  const [startYear, endYear] = season.split('-');
  const seasonLabel = `${startYear}/${endYear} 시즌아웃`;

  // 제일 늦은 날 (참고용)
  const latestDate = seasonOuts.length > 0
    ? seasonOuts.reduce((latest, s) => (s.date > latest ? s.date : latest), seasonOuts[0].date)
    : null;

  const daysUntil = (date) => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}일 전`;
    if (diff === 0) return '오늘';
    return `D-${diff}`;
  };

  const fmtDate = (date) => {
    if (!date) return '-';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
  };

  return (
    <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
      {/* 헤더 (항상 보임) */}
      <div className="flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors">
        {/* 왼쪽: 클릭하면 열고 닫기 */}
        <div
          className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
          onClick={() => setIsOpen(v => !v)}
        >
          <PackageOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-800">{seasonLabel}</span>
          <span className="text-xs text-gray-400">{seasonOuts.length}명 등록</span>
          {cleanupDay ? (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">
              대청소 {cleanupDay.date.getMonth() + 1}/{cleanupDay.date.getDate()}
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full flex-shrink-0">
              대청소 미정
            </span>
          )}
        </div>
        {/* 오른쪽: 버튼 + 화살표 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onRegisterClick}
            className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors"
          >
            내 날짜
          </button>
          <div className="cursor-pointer p-1" onClick={() => setIsOpen(v => !v)}>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* 펼쳐진 내용 */}
      {isOpen && (
        <div className="border-t border-amber-100 px-4 pb-4 pt-3 space-y-3">

          {/* 대청소 날 섹션 */}
          <div className={`rounded-xl p-3 flex items-center justify-between ${
            cleanupDay ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-dashed border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 flex-shrink-0 ${cleanupDay ? 'text-green-600' : 'text-gray-300'}`} />
              <div>
                <div className="text-xs font-medium text-gray-500">대청소 날 (방장 결정)</div>
                {cleanupDay ? (
                  <>
                    <div className="text-base font-bold text-green-900">
                      {fmtDate(cleanupDay.date)}
                      <span className="ml-2 text-sm font-normal text-green-700">{daysUntil(cleanupDay.date)}</span>
                    </div>
                    {cleanupDay.note && (
                      <div className="text-xs text-green-700 mt-0.5">{cleanupDay.note}</div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-400">아직 결정되지 않았습니다</div>
                )}
              </div>
            </div>
            {isManager && (
              <button
                onClick={onCleanupDayClick}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex-shrink-0"
              >
                <PenLine className="w-3 h-3" />
                {cleanupDay ? '수정' : '결정'}
              </button>
            )}
          </div>

          {/* 멤버 목록 */}
          {seasonOuts.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-400">
              아직 등록한 멤버가 없습니다
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* 제일 늦은 날 참고 표시 */}
              {latestDate && (
                <div className="text-xs text-gray-400 px-1">
                  제일 늦은 날: <span className="text-amber-600 font-semibold">{fmtDate(latestDate)}</span> 기준
                </div>
              )}
              {seasonOuts.map((item, idx) => {
                const isLatest = latestDate && item.date?.getTime() === latestDate.getTime();
                return (
                  <div
                    key={item.userId || idx}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                      isLatest ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isLatest ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
                        {isLatest && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded font-medium flex-shrink-0">최후</span>
                        )}
                      </div>
                      {item.note && (
                        <div className="text-xs text-gray-400 truncate">{item.note}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-800">{fmtDate(item.date)}</div>
                      <div className="text-xs text-gray-400">{daysUntil(item.date)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeasonOutListView;
