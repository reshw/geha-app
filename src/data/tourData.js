// src/data/tourData.js

export const TOUR_IDS = {
  MEAL_CHECK: 'meal-check-v1',
  SETTLEMENT: 'settlement-v1',
};

export const tours = {
  [TOUR_IDS.MEAL_CHECK]: {
    id: TOUR_IDS.MEAL_CHECK,
    title: '밥 체크 기능',
    description: '매일 밥을 먹을지 체크하고, 참여 인원을 확인해보세요!',
    version: '1.0',
    steps: [
      {
        title: '밥 체크 기능을 시작합니다',
        content: '예약 페이지에서 밥 체크 기능을 사용할 수 있어요.\n캘린더를 통해 매일 점심과 저녁을 관리해보세요!',
        image: null,
        highlightSelector: null,
        position: 'center',
        primaryAction: '시작하기',
        secondaryAction: '건너뛰기',
        navigationPath: '/', // 예약 페이지로 이동
      },
      {
        title: '밥 체크 버튼 찾기',
        content: '캘린더의 각 날짜 옆에 있는 포크 아이콘을 눌러보세요.\n그 날의 밥 체크 화면이 열립니다.',
        showIcon: 'utensils',
        highlightSelector: null,
        position: 'center',
        primaryAction: '다음',
        secondaryAction: '건너뛰기',
      },
      {
        title: '점심/저녁 선택하기',
        content: '점심 또는 저녁 카드를 선택하면\n참여자 목록을 확인하고 참여/취소할 수 있어요.',
        image: null,
        highlightSelector: '.meal-section-tabs',
        position: 'top',
        primaryAction: '다음',
        secondaryAction: '이전',
      },
      {
        title: '참여자 확인하기',
        content: '누가 밥을 먹는지 실시간으로 확인하고,\n하단 버튼으로 참여하거나 취소할 수 있어요.\n\n체크한 내용은 캘린더의 포크 아이콘에 표시되어\n언제든지 내 식사 일정을 확인할 수 있습니다!',
        showIcon: 'utensils-with-badges',
        highlightSelector: null,
        position: 'center',
        primaryAction: '완료',
        secondaryAction: '이전',
      },
    ],
  },

  [TOUR_IDS.SETTLEMENT]: {
    id: TOUR_IDS.SETTLEMENT,
    title: '정산 기능',
    description: '영수증을 등록하고 자동으로 정산해보세요!',
    version: '1.0',
    steps: [
      {
        title: '정산 기능을 시작합니다',
        content: '정산 페이지에서 영수증을 등록하고\n자동으로 정산할 수 있어요!',
        image: null,
        highlightSelector: null,
        position: 'center',
        primaryAction: '시작하기',
        secondaryAction: '건너뛰기',
        navigationPath: '/settlement', // 정산 페이지로 이동
      },
      {
        title: '내 정산 현황',
        content: '이번 주 내가 낸 금액과 부담액을 확인하고,\n정산 결과를 한눈에 볼 수 있어요.',
        image: null,
        highlightSelector: '.bg-gradient-to-br.from-blue-500.to-blue-600',
        position: 'bottom',
        primaryAction: '다음',
        secondaryAction: '건너뛰기',
      },
      {
        title: '내 참여내역 확인',
        content: '"내 참여내역" 탭에서는\n내가 분담자로 포함된 영수증만 볼 수 있어요.\n내가 낼 금액을 빠르게 확인할 수 있습니다!',
        image: null,
        highlightSelector: '[data-tour="my-receipts-tab"]',
        position: 'bottom',
        primaryAction: '다음',
        secondaryAction: '이전',
      },
      {
        title: '영수증 제출 버튼',
        content: '우측 하단의 "+ 영수증 제출" 버튼을 눌러\n영수증을 제출할 수 있어요.',
        image: null,
        highlightSelector: '[data-tour="submit-receipt-button"]',
        position: 'top',
        primaryAction: '다음',
        secondaryAction: '이전',
      },
      {
        title: '영수증 제출 페이지',
        content: '영수증 제출 페이지에서\n다양한 정보를 입력할 수 있어요.',
        image: null,
        highlightSelector: null,
        position: 'center',
        primaryAction: '다음',
        secondaryAction: '이전',
        navigationPath: '/settlement/submit',
      },
      {
        title: '귀속일 선택',
        content: '영수증의 귀속일을 선택할 수 있어요.\n과거 날짜도 선택 가능하며, 해당 주차가 마감되었으면\n자동으로 정산 가능한 주차에 등록됩니다.',
        image: null,
        highlightSelector: '[data-tour="belongs-date-input"]',
        position: 'bottom',
        primaryAction: '다음',
        secondaryAction: '이전',
      },
      {
        title: '영수증 사진 첨부',
        content: '영수증 사진을 찍거나 갤러리에서 선택하세요.\n나중에 확인할 때 편리합니다!',
        image: null,
        highlightSelector: '.receipt-image-upload',
        position: 'bottom',
        primaryAction: '다음',
        secondaryAction: '이전',
      },
      {
        title: '돈 낸 사람 선택',
        content: '실제로 돈을 낸 사람을 선택하세요.\n기본값은 본인으로 설정되어 있어요.',
        image: null,
        highlightSelector: '.paid-by-section',
        position: 'bottom',
        primaryAction: '다음',
        secondaryAction: '이전',
      },
      {
        title: '항목별 분담자 설정',
        content: '각 항목마다 누가 비용을 분담할지 선택할 수 있어요.\n본인은 자동으로 추가되며, X 버튼으로 제외할 수 있습니다.',
        image: null,
        highlightSelector: '.item-split-section',
        position: 'top',
        primaryAction: '완료',
        secondaryAction: '이전',
      },
    ],
  },
};

export default tours;
