// components/praise/PraiseModal.jsx
import { useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import useStore from '../../store/useStore';
import praiseService from '../../services/praiseService';
import { getWeeklyNickname, getWeeklyAnimalEmoji } from '../../utils/nicknameUtils';

export default function PraiseModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const { selectedSpace } = useStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    rawText: '',
    eventDate: new Date().toISOString().split('T')[0]
  });

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.rawText.trim()) {
      alert('내용을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      // 1. 사진 업로드 (있는 경우)
      let imageUrl = null;
      if (imageFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        uploadFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PRAISE);
        uploadFormData.append('folder', `spaces/${selectedSpace.id}/praises`);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: uploadFormData
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Cloudinary 오류:', errorData);
          throw new Error('사진 업로드 실패');
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.secure_url;
        console.log('✅ 사진 업로드 완료:', imageUrl);
        setUploading(false);
      }

      // 2. AI 처리
      console.log('🤖 AI 처리 시작...');
      const aiResponse = await fetch('/api/process-praise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: formData.rawText,
          eventDate: formData.eventDate
        })
      });

      if (!aiResponse.ok) {
        throw new Error('AI 처리 실패');
      }

      const aiResult = await aiResponse.json();
      console.log('✅ AI 처리 완료:', aiResult);

      // 3. Firebase에 저장
      const weeklyNickname = getWeeklyNickname(user.id);
      const weeklyAnimalEmoji = getWeeklyAnimalEmoji(user.id);

      const praiseData = {
        userId: user.id,
        userName: weeklyNickname,
        animalEmoji: weeklyAnimalEmoji,
        nickname: weeklyNickname,
        userType: selectedSpace.userType,
        originalText: aiResult.originalText,
        refinedText: aiResult.refinedText,
        category: aiResult.category,
        itemName: aiResult.itemName,
        eventDate: formData.eventDate,
        imageUrl: imageUrl,
        status: 'pending'
      };

      await praiseService.create(selectedSpace.id, praiseData);
      console.log('✅ 칭찬 등록 완료');

      // 4. 관리자 이메일 알림
      try {
        await fetch('/api/send-praise-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spaceId: selectedSpace.id,
            spaceName: selectedSpace.spaceName,
            userName: weeklyNickname,
            originalText: aiResult.originalText,
            refinedText: aiResult.refinedText,
            eventDate: formData.eventDate
          })
        });
        console.log('📧 관리자 알림 발송 완료');
      } catch (emailError) {
        console.warn('이메일 발송 실패 (무시):', emailError);
      }

      alert('칭찬이 등록되었습니다!\n관리자 승인 후 게시됩니다.');
      onSuccess();

    } catch (error) {
      console.error('❌ 칭찬 등록 실패:', error);
      alert('칭찬 등록에 실패했습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">✨ 칭찬하기</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 내용 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              칭찬하고 싶은 일을 적어주세요
            </label>
            <textarea
              value={formData.rawText}
              onChange={(e) => setFormData({ ...formData, rawText: e.target.value })}
              placeholder="예: 오늘 설거지 다 해놨어요&#10;예: 쓰레기 분리수거 했습니다"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={5}
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 AI가 자동으로 익명화하고 정리해드립니다
            </p>
          </div>

          {/* 날짜 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              언제 있었던 일인가요?
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* 사진 첨부 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              📷 사진 (선택)
            </label>
            
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">클릭하여 사진 선택</p>
                  <p className="text-xs text-gray-500 mt-1">최대 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  disabled={loading}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                사진 업로드 중...
              </>
            ) : loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                처리 중...
              </>
            ) : (
              '제출하기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}