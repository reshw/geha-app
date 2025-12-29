// src/components/tour/TourOverlay.jsx
import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Utensils } from 'lucide-react';
import { useTour } from '../../contexts/TourContext';
import tours from '../../data/tourData';

const TourOverlay = () => {
  const { activeTour, currentStep, nextStep, prevStep, endTour } = useTour();
  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  const tourData = activeTour ? tours[activeTour] : null;
  const currentStepData = tourData?.steps[currentStep];
  const isLastStep = currentStep === (tourData?.steps.length - 1);
  const isFirstStep = currentStep === 0;

  // 하이라이트할 요소 찾기 및 위치 계산
  useEffect(() => {
    const updatePosition = () => {
      try {
        // highlightSelector가 없는 경우 (중앙 배치)
        if (!currentStepData?.highlightSelector) {
          setHighlightRect(null);

          // 중앙 배치를 위한 툴팁 위치 계산
          if (tooltipRef.current && currentStepData?.position === 'center') {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            setTooltipPosition({
              top: viewportHeight / 2 - tooltipRect.height / 2,
              left: viewportWidth / 2 - tooltipRect.width / 2,
            });
          }
          return;
        }

        const element = document.querySelector(currentStepData.highlightSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });

          // 툴팁 위치 계산
          if (tooltipRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = 0;
            let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

            // 위치에 따라 툴팁 배치
            if (currentStepData.position === 'top') {
              top = rect.top - tooltipRect.height - 20;
            } else if (currentStepData.position === 'bottom') {
              top = rect.bottom + 20;
            } else if (currentStepData.position === 'center') {
              // 중앙 배치
              top = viewportHeight / 2 - tooltipRect.height / 2;
              left = viewportWidth / 2 - tooltipRect.width / 2;
            } else {
              // 자동 배치: 화면 중앙 기준으로 위/아래 결정
              if (rect.top > viewportHeight / 2) {
                top = rect.top - tooltipRect.height - 20;
              } else {
                top = rect.bottom + 20;
              }
            }

            // 좌우 경계 체크 (center가 아닌 경우에만)
            if (currentStepData.position !== 'center') {
              if (left < 20) left = 20;
              if (left + tooltipRect.width > viewportWidth - 20) {
                left = viewportWidth - tooltipRect.width - 20;
              }

              // 상하 경계 체크
              if (top < 20) top = 20;
              if (top + tooltipRect.height > viewportHeight - 20) {
                top = viewportHeight - tooltipRect.height - 20;
              }
            }

            setTooltipPosition({ top, left });
          }
        } else {
          setHighlightRect(null);
        }
      } catch (error) {
        console.error('요소 찾기 실패:', error);
        setHighlightRect(null);
      }
    };

    updatePosition();

    // 화면 크기 변경 시 재계산
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStepData, currentStep]);

  // ESC 키로 투어 종료
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        endTour(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [endTour]);

  if (!tourData || !currentStepData) return null;

  const handlePrimaryAction = () => {
    if (isLastStep) {
      endTour(true);
    } else {
      nextStep();
    }
  };

  const handleSecondaryAction = () => {
    if (isFirstStep) {
      endTour(false);
    } else {
      prevStep();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* 어두운 배경 */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: 0.7 }}
        onClick={() => endTour(false)}
      />

      {/* Spotlight 효과 */}
      {highlightRect && (
        <>
          {/* 하이라이트 영역 (클릭 가능하게) */}
          <div
            className="absolute pointer-events-auto"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.7)',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
            }}
          />

          {/* 펄스 애니메이션 */}
          <div
            className="absolute pointer-events-none animate-ping"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              border: '2px solid rgba(59, 130, 246, 0.6)',
              borderRadius: '12px',
            }}
          />
        </>
      )}

      {/* 투어 카드 */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-2xl shadow-2xl max-w-md w-[90vw] pointer-events-auto"
        style={{
          top: highlightRect ? `${tooltipPosition.top}px` : '50%',
          left: highlightRect ? `${tooltipPosition.left}px` : '50%',
          transform: highlightRect ? 'none' : 'translate(-50%, -50%)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={() => endTour(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* 진행 표시기 */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-4">
            {tourData.steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* 투어 제목 */}
          <p className="text-xs text-blue-600 font-semibold mb-1">
            {tourData.title} • {currentStep + 1}/{tourData.steps.length}
          </p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h3>
        </div>

        {/* 내용 */}
        <div className="px-6 pb-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
            {currentStepData.content}
          </p>

          {/* 아이콘 표시 (있는 경우) */}
          {currentStepData.showIcon && (
            <div className="flex items-center justify-center mb-6 py-8 bg-amber-50 rounded-lg">
              <div className="relative">
                <Utensils className="w-16 h-16 text-amber-600" />
                {currentStepData.showIcon === 'utensils-with-badges' && (
                  <>
                    {/* 점심 배지 (녹색) */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    {/* 저녁 배지 (주황색) */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 이미지 (있는 경우) */}
          {currentStepData.image && (
            <img
              src={currentStepData.image}
              alt={currentStepData.title}
              className="w-full rounded-lg mb-6"
            />
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSecondaryAction}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              {isFirstStep ? '건너뛰기' : '이전'}
            </button>
            <button
              onClick={handlePrimaryAction}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLastStep ? (
                <>
                  <Check className="w-5 h-5" />
                  완료
                </>
              ) : (
                <>
                  다음
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
