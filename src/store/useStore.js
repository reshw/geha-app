import { create } from 'zustand';

const useStore = create((set) => ({
  // 인증
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => set({ user: null, isLoggedIn: false, selectedSpace: null }),
  
  // 스페이스
  selectedSpace: null,
  setSelectedSpace: (space) => set({ selectedSpace: space }),
  
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