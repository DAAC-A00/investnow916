/**
 * 관리자 모드 상태 관리 스토어 (Zustand + Immer)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// 관리자 모드 스토어 타입
interface AdminModeStore {
  // 상태
  isEnabled: boolean;
  
  // 액션
  isAdminMode: () => void;
  setAdminMode: (isEnabled: boolean) => void;
}

// 스토어 생성
export const useAdminModeStore = create<AdminModeStore>()(
  persist(
    immer(
      devtools(
        (set) => ({
          // 초기 상태
          isEnabled: false,

          // 액션들
          isAdminMode: () => 
            set(
              (state) => {
                state.isEnabled = !state.isEnabled;
              },
              false,
              'isAdminMode'
            ),

          setAdminMode: (isEnabled: boolean) =>
            set(
              (state) => {
                state.isEnabled = isEnabled;
              },
              false,
              'setAdminMode'
            ),
        })
      )
    ),
    {
      name: 'admin-mode-storage',
    }
  )
);

// 선택자 훅
export const useIsAdminModeEnabled = () => useAdminModeStore((state) => state.isEnabled);

// 액션 훅
export const useAdminModeActions = () => useAdminModeStore((state) => ({
  isAdminMode: state.isAdminMode,
  setAdminMode: state.setAdminMode,
}));
