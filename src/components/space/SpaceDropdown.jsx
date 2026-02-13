// src/components/space/SpaceDropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { GripVertical, ChevronDown, Plus } from 'lucide-react';
import UserTypeBadge from '../common/UserTypeBadge';
import useStore from '../../store/useStore';

const SpaceDropdown = ({ spaces, selectedSpace, onSelect, onReorder, onCreateSpace }) => {
  const { getTierConfig } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [orderedSpaces, setOrderedSpaces] = useState(spaces);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchCurrentY, setTouchCurrentY] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setOrderedSpaces(spaces);
  }, [spaces]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // userTypeMap 제거 - UserTypeBadge 컴포넌트 사용

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSpaces = [...orderedSpaces];
    const draggedItem = newSpaces[draggedIndex];
    newSpaces.splice(draggedIndex, 1);
    newSpaces.splice(index, 0, draggedItem);

    setOrderedSpaces(newSpaces);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      // order 값 업데이트
      const updatedSpaces = orderedSpaces.map((space, idx) => ({
        ...space,
        order: idx
      }));
      
      // 부모 컴포넌트에 순서 변경 알림
      if (onReorder) {
        await onReorder(updatedSpaces);
      }
      
      setOrderedSpaces(updatedSpaces);
    }
    setDraggedIndex(null);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e, index) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchCurrentY(touch.clientY);
    setDraggedIndex(index);
  };

  const handleTouchMove = (e, currentIndex) => {
    if (draggedIndex === null || touchStartY === null) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    setTouchCurrentY(touch.clientY);
    
    const itemHeight = 60; // 대략적인 항목 높이
    const diff = touch.clientY - touchStartY;
    const steps = Math.round(diff / itemHeight);
    
    if (steps !== 0) {
      const newIndex = Math.max(0, Math.min(orderedSpaces.length - 1, draggedIndex + steps));
      
      if (newIndex !== draggedIndex) {
        const newSpaces = [...orderedSpaces];
        const draggedItem = newSpaces[draggedIndex];
        newSpaces.splice(draggedIndex, 1);
        newSpaces.splice(newIndex, 0, draggedItem);
        
        setOrderedSpaces(newSpaces);
        setDraggedIndex(newIndex);
        setTouchStartY(touch.clientY);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (draggedIndex !== null) {
      const updatedSpaces = orderedSpaces.map((space, idx) => ({
        ...space,
        order: idx
      }));
      
      if (onReorder) {
        await onReorder(updatedSpaces);
      }
      
      setOrderedSpaces(updatedSpaces);
    }
    setDraggedIndex(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  const handleSelect = (space) => {
    onSelect(space);
    setIsOpen(false);
  };

  const selectedSpaceName = selectedSpace?.spaceName || selectedSpace?.name || '방 선택';
  const selectedUserType = selectedSpace?.userType || 'guest';

  // 선택된 스페이스의 tierConfig 가져오기
  const selectedSpaceId = selectedSpace?.id || selectedSpace?.spaceId;
  const selectedTierConfig = selectedSpaceId ? getTierConfig(selectedSpaceId) : null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* 선택된 방 표시 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(255,255,255,.08)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,.14)',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <UserTypeBadge userType={selectedUserType} tierConfig={selectedTierConfig} size="xs" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedSpaceName}
          </span>
        </div>
        <ChevronDown
          className="w-5 h-5 flex-shrink-0"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </button>

      {/* 드롭다운 목록 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 50,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {orderedSpaces.map((space, index) => {
            const spaceId = space.id || space.spaceId;
            const spaceName = space.spaceName || space.name || spaceId;
            const userType = space.userType || 'guest';
            const isSelected = (selectedSpace?.id || selectedSpace?.spaceId) === spaceId;
            const isDragging = draggedIndex === index;

            // 이 스페이스의 tierConfig 가져오기
            const spaceTierConfig = getTierConfig(spaceId);
            
            // 드래그 중일 때 이동 거리 계산
            let translateY = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 1;
            let boxShadow = 'none';
            
            if (isDragging && touchStartY && touchCurrentY) {
              translateY = touchCurrentY - touchStartY;
              scale = 1.05;
              opacity = 0.9;
              zIndex = 100;
              boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
            }

            return (
              <div
                key={spaceId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => {
                  // 드래그 핸들을 터치한 경우에만 드래그 시작
                  if (e.target.closest('.drag-handle')) {
                    handleTouchStart(e, index);
                  }
                }}
                onTouchMove={(e) => handleTouchMove(e, index)}
                onTouchEnd={handleTouchEnd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: isSelected ? '#f0f9ff' : isDragging ? '#e0f2fe' : '#fff',
                  borderBottom: index < orderedSpaces.length - 1 ? '1px solid #e5e7eb' : 'none',
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  transition: isDragging ? 'none' : 'all 0.2s ease',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                  boxShadow: boxShadow,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (draggedIndex === null && !isSelected) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (draggedIndex === null && !isSelected) {
                    e.currentTarget.style.background = '#fff';
                  }
                }}
              >
                {/* 드래그 핸들 */}
                <div
                  className="drag-handle"
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    color: isDragging ? '#2563eb' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    touchAction: 'none',
                    transition: 'color 0.2s'
                  }}
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* 방 정보 */}
                <div
                  onClick={() => handleSelect(space)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: 0
                  }}
                >
                  <UserTypeBadge userType={userType} tierConfig={spaceTierConfig} size="xs" />
                  <div style={{
                    fontWeight: '600',
                    fontSize: '15px',
                    color: isSelected ? '#2563eb' : '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {spaceName}
                  </div>
                </div>

                {/* 선택 표시 */}
                {isSelected && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2563eb'
                  }} />
                )}
              </div>
            );
          })}

          {/* 방 생성 신청 버튼 */}
          {onCreateSpace && (
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateSpace();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '600',
                fontSize: '15px',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
              }}
            >
              <Plus className="w-5 h-5" />
              <span>방 생성 신청</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SpaceDropdown;