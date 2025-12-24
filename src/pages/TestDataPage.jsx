// src/pages/TestDataPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getWeekId, getWeekRange } from '../services/settlementService';
import { ChevronLeft, TestTube } from 'lucide-react';

const TestDataPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 테스트 데이터 기본값
  const [spaceCode, setSpaceCode] = useState('37VXcw');
  const [itemName, setItemName] = useState('치킨');
  const [amount, setAmount] = useState(10000);
  const [paidBy, setPaidBy] = useState('3828221463');
  const [paidByName, setPaidByName] = useState('낸사람');
  const [splitAmong, setSplitAmong] = useState('3848191355');
  const [memo, setMemo] = useState('테스트 데이터');

  // 주차 선택
  const [targetDate, setTargetDate] = useState('');
  const [weekInfo, setWeekInfo] = useState(null);

  // 오늘 날짜의 지난 주 계산
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const year = lastWeek.getFullYear();
    const month = String(lastWeek.getMonth() + 1).padStart(2, '0');
    const day = String(lastWeek.getDate()).padStart(2, '0');

    setTargetDate(`${year}-${month}-${day}`);
  }, []);

  // 선택한 날짜의 주차 정보 계산
  useEffect(() => {
    if (targetDate) {
      const date = new Date(targetDate);
      const weekId = getWeekId(date);
      const { weekStart, weekEnd } = getWeekRange(date);

      setWeekInfo({
        weekId,
        weekStart,
        weekEnd,
      });
    }
  }, [targetDate]);

  // 스페이스 ID 조회 (코드로)
  const getSpaceIdByCode = async (code) => {
    try {
      const spaceRef = doc(db, 'spaces', code);
      const spaceDoc = await getDoc(spaceRef);

      if (!spaceDoc.exists()) {
        throw new Error('스페이스를 찾을 수 없습니다.');
      }

      return code;
    } catch (error) {
      console.error('❌ 스페이스 조회 실패:', error);
      throw error;
    }
  };

  // Receipt ID 생성 (타임스탬프 기반)
  const generateReceiptId = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}${minutes}${seconds}`;
  };

  // 더미 데이터 생성
  const createTestData = async () => {
    if (!weekInfo) {
      setMessage('주차 정보를 로드 중입니다...');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 스페이스 ID 조회
      const spaceId = await getSpaceIdByCode(spaceCode);

      // 분담자 목록 파싱 (쉼표로 구분)
      const splitAmongArray = splitAmong.split(',').map(s => s.trim()).filter(s => s);

      if (splitAmongArray.length === 0) {
        throw new Error('분담자를 입력해주세요.');
      }

      // 1. Settlement 주차 문서 확인 및 생성
      const settlementRef = doc(db, 'spaces', spaceId, 'settlement', weekInfo.weekId);
      const settlementSnap = await getDoc(settlementRef);

      if (!settlementSnap.exists()) {
        console.log('🆕 Settlement 주차 문서 생성:', weekInfo.weekId);
        await setDoc(settlementRef, {
          weekId: weekInfo.weekId,
          weekStart: Timestamp.fromDate(weekInfo.weekStart),
          weekEnd: Timestamp.fromDate(weekInfo.weekEnd),
          status: 'active',
          createdAt: Timestamp.now(),
          settledAt: null,
          participants: {},
          totalAmount: 0,
        });
      }

      // 2. Receipt ID 생성
      const now = new Date();
      const receiptId = generateReceiptId(now);

      // 3. 항목별 1인당 금액 계산 (올림)
      const perPerson = Math.ceil(amount / splitAmongArray.length);

      // 4. 영수증 데이터
      const receipt = {
        id: receiptId,
        submittedBy: 'TEST_USER',
        submittedByName: '테스트관리자',
        paidBy,
        paidByName,
        createdAt: Timestamp.fromDate(now),
        memo: memo || '',
        imageUrl: '',
        items: [
          {
            itemName,
            amount,
            splitAmong: splitAmongArray,
            perPerson,
          }
        ],
        totalAmount: amount,
      };

      // 5. Firestore에 저장
      const receiptRef = doc(
        db,
        'spaces',
        spaceId,
        'settlement',
        weekInfo.weekId,
        'receipts',
        receiptId
      );

      await setDoc(receiptRef, receipt);

      setMessage(`✅ 테스트 데이터 생성 완료!\n주차: ${weekInfo.weekId}\n영수증 ID: ${receiptId}`);

      console.log('✅ 테스트 데이터 생성:', {
        spaceId,
        weekId: weekInfo.weekId,
        receiptId,
        receipt,
      });

      // 3초 후 정산 페이지로 이동
      setTimeout(() => {
        navigate('/settlement');
      }, 3000);
    } catch (error) {
      console.error('❌ 테스트 데이터 생성 실패:', error);
      setMessage(`❌ 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-purple-600" />
              <h1 className="text-xl font-bold">테스트 데이터 생성</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 안내 메시지 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            ⚠️ 이 페이지는 테스트 전용입니다. 원하는 주차에 더미 영수증 데이터를 생성할 수 있습니다.
          </p>
        </div>

        {/* 주차 선택 */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold text-lg">주차 선택</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              날짜 선택 (해당 날짜가 포함된 주차에 데이터 생성)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {weekInfo && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm">
                <span className="font-medium">주차 ID:</span> {weekInfo.weekId}
              </p>
              <p className="text-sm">
                <span className="font-medium">기간:</span>{' '}
                {weekInfo.weekStart.toLocaleDateString('ko-KR')} ~{' '}
                {weekInfo.weekEnd.toLocaleDateString('ko-KR')}
              </p>
            </div>
          )}
        </div>

        {/* 테스트 데이터 입력 */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold text-lg">영수증 정보</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              스페이스 코드
            </label>
            <input
              type="text"
              value={spaceCode}
              onChange={(e) => setSpaceCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="37VXcw"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              항목명
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="치킨"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              금액 (원)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              낸 사람 (UID)
            </label>
            <input
              type="text"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="3828221463"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              낸 사람 이름
            </label>
            <input
              type="text"
              value={paidByName}
              onChange={(e) => setPaidByName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="낸사람"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분담자 (UID, 쉼표로 구분)
            </label>
            <input
              type="text"
              value={splitAmong}
              onChange={(e) => setSplitAmong(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="3848191355, 3828221463"
            />
            <p className="text-xs text-gray-500 mt-1">
              여러 명인 경우 쉼표로 구분하세요
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="테스트 데이터"
            />
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={createTestData}
          disabled={loading || !weekInfo}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '생성 중...' : '테스트 데이터 생성'}
        </button>

        {/* 메시지 */}
        {message && (
          <div className={`rounded-lg p-4 ${
            message.includes('❌')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            <pre className="text-sm whitespace-pre-wrap font-mono">{message}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDataPage;
