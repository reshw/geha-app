import { useState, useEffect } from 'react';
import { PackageOpen, Trash2, Calendar } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/dateUtils';
import seasonOutService from '../../services/seasonOutService';

/**
 * 시즌아웃 등록/수정 모달
 * - 내 짐 빼는 날짜 등록
 * - 메모 입력
 * - 삭제 가능
 */
const SeasonOutModal = ({ isOpen, onClose, mySeasonOut, onSave, onDelete, userName }) => {
  const { season, start, end } = seasonOutService.getCurrentSeasonDates();

  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mySeasonOut) {
        setDate(formatDate(mySeasonOut.date));
        setNote(mySeasonOut.note || '');
      } else {
        // 기본값: 3월 마지막 날
        setDate(formatDate(end));
        setNote('');
      }
    }
  }, [isOpen, mySeasonOut]);

  const handleSave = async () => {
    if (!date) {
      alert('날짜를 선택해주세요.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: userName, date: new Date(date), note });
      onClose();
    } catch (err) {
      alert('저장에 실패했습니다: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('시즌아웃 날짜를 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      alert('삭제에 실패했습니다: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const seasonLabel = season
    ? `${season.split('-')[0]}/${season.split('-')[1]} 시즌`
    : '현재 시즌';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="시즌아웃 날짜 등록">
      <div className="space-y-5">
        {/* 안내 */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <PackageOpen className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-900">{seasonLabel} 아웃</div>
              <div className="text-xs text-amber-700 mt-1">
                내 짐을 마지막으로 빼는 날짜를 등록하세요.
                모든 멤버가 함께 볼 수 있어 대청소 날짜 조율에 활용됩니다.
              </div>
            </div>
          </div>
        </div>

        {/* 날짜 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            짐 빼는 날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={formatDate(start)}
            max={formatDate(end)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none text-base"
          />
          <p className="text-xs text-gray-500 mt-1">
            시즌 기간: {start.getFullYear()}.{start.getMonth() + 1}.{start.getDate()} ~ {end.getFullYear()}.{end.getMonth() + 1}.{end.getDate()}
          </p>
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            메모 <span className="text-gray-400 font-normal text-xs">(선택사항)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 오전 중 짐 빼고 오후에 대청소 참여 가능"
            rows={2}
            maxLength={100}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-amber-500 resize-none"
          />
          {note.length > 0 && (
            <p className="text-xs text-gray-400 text-right mt-1">{note.length}/100</p>
          )}
        </div>

        {/* 버튼 */}
        <div className={`grid gap-3 ${mySeasonOut ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>

          {mySeasonOut && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !date}
            className="px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : mySeasonOut ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SeasonOutModal;
