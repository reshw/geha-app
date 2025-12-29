// src/contexts/TourContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import tourService from '../services/tourService';
import tours from '../data/tourData';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [activeTour, setActiveTour] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // 사용자가 완료한 투어 목록 로드
  useEffect(() => {
    if (user?.id) {
      loadCompletedTours();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCompletedTours = async () => {
    try {
      setLoading(true);
      const completed = await tourService.getCompletedTours(user.id);
      setCompletedTours(completed);
    } catch (error) {
      console.error('투어 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 투어 시작
  const startTour = (tourId) => {
    const tourData = tours[tourId];
    if (!tourData) {
      console.error('투어를 찾을 수 없습니다:', tourId);
      return;
    }

    // 투어의 첫 번째 스텝에 navigationPath가 있으면 해당 페이지로 이동
    const firstStep = tourData.steps[0];
    if (firstStep?.navigationPath) {
      navigate(firstStep.navigationPath);
      // 페이지 이동 후 약간의 딜레이를 줘서 페이지가 로드된 후 투어 시작
      setTimeout(() => {
        setActiveTour(tourId);
        setCurrentStep(0);
      }, 500);
    } else {
      setActiveTour(tourId);
      setCurrentStep(0);
    }
  };

  // 다음 단계
  const nextStep = () => {
    const nextStepIndex = currentStep + 1;
    const tourData = tours[activeTour];

    if (!tourData || nextStepIndex >= tourData.steps.length) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    const nextStepData = tourData.steps[nextStepIndex];

    // 다음 스텝에 navigationPath가 있으면 페이지 이동
    if (nextStepData?.navigationPath) {
      navigate(nextStepData.navigationPath);
      // 페이지 이동 후 약간의 딜레이를 줘서 페이지가 로드된 후 스텝 변경
      setTimeout(() => {
        setCurrentStep(nextStepIndex);
      }, 500);
    } else {
      setCurrentStep(nextStepIndex);
    }
  };

  // 이전 단계
  const prevStep = () => {
    const prevStepIndex = Math.max(0, currentStep - 1);
    const tourData = tours[activeTour];

    if (!tourData) {
      setCurrentStep(prevStepIndex);
      return;
    }

    const prevStepData = tourData.steps[prevStepIndex];

    // 이전 스텝에 navigationPath가 있으면 페이지 이동
    if (prevStepData?.navigationPath) {
      navigate(prevStepData.navigationPath);
      // 페이지 이동 후 약간의 딜레이를 줘서 페이지가 로드된 후 스텝 변경
      setTimeout(() => {
        setCurrentStep(prevStepIndex);
      }, 500);
    } else {
      setCurrentStep(prevStepIndex);
    }
  };

  // 투어 종료
  const endTour = async (markAsCompleted = true) => {
    if (markAsCompleted && activeTour && user?.id) {
      try {
        await tourService.markTourAsCompleted(user.id, activeTour);
        setCompletedTours((prev) => [...prev, activeTour]);
      } catch (error) {
        console.error('투어 완료 저장 실패:', error);
      }
    }
    setActiveTour(null);
    setCurrentStep(0);
  };

  // 투어를 완료했는지 확인
  const isTourCompleted = (tourId) => {
    return completedTours.includes(tourId);
  };

  // 투어 다시 보기
  const resetTour = async (tourId) => {
    if (user?.id) {
      try {
        await tourService.resetTour(user.id, tourId);
        setCompletedTours((prev) => prev.filter((id) => id !== tourId));
      } catch (error) {
        console.error('투어 리셋 실패:', error);
      }
    }
  };

  const value = {
    activeTour,
    currentStep,
    completedTours,
    loading,
    startTour,
    nextStep,
    prevStep,
    endTour,
    isTourCompleted,
    resetTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
