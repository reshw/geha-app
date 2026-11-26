import { Utensils } from 'lucide-react';

/**
 * 밥X 아이콘: 커틀러리(포크·나이프) 위에 X
 * "그날 밖에서 먹어요" 표시용
 */
const MealOutIcon = ({ className = 'w-4 h-4', utensilsClassName = 'text-orange-600', xClassName = 'text-red-500' }) => (
  <span className={`relative inline-flex items-center justify-center ${className}`} aria-label="밥X">
    <Utensils className={`w-full h-full ${utensilsClassName}`} />
    <svg
      viewBox="0 0 24 24"
      className={`absolute inset-0 w-full h-full ${xClassName}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  </span>
);

export default MealOutIcon;
