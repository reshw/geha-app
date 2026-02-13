import { USER_TYPES } from './constants';
import * as oldPermissions from './permissions';

/**
 * 커스텀 회원 등급 권한 시스템
 * tierConfig가 없으면 기존 permissions.js로 fallback
 */

/**
 * userType → tier ID 매핑
 */
export const mapUserTypeToTier = (userType) => {
  const mapping = {
    [USER_TYPES.MANAGER]: 'master',
    [USER_TYPES.VICE_MANAGER]: 'vice-master',
    [USER_TYPES.SHAREHOLDER]: 'c2',
    [USER_TYPES.GUEST]: 'c1'
  };
  return mapping[userType] || 'c1';
};

/**
 * tier ID → userType 역매핑
 */
export const mapTierToUserType = (tier) => {
  const mapping = {
    'master': USER_TYPES.MANAGER,
    'vice-master': USER_TYPES.VICE_MANAGER,
    'c2': USER_TYPES.SHAREHOLDER,
    'c1': USER_TYPES.GUEST
  };
  return mapping[tier] || USER_TYPES.GUEST;
};

/**
 * 등급 레벨 가져오기
 */
export const getTierLevel = (tierConfig, userTier) => {
  if (!tierConfig) return 0;
  const internalTier = mapUserTypeToTier(userTier);
  return tierConfig.tierLevels?.[internalTier] || 0;
};

/**
 * 등급 레벨 비교
 */
export const hasTierLevel = (tierConfig, userTier, requiredTier) => {
  if (!tierConfig) return false;

  const userLevel = getTierLevel(tierConfig, userTier);
  const requiredLevel = tierConfig.tierLevels?.[requiredTier] || 0;

  return userLevel >= requiredLevel;
};

/**
 * 기능-액션 권한 체크 (핵심 함수)
 */
export const canAccessFeature = (tierConfig, userTier, feature, action = 'view') => {
  // tierConfig 없으면 false (fallback 함수에서 처리)
  if (!tierConfig || !feature || !action) return false;

  // master는 항상 전체 권한
  if (mapUserTypeToTier(userTier) === 'master') return true;

  const requiredTier = tierConfig.permissions?.[feature]?.[action];
  if (!requiredTier) return false;

  return hasTierLevel(tierConfig, userTier, requiredTier);
};

/**
 * 등급명 표시
 */
export const getTierDisplayName = (tierConfig, userTier) => {
  if (!tierConfig) return null;

  const internalTier = mapUserTypeToTier(userTier);
  return tierConfig.tierNames?.[internalTier] || null;
};

/**
 * ==========================================
 * Fallback 함수들 (기존 시스템과 호환)
 * ==========================================
 */

/**
 * 재정 관리 접근 권한 (Fallback 지원)
 */
export const canAccessFinance = (tierConfigOrUserType, userTypeOrPermission, actionOrUndefined) => {
  // 새 시스템: canAccessFinance(tierConfig, userType, action)
  if (tierConfigOrUserType && typeof tierConfigOrUserType === 'object' && tierConfigOrUserType.tierNames) {
    const tierConfig = tierConfigOrUserType;
    const userType = userTypeOrPermission;
    const action = actionOrUndefined || 'view';

    return canAccessFeature(tierConfig, userType, 'finance', action);
  }

  // 기존 시스템: canAccessFinance(userType, financePermission)
  const userType = tierConfigOrUserType;
  const financePermission = userTypeOrPermission;

  return oldPermissions.canAccessFinance(userType, financePermission);
};

/**
 * 칭찬 통계 접근 권한 (Fallback 지원)
 */
export const canAccessPraiseStats = (tierConfigOrUserType, userTypeOrPermission) => {
  // 새 시스템: canAccessPraiseStats(tierConfig, userType)
  if (tierConfigOrUserType && typeof tierConfigOrUserType === 'object' && tierConfigOrUserType.tierNames) {
    const tierConfig = tierConfigOrUserType;
    const userType = userTypeOrPermission;

    return canAccessFeature(tierConfig, userType, 'praise', 'viewStats');
  }

  // 기존 시스템: 기본 권한 함수 사용
  // Note: permissions.js에는 canAccessPraiseStats가 없으므로 직접 구현
  const userType = tierConfigOrUserType;
  const praisePermission = userTypeOrPermission || 'manager_only';

  switch (praisePermission) {
    case 'manager_only':
      return userType === USER_TYPES.MANAGER;
    case 'vice_manager_up':
      return userType === USER_TYPES.MANAGER || userType === USER_TYPES.VICE_MANAGER;
    case 'all_members':
      return true;
    default:
      return userType === USER_TYPES.MANAGER;
  }
};

