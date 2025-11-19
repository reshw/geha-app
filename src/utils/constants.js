// Space 레벨 사용자 유형 (각 스페이스마다 다를 수 있음)
export const USER_TYPES = {
  GUEST: 'guest',
  SHAREHOLDER: 'shareholder',
  VICE_MANAGER: 'vice-manager',
  MANAGER: 'manager'
};

// 사용자 유형 표시명 (기본값, 나중에 각 스페이스별로 커스터마이징 가능)
export const USER_TYPE_LABELS = {
  'guest': '게스트',
  'shareholder': '주주',
  'vice-manager': '부매니저',
  'manager': '매니저'
};

// 권한 레벨 (숫자가 높을수록 높은 권한)
export const USER_TYPE_LEVEL = {
  'guest': 1,
  'shareholder': 2,
  'vice-manager': 3,
  'manager': 4
};

export const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];