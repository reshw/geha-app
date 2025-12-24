import { USER_TYPES, USER_TYPE_LEVEL } from './constants';
import { isPastDate } from './dateUtils';

export const canReserveOnDate = (userType, date) => {
  if (!userType) return false;
  
  // guest, shareholder는 과거 날짜 예약 불가
  if (userType === USER_TYPES.GUEST || userType === USER_TYPES.SHAREHOLDER) {
    return !isPastDate(date);
  }
  
  // vice-manager, manager는 과거 포함 모두 가능
  return true;
};

export const canCancelReservation = (userType, userId, reservationUserId) => {
  // 본인 예약은 항상 취소 가능
  if (userId === reservationUserId) return true;
  
  // vice-manager, manager는 모든 예약 취소 가능
  return userType === USER_TYPES.VICE_MANAGER || userType === USER_TYPES.MANAGER;
};

export const canManageSpace = (userType) => {
  // vice-manager, manager는 스페이스 관리 가능 (멤버 관리, 권한 변경 등)
  return userType === USER_TYPES.VICE_MANAGER || userType === USER_TYPES.MANAGER;
};

export const canManageReservations = (userType) => {
  // vice-manager 이상은 예약 관리 가능
  return userType === USER_TYPES.VICE_MANAGER || userType === USER_TYPES.MANAGER;
};

// 권한 레벨 비교
export const hasHigherOrEqualLevel = (userType, targetUserType) => {
  const userLevel = USER_TYPE_LEVEL[userType] || 0;
  const targetLevel = USER_TYPE_LEVEL[targetUserType] || 0;
  return userLevel >= targetLevel;
};