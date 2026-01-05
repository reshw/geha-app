import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, ShoppingCart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import bartenderService from '../services/bartenderService';
import BartenderOrderDetailModal from '../components/bartender/BartenderOrderDetailModal';
import LoginOverlay from '../components/auth/LoginOverlay';

const BartenderOrderListPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (selectedSpace?.id) {
      loadOrders();
    }
  }, [selectedSpace]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await bartenderService.getOrders(selectedSpace.id);
      setOrders(data);
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
      alert('주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 날짜별 그룹화
  const groupedOrders = orders.reduce((groups, order) => {
    const dateKey = formatDateOnly(order.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(order);
    return groups;
  }, {});

  // 로그인 확인
  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/bartender/menu')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">주문 내역</h1>
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">주문 내역을 불러오는 중...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 mb-4">주문 내역이 없습니다.</p>
            <button
              onClick={() => navigate('/bartender/menu')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
            >
              메뉴판으로 이동
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedOrders).map(([date, dateOrders]) => (
              <div key={date}>
                {/* 날짜 헤더 */}
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  {date}
                </h2>

                {/* 해당 날짜의 주문들 */}
                <div className="space-y-3">
                  {dateOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-orange-500" />
                          <span className="font-semibold text-gray-900">{order.userName}</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</span>
                      </div>

                      {/* 주문 항목 요약 */}
                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                        <ShoppingCart className="w-4 h-4" />
                        <span>
                          {order.items.map(item => `${item.menuName} ×${item.quantity}`).join(', ')}
                        </span>
                      </div>

                      {/* 총액 */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">총 금액</span>
                        <span className="text-lg font-bold text-orange-600">
                          {order.totalAmount.toLocaleString()}원
                        </span>
                      </div>

                      {/* 메모 (있는 경우) */}
                      {order.memo && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            <span className="font-semibold">요청사항:</span> {order.memo}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <BartenderOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default BartenderOrderListPage;
