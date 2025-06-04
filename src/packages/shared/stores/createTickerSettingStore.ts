import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TickerColorMode = 'global' | 'aisa' | 'nothing' | 'shadow';

/**
 * 색상 모드별 라벨
 */
export const TICKER_COLOR_MODE_LABELS: Record<TickerColorMode, string> = {
  global: '글로벌',
  aisa: '아시아',
  nothing: '색상 없음',
  shadow: '그림자'
};

/**
 * 색상 모드별 설명
 */
export const TICKER_COLOR_MODE_DESCRIPTIONS: Record<TickerColorMode, string> = {
  global: '상승: 녹색, 하락: 빨간색',
  aisa: '상승: 빨간색, 하락: 파란색',
  nothing: '모든 색상 동일',
  shadow: '회색 톤 사용'
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
export const createPriceChangeAnimationManager = (duration: BorderAnimationDuration = 150) => {
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

      // 설정된 시간 후 애니메이션 종료
      const timer = setTimeout(() => {
        animationStates.set(symbol, false);
        onAnimationChange(symbol, false);
        animationTimers.delete(symbol);
      }, duration);

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
 * 티커 테두리 스타일 반환
 * @param isAnimating 애니메이션 중인지 여부
 * @param mode 색상 모드
 * @param previousPrice 이전 가격
 * @param currentPrice 현재 가격
 * @param animationEnabled 애니메이션 활성화 여부
 */
export const getTickerBorderStyle = (
  isAnimating: boolean,
  mode: TickerColorMode,
  previousPrice: number,
  currentPrice: number,
  animationEnabled: boolean = true
): React.CSSProperties => {
  // 애니메이션이 비활성화되어 있으면 투명 테두리 반환
  if (!animationEnabled) {
    return {
      borderColor: 'transparent',
      borderWidth: '1px'
    };
  }

  // 애니메이션 중이 아니면 투명 테두리
  if (!isAnimating) {
    return {
      borderColor: 'transparent',
      borderWidth: '1px'
    };
  }
  
  // 가격 변화 계산
  const priceChange = currentPrice - previousPrice;
  
  // 가격이 동일하면 투명 테두리
  if (priceChange === 0) {
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

// 테두리 애니메이션 지속 시간 옵션
export type BorderAnimationDuration = 100 | 150 | 200;

// 테두리 애니메이션 지속 시간 옵션 라벨
export const BORDER_ANIMATION_DURATION_LABELS: Record<BorderAnimationDuration, string> = {
  100: '100ms (빠름)',
  150: '150ms (보통)',
  200: '200ms (느림)'
};

interface TickerSettingState {
  tickerColorMode: TickerColorMode;
  borderAnimationEnabled: boolean;
  borderAnimationDuration: BorderAnimationDuration;
  showPercentSymbol: boolean;
  showPriceChange: boolean;
}

interface TickerSettingActions {
  setTickerColorMode: (mode: TickerColorMode) => void;
  setBorderAnimationEnabled: (enabled: boolean) => void;
  setBorderAnimationDuration: (duration: BorderAnimationDuration) => void;
  setShowPercentSymbol: (show: boolean) => void;
  setShowPriceChange: (show: boolean) => void;
}

export const useTickerSettingStore = create<TickerSettingState & TickerSettingActions>()(
  persist(
    (set) => ({
      tickerColorMode: 'global',
      borderAnimationEnabled: true,
      borderAnimationDuration: 100,
      showPercentSymbol: true,
      showPriceChange: true,
      setTickerColorMode: (mode) => set({ tickerColorMode: mode }),
      setBorderAnimationEnabled: (enabled) => set({ borderAnimationEnabled: enabled }),
      setBorderAnimationDuration: (duration) => set({ borderAnimationDuration: duration }),
      setShowPercentSymbol: (show) => set({ showPercentSymbol: show }),
      setShowPriceChange: (show) => set({ showPriceChange: show }),
    }),
    {
      name: 'ticker-setting-store',
    }
  )
);
