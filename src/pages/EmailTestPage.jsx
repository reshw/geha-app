import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';

export default function EmailTestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recipient, setRecipient] = useState('reshw@naver.com');

  const testEmail = async (type) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log(`📧 테스트 이메일 발송 시작 (${type})...`);

      let emailData = {
        type: type,
        spaceName: '조강308호 (테스트)',
        recipients: {
          to: recipient,
          cc: []
        }
      };

      // 타입별 테스트 데이터
      if (type === 'guest_reservation') {
        emailData = {
          ...emailData,
          name: '홍길동',
          phone: '010-1234-5678',
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          gender: '남성',
          birthYear: '1990',
          hostDisplayName: '김주주',
          memo: '이것은 테스트 예약입니다.',
          pricePerNight: 30000
        };
      } else if (type === 'praise') {
        emailData = {
          ...emailData,
          userName: '테스트 유저',
          category: '청소',
          itemName: '화장실',
          originalText: '테스트 칭찬 내용입니다. 청소를 정말 깨끗하게 해주셨어요!',
          refinedText: '화장실 청소를 정말 깨끗하게 해주셔서 감사합니다.',
          eventDate: new Date(),
          imageUrl: null
        };
      } else if (type === 'settlement') {
        emailData = {
          ...emailData,
          paidByName: '김납부',
          submittedByName: '이등록',
          submittedAt: new Date(),
          totalAmount: 50000,
          items: [
            { itemName: '생수', amount: 20000, splitAmong: ['A', 'B', 'C'] },
            { itemName: '커피', amount: 30000, splitAmong: ['A', 'B'] }
          ],
          memo: '테스트 영수증입니다.',
          imageUrl: null
        };
      } else if (type === 'expense') {
        emailData = {
          ...emailData,
          userName: '박청구',
          usedAt: new Date(),
          createdAt: new Date(),
          totalAmount: 75000,
          items: [
            { itemName: '청소용품', itemPrice: 25000, itemQty: 2, itemSpec: '대형', total: 50000 },
            { itemName: '화장지', itemPrice: 12500, itemQty: 2, itemSpec: '6롤', total: 25000 }
          ],
          memo: '테스트 운영비 청구입니다.',
          imageUrl: null
        };
      }

      console.log('발송할 데이터:', emailData);

      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      console.log('응답 상태:', response.status);

      const responseText = await response.text();
      console.log('응답 본문 (raw):', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('응답 데이터 (parsed):', data);
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        throw new Error(`서버 응답 파싱 실패: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || '이메일 발송 실패');
      }

      setResult({
        success: true,
        message: '이메일이 성공적으로 발송되었습니다!',
        data: data
      });

      console.log('✅ 이메일 발송 성공:', data);
    } catch (err) {
      console.error('❌ 이메일 발송 실패:', err);
      setError(err.message);
      setResult({
        success: false,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/30 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">이메일 테스트</h1>
              <p className="text-sm text-slate-300">Resend 이메일 발송 테스트</p>
            </div>
          </div>
        </div>
      </div>

      {/* 테스트 영역 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 수신자 입력 */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 shadow-lg mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            수신자 이메일
          </label>
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="test@example.com"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* 테스트 버튼들 */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-white mb-4">테스트 이메일 발송</h2>
          <div className="space-y-3">
            <button
              onClick={() => testEmail('guest_reservation')}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              게스트 예약 이메일 테스트
            </button>

            <button
              onClick={() => testEmail('praise')}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              칭찬 접수 이메일 테스트
            </button>

            <button
              onClick={() => testEmail('settlement')}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              정산 접수 이메일 테스트
            </button>

            <button
              onClick={() => testEmail('expense')}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              운영비 청구 이메일 테스트
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-300">이메일 발송 중...</p>
            </div>
          </div>
        )}

        {/* 성공 메시지 */}
        {result && result.success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="text-green-300">
              <p className="font-bold mb-2">✅ 발송 성공!</p>
              <p className="text-sm">{result.message}</p>
              {result.data && (
                <pre className="mt-3 text-xs bg-black/30 p-3 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {result && !result.success && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <div className="text-red-300">
              <p className="font-bold mb-2">❌ 발송 실패</p>
              <p className="text-sm">{result.message}</p>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-2">💡 테스트 안내</p>
            <ul className="space-y-1 text-blue-200/80">
              <li>• 각 버튼을 클릭하면 해당 타입의 테스트 이메일이 발송됩니다.</li>
              <li>• 브라우저 개발자 도구 콘솔에서 상세 로그를 확인할 수 있습니다.</li>
              <li>• Netlify Functions가 배포되어 있어야 합니다.</li>
              <li>• RESEND_API_KEY 환경 변수가 설정되어 있어야 합니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
