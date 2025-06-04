import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TickerColorMode = 'global' | 'aisa' | 'nothing' | 'shadow';

/**
 * 색상 모드별 라벨
 */
export const TICKER_COLOR_MODE_LABELS: Record<TickerColorMode, string> = {
  global: 'Global (기본)',
  aisa: 'Aisa (상승=빨강/하락=파랑)',
  nothing: 'Nothing (일반 글자색)',
  shadow: 'Shadow (회색)',
};

/**
 * 색상 모드별 설명
 */
export const TICKER_COLOR_MODE_DESCRIPTIONS: Record<TickerColorMode, string> = {
  global: '상승(초록) / 하락(빨강) / 보합(회색)',
  aisa: '상승(빨강) / 하락(파랑) / 보합(회색)',
  nothing: '모든 가격 변화에 대해 기본 텍스트 색상 사용',
  shadow: '흐릿한 회색 스타일',
};

/**
 * 색상 모드별 배경색 설정 (퍼센트 표시용)
 */
export const getTickerBackgroundColor = (mode: TickerColorMode, change: number): string => {
  if (change === 0) return 'rgba(156, 163, 175, 0.2)'; // 보합: 회색
  
  switch (mode) {
    case 'global':
      return change > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'; // 상승: 초록, 하락: 빨강
    case 'aisa':
      return change > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'; // 상승: 빨강, 하락: 파랑
    case 'nothing':
    case 'shadow':
      return 'rgba(156, 163, 175, 0.2)'; // 회색
    default:
      return 'rgba(156, 163, 175, 0.2)';
  }
};

/**
 * 가격 변화 애니메이션 관리를 위한 유틸리티
 */
export const createPriceChangeAnimationManager = () => {
  const animationTimers = new Map<string, NodeJS.Timeout>();
  const animationStates = new Map<string, boolean>();

  return {
    /**
     * 가격 변화 애니메이션 트리거
     * @param symbol 심볼 (예: 'BTC/USDT')
     * @param previousPrice 이전 가격
     * @param currentPrice 현재 가격
     * @param onAnimationChange 애니메이션 상태 변경 콜백
     */
    triggerPriceChangeAnimation: (
      symbol: string,
      previousPrice: number,
      currentPrice: number,
      onAnimationChange: (symbol: string, isAnimating: boolean) => void
    ) => {
      // 기존 타이머가 있으면 제거
      const existingTimer = animationTimers.get(symbol);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // 가격 변동 여부와 관계없이 무조건 애니메이션 실행
      // 애니메이션 시작
      animationStates.set(symbol, true);
      onAnimationChange(symbol, true);

      // 100ms 후 애니메이션 종료
      const timer = setTimeout(() => {
        animationStates.set(symbol, false);
        onAnimationChange(symbol, false);
        animationTimers.delete(symbol);
      }, 100);

      animationTimers.set(symbol, timer);
    },

    /**
     * 특정 심볼의 애니메이션 상태 확인
     */
    isAnimating: (symbol: string): boolean => {
      return animationStates.get(symbol) || false;
    },

    /**
     * 모든 애니메이션 정리
     */
    cleanup: () => {
      animationTimers.forEach(timer => clearTimeout(timer));
      animationTimers.clear();
      animationStates.clear();
    }
  };
};

/**
 * 테두리 스타일 설정 (애니메이션 포함)
 */
export const getTickerBorderStyle = (
  isAnimating: boolean, 
  mode: TickerColorMode, 
  previousPrice: number,
  currentPrice: number
): { borderColor?: string; borderWidth?: string } => {
  if (!isAnimating) {
    return { 
      borderColor: 'transparent',
      borderWidth: '1px'
    };
  }
  
  // 가격 비교로 색상 결정
  let priceChange = 0;
  if (currentPrice > previousPrice) {
    priceChange = 1; // 상승
  } else if (currentPrice < previousPrice) {
    priceChange = -1; // 하락
  } else {
    // 같을 때는 투명
    return { 
      borderColor: 'transparent',
      borderWidth: '1px'
    };
  }
  
  // 애니메이션 중일 때는 모드에 따른 색상 적용
  const borderColor = getBorderColorByMode(mode, priceChange);
  return { 
    borderColor,
    borderWidth: '1px'
  };
};

/**
 * 모드별 테두리 색상 반환
 */
const getBorderColorByMode = (mode: TickerColorMode, change: number): string => {
  switch (mode) {
    case 'global':
      return change > 0 ? '#22c55e' : '#ef4444'; // 상승: 초록, 하락: 빨강
    case 'aisa':
      return change > 0 ? '#ef4444' : '#3b82f6'; // 상승: 빨강, 하락: 파랑
    case 'nothing':
      return 'hsl(var(--foreground))'; // 기본 전경색
    case 'shadow':
      return '#9ca3af'; // 회색
    default:
      return 'transparent';
  }
};

/**
 * 티커 등락률에 따라 Tailwind 색상 클래스를 반환하는 유틸리티
 * @param mode 현재 색상 모드
 * @param change 등락률 (양수/음수/0)
 * @param type 'text' | 'border' | 'bg' (기본값: 'text')
 */
export function getTickerColorClass(
  mode: TickerColorMode,
  change: number,
  type: 'text' | 'border' | 'bg' = 'text'
): string {
  const prefix = type === 'text' ? 'text-' : type === 'border' ? 'border-' : 'bg-';
  const suffix = (color: string) => `${prefix}${color}`;
  
  switch (mode) {
    case 'global':
      if (change > 0) return suffix('green-500');
      if (change < 0) return suffix('red-500');
      return suffix('gray-400'); // 보합은 회색
    case 'aisa':
      if (change > 0) return suffix('red-500');
      if (change < 0) return suffix('blue-500');
      return suffix('gray-400'); // 보합은 회색
    case 'nothing':
      return type === 'text' ? 'text-foreground' : type === 'border' ? 'border-foreground' : 'bg-background';
    case 'shadow':
      return type === 'text' ? 'text-gray-400' : type === 'border' ? 'border-gray-400' : 'bg-gray-100';
    default:
      return type === 'text' ? 'text-foreground' : type === 'border' ? 'border-foreground' : 'bg-background';
  }
}

interface TickerSettingState {
  tickerColorMode: TickerColorMode;
  setTickerColorMode: (mode: TickerColorMode) => void;
}

export const useTickerSettingStore = create<TickerSettingState>()(
  persist(
    (set) => ({
      tickerColorMode: 'global',
      setTickerColorMode: (mode) => set({ tickerColorMode: mode }),
    }),
    {
      name: 'ticker-setting-store',
    }
  )
);
