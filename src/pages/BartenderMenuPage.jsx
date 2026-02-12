import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, ShoppingCart, Plus, Minus, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import bartenderService from '../services/bartenderService';
import BartenderOrderModal from '../components/bartender/BartenderOrderModal';
import LoginOverlay from '../components/auth/LoginOverlay';
import { canManageSpace } from '../utils/permissions';

const BartenderMenuPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();

  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const hasManagePermission = selectedSpace?.userType && canManageSpace(selectedSpace.userType);

  useEffect(() => {
    if (selectedSpace?.id) {
      loadMenus();
    }
  }, [selectedSpace]);

  const loadMenus = async () => {
    setIsLoading(true);
    try {
      const data = await bartenderService.getAvailableMenus(selectedSpace.id);
      setMenus(data);
    } catch (error) {
      console.error('메뉴 조회 실패:', error);
      alert('메뉴 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 목록 추출 (순서 유지)
  const uniqueCategories = [...new Set(menus.map(m => m.category))];
  const categoryOrder = { 'LOW': 1, 'MID': 2, 'HIGH': 3 };
  const sortedCategories = uniqueCategories.sort((a, b) =>
    (categoryOrder[a] || 999) - (categoryOrder[b] || 999)
  );
  const categories = ['all', ...sortedCategories];

  // 카테고리별 필터링 및 정렬
  const filteredMenus = (categoryFilter === 'all'
    ? menus
    : menus.filter(m => m.category === categoryFilter)
  ).sort((a, b) => {
    // 카테고리 우선 정렬 (LOW, MID, HIGH 순)
    const categoryOrder = { 'LOW': 1, 'MID': 2, 'HIGH': 3 };
    const categoryDiff = (categoryOrder[a.category] || 999) - (categoryOrder[b.category] || 999);
    if (categoryDiff !== 0) return categoryDiff;

    // 같은 카테고리 내에서는 생성일 최신순
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // 장바구니에 추가
  const addToCart = (menu) => {
    const existingItem = cart.find(item => item.menuId === menu.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuId === menu.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menuId: menu.id,
        menuName: menu.menuName,
        price: menu.price,
        quantity: 1
      }]);
    }
  };

  // 장바구니에서 제거
  const removeFromCart = (menuId) => {
    const existingItem = cart.find(item => item.menuId === menuId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item =>
        item.menuId === menuId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.menuId !== menuId));
    }
  };

  // 특정 메뉴의 장바구니 수량 조회
  const getCartQuantity = (menuId) => {
    const item = cart.find(item => item.menuId === menuId);
    return item ? item.quantity : 0;
  };

  // 장바구니 총 수량
  const cartTotalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 주문하기
  const handleSubmitOrder = async (cart, memo) => {
    const orderData = {
      userId: user.id,
      userName: user.displayName || user.name,
      items: cart,
      memo: memo
    };

    await bartenderService.createOrder(selectedSpace.id, orderData);
    alert('주문이 완료되었습니다!\n메뉴판 담당자에게 알림이 전송되었습니다.');
    setCart([]);
  };

  // 로그인 확인
  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/more')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold flex-1">메뉴판</h1>
            <button
              onClick={() => navigate('/bartender/orders')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="주문 내역"
            >
              <ClipboardList className="w-6 h-6" />
            </button>
            {hasManagePermission && (
              <button
                onClick={() => navigate('/bartender/manage')}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="메뉴 관리"
              >
                <Settings className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
            <p className="text-gray-600">메뉴를 불러오는 중...</p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍸</div>
            <p className="text-gray-600 mb-4">
              {categoryFilter === 'all' ? '판매 중인 메뉴가 없습니다.' : `${categoryFilter} 카테고리에 메뉴가 없습니다.`}
            </p>
            {hasManagePermission && (
              <button
                onClick={() => navigate('/bartender/manage')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
              >
                메뉴 관리로 이동
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenus.map((menu) => {
              const quantity = getCartQuantity(menu.id);
              return (
                <div
                  key={menu.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* 메뉴 이미지 */}
                  <div className="h-48 bg-gray-200 relative">
                    {menu.imageUrl ? (
                      <img
                        src={menu.imageUrl}
                        alt={menu.menuName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🍸
                      </div>
                    )}
                    {quantity > 0 && (
                      <div className="absolute top-2 right-2 bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                        {quantity}
                      </div>
                    )}
                  </div>

                  {/* 메뉴 정보 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-900 flex-1">{menu.menuName}</h3>
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold ml-2">
                        {menu.category}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-orange-600 mb-2">
                      {menu.price.toLocaleString()}원
                    </p>
                    {menu.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{menu.description}</p>
                    )}

                    {/* 장바구니 버튼 */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => addToCart(menu)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        담기
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(menu.id)}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-xl font-bold text-gray-900 min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => addToCart(menu)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 플로팅 장바구니 버튼 */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowOrderModal(true)}
            className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-full shadow-2xl hover:from-orange-600 hover:to-amber-600 transition-all hover:scale-110"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {cartTotalQuantity}
            </span>
          </button>
        </div>
      )}

      {/* 주문 모달 */}
      {showOrderModal && (
        <BartenderOrderModal
          cart={cart}
          onClose={() => setShowOrderModal(false)}
          onSubmit={handleSubmitOrder}
        />
      )}
    </div>
  );
};

export default BartenderMenuPage;
