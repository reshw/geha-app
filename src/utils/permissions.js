import { USER_TYPES } from './constants';
import { isPastDate } from './dateUtils';

export const canReserveOnDate = (userType, date) => {
  if (!userType) return false;
  
  if (userType === USER_TYPES.GUEST || userType === USER_TYPES.SHAREHOLDER) {
    return !isPastDate(date);
  }
  
  return true; // SUBADMIN, ADMIN은 과거 포함 모두 가능
};

export const canCancelReservation = (userType, userId, reservationUserId) => {
  if (userId === reservationUserId) return true;
  return userType === USER_TYPES.SUBADMIN || userType === USER_TYPES.ADMIN;
};

export const canManageSpace = (userType) => {
  return userType === USER_TYPES.SUBADMIN || userType === USER_TYPES.ADMIN;
};
