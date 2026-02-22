// 사용 가능한 기능 정의
import { Calendar, Receipt, Heart, Wallet, Mountain, Coffee } from 'lucide-react';

export const AVAILABLE_FEATURES = {
  reservation: {
    id: 'reservation',
    name: '일정',
    icon: Calendar,
    path: '/',
    description: '예약 및 일정 관리',
    isDefault: false,
    color: 'blue'
  },
  settlement: {
    id: 'settlement',
    name: '정산',
    icon: Receipt,
    path: '/settlement',
    description: '월별 정산 및 청구',
    isDefault: false,
    color: 'green'
  },
  praise: {
    id: 'praise',
    name: '칭찬',
    icon: Heart,
    path: '/praise',
    description: '칭찬 제보 및 게시판',
    isDefault: false,
    color: 'pink'
  },
  expense: {
    id: 'expense',
    name: '공금',
    icon: Wallet,
    path: '/expenses',
    description: '공용 운영비 관리',
    isDefault: false,
    color: 'yellow'
  },
  slopes: {
    id: 'slopes',
    name: '오픈정보',
    icon: Mountain,
    path: '/slopes',
    description: '스키장 및 시설 정보',
    isDefault: false,
    color: 'purple'
  },
  bartender: {
    id: 'bartender',
    name: '메뉴판',
    icon: Coffee,
    path: '/bartender/menu',
    description: '음료 주문 및 관리',
    isDefault: false,
    color: 'orange'
  }
};

// 기본 기능 설정 (신규 스페이스)
export const DEFAULT_FEATURES_CONFIG = {
  reservation: {
    enabled: true,
    order: 1,
    showInBottomNav: true,
    isDefault: false
  },
  settlement: {
    enabled: false,
    order: 2,
    showInBottomNav: false,
    isDefault: false
  },
  praise: {
    enabled: false,
    order: 3,
    showInBottomNav: false,
    isDefault: false
  },
  expense: {
    enabled: false,
    order: 4,
    showInBottomNav: false,
    isDefault: false
  },
  slopes: {
    enabled: false,
    order: 5,
    showInBottomNav: false,
    isDefault: false
  },
  bartender: {
    enabled: false,
    order: 6,
    showInBottomNav: false,
    isDefault: false
  }
};

// 하단 메뉴 최대 개수
export const MAX_BOTTOM_NAV_ITEMS = 4;
