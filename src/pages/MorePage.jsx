// src/pages/MorePage.jsx
import { useNavigate } from 'react-router-dom';
import {
  Settings2,
  Wallet,
  Share2,
  UserCog,
  FileText,
  Shield,
  ShieldCheck,
  LogOut,
  UserMinus,
  ChevronRight,
  CalendarClock,
  TestTube,
  BookOpen,
  Users,
  Play,
  Coffee
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import { canManageSpace } from '../utils/permissions';
import { USER_TYPE_LABELS } from '../utils/constants';
import LoginOverlay from '../components/auth/LoginOverlay';
import { useTour } from '../contexts/TourContext';
import { TOUR_IDS, tours } from '../data/tourData';

const MorePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const { selectedSpace } = useStore();
  const { startTour, isTourCompleted } = useTour();

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  const handleShare = async () => {
    const spaceId = selectedSpace?.id || selectedSpace?.spaceId;

    if (!spaceId) {
      alert('스페이스 ID를 찾을 수 없습니다');
      return;
    }

    const inviteLink = `${window.location.origin}/join/${spaceId}`;

    // 모바일 대응: textarea를 사용한 복사
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 최신 브라우저
        await navigator.clipboard.writeText(inviteLink);
        alert('초대 링크가 복사되었습니다!');
      } else {
        // 구형 브라우저/모바일 대응
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        alert('초대 링크가 복사되었습니다!');
      }
    } catch (err) {
      console.error('복사 실패:', err);
      // 복사 실패 시 링크 직접 표시
      setTimeout(() => {
        alert(`이 링크를 복사하세요:\n${inviteLink}`);
      }, 100);
    }
  };

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      logout();
      navigate('/');
    }
  };

  const handleWithdraw = () => {
    if (window.confirm('정말 회원 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) {
      alert('회원 탈퇴 기능은 준비 중입니다.');
    }
  };

  // 메뉴 아이템 컴포넌트
  const MenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => {
    const colorClass = variant === 'danger' ? 'text-red-600 hover:bg-red-50 active:bg-red-100' :
                      variant === 'admin' ? 'text-purple-700 hover:bg-purple-50 active:bg-purple-100' :
                      'text-gray-700 hover:bg-blue-50 active:bg-blue-100';
    const iconBgClass = variant === 'danger' ? 'bg-red-50' :
                       variant === 'admin' ? 'bg-purple-50' :
                       'bg-blue-50';
    const iconColorClass = variant === 'danger' ? 'text-red-600' :
                          variant === 'admin' ? 'text-purple-600' :
                          'text-blue-600';

    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 transition-all hover:shadow-md hover:border-transparent ${colorClass}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClass}`}>
            <Icon className={`w-6 h-6 ${iconColorClass}`} />
          </div>
          <span className="font-semibold text-base">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-24">
      {/* 헤더 & 프로필 */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white">
        <div className="px-6 pt-6 pb-8">
          <h1 className="text-2xl font-bold mb-6">더보기</h1>

          {/* 프로필 섹션 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3">
              {/* 프로필 이미지 */}
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.displayName}
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                  <span className="text-xl font-bold">{user?.displayName?.[0] || 'U'}</span>
                </div>
              )}

              {/* 사용자 정보 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold mb-1 truncate">{user?.displayName || '사용자'}</h2>
                <div className="text-xs text-white/85 flex items-center gap-1.5">
                  <span className="truncate">{selectedSpace?.spaceName || '스페이스'}</span>
                  <span className="text-white/50">•</span>
                  <span className="font-medium">{selectedSpace?.userType && USER_TYPE_LABELS[selectedSpace.userType] || '게스트'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 섹션 */}
      <div className="px-4 pt-6 space-y-8 pb-4">
        {/* 스페이스 관리 메뉴 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-4">
            스페이스
          </h3>

          {/* 스페이스 관리 (vice-manager, manager만) */}
          {selectedSpace?.userType && canManageSpace(selectedSpace.userType) && (
            <>
              <MenuItem
                icon={Settings2}
                label="스페이스 관리"
                onClick={() => navigate('/space/manage')}
              />

              <MenuItem
                icon={CalendarClock}
                label="정산 자동화 설정"
                onClick={() => navigate('/settlement/schedule')}
              />
            </>
          )}

          <MenuItem
            icon={Wallet}
            label="공용 운영비"
            onClick={() => navigate('/expenses')}
          />

          <MenuItem
            icon={Coffee}
            label="바텐더 주문"
            onClick={() => navigate('/bartender/menu')}
          />

          <MenuItem
            icon={Share2}
            label="초대 코드 공유"
            onClick={handleShare}
          />
        </div>

        {/* 개인 설정 메뉴 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-4">
            개인 설정
          </h3>

          <MenuItem
            icon={UserCog}
            label="개인정보 수정"
            onClick={() => alert('개인정보 수정 기능은 준비 중입니다.')}
          />

          <MenuItem
            icon={FileText}
            label="이용약관"
            onClick={() => navigate('/terms')}
          />

          <MenuItem
            icon={Shield}
            label="개인정보 처리방침"
            onClick={() => navigate('/privacy')}
          />
        </div>

        {/* 앱 정보 메뉴 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-4">
            앱 정보
          </h3>

          <MenuItem
            icon={Users}
            label="사용 가이드"
            onClick={() => navigate('/user-guide')}
          />

          <MenuItem
            icon={BookOpen}
            label="앱 소개"
            onClick={() => navigate('/introduction')}
          />

          {/* 투어 다시보기 */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600" />
              기능 안내 다시보기
            </h4>
            <div className="space-y-2">
              {Object.values(tours).map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => startTour(tour.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors group"
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                      {tour.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tour.description}
                    </p>
                  </div>
                  {isTourCompleted(tour.id) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium ml-2">
                      완료
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 슈퍼어드민 메뉴 */}
        {user?.isSuperAdmin && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-4">
              관리자
            </h3>

            <MenuItem
              icon={ShieldCheck}
              label="슈퍼어드민"
              onClick={() => navigate('/super-admin')}
              variant="admin"
            />

            <MenuItem
              icon={TestTube}
              label="테스트 데이터 생성"
              onClick={() => navigate('/test-data')}
              variant="admin"
            />
          </div>
        )}

        {/* 계정 메뉴 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-4">
            계정
          </h3>

          <MenuItem
            icon={LogOut}
            label="로그아웃"
            onClick={handleLogout}
          />

          <MenuItem
            icon={UserMinus}
            label="회원 탈퇴"
            onClick={handleWithdraw}
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
};

export default MorePage;
