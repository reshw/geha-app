import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import bartenderService from '../services/bartenderService';
import BartenderMenuFormModal from '../components/bartender/BartenderMenuFormModal';
import LoginOverlay from '../components/auth/LoginOverlay';
import { canManageSpace } from '../utils/permissions';

const BartenderManagePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();

  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // 권한 확인
  const hasPermission = selectedSpace?.userType && canManageSpace(selectedSpace.userType);

  useEffect(() => {
    if (selectedSpace?.id) {
      loadMenus();
    }
  }, [selectedSpace]);

  const loadMenus = async () => {
    setIsLoading(true);
    try {
      const data = await bartenderService.getMenus(selectedSpace.id);
      setMenus(data);
    } catch (error) {
      console.error('메뉴 조회 실패:', error);
      alert('메뉴 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMenu = () => {
    setFormMode('create');
    setSelectedMenu(null);
    setShowFormModal(true);
  };

  const handleEditMenu = (menu) => {
    setFormMode('edit');
    setSelectedMenu(menu);
    setShowFormModal(true);
  };

  const handleSaveMenu = async (menuData) => {
    try {
      if (formMode === 'create') {
        await bartenderService.createMenu(selectedSpace.id, menuData);
        alert('메뉴가 추가되었습니다!');
      } else {
        await bartenderService.updateMenu(selectedSpace.id, selectedMenu.id, menuData);
        alert('메뉴가 수정되었습니다!');
      }
      loadMenus();
    } catch (error) {
      console.error('메뉴 저장 실패:', error);
      throw error;
    }
  };

  const handleDeleteMenu = async (menuId, menuName) => {
    if (!window.confirm(`"${menuName}" 메뉴를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await bartenderService.deleteMenu(selectedSpace.id, menuId);
      alert('메뉴가 삭제되었습니다.');
      loadMenus();
    } catch (error) {
      console.error('메뉴 삭제 실패:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  const handleToggleAvailability = async (menuId) => {
    try {
      await bartenderService.toggleMenuAvailability(selectedSpace.id, menuId);
      loadMenus();
    } catch (error) {
      console.error('판매 가능 여부 변경 실패:', error);
      alert('판매 가능 여부 변경에 실패했습니다.');
    }
  };

  // 카테고리 목록 추출
  const categories = ['all', ...new Set(menus.map(m => m.category))];

  // 카테고리별 필터링
  const filteredMenus = categoryFilter === 'all'
    ? menus
    : menus.filter(m => m.category === categoryFilter);

  // 로그인 확인
  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  // 권한 확인
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-xl max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-6">
            메뉴 관리는 매니저/부매니저만 가능합니다.
          </p>
          <button
            onClick={() => navigate('/bartender/menu')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
          >
            메뉴판으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/bartender/menu')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold flex-1">메뉴 관리</h1>
            <button
              onClick={handleCreateMenu}
              className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              메뉴 추가
            </button>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === category
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {category === 'all' ? '전체' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">메뉴 목록을 불러오는 중...</p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍸</div>
            <p className="text-gray-600 mb-4">
              {categoryFilter === 'all' ? '등록된 메뉴가 없습니다.' : `${categoryFilter} 카테고리에 메뉴가 없습니다.`}
            </p>
            <button
              onClick={handleCreateMenu}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
            >
              첫 메뉴 추가하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${
                  !menu.available ? 'opacity-60' : ''
                }`}
              >
                <div className="flex">
                  {/* 메뉴 이미지 */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-200">
                    {menu.imageUrl ? (
                      <img
                        src={menu.imageUrl}
                        alt={menu.menuName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍸
                      </div>
                    )}
                  </div>

                  {/* 메뉴 정보 */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{menu.menuName}</h3>
                        <span className="text-sm px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold">
                          {menu.category}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-orange-600 mb-2">
                        {menu.price.toLocaleString()}원
                      </p>
                      {menu.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{menu.description}</p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleToggleAvailability(menu.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                          menu.available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {menu.available ? (
                          <>
                            <Power className="w-4 h-4" />
                            판매중
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-4 h-4" />
                            품절
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleEditMenu(menu)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu.id, menu.menuName)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 메뉴 폼 모달 */}
      {showFormModal && (
        <BartenderMenuFormModal
          mode={formMode}
          menu={selectedMenu}
          onClose={() => setShowFormModal(false)}
          onSave={handleSaveMenu}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default BartenderManagePage;
