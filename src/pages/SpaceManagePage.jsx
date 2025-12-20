import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { ArrowLeft, Settings, Users, Bell, Info } from 'lucide-react';
import { canManageSpace } from '../utils/permissions';
import { useEffect } from 'react';

export default function SpaceManagePage() {
  const navigate = useNavigate();
  const { user, selectedSpace } = useStore();

  // 권한 체크
  useEffect(() => {
    console.log('🔍 SpaceManagePage 권한 체크:', { user, selectedSpace });
    
    if (!user || !selectedSpace) {
      console.warn('⚠️ user 또는 selectedSpace 없음');
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    const spaceId = selectedSpace.id || selectedSpace.spaceId;
    const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);
    
    if (!userSpaceData || !canManageSpace(userSpaceData.userType)) {
      console.warn('⚠️ 권한 없음:', userSpaceData?.userType);
      alert('접근 권한이 없습니다. 매니저만 접근 가능합니다.');
      navigate('/');
      return;
    }
    
    console.log('✅ 권한 확인 완료');
  }, [user, selectedSpace, navigate]);

  const menuItems = [
    {
      id: 'space-settings',
      title: '스페이스 설정',
      description: '스페이스 이름 등 기본 설정',
      icon: Settings,
      color: 'from-blue-500 to-blue-600',
      path: '/space/settings'
    },
    {
      id: 'member-manage',
      title: '멤버 관리',
      description: '멤버 권한 변경 및 관리',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      path: '/space/members'
    },
    {
      id: 'alimtalk-settings',
      title: '알림톡 설정',
      description: '알림톡 발송 on/off',
      icon: Bell,
      color: 'from-green-500 to-green-600',
      path: '/space/alimtalk'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/30 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">스페이스 관리</h1>
              <p className="text-sm text-slate-300">{selectedSpace?.spaceName || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 카드 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="w-full bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
                </div>
              </button>
            );
          })}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-2">관리자 안내</p>
              <ul className="space-y-1 text-blue-200/80">
                <li>• 매니저만 스페이스 설정을 변경할 수 있습니다.</li>
                <li>• 변경 사항은 즉시 반영되며, 모든 멤버에게 적용됩니다.</li>
                <li>• 중요한 설정 변경 시 신중히 결정해주세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
