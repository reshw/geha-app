// pages/HomePage.jsx
import useStore from '../store/useStore';
import WeeklyList from '../components/reservations/WeeklyList';
import CarpoolListPage from './CarpoolListPage';

/**
 * 홈 페이지 - 앱에 따라 다른 페이지 렌더링
 *
 * - geha: WeeklyList (시즌방 예약 관리)
 * - carpool: CarpoolListPage (카풀 매칭)
 */
const HomePage = () => {
  const { currentApp } = useStore();

  if (currentApp === 'carpool') {
    return <CarpoolListPage />;
  }

  // 기본: geha 앱 (시즌방)
  return <WeeklyList />;
};

export default HomePage;
