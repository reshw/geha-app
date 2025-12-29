// components/praise/PraiseCard.jsx
import { useState } from 'react';
import { Calendar, CheckCircle, XCircle, Edit2, Save, ImageIcon } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { getWeeklyAnimalEmoji, getWeeklyNickname } from '../../utils/nicknameUtils';
import PraiseDetailModal from './PraiseDetailModal';

export default function PraiseCard({ praise, isManager, onApprove, onReject, onUpdate, weeklyCount }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(praise.refinedText);
  const [editedCategory, setEditedCategory] = useState(praise.category || '기타');
  const [editedItemName, setEditedItemName] = useState(praise.itemName || '');
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isPending = praise.status === 'pending';
  // 저장된 값 사용 (없으면 동적 생성 - 하위호환성)
  const animalEmoji = praise.animalEmoji || getWeeklyAnimalEmoji(praise.userId);
  const nickname = praise.nickname || getWeeklyNickname(praise.userId);

  const handleSave = async () => {
    try {
      await onUpdate(praise.id, {
        refinedText: editedText,
        category: editedCategory,
        itemName: editedItemName
      });
      setIsEditing(false);
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정에 실패했습니다');
    }
  };

  const handleCardClick = () => {
    // 관리자가 편집 중이 아닐 때만 상세 모달 열기
    if (!isEditing) {
      setShowDetailModal(true);
    }
  };

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
      <div 
        className={`bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
          isPending ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
        }`}
        onClick={handleCardClick}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{animalEmoji}</span>
            {/* 관리자에게만 닉네임 + 주간 제보 횟수 표시 */}
            {isManager && isPending && (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-700">{nickname}</span>
                {weeklyCount > 0 && (
                  <span className="text-xs text-gray-500">이번 주 {weeklyCount}번 제보</span>
                )}
              </div>
            )}
            {isPending && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                승인대기
              </span>
            )}
          </div>
          {/* 선행 발생 날짜 */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={14} />
            {formatDate(praise.eventDate)}
          </div>
        </div>

        {/* 카테고리 정보 (관리자에게만 표시) */}
        {isManager && isPending && (
          <div className="mb-3 space-y-2">
            {isEditing ? (
              <>
                {/* 편집 모드: 선택 가능 */}
                <div onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="물품기부">🎁 물품기부</option>
                    <option value="청소정리">🧹 청소정리</option>
                    <option value="기타">✨ 기타</option>
                  </select>
                </div>
                
                {editedCategory === '물품기부' && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">물품명</label>
                    <input
                      type="text"
                      value={editedItemName}
                      onChange={(e) => setEditedItemName(e.target.value)}
                      placeholder="예: 돼지고기"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* 보기 모드: 텍스트로 표시 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm">
                  <span className="text-gray-600">카테고리: </span>
                  <span className="font-medium text-gray-900">
                    {getCategoryIcon(praise.category)} {praise.category || '기타'}
                  </span>
                </div>
                
                {praise.category === '물품기부' && praise.itemName && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
                    <span className="text-blue-700">물품명: </span>
                    <span className="font-medium text-blue-900">{praise.itemName}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 내용 */}
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
            rows={3}
          />
        ) : (
          <p className="text-gray-900 leading-relaxed mb-3">
            {praise.refinedText}
          </p>
        )}

        {/* 하단: 사진 아이콘 + 물품 태그 */}
        <div className="flex items-center justify-between text-sm">
          {praise.imageUrl && (
            <div className="flex items-center gap-1 text-gray-600">
              <ImageIcon size={16} />
              <span>사진 있음</span>
            </div>
          )}
          
          {praise.category === '물품기부' && praise.itemName && (
            <div className="flex items-center gap-1 text-blue-600 font-medium ml-auto">
              {getCategoryIcon(praise.category)}
              <span>{praise.itemName}</span>
            </div>
          )}
        </div>

        {/* 원본 텍스트 (관리자만) */}
        {isManager && isPending && !isEditing && (
          <details className="mt-3" onClick={(e) => e.stopPropagation()}>
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
              원본 보기
            </summary>
            <p className="text-sm text-gray-600 mt-2 pl-3 border-l-2 border-gray-300">
              {praise.originalText}
            </p>
          </details>
        )}

        {/* 관리자 액션 버튼 */}
        {isManager && isPending && (
          <div className="space-y-2 mt-3" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 border border-blue-200"
                >
                  <Save size={16} />
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditedText(praise.refinedText);
                    setEditedCategory(praise.category || '기타');
                    setEditedItemName(praise.itemName || '');
                    setIsEditing(false);
                  }}
                  className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 border border-gray-200"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 border border-gray-200"
                >
                  <Edit2 size={16} />
                  수정
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(praise.id)}
                    className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 border border-green-200"
                  >
                    <CheckCircle size={16} />
                    승인
                  </button>
                  <button
                    onClick={() => onReject(praise.id)}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 border border-red-200"
                  >
                    <XCircle size={16} />
                    거부
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {showDetailModal && (
        <PraiseDetailModal
          praise={praise}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
}