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
          // 현재 HTML에 적용된 테마 클래스 확인 (인라인 스크립트에 의해 이미 적용되었을 수 있음)
          const isDarkClass = document.documentElement.classList.contains('dark');
          
          // localStorage에서 저장된 테마 확인
          const savedTheme = localStorage.getItem('theme') as Theme | null;
          
          // 시스템 테마 확인
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          
          // 우선순위: 1. localStorage 테마, 2. 이미 적용된 클래스, 3. 시스템 테마
          let initialTheme: Theme;
          if (savedTheme) {
            initialTheme = savedTheme as Theme;
          } else if (isDarkClass) {
            initialTheme = 'dark';
          } else {
            initialTheme = systemTheme;
          }

          // 상태 업데이트
          set((state) => {
            state.theme = initialTheme;
            state.isHydrated = true;
          });

          // 이미 적용된 클래스와 일치하는지 확인하고, 필요한 경우에만 업데이트
          const needsUpdate = (initialTheme === 'dark' && !isDarkClass) || 
                             (initialTheme === 'light' && isDarkClass);
                             
          if (needsUpdate) {
            document.documentElement.classList.toggle('dark', initialTheme === 'dark');
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[ThemeStore] 테마 초기화:', initialTheme, '(클래스 업데이트:', needsUpdate ? '필요' : '불필요', ')');
          }
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
