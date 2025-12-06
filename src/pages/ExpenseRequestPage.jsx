import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, ImageIcon, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import expenseService from '../services/expenseService';
import { uploadImage, validateImage, createPreviewUrl, revokePreviewUrl } from '../utils/imageUpload';

const ExpenseRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSpace } = useStore();
  
  const [usedAt, setUsedAt] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [memo, setMemo] = useState('');
  const [items, setItems] = useState([
    {
      itemName: '',
      itemPrice: '',
      itemQty: 1,
      itemSpec: '',
      imageFile: null,
      imagePreview: null,
      imageUrl: '',
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  
  // 항목 추가
  const addItem = () => {
    setItems([...items, {
      itemName: '',
      itemPrice: '',
      itemQty: 1,
      itemSpec: '',
      imageFile: null,
      imagePreview: null,
      imageUrl: '',
    }]);
  };
  
  // 항목 삭제
  const removeItem = (index) => {
    if (items.length === 1) {
      alert('최소 1개 항목은 필요합니다.');
      return;
    }
    
    // 이미지 프리뷰 URL 해제
    if (items[index].imagePreview) {
      revokePreviewUrl(items[index].imagePreview);
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
  const handleImageChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // 유효성 검사
      validateImage(file, 5); // 최대 5MB
      
      // 기존 프리뷰 해제
      if (items[index].imagePreview) {
        revokePreviewUrl(items[index].imagePreview);
      }
      
      // 프리뷰 생성
      const previewUrl = createPreviewUrl(file);
      
      updateItem(index, 'imageFile', file);
      updateItem(index, 'imagePreview', previewUrl);
    } catch (error) {
      alert(error.message);
    }
  };
  
  // 이미지 삭제
  const removeImage = (index) => {
    if (items[index].imagePreview) {
      revokePreviewUrl(items[index].imagePreview);
    }
    updateItem(index, 'imageFile', null);
    updateItem(index, 'imagePreview', null);
    updateItem(index, 'imageUrl', '');
  };
  
  // 총액 계산
  const calculateTotal = () => {
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
      alert('사용일자를 선택해주세요.');
      return false;
    }
    
    // 항목 체크
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
    
    return true;
  };
  
  // 제출
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (!window.confirm('운영비를 청구하시겠습니까?')) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('💰 운영비 청구 시작');
      
      // 이미지 업로드
      const itemsWithImages = await Promise.all(
        items.map(async (item, index) => {
          if (item.imageFile) {
            setUploadingIndex(index);
            const imageUrl = await uploadImage(item.imageFile, selectedSpace.id);
            return {
              itemName: item.itemName.trim(),
              itemPrice: parseFloat(item.itemPrice),
              itemQty: parseInt(item.itemQty),
              itemSpec: item.itemSpec.trim(),
              imageUrl: imageUrl,
            };
          } else {
            return {
              itemName: item.itemName.trim(),
              itemPrice: parseFloat(item.itemPrice),
              itemQty: parseInt(item.itemQty),
              itemSpec: item.itemSpec.trim(),
              imageUrl: '',
            };
          }
        })
      );
      
      setUploadingIndex(null);
      
      // Firebase에 저장
      const requestData = {
        userId: user.id,
        userName: user.displayName || user.name,
        usedAt: new Date(usedAt),
        memo: memo.trim(),
        items: itemsWithImages,
      };
      
      console.log('📤 청구 데이터:', requestData);
      
      await expenseService.createExpense(selectedSpace.id, requestData);
      
      console.log('✅ 청구 완료');
      alert('운영비 청구가 완료되었습니다!');
      
      // 이미지 프리뷰 정리
      items.forEach(item => {
        if (item.imagePreview) {
          revokePreviewUrl(item.imagePreview);
        }
      });
      
      navigate('/expenses');
    } catch (error) {
      console.error('❌ 청구 실패:', error);
      alert('청구 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setUploadingIndex(null);
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
              <h1 className="text-2xl font-bold">운영비 청구</h1>
              <p className="text-white/80 text-sm mt-1">
                {selectedSpace?.spaceName || '스페이스'} 운영비 청구하기
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 폼 */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 사용일자 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            사용일자
          </label>
          <input
            type="date"
            value={usedAt}
            onChange={(e) => setUsedAt(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* 품목 리스트 */}
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
              
              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영수증 이미지 (선택)
                </label>
                
                {item.imagePreview ? (
                  <div className="relative">
                    <img 
                      src={item.imagePreview} 
                      alt="미리보기"
                      className="w-full rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => removeImage(index)}
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
                        클릭하여 이미지 선택
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        최대 5MB (JPG, PNG, GIF, WEBP)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 메모 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            메모 (선택)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="청구 사유나 참고사항을 입력해주세요"
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
          disabled={isSubmitting || uploadingIndex !== null}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? uploadingIndex !== null 
              ? `이미지 업로드 중... (${uploadingIndex + 1}/${items.length})`
              : '청구 처리 중...'
            : '청구하기'
          }
        </button>
      </div>
    </div>
  );
};

export default ExpenseRequestPage;