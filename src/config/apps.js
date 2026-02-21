import { Home, Car } from 'lucide-react';

/**
 * 슈퍼앱 내 사용 가능한 앱 정의
 *
 * 각 앱은 독립적인 컨텍스트(space, resort 등)를 가지며,
 * 앱 전환 시 적절한 UI와 데이터를 표시합니다.
 */
export const AVAILABLE_APPS = {
  geha: {
    id: 'geha',
    name: '시즌방',
    icon: Home,
    description: '스키장 시즌권 공유 관리',
    color: 'blue',
    contextType: 'space',
    contextLabel: '방',
    enabled: true
  },
  carpool: {
    id: 'carpool',
    name: '카풀',
    icon: Car,
    description: '스키장 카풀 매칭',
    color: 'green',
    contextType: 'resort',
    contextLabel: '스키장',
    enabled: true
  }
};

/**
 * 앱 ID로 앱 정보 가져오기
 */
export const getAppById = (appId) => {
  return AVAILABLE_APPS[appId] || null;
};

/**
 * 활성화된 앱 목록 가져오기
 */
export const getEnabledApps = () => {
  return Object.values(AVAILABLE_APPS).filter(app => app.enabled);
};
