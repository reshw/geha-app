import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * 식사 선택 팝업 패널
 * - 본인 프로필 클릭 시 표시
 * - 점심/저녁 체크박스
 */
const MealSelectionPanel = ({ isOpen, onClose, currentMeal, onSave, reservationName }) => {
  const [lunch, setLunch] = useState(false);
  const [dinner, setDinner] = useState(false);

  // currentMeal 변경 시 state 초기화
  useEffect(() => {
    if (currentMeal) {
      setLunch(currentMeal.lunch || false);
      setDinner(currentMeal.dinner || false);
    } else {
      setLunch(false);
      setDinner(false);
    }
  }, [currentMeal]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ lunch, dinner });
    onClose();
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      {/* 패널 */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                   bg-white rounded-2xl shadow-2xl z-[61] p-6 w-80 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">오늘의 식사</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 사용자 이름 */}
        <div className="text-sm text-gray-600 mb-4">{reservationName}님</div>

        {/* 체크박스 */}
        <div className="space-y-3 mb-6">
          {/* 점심 */}
          <label className="flex items-center gap-3 p-4 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-colors border-2 border-green-200">
            <input
              type="checkbox"
              checked={lunch}
              onChange={(e) => setLunch(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <div className="flex-1">
              <span className="font-semibold text-gray-900">점심</span>
            </div>
            {lunch && (
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            )}
          </label>

          {/* 저녁 */}
          <label className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors border-2 border-orange-200">
            <input
              type="checkbox"
              checked={dinner}
              onChange={(e) => setDinner(e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <div className="flex-1">
              <span className="font-semibold text-gray-900">저녁</span>
            </div>
            {dinner && (
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            )}
          </label>
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </>
  );
};

export default MealSelectionPanel;
