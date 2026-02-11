// components/common/UserTypeBadge.jsx
// 재사용 가능한 직급 배지 컴포넌트

/**
 * 직급별 색상 및 레이블 정의
 */
export const USER_TYPE_CONFIG = {
  manager: {
    label: '관리자',
    bgColor: 'bg-purple-500',
    textColor: 'text-white',
    borderColor: 'border-purple-600',
  },
  'vice-manager': {
    label: '부관리자',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
  },
  shareholder: {
    label: '주주',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    borderColor: 'border-green-600',
  },
  guest: {
    label: '게스트',
    bgColor: 'bg-gray-400',
    textColor: 'text-white',
    borderColor: 'border-gray-500',
  },
};

/**
 * 직급 배지 컴포넌트
 * @param {string} userType - 'manager' | 'vice-manager' | 'shareholder' | 'guest'
 * @param {string} size - 'sm' | 'md' | 'lg' (기본: 'sm')
 * @param {boolean} rounded - 라운드 처리 여부 (기본: true)
 */
const UserTypeBadge = ({ userType, size = 'sm', rounded = true }) => {
  const config = USER_TYPE_CONFIG[userType] || USER_TYPE_CONFIG.guest;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const roundedClass = rounded ? 'rounded-md' : '';

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-semibold
        ${config.bgColor}
        ${config.textColor}
        ${sizeClasses[size]}
        ${roundedClass}
        whitespace-nowrap
      `}
    >
      {config.label}
    </span>
  );
};

export default UserTypeBadge;
