import { useState } from 'react';
import { Megaphone, ChevronDown, ChevronUp, ExternalLink, PenLine } from 'lucide-react';

/**
 * 공지사항 아코디언 뷰
 * - 공지가 있거나 매니저면 표시
 * - 공지 1건이면 바로 펼침, 없으면 접힌 상태
 */
const NoticeListView = ({ notices, isManager, onAddClick, onEditClick }) => {
  const [isOpen, setIsOpen] = useState(notices.length > 0);

  // 공지도 없고 매니저도 아니면 렌더링 안함
  if (notices.length === 0 && !isManager) return null;

  return (
    <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors">
        <div
          className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
          onClick={() => setIsOpen(v => !v)}
        >
          <Megaphone className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-800">공지사항</span>
          {notices.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium flex-shrink-0">
              {notices.length}건
            </span>
          )}
          {notices.length === 0 && (
            <span className="text-xs text-gray-400">등록된 공지 없음</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isManager && (
            <button
              onClick={onAddClick}
              className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              작성
            </button>
          )}
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
        <div className="border-t border-blue-100 divide-y divide-gray-50">
          {notices.length === 0 ? (
            <div className="px-4 py-5 text-center text-sm text-gray-400">
              아직 등록된 공지가 없습니다
            </div>
          ) : (
            notices.map(notice => (
              <div key={notice.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 leading-snug">
                      {notice.title}
                    </span>
                  </div>
                  {notice.content && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed whitespace-pre-line">
                      {notice.content}
                    </p>
                  )}
                  {notice.link && (
                    <a
                      href={notice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      바로가기
                    </a>
                  )}
                </div>
                {isManager && (
                  <button
                    onClick={() => onEditClick(notice)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 mt-0.5"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NoticeListView;
