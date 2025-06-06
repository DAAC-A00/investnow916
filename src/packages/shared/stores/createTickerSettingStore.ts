import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  TickerColorMode, 
  getTickerColor
} from '@/packages/ui-kit/tokens/design-tokens';

// 디자인 토큰에서 import한 타입을 re-export
export type { TickerColorMode };

/**
 * 색상 모드별 라벨
 */
export const TICKER_COLOR_MODE_LABELS: Record<TickerColorMode, string> = {
  global: '글로벌',
  asia: '아시아',
  nothing: '색상 없음',
  gray: '회색'
};

/**
 * 색상 모드별 설명
 */
export const TICKER_COLOR_MODE_DESCRIPTIONS: Record<TickerColorMode, string> = {
  global: '상승: 녹색, 하락: 빨간색',
  asia: '상승: 빨간색, 하락: 파란색',
  nothing: '모든 색상 동일',
  gray: '회색 톤 사용'
};

/**
 * 색상 모드별 배경색 설정 (퍼센트 표시용) - 디자인 토큰 기반
 */
export const getTickerBackgroundColor = (mode: TickerColorMode, change: number): string => {
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
  let borderColor;
  if (priceChange > 0) {
    borderColor = getTickerColor(mode, 'up');
  } else if (priceChange < 0) {
    borderColor = getTickerColor(mode, 'down');
  } else {
    borderColor = getTickerColor(mode, 'unchanged');
  }
  return { 
    borderColor: 'hsl(' + borderColor + ')',
    borderWidth: '1px'
  };
};

/**
 * 티커 가격 텍스트 스타일 반환
 * @param mode 색상 모드
 * @param priceChange 가격 변동량 (양수/음수/0)
 */
export const getTickerPriceStyle = (
  mode: TickerColorMode,
  priceChange: number
): React.CSSProperties => {
  // 가격 변동량에 따른 색상 결정
  let color;
  if (priceChange > 0) {
    color = getTickerColor(mode, 'up');
  } else if (priceChange < 0) {
    color = getTickerColor(mode, 'down');
  } else {
    color = getTickerColor(mode, 'unchanged');
  }
  
  return { 
    color: 'hsl(' + color + ')'
  };
};

/**
 * 티커 변동률 배경 스타일 반환
 * @param mode 색상 모드
 * @param priceChange 가격 변동값
 * @param showBackground 배경색 표시 여부
 */
export const getTickerPercentBackgroundStyle = (
  mode: TickerColorMode,
  priceChange: number,
  showBackground: boolean = true
): React.CSSProperties => {
  if (!showBackground) {
    return {
      backgroundColor: 'transparent'
    };
  }

  let backgroundColor;
  if (priceChange > 0) {
    const upColor = getTickerColor(mode, 'up');
    backgroundColor = upColor;
  } else if (priceChange < 0) {
    const downColor = getTickerColor(mode, 'down');
    backgroundColor = downColor;
  } else {
    const unchangedColor = getTickerColor(mode, 'unchanged');
    backgroundColor = unchangedColor;
  }
  
  return { 
    backgroundColor: 'hsla(' + backgroundColor + ', 0.2)'
  };
};

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
  showPercentBackground: boolean;
}

interface TickerSettingActions {
  setTickerColorMode: (mode: TickerColorMode) => void;
  setBorderAnimationEnabled: (enabled: boolean) => void;
  setBorderAnimationDuration: (duration: BorderAnimationDuration) => void;
  setShowPercentSymbol: (show: boolean) => void;
  setShowPriceChange: (show: boolean) => void;
  setShowPercentBackground: (show: boolean) => void;
}

export const useTickerSettingStore = create<TickerSettingState & TickerSettingActions>()(
  persist(
    (set) => ({
      tickerColorMode: 'global',
      borderAnimationEnabled: true,
      borderAnimationDuration: 100,
      showPercentSymbol: true,
      showPriceChange: true,
      showPercentBackground: true,
      setTickerColorMode: (mode) => set({ tickerColorMode: mode }),
      setBorderAnimationEnabled: (enabled) => set({ borderAnimationEnabled: enabled }),
      setBorderAnimationDuration: (duration) => set({ borderAnimationDuration: duration }),
      setShowPercentSymbol: (show) => set({ showPercentSymbol: show }),
      setShowPriceChange: (show) => set({ showPriceChange: show }),
      setShowPercentBackground: (show) => set({ showPercentBackground: show }),
    }),
    {
      name: 'ticker-setting-store',
    }
  )
);
