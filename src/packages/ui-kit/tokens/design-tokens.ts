/**
 * 🎨 InvestNow916 디자인 토큰 시스템
 * 
 * 모든 디자인 토큰은 여기에서 중앙 집중 관리되며,
 * 웹(Tailwind)과 모바일(Tamagui) 간 완벽한 일관성을 보장합니다.
 * 
 * 구조:
 * - 색상: HSL 형식으로 테마별 자동 조정
 * - 타이포그래피: 반응형 텍스트 스케일
 * - 간격: 4px 그리드 시스템
 * - 그림자: 일관된 깊이 표현
 * - 애니메이션: 부드러운 전환 효과
 */

// ===== 🎨 색상 팔레트 =====
// HSL 형식으로 정의하여 명도/채도 조정이 용이하도록 구성
export const colorTokens = {
  // 🔵 Primary - 브랜드 메인 색상 (파란색 계열)
  primary: {
    50: '217 91% 98%',   // 거의 흰색
    100: '217 91% 95%',  // 매우 연한 파랑
    200: '217 91% 90%',  // 연한 파랑
    300: '217 91% 80%',  // 중간 연한 파랑
    400: '217 91% 70%',  // 중간 파랑
    500: '217 91% 60%',  // 기본 파랑 (DEFAULT)
    600: '217 91% 50%',  // 진한 파랑
    700: '217 91% 40%',  // 더 진한 파랑
    800: '217 91% 30%',  // 매우 진한 파랑
    900: '217 91% 20%',  // 거의 검은 파랑
    950: '217 91% 10%',  // 가장 진한 파랑
    DEFAULT: '217 91% 60%',
    foreground: '0 0% 100%', // 흰색 텍스트
  },

  // 🟢 Success/Up - 성공/상승 (초록색 계열)
  success: {
    50: '142 76% 96%',
    100: '141 84% 92%',
    200: '141 79% 85%',
    300: '142 77% 73%',
    400: '142 69% 58%',
    500: '142 71% 45%',   // 기본 초록 (DEFAULT)
    600: '142 76% 36%',
    700: '142 72% 29%',
    800: '144 61% 20%',
    900: '145 80% 10%',
    950: '145 80% 5%',
    DEFAULT: '142 71% 45%',
    foreground: '0 0% 100%',
  },

  // 🔴 Error/Down - 오류/하락 (빨간색 계열)
  error: {
    50: '0 86% 97%',
    100: '0 93% 94%',
    200: '0 96% 89%',
    300: '0 94% 82%',
    400: '0 91% 71%',
    500: '0 84% 60%',     // 기본 빨강 (DEFAULT)
    600: '0 72% 51%',
    700: '0 74% 42%',
    800: '0 70% 35%',
    900: '0 63% 31%',
    950: '0 75% 15%',
    DEFAULT: '0 84% 60%',
    foreground: '0 0% 100%',
  },

  // 🟡 Warning - 경고/주의 (주황색 계열)
  warning: {
    50: '38 92% 97%',
    100: '39 97% 93%',
    200: '40 97% 85%',
    300: '41 97% 69%',
    400: '35 96% 62%',
    500: '32 95% 53%',    // 기본 주황 (DEFAULT)
    600: '26 90% 46%',
    700: '21 83% 39%',
    800: '22 78% 31%',
    900: '22 73% 26%',
    950: '21 83% 14%',
    DEFAULT: '32 95% 53%',
    foreground: '0 0% 100%',
  },

  // ⚫ Gray - 회색 계열 (중성 색상)
  gray: {
    50: '210 20% 98%',    // 거의 흰색
    100: '220 14% 96%',   // 매우 연한 회색
    200: '220 13% 91%',   // 연한 회색
    300: '216 12% 84%',   // 중간 연한 회색
    400: '218 11% 65%',   // 중간 회색
    500: '220 9% 46%',    // 기본 회색
    600: '215 14% 34%',   // 진한 회색
    700: '217 19% 27%',   // 더 진한 회색
    800: '215 28% 17%',   // 매우 진한 회색
    900: '221 39% 11%',   // 거의 검은 회색
    950: '224 71% 4%',    // 가장 진한 회색
    DEFAULT: '220 9% 46%', // 기본값 추가
  },

  // 🟣 Secondary - 보조 색상 (보라색 계열)
  secondary: {
    50: '270 100% 98%',
    100: '269 100% 95%',
    200: '269 100% 92%',
    300: '268 100% 86%',
    400: '270 95% 75%',
    500: '270 91% 65%',   // 기본 보라 (DEFAULT)
    600: '271 91% 55%',
    700: '272 84% 45%',
    800: '273 87% 35%',
    900: '274 100% 25%',
    950: '276 100% 15%',
    DEFAULT: '270 91% 65%',
    foreground: '0 0% 100%',
  },

  // 🔶 Accent - 강조 색상 (티파니 블루)
  accent: {
    50: '174 100% 97%',
    100: '174 86% 94%',
    200: '174 87% 85%',
    300: '174 77% 75%',
    400: '174 71% 60%',
    500: '174 80% 45%',   // 기본 티파니 (DEFAULT)
    600: '174 80% 35%',
    700: '174 82% 25%',
    800: '174 86% 15%',
    900: '174 90% 10%',
    950: '174 95% 5%',
    DEFAULT: '174 80% 45%',
    foreground: '0 0% 100%',
  },

  // 🎯 티커 색상 시스템 (금융 서비스 특화)
  ticker: {
    light: {
      // Global 모드: 상승 녹색, 하락 빨간색, 보합 회색
      global: {
        up: '142 71% 45%',      // 상승: 녹색 (success-500)
        down: '0 84% 60%',      // 하락: 빨간색 (error-500)
        unchanged: '220 9% 46%', // 보합: 회색 (gray-500)
      },
      // Asia 모드: 상승 빨간색, 하락 파란색, 보합 회색
      asia: {
        up: '0 84% 60%',        // 상승: 빨간색 (error-500)
        down: '217 91% 60%',    // 하락: 파란색 (primary-500)
        unchanged: '220 9% 46%', // 보합: 회색 (gray-500)
      },
      // Nothing 모드: 라이트 모드 일반 텍스트 색상
      nothing: {
        up: '221 39% 11%',      // 라이트 모드 foreground
        down: '221 39% 11%',    // 라이트 모드 foreground
        unchanged: '221 39% 11%', // 라이트 모드 foreground
      },
      // Gray 모드: 모든 색상 회색
      gray: {
        up: '220 9% 46%',       // 회색 (gray-500)
        down: '220 9% 46%',     // 회색 (gray-500)
        unchanged: '220 9% 46%', // 회색 (gray-500)
      },
    },
    dark: {
      // Global 모드: 상승 녹색, 하락 빨간색, 보합 회색 (라이트와 동일)
      global: {
        up: '142 71% 45%',      // 상승: 녹색 (success-500)
        down: '0 84% 60%',      // 하락: 빨간색 (error-500)
        unchanged: '220 9% 46%', // 보합: 회색 (gray-500)
      },
      // Asia 모드: 상승 빨간색, 하락 파란색, 보합 회색 (라이트와 동일)
      asia: {
        up: '0 84% 60%',        // 상승: 빨간색 (error-500)
        down: '217 91% 60%',    // 하락: 파란색 (primary-500)
        unchanged: '220 9% 46%', // 보합: 회색 (gray-500)
      },
      // Nothing 모드: 다크 모드 일반 텍스트 색상
      nothing: {
        up: '210 20% 98%',      // 다크 모드 foreground
        down: '210 20% 98%',    // 다크 모드 foreground
        unchanged: '210 20% 98%', // 다크 모드 foreground
      },
      // Gray 모드: 모든 색상 회색 (라이트와 동일)
      gray: {
        up: '220 9% 46%',       // 회색 (gray-500)
        down: '220 9% 46%',     // 회색 (gray-500)
        unchanged: '220 9% 46%', // 회색 (gray-500)
      },
    },
  },
} as const;

