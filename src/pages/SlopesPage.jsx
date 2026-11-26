// pages/SlopesPage.jsx
// 오픈정보: 오늘슬로프(slope.scnd.kr) 화면을 헤더 없이 그대로 보여준다.
import { useAuth } from '../hooks/useAuth';
import LoginOverlay from '../components/auth/LoginOverlay';

const SLOPE_URL = 'https://slope.scnd.kr/phoenix';

export default function SlopesPage() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className="bg-white">
      <iframe
        src={SLOPE_URL}
        className="block w-full border-0"
        // 전체 높이 - BottomNav(64px) - 아이폰 하단 여백
        style={{ height: 'calc(100dvh - 64px - env(safe-area-inset-bottom))' }}
        title="오늘슬로프 - 휘닉스 평창 오픈 현황"
      />
      {/* BottomNav를 위한 여백 */}
      <div style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
    </div>
  );
}
