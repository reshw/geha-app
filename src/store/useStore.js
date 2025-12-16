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
    if (space?.id) {
      try {
        const spaceDocRef = doc(db, 'spaces', space.id);
        const spaceDoc = await getDoc(spaceDocRef);
        
        if (spaceDoc.exists()) {
          const spaceData = spaceDoc.data();
          space.accountBank = spaceData.accountBank;
          space.accountNumber = spaceData.accountNumber;
          space.accountHolder = spaceData.accountHolder;
          console.log('✅ 계좌 정보 로드 완료:', {
            accountBank: spaceData.accountBank,
            accountNumber: spaceData.accountNumber,
            accountHolder: spaceData.accountHolder,
          });
        }
      } catch (error) {
        console.error('❌ 계좌 정보 로드 실패:', error);
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