/**
 * 색상 모드별 배경색 설정 (퍼센트 표시용) - 디자인 토큰 기반
 */
export const getTickerBackgroundColor = (
  mode: TickerColorMode,
  change: number
): string => {
  if (change === 0) {
    const unchangedColor = getTickerColor(mode, 'unchanged');
    return `hsla(${unchangedColor}, 0.2)`;
  }
  if (change > 0) {
    const upColor = getTickerColor(mode, 'up');
    return `hsla(${upColor}, 0.2)`;
  } else {
    const downColor = getTickerColor(mode, 'down');
    return `hsla(${downColor}, 0.2)`;
  }
};

// ===== 📝 타이포그래피 =====
// 반응형 텍스트 스케일과 폰트 설정
export const typography = {
  fontFamily: {
    sans: [
      'Pretendard Variable',
      'Pretendard',
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'Roboto',
      'Helvetica Neue',
      'Segoe UI',
      'Apple SD Gothic Neo',
      'Noto Sans KR',
      'Malgun Gothic',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Consolas',
      'Monaco',
      'Andale Mono',
      'Ubuntu Mono',
      'monospace',
    ],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
    '8xl': ['6rem', { lineHeight: '1' }],         // 96px
    '9xl': ['8rem', { lineHeight: '1' }],         // 128px
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// ===== 📏 간격 시스템 =====
// 4px 그리드 기반 일관된 간격
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// ===== 🌟 그림자 시스템 =====
// 일관된 깊이감 표현을 위한 그림자 팔레트
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
  
  // 금융 앱 전용 그림자
  card: '0 2px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  ticker: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ===== 🔄 애니메이션 =====
// 부드러운 전환 효과를 위한 애니메이션 토큰
export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    slideUp: {
      '0%': { transform: 'translateY(10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
} as const;

// ===== 📐 Border Radius =====
// 일관된 모서리 둥글기
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ===== 🎯 브레이크포인트 =====
// 반응형 디자인을 위한 화면 크기 기준점
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===== 🔧 유틸리티 함수 =====
// 디자인 토큰을 활용한 헬퍼 함수들

/**
 * 색상 팔레트에서 특정 색상 추출
 */
export const getColor = (color: keyof typeof colorTokens, shade?: string | number): string => {
  const colorPalette = colorTokens[color];
  if (typeof colorPalette === 'string') {
    return colorPalette;
  }
  if (shade && typeof colorPalette === 'object' && shade in colorPalette) {
    return (colorPalette as any)[shade];
  }
  if (typeof colorPalette === 'object' && 'DEFAULT' in colorPalette) {
    return (colorPalette as any).DEFAULT;
  }
  if (typeof colorPalette === 'object' && '500' in colorPalette) {
    return (colorPalette as any)['500'];
  }
  return '';
};

/**
 * 티커 색상 모드 타입 정의
 */
export type TickerColorMode = 'global' | 'asia' | 'nothing' | 'gray';

/**
 * 티커 색상을 반환
 */
export const getTickerColor = (
  mode: TickerColorMode, 
  changeStatus: 'up' | 'down' | 'unchanged'
): string => {
  // 현재 테마 감지 (DOM에서 dark 클래스 확인)
  let currentTheme: 'light' | 'dark' = 'light';
  if (typeof window !== 'undefined') {
    currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  
  const colorValue = colorTokens.ticker[currentTheme][mode][changeStatus];
  return colorValue;
};

// ===== 📤 타입 정의 내보내기 =====
export type ColorTokens = typeof colorTokens;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Shadows = typeof shadows;
export type Animation = typeof animation;
export type BorderRadius = typeof borderRadius;
export type Breakpoints = typeof breakpoints;

// 전체 디자인 토큰 객체
export const designTokens = {
  colors: colorTokens,
  typography,
  spacing,
  shadows,
  animation,
  borderRadius,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;
