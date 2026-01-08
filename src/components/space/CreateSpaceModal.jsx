// src/components/space/CreateSpaceModal.jsx
import { useState } from 'react';
import { X, Home, AlertCircle } from 'lucide-react';

const CreateSpaceModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [spaceName, setSpaceName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // 유효성 검사
    if (!spaceName.trim()) {
      setError('방 이름을 입력해주세요');
      return;
    }

    if (spaceName.trim().length < 2) {
      setError('방 이름은 2글자 이상이어야 합니다');
      return;
    }

    if (spaceName.trim().length > 30) {
      setError('방 이름은 30글자 이하여야 합니다');
      return;
    }

    setError('');
    await onSubmit(spaceName.trim());
  };

  const handleClose = () => {
    setSpaceName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">방 생성 신청</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-blue-100">
            새로운 방을 만들어 멤버들과 함께 사용하세요
          </p>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 안내 메시지 */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">방 생성 안내</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 신청 후 관리자 승인이 필요합니다</li>
                  <li>• 승인 완료 시 자동으로 방이 생성됩니다</li>
                  <li>• 생성된 방의 관리자가 됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 입력 필드 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={spaceName}
              onChange={(e) => {
                setSpaceName(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSubmit();
                }
              }}
              placeholder="예: 라운지 1층"
              maxLength={30}
              disabled={isLoading}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all
                ${error
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'}
                disabled:bg-gray-50 disabled:cursor-not-allowed`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              {spaceName.length}/30 글자
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !spaceName.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>신청 중...</span>
                </div>
              ) : (
                '신청하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSpaceModal;
