import { useState, useEffect } from 'react';
import { X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ['칵테일', '맥주', '위스키', '안주', '기타'];

export default function BartenderMenuFormModal({ mode, menu, onClose, onSave, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    menuName: '',
    price: '',
    category: '칵테일',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (mode === 'edit' && menu) {
      setFormData({
        menuName: menu.menuName || '',
        price: menu.price?.toString() || '',
        category: menu.category || '칵테일',
        description: menu.description || '',
        imageUrl: menu.imageUrl || ''
      });
      if (menu.imageUrl) {
        setImagePreview(menu.imageUrl);
      }
    }
  }, [mode, menu]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.menuName.trim()) {
      alert('메뉴명을 입력해주세요');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('가격을 올바르게 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.imageUrl;

      // 새 이미지 업로드
      if (imageFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        uploadFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        uploadFormData.append('folder', 'bartender-menu');

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: uploadFormData
          }
        );

        if (!uploadResponse.ok) {
          throw new Error('이미지 업로드 실패');
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.secure_url;
        console.log('✅ 이미지 업로드 완료:', imageUrl);
        setUploading(false);
      }

      const menuData = {
        menuName: formData.menuName.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description.trim(),
        imageUrl: imageUrl,
        ...(mode === 'create' ? {
          createdBy: currentUser.id,
          createdByName: currentUser.displayName
        } : {
          updatedBy: currentUser.id,
          updatedByName: currentUser.displayName
        })
      };

      await onSave(menuData);
      onClose();
    } catch (error) {
      console.error('❌ 메뉴 저장 실패:', error);
      alert('메뉴 저장에 실패했습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? '메뉴 추가' : '메뉴 수정'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 메뉴명 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              메뉴명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.menuName}
              onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="예: 진토닉"
              disabled={loading}
              required
            />
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              가격 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="15000"
                disabled={loading}
                required
                min="0"
                step="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="메뉴에 대한 설명을 입력하세요"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              메뉴 이미지
            </label>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="메뉴 이미지 미리보기"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-semibold">클릭하여 이미지 업로드</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG (최대 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            )}
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
              {uploading ? (
                <>
                  <Upload className="w-5 h-5 animate-bounce" />
                  업로드 중...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  저장 중...
                </>
              ) : (
                mode === 'create' ? '추가' : '수정'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
