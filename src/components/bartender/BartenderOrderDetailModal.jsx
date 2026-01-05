import { X, User, Calendar, FileText } from 'lucide-react';

export default function BartenderOrderDetailModal({ order, onClose }) {
  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">주문 상세</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 주문 정보 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <User className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">주문자</p>
                <p className="font-semibold">{order.userName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">주문일시</p>
                <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* 주문 항목 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">주문 항목</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">메뉴</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">수량</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.menuName}</p>
                        <p className="text-sm text-gray-500">{item.price.toLocaleString()}원</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {item.total.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 총액 */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">총 금액</span>
              <span className="text-2xl font-bold text-orange-600">
                {order.totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 메모 */}
          {order.memo && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-700">요청 사항</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{order.memo}</p>
              </div>
            </div>
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
