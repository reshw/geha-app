// src/components/tour/TourAutoLauncher.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTour } from '../../contexts/TourContext';
import { TOUR_IDS } from '../../data/tourData';

/**
 * 로그인 후 자동으로 투어를 실행하는 컴포넌트
 * 특정 페이지 방문 시 해당 페이지의 투어를 자동 실행
 */
const TourAutoLauncher = () => {
  const location = useLocation();
  const { isTourCompleted, startTour, loading } = useTour();
  const [hasLaunched, setHasLaunched] = useState(false);

  useEffect(() => {
    if (loading || hasLaunched) return;

    // 각 페이지별 투어 매핑
    const pageTourMap = {
      '/': TOUR_IDS.MEAL_CHECK, // 홈 페이지 -> 밥 체크 투어
      '/settlement': TOUR_IDS.SETTLEMENT, // 정산 페이지 -> 정산 투어
    };

    const tourId = pageTourMap[location.pathname];

    // 해당 페이지에 투어가 있고, 아직 완료하지 않았으면 실행
    if (tourId && !isTourCompleted(tourId)) {
      // 약간의 딜레이를 줘서 페이지가 완전히 로드된 후 실행
      const timer = setTimeout(() => {
        startTour(tourId);
        setHasLaunched(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, loading, isTourCompleted, startTour, hasLaunched]);

  return null; // UI를 렌더링하지 않음
};

export default TourAutoLauncher;
