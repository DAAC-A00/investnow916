/**
 * 관리자 모드 상태 관리 스토어 (Zustand + Immer)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 상태 타입 정의
interface AdminModeStore {
  // 상태
  isEnabled: boolean;

  // 액션
  isAdminMode: () => void;
  setAdminMode: (isEnabled: boolean) => void;
}

// 커스텀 localStorage 관리 함수
const saveToLocalStorage = (isEnabled: boolean) => {
  if (isEnabled) {
    localStorage.setItem('isAdminMode', 'true');
  } else {
    localStorage.removeItem('isAdminMode');
  }
};

const loadFromLocalStorage = (): boolean => {
  return localStorage.getItem('isAdminMode') === 'true';
};

// 스토어 생성
export const useAdminModeStore = create<AdminModeStore>()(
  immer(
    devtools(
      (set) => ({
        // 초기 상태 - localStorage에서 값 로드
        isEnabled: typeof window !== 'undefined' ? loadFromLocalStorage() : false,

        // 액션들
        isAdminMode: () => 
          set(
            (state) => {
              state.isEnabled = !state.isEnabled;
              saveToLocalStorage(state.isEnabled);
            },
            false,
            'isAdminMode'
          ),

        setAdminMode: (isEnabled: boolean) =>
          set(
            (state) => {
              state.isEnabled = isEnabled;
              saveToLocalStorage(state.isEnabled);
            },
            false,
            'setAdminMode'
          ),
      })
    )
  )
);

// 선택자 훅
export const useIsAdminModeEnabled = () => useAdminModeStore((state) => state.isEnabled);

// 액션 훅
export const useAdminModeActions = () => useAdminModeStore((state) => ({
  isAdminMode: state.isAdminMode,
  setAdminMode: state.setAdminMode,
}));