/**
 * 스페이스 관리 권한 (Fallback 지원)
 */
export const canManageSpace = (tierConfigOrUserType, userType) => {
  // 새 시스템: canManageSpace(tierConfig, userType)
  if (tierConfigOrUserType && typeof tierConfigOrUserType === 'object' && tierConfigOrUserType.tierNames) {
    const tierConfig = tierConfigOrUserType;

    return canAccessFeature(tierConfig, userType, 'space', 'manageMembers');
  }

  // 기존 시스템: canManageSpace(userType)
  return oldPermissions.canManageSpace(tierConfigOrUserType);
};

/**
 * 예약 관리 권한 (Fallback 지원)
 */
export const canManageReservations = (tierConfigOrUserType, userType) => {
  // 새 시스템: canManageReservations(tierConfig, userType)
  if (tierConfigOrUserType && typeof tierConfigOrUserType === 'object' && tierConfigOrUserType.tierNames) {
    const tierConfig = tierConfigOrUserType;

    return canAccessFeature(tierConfig, userType, 'reservation', 'cancelAny');
  }

  // 기존 시스템: canManageReservations(userType)
  return oldPermissions.canManageReservations(tierConfigOrUserType);
};

/**
 * 날짜 기반 예약 권한 (Fallback 지원)
 */
export const canReserveOnDate = (tierConfigOrUserType, userTypeOrDate, date) => {
  // 새 시스템: canReserveOnDate(tierConfig, userType, date)
  if (tierConfigOrUserType && typeof tierConfigOrUserType === 'object' && tierConfigOrUserType.tierNames) {
    const tierConfig = tierConfigOrUserType;
    const userType = userTypeOrDate;
    const targetDate = date;

    const canCreatePast = canAccessFeature(tierConfig, userType, 'reservation', 'createPast');
    if (canCreatePast) return true;

    const isPast = new Date(targetDate) < new Date(new Date().setHours(0, 0, 0, 0));
    return !isPast;
  }

  // 기존 시스템: canReserveOnDate(userType, date)
  return oldPermissions.canReserveOnDate(tierConfigOrUserType, userTypeOrDate);
};

/**
 * 예약 취소 권한 (Fallback 지원)
 */
export const canCancelReservation = (tierConfigOrUserType, userTypeOrUserId, userIdOrReservationUserId, reservationUserId) => {
  // 새 시스템: canCancelReservation(tierConfig, userType, userId, reservationUserId)
  if (tierConfigOrUserType && typeof tierConfigOrUserType === 'object' && tierConfigOrUserType.tierNames) {
    const tierConfig = tierConfigOrUserType;
    const userType = userTypeOrUserId;
    const userId = userIdOrReservationUserId;
    const resUserId = reservationUserId;

    // 본인 예약
    if (userId === resUserId) {
      return canAccessFeature(tierConfig, userType, 'reservation', 'cancelOwn');
    }

    // 타인 예약
    return canAccessFeature(tierConfig, userType, 'reservation', 'cancelAny');
  }

  // 기존 시스템: canCancelReservation(userType, userId, reservationUserId)
  return oldPermissions.canCancelReservation(tierConfigOrUserType, userTypeOrUserId, userIdOrReservationUserId);
};

/**
 * 등급 레벨 비교 (Fallback 지원)
 */
export const hasHigherOrEqualLevel = (tierConfigOrUserType, userTypeOrTargetUserType, targetUserType) => {
  // 새 시스템: hasHigherOrEqualLevel(tierConfig, userType, targetUserType)
  if (tierConfigOrUserType && typeof tierConfigOrUserType === 'object' && tierConfigOrUserType.tierNames) {
    const tierConfig = tierConfigOrUserType;
    const userType = userTypeOrTargetUserType;
    const target = targetUserType;

    return hasTierLevel(tierConfig, userType, mapUserTypeToTier(target));
  }

  // 기존 시스템: hasHigherOrEqualLevel(userType, targetUserType)
  return oldPermissions.hasHigherOrEqualLevel(tierConfigOrUserType, userTypeOrTargetUserType);
};
