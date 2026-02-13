import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, ImageIcon, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import expenseService from '../services/expenseService';
import spaceSettingsService from '../services/spaceSettingsService';
import { canAccessFinance } from '../utils/permissions';
import { uploadImage, validateImage, createPreviewUrl, revokePreviewUrl } from '../utils/imageUpload';

const ExpenseRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSpace } = useStore();

  const [selectedType, setSelectedType] = useState('expense'); // 'expense' | 'income'
  const [usedAt, setUsedAt] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [memo, setMemo] = useState('');

  // 지출용 상태
  const [items, setItems] = useState([
    {
      itemName: '',
      itemPrice: '',
      itemQty: 1,
      itemSpec: '',
    }
  ]);

  // 입금용 상태
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 권한 체크
  useEffect(() => {
    const checkPermission = async () => {
      if (!selectedSpace?.id || !user) return;

      try {
        const financePermission = await spaceSettingsService.getFinancePermission(selectedSpace.id);
        const hasAccess = canAccessFinance(selectedSpace.userType, financePermission);

        if (!hasAccess) {
          alert('재정 관리 페이지에 접근 권한이 없습니다.');
          navigate('/');
        }
      } catch (error) {
        console.error('권한 체크 실패:', error);
      }
    };

    checkPermission();
  }, [selectedSpace, user, navigate]);

  // 항목 추가
  const addItem = () => {
    setItems([...items, {
      itemName: '',
      itemPrice: '',
      itemQty: 1,
      itemSpec: '',
    }]);
  };
  
  // 항목 삭제
  const removeItem = (index) => {
    if (items.length === 1) {
      alert('최소 1개 항목은 필요합니다.');
      return;
    }
    
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  // 항목 필드 변경
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  
  // 이미지 선택
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // 유효성 검사
      validateImage(file, 5); // 최대 5MB
      
      // 기존 프리뷰 해제
      if (imagePreview) {
        revokePreviewUrl(imagePreview);
      }
      
      // 프리뷰 생성
      const previewUrl = createPreviewUrl(file);
      
      setImageFile(file);
      setImagePreview(previewUrl);
    } catch (error) {
      alert(error.message);
    }
  };
  
  // 이미지 삭제
  const removeImage = () => {
    if (imagePreview) {
      revokePreviewUrl(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };
  
  // 총액 계산
  const calculateTotal = () => {
    if (selectedType === 'income') {
      return parseFloat(incomeAmount) || 0;
    }
    return items.reduce((sum, item) => {
      const price = parseFloat(item.itemPrice) || 0;
      const qty = parseInt(item.itemQty) || 0;
      return sum + (price * qty);
    }, 0);
  };
  
  // 유효성 검사
  const validateForm = () => {
    // 사용일자 체크
    if (!usedAt) {
      alert(selectedType === 'income' ? '입금일자를 선택해주세요.' : '사용일자를 선택해주세요.');
      return false;
    }

    if (selectedType === 'income') {
      // 입금 타입 검증
      if (!incomeName.trim()) {
        alert('항목명을 입력해주세요.');
        return false;
      }

      if (!incomeAmount || parseFloat(incomeAmount) <= 0) {
        alert('금액을 입력해주세요.');
        return false;
      }
    } else {
      // 지출 타입 검증 (기존 로직)
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (!item.itemName.trim()) {
          alert(`${i + 1}번 항목의 품목명을 입력해주세요.`);
          return false;
        }

        if (!item.itemPrice || parseFloat(item.itemPrice) <= 0) {
          alert(`${i + 1}번 항목의 단가를 입력해주세요.`);
          return false;
        }

        if (!item.itemQty || parseInt(item.itemQty) <= 0) {
          alert(`${i + 1}번 항목의 수량을 입력해주세요.`);
          return false;
        }
      }
    }

    return true;
  };
  
  // 제출
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const confirmMessage = selectedType === 'income'
      ? '입금 내역을 등록하시겠습니까?'
      : '운영비를 청구하시겠습니까?';

    if (!window.confirm(confirmMessage)) return;

    setIsSubmitting(true);

    try {
      console.log(`💰 ${selectedType === 'income' ? '입금' : '지출'} 등록 시작`);

      // 이미지 업로드 (있는 경우만)
      let imageUrl = '';
      if (imageFile) {
        console.log('📤 이미지 업로드 중...');
        imageUrl = await uploadImage(imageFile, selectedSpace.id);
        console.log('✅ 이미지 업로드 완료:', imageUrl);
      }

      // Firebase에 저장
      const requestData = {
        type: selectedType,
        userId: user.id,
        userName: user.displayName || user.name,
        usedAt: new Date(usedAt),
        memo: memo.trim(),
        imageUrl: imageUrl,
      };

      if (selectedType === 'income') {
        // 입금 타입
        requestData.itemName = incomeName.trim();
        requestData.totalAmount = parseFloat(incomeAmount);
        requestData.transactionType = 'manual';
      } else {
        // 지출 타입
        const cleanedItems = items.map(item => ({
          itemName: item.itemName.trim(),
          itemPrice: parseFloat(item.itemPrice),
          itemQty: parseInt(item.itemQty),
          itemSpec: item.itemSpec.trim(),
        }));
        requestData.items = cleanedItems;
      }

      console.log('📤 청구 데이터:', requestData);

      await expenseService.createExpense(selectedSpace.id, requestData);

      console.log('✅ 등록 완료');
      alert(selectedType === 'income' ? '입금 내역이 등록되었습니다!' : '운영비 청구가 완료되었습니다!');

      // 이미지 프리뷰 정리
      if (imagePreview) {
        revokePreviewUrl(imagePreview);
      }

      navigate('/expenses');
    } catch (error) {
      console.error('❌ 등록 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR') + '원';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/expenses')}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">재정 관리</h1>
              <p className="text-white/80 text-sm mt-1">
                {selectedSpace?.spaceName || '스페이스'} 입금 및 지출 관리
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 타입 선택 탭 */}
      <div className="max-w-2xl mx-auto px-4 -mt-4 mb-4 relative z-10">
        <div className="bg-white rounded-xl shadow-sm p-2 flex gap-2">
          <button
            onClick={() => setSelectedType('expense')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              selectedType === 'expense'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💸 지출
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              selectedType === 'income'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💰 입금
          </button>
        </div>
      </div>

      {/* 폼 */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 사용일자 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {selectedType === 'income' ? '입금일자' : '사용일자'}
          </label>
          <input
            type="date"
            value={usedAt}
            onChange={(e) => setUsedAt(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* 증빙 이미지 (전체 청구에 대한 하나의 이미지) */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            증빙 이미지 (선택)
          </label>
          
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="영수증 미리보기"
                className="w-full rounded-lg border border-gray-300"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  클릭하여 영수증 이미지 선택
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  최대 5MB (JPG, PNG, GIF, WEBP)
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
        
        {/* 입금 폼 (입금 타입일 때) */}
        {selectedType === 'income' ? (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">💰 입금 정보</h2>

            {/* 항목명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                항목명 *
              </label>
              <input
                type="text"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
                placeholder="예: 회비, 게스트비, 기부금"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 금액 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금액 *
              </label>
              <input
                type="number"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          /* 지출 폼 (기존 품목 리스트) */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">📋 품목 내역</h2>
              <button
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                항목 추가
              </button>
            </div>
          
          {items.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">항목 {index + 1}</span>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* 품목명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품목명 *
                </label>
                <input
                  type="text"
                  value={item.itemName}
                  onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                  placeholder="예: 화장지, 세제, 전구"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 단가 & 수량 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    단가 *
                  </label>
                  <input
                    type="number"
                    value={item.itemPrice}
                    onChange={(e) => updateItem(index, 'itemPrice', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    수량 *
                  </label>
                  <input
                    type="number"
                    value={item.itemQty}
                    onChange={(e) => updateItem(index, 'itemQty', e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* 규격 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  규격 (선택)
                </label>
                <input
                  type="text"
                  value={item.itemSpec}
                  onChange={(e) => updateItem(index, 'itemSpec', e.target.value)}
                  placeholder="예: 2L, 500ml, 대형"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 소계 */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">소계</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency((parseFloat(item.itemPrice) || 0) * (parseInt(item.itemQty) || 0))}
                </span>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* 메모 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            메모 (선택)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={selectedType === 'income' ? '입금 관련 참고사항을 입력해주세요' : '청구 사유나 참고사항을 입력해주세요'}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* 총액 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">총액</span>
            <span className="text-3xl font-bold text-blue-600">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>
        
        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full py-4 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedType === 'income'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
              : 'bg-gradient-to-r from-red-600 to-pink-600'
          }`}
        >
          {isSubmitting
            ? (selectedType === 'income' ? '입금 등록 중...' : '청구 처리 중...')
            : (selectedType === 'income' ? '입금 등록하기' : '청구하기')
          }
        </button>
      </div>
    </div>
  );
};

export default ExpenseRequestPage;