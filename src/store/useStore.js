// useStore.js
import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const useStore = create((set, get) => ({
  // 인증
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => set({ user: null, isLoggedIn: false, selectedSpace: null }),
  
  // 스페이스
  selectedSpace: null,
  setSelectedSpace: async (space) => {
    // 계좌 정보 로드
    if (space?.id) {
      try {
        const accountDocRef = doc(db, 'spaces', space.id, 'settings', 'account');
        const accountDoc = await getDoc(accountDocRef);
        
        if (accountDoc.exists()) {
          const accountData = accountDoc.data();
          space.accountBank = accountData.accountBank;
          space.accountNumber = accountData.accountNumber;
          space.accountHolder = accountData.accountHolder;
        }
      } catch (error) {
        console.warn('⚠️ 계좌 정보 로드 실패 (기본값 사용):', error);
      }
    }
    
    set({ selectedSpace: space });
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