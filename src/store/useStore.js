import { create } from 'zustand';

const useStore = create((set, get) => ({
  // 인증
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => set({ user: null, isLoggedIn: false, selectedSpace: null, spaces: [] }),

  // 스페이스 관리 (Phase 1 개선)
  spaces: [], // 사용자의 모든 스페이스 목록
  selectedSpace: null,

  // 스페이스 목록 설정
  setSpaces: (spaces) => {
    set({ spaces });

    // 스페이스가 있고 selectedSpace가 없으면 자동 선택
    const { selectedSpace } = get();
    if (spaces.length > 0 && !selectedSpace) {
      // localStorage에서 마지막 선택 공간 복원 시도
      const lastSelectedId = localStorage.getItem('lastSelectedSpaceId');
      const lastSpace = spaces.find(s => s.id === lastSelectedId);

      // 마지막 선택 공간이 있으면 복원, 없으면 order 0 또는 첫 번째 공간 선택
      const spaceToSelect = lastSpace || spaces.find(s => s.order === 0) || spaces[0];
      get().setSelectedSpace(spaceToSelect);
    }
  },

  // 선택된 스페이스 변경
  setSelectedSpace: (space) => {
    // localStorage에 마지막 선택 공간 ID 저장
    if (space?.id) {
      localStorage.setItem('lastSelectedSpaceId', space.id);
    } else {
      localStorage.removeItem('lastSelectedSpaceId');
    }
    set({ selectedSpace: space });
  },

  // 스페이스 순서 업데이트
  updateSpaceOrder: (updatedSpaces) => {
    set({ spaces: updatedSpaces });

    // 선택된 스페이스 정보도 업데이트
    const { selectedSpace } = get();
    if (selectedSpace) {
      const updatedSelectedSpace = updatedSpaces.find(s => s.id === selectedSpace.id);
      if (updatedSelectedSpace) {
        set({ selectedSpace: updatedSelectedSpace });
      }
    }
  },

  // 스페이스 추가
  addSpace: (space) => {
    const { spaces } = get();
    set({ spaces: [...spaces, space] });
  },

  // 스페이스 제거
  removeSpace: (spaceId) => {
    const { spaces, selectedSpace } = get();
    const updatedSpaces = spaces.filter(s => s.id !== spaceId);
    set({ spaces: updatedSpaces });

    // 제거된 스페이스가 선택된 스페이스였다면 다른 스페이스 선택
    if (selectedSpace?.id === spaceId) {
      if (updatedSpaces.length > 0) {
        get().setSelectedSpace(updatedSpaces[0]);
      } else {
        get().setSelectedSpace(null);
      }
    }
  },

  // 예약
  reservations: {},
  setReservations: (reservations) => set({ reservations }),

  // 프로필
  profiles: {},
  addProfiles: (newProfiles) => set((state) => ({
    profiles: { ...state.profiles, ...newProfiles }
  })),
}));

export default useStore;