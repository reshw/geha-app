// pages/PraisePage.jsx
import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import praiseService from '../services/praiseService';
import PraiseModal from '../components/praise/PraiseModal';
import PraiseCard from '../components/praise/PraiseCard';
import LoginOverlay from '../components/auth/LoginOverlay';

export default function PraisePage() {
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();
  const [praises, setPraises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('approved');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const isManager = selectedSpace?.userType === 'manager' || selectedSpace?.userType === 'vice-manager';

  useEffect(() => {
    loadPraises();
  }, [selectedSpace, statusFilter, categoryFilter]);

  const loadPraises = async () => {
    if (!selectedSpace) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await praiseService.list(selectedSpace.id, statusFilter);
      
      // 카테고리 필터 적용
      const filtered = categoryFilter === 'all' 
        ? data 
        : data.filter(p => p.category === categoryFilter);
      
      setPraises(filtered);
    } catch (error) {
      console.error('칭찬 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 주간 제보 횟수 계산
  const getWeeklyCount = (userId) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    return praises.filter(p => {
      const createdDate = p.createdAt?.toDate?.() || new Date(p.createdAt);
      return p.userId === userId && createdDate >= weekStart;
    }).length;
  };

  const handleApprove = async (praiseId) => {
    try {
      await praiseService.approve(selectedSpace.id, praiseId, user.id);
      loadPraises();
    } catch (error) {
      console.error('승인 실패:', error);
    }
  };

  const handleReject = async (praiseId) => {
    try {
      await praiseService.reject(selectedSpace.id, praiseId);
      loadPraises();
    } catch (error) {
      console.error('거부 실패:', error);
    }
  };

  const handleUpdate = async (praiseId, updates) => {
    try {
      await praiseService.update(selectedSpace.id, praiseId, updates);
      loadPraises();
    } catch (error) {
      console.error('수정 실패:', error);
      throw error;
    }
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  if (!selectedSpace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl mb-4">🏠</div>
          <p className="text-gray-600 mb-2">스페이스를 불러오는 중...</p>
          <p className="text-sm text-gray-500">예약 페이지에서 스페이스를 먼저 선택해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[600px] mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">✨ {selectedSpace.spaceName} 칭찬</h1>
          <p className="text-sm text-gray-600 mt-1">따뜻한 마음을 나눠주세요</p>
        </div>
      </header>

      {/* 상태 필터 탭 (관리자만) */}
      {isManager && (
        <div className="max-w-[600px] mx-auto px-4 py-3">
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setStatusFilter('approved')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'approved'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CheckCircle size={16} className="inline mr-1" />
              승인됨
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock size={16} className="inline mr-1" />
              대기중
            </button>
          </div>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="max-w-[600px] mx-auto px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setCategoryFilter('물품기부')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              categoryFilter === '물품기부'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🎁 물품기부
          </button>
          <button
            onClick={() => setCategoryFilter('청소정리')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              categoryFilter === '청소정리'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🧹 청소정리
          </button>
          <button
            onClick={() => setCategoryFilter('기타')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              categoryFilter === '기타'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            ✨ 기타
          </button>
        </div>
      </div>

      {/* 칭찬 목록 */}
      <div className="max-w-[600px] mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : praises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {statusFilter === 'pending' ? '대기 중인 칭찬이 없습니다' : '아직 칭찬이 없습니다'}
          </div>
        ) : (
          praises.map((praise) => (
            <PraiseCard
              key={praise.id}
              praise={praise}
              isManager={isManager}
              weeklyCount={getWeeklyCount(praise.userId)}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-50"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus size={24} />
      </button>

      {/* 칭찬 등록 모달 */}
      {showModal && (
        <PraiseModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadPraises();
          }}
        />
      )}
    </div>
  );
}