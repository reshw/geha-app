import { useState } from 'react';
import { X, Loader2, ShoppingCart } from 'lucide-react';

export default function BartenderOrderModal({ cart, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('장바구니가 비어있습니다');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(cart, memo);
      onClose();
    } catch (error) {
      console.error('❌ 주문 실패:', error);
      alert('주문에 실패했습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            주문 확인
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 주문 내역 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 주문 항목 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">주문 항목</h3>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.menuName}</p>
                    <p className="text-sm text-gray-600">
                      {item.price.toLocaleString()}원 × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-orange-600">
                    {(item.price * item.quantity).toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 총액 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">총 금액</span>
              <span className="text-2xl font-bold text-orange-600">
                {totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              요청 사항 (선택)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="주문 시 바텐더에게 전달할 메모를 입력하세요"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  주문 중...
                </>
              ) : (
                `${totalAmount.toLocaleString()}원 주문하기`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
