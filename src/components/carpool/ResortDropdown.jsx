// src/components/carpool/ResortDropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { GripVertical, ChevronDown, Plus } from 'lucide-react';

/**
 * 스키장 선택 드롭다운
 *
 * SpaceDropdown 패턴 재사용
 * - 드래그&드롭 순서 변경
 * - 스키장 추가 버튼
 */
const ResortDropdown = ({ resorts, selectedResort, onSelect, onReorder, onAddResort }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [orderedResorts, setOrderedResorts] = useState(resorts);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchCurrentY, setTouchCurrentY] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setOrderedResorts(resorts);
  }, [resorts]);

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

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newResorts = [...orderedResorts];
    const draggedItem = newResorts[draggedIndex];
    newResorts.splice(draggedIndex, 1);
    newResorts.splice(index, 0, draggedItem);

    setOrderedResorts(newResorts);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      const updatedResorts = orderedResorts.map((resort, idx) => ({
        ...resort,
        order: idx
      }));

      if (onReorder) {
        await onReorder(updatedResorts);
      }

      setOrderedResorts(updatedResorts);
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

    const itemHeight = 60;
    const diff = touch.clientY - touchStartY;
    const steps = Math.round(diff / itemHeight);

    if (steps !== 0) {
      const newIndex = Math.max(0, Math.min(orderedResorts.length - 1, draggedIndex + steps));

      if (newIndex !== draggedIndex) {
        const newResorts = [...orderedResorts];
        const draggedItem = newResorts[draggedIndex];
        newResorts.splice(draggedIndex, 1);
        newResorts.splice(newIndex, 0, draggedItem);

        setOrderedResorts(newResorts);
        setDraggedIndex(newIndex);
        setTouchStartY(touch.clientY);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (draggedIndex !== null) {
      const updatedResorts = orderedResorts.map((resort, idx) => ({
        ...resort,
        order: idx
      }));

      if (onReorder) {
        await onReorder(updatedResorts);
      }

      setOrderedResorts(updatedResorts);
    }
    setDraggedIndex(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  const handleSelect = (resort) => {
    onSelect(resort);
    setIsOpen(false);
  };

  const selectedResortName = selectedResort?.name || '스키장 선택';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* 선택된 스키장 표시 */}
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
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selectedResortName}
        </span>
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
          {orderedResorts.map((resort, index) => {
            const isSelected = selectedResort?.id === resort.id;
            const isDragging = draggedIndex === index;

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
                key={resort.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => {
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
                  borderBottom: index < orderedResorts.length - 1 ? '1px solid #e5e7eb' : 'none',
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

                {/* 스키장 정보 */}
                <div
                  onClick={() => handleSelect(resort)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    minWidth: 0
                  }}
                >
                  <div style={{
                    fontWeight: '600',
                    fontSize: '15px',
                    color: isSelected ? '#2563eb' : '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {resort.name}
                  </div>
                  {resort.distance && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {resort.distance}km · {resort.recommendedCost?.toLocaleString()}원
                    </div>
                  )}
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

          {/* 스키장 추가 버튼 */}
          {onAddResort && (
            <button
              onClick={() => {
                setIsOpen(false);
                onAddResort();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
              }}
            >
              <Plus className="w-5 h-5" />
              <span>스키장 추가</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResortDropdown;
