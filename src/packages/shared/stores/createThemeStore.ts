import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isHydrated: boolean;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  devtools(
    immer((set, get) => ({
      // 초기 상태
      theme: 'light',
      isHydrated: false,

      // 테마 설정
      setTheme: (theme: Theme) => {
        set((state) => {
          state.theme = theme;
        });
        
        // localStorage에 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', theme);
          // HTML 클래스 업데이트
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },

      // 테마 토글
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // 테마 초기화 (localStorage에서 읽기)
      initializeTheme: () => {
        if (typeof window === 'undefined') return;

        try {
          const savedTheme = localStorage.getItem('theme') as Theme | null;
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          const initialTheme = savedTheme || systemTheme;

          set((state) => {
            state.theme = initialTheme;
            state.isHydrated = true;
          });

          // HTML 클래스 설정
          document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        } catch (error) {
          console.error('테마 초기화 실패:', error);
          set((state) => {
            state.theme = 'light';
            state.isHydrated = true;
          });
        }
      },
    })),
    {
      name: 'theme-store',
    }
  )
);

// 선택자 함수들
export const useTheme = () => useThemeStore((state) => state.theme);
export const useIsHydrated = () => useThemeStore((state) => state.isHydrated);
export const useThemeActions = () => useThemeStore((state) => ({
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
  initializeTheme: state.initializeTheme,
}));
