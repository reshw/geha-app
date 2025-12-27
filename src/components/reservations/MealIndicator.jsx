/**
 * 프로필 아바타에 표시되는 식사 표시 점 2개
 * - 왼쪽: 점심 (초록색)
 * - 오른쪽: 저녁 (주황색)
 */
const MealIndicator = ({ lunch, dinner, className = "" }) => {
  // 둘 다 없으면 표시 안 함
  if (!lunch && !dinner) return null;

  return (
    <div className={`absolute -bottom-0.5 -right-0.5 flex gap-0.5 ${className}`}>
      {/* 점심 점 */}
      <div
        className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
          lunch ? 'bg-green-500' : 'bg-gray-300'
        }`}
        title="점심"
      />
      {/* 저녁 점 */}
      <div
        className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
          dinner ? 'bg-orange-500' : 'bg-gray-300'
        }`}
        title="저녁"
      />
    </div>
  );
};

export default MealIndicator;
