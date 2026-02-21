// pages/CarpoolListPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import carpoolService from '../services/carpoolService';
import CarpoolCard from '../components/carpool/CarpoolCard';
import CarpoolFilters from '../components/carpool/CarpoolFilters';
import CarpoolDetailModal from '../components/carpool/CarpoolDetailModal';

// 토스트 알림 컴포넌트
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2 z-[99999] px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slideDown max-w-[90vw]"
      style={{
        top: 'max(20px, env(safe-area-inset-top, 20px))',
        background: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white'
      }}
    >
      {type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      <span className="font-semibold">{message}</span>
    </div>
  );
};

// 로딩 오버레이
const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center">
    <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
      <div className="text-gray-700 font-semibold">처리 중...</div>
    </div>
  </div>
);

// 스키장 없음 안내
const NoResortNotice = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          스키장을 선택해주세요
        </h2>
        <p className="text-gray-600">
          카풀 매칭을 시작하려면 상단에서 스키장을 선택하세요
        </p>
      </div>
    </div>
  </div>
);

const CarpoolListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedResort } = useStore();

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filters, setFilters] = useState({
    type: null, // null | 'offer' | 'request'
    date: null,
    departureLocation: null,
    hasEquipment: null
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // 카풀 포스트 로드
  useEffect(() => {
    const loadPosts = async () => {
      if (!selectedResort?.id) return;

      setIsLoading(true);
      try {
        const data = await carpoolService.getCarpoolPosts(selectedResort.id, filters);
        setPosts(data);
        setFilteredPosts(data);
      } catch (error) {
        console.error('❌ 카풀 포스트 로드 실패:', error);
        setToast({ message: '카풀 목록을 불러오지 못했습니다', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [selectedResort, filters]);

  // 페이지 돌아왔을 때 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      refreshPosts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedResort, filters]);

  // 필터 변경
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // 카풀 상세보기
  const handleCardClick = (post) => {
    setSelectedPost(post);
    setShowDetailModal(true);
  };

  // 목록 새로고침
  const refreshPosts = async () => {
    if (!selectedResort?.id) return;
    try {
      const data = await carpoolService.getCarpoolPosts(selectedResort.id, filters);
      setPosts(data);
      setFilteredPosts(data);
    } catch (error) {
      console.error('❌ 카풀 목록 로드 실패:', error);
    }
  };

  // 스키장이 없으면 안내 표시
  if (!selectedResort) {
    return <NoResortNotice />;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* 필터 바 (끈끈이) */}
        <div className="sticky top-[72px] z-30 bg-white border-b border-gray-200 shadow-sm">
          <CarpoolFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* 카풀 목록 */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">등록된 카풀이 없습니다</div>
              <div className="text-gray-400 text-sm mt-2">
                첫 번째 카풀을 등록해보세요!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <CarpoolCard
                  key={post.id}
                  post={post}
                  onClick={() => handleCardClick(post)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 플로팅 카풀 등록 버튼 */}
        <button
          onClick={() => navigate('/carpool/create')}
          className="fixed z-40 px-5 py-4 bg-gradient-to-br from-green-600 to-green-700 rounded-full shadow-lg flex items-center gap-2 text-white hover:shadow-xl transition-all hover:scale-105 active:scale-95 min-h-[48px]"
          style={{
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            right: 'max(24px, env(safe-area-inset-right))'
          }}
          aria-label="카풀 등록"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">카풀 등록</span>
        </button>
      </div>

      {/* 카풀 상세 모달 */}
      {selectedPost && (
        <CarpoolDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          currentUserId={user?.id}
          onUpdate={refreshPosts}
        />
      )}

      {/* 토스트 알림 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 로딩 오버레이 */}
      {isLoading && <LoadingOverlay />}
    </>
  );
};

export default CarpoolListPage;
