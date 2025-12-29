// components/praise/PraiseDetailModal.jsx
import { X, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { getWeeklyAnimalEmoji } from '../../utils/nicknameUtils';

export default function PraiseDetailModal({ praise, onClose }) {
  // 저장된 값 사용 (없으면 동적 생성 - 하위호환성)
  const animalEmoji = praise.animalEmoji || getWeeklyAnimalEmoji(praise.userId);

  const getCategoryIcon = (category) => {
    switch(category) {
      case '물품기부': return '🎁';
      case '청소정리': return '🧹';
      case '기타': return '✨';
      default: return '✨';
    }
  };

  return (
    <>
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="bg-white w-full sm:max-w-md overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl"
          style={{
            maxHeight: '85vh',
            height: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-900">칭찬 상세</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          {/* 스크롤 가능한 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 기본 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{animalEmoji}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar size={16} />
                {formatDate(praise.eventDate)}
              </div>
            </div>

            {/* 내용 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 leading-relaxed">
                {praise.refinedText}
              </p>
            </div>

            {/* 사진 */}
            {praise.imageUrl && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">📷 사진</h3>
                <div className="relative">
                  <img 
                    src={praise.imageUrl} 
                    alt="칭찬 사진"
                    className="w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(praise.imageUrl, '_blank')}
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    클릭하여 크게 보기
                  </div>
                </div>
              </div>
            )}

            {/* 물품 정보 */}
            {praise.category === '물품기부' && praise.itemName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <span className="text-xl">{getCategoryIcon(praise.category)}</span>
                  <span className="font-medium">{praise.itemName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}