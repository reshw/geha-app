import { useState, useEffect } from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/dateUtils';
import seasonOutService from '../../services/seasonOutService';

/**
 * 대청소 날 설정 모달 (방장 전용)
 */
const CleanupDayModal = ({ isOpen, onClose, cleanupDay, latestDate, onSave, onDelete, managerName }) => {
  const { start, end } = seasonOutService.getCurrentSeasonDates();

  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (cleanupDay) {
        setDate(formatDate(cleanupDay.date));
        setNote(cleanupDay.note || '');
      } else {
        // 기본값: 제일 늦은 시즌아웃 날짜 or 시즌 마지막날
        setDate(latestDate ? formatDate(latestDate) : formatDate(end));
        setNote('');
      }
    }
  }, [isOpen, cleanupDay, latestDate]);

  const handleSave = async () => {
    if (!date) { alert('날짜를 선택해주세요.'); return; }
    setSaving(true);
    try {
      await onSave({ date: new Date(date), note, setBy: null, setByName: managerName });
      onClose();
    } catch (err) {
      console.error('대청소 날 저장 실패:', err);
      const errorMsg = err?.message || String(err) || '알 수 없는 오류';
      alert('저장 실패: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('대청소 날을 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error('대청소 날 삭제 실패:', err);
      const errorMsg = err?.message || String(err) || '알 수 없는 오류';
      alert('삭제 실패: ' + errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="대청소 날 결정">
      <div className="space-y-5">
        {/* 안내 */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              방장이 최종 대청소 날짜를 결정합니다.<br />
              {latestDate && (
                <span className="text-xs text-green-600">
                  참고: 제일 늦은 시즌아웃 — {latestDate.getMonth() + 1}/{latestDate.getDate()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 날짜 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">대청소 날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={formatDate(start)}
            max={formatDate(end)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-base"
          />
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            메모 <span className="text-gray-400 font-normal text-xs">(선택사항)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 오전 10시 집결, 청소 도구 각자 지참"
            rows={2}
            maxLength={100}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className={`grid gap-3 ${cleanupDay ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button onClick={onClose} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            취소
          </button>
          {cleanupDay && (
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
              <Trash2 className="w-4 h-4" />삭제
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !date}
            className="px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : cleanupDay ? '수정' : '결정'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CleanupDayModal;
