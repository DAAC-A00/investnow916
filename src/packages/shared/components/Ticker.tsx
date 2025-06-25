'use client';

import { useState, useEffect, useRef } from 'react';
import { useTickerSettingStore, getTickerBorderStyle, getTickerPriceStyle, getTickerPercentBackgroundStyle, createPriceChangeAnimationManager, BottomDisplayMode } from '@/packages/shared/stores/createTickerSettingStore';
import { TickerData, WARNING_TYPE_LABELS } from '@/packages/shared/types/exchange';
import { formatPrice, formatPriceChange, PriceDecimalTracker } from '@/packages/shared/utils';

interface TickerProps {
  data: TickerData;
  className?: string;
  onPriceChange?: (symbol: string, oldPrice: number, newPrice: number) => void;
  priceTracker?: PriceDecimalTracker; // 가격 추적기 (선택사항)  
  onClick?: (data: TickerData) => void; // 클릭 이벤트 핸들러 추가
}

// 동적 폰트 크기 계산 함수
const calculateFontSize = (text: string, baseFontSize: number, maxLength: number) => {
  const length = text.length;
  if (length <= maxLength) return baseFontSize;
  
  // 길이가 초과하면 비례적으로 폰트 크기 감소
  const reduction = Math.min((length - maxLength) * 0.05, 0.3); // 최대 0.3rem까지만 감소
  return Math.max(baseFontSize - reduction, baseFontSize * 0.6); // 최소 기본 크기의 60%까지만
};

// percent 영역의 동적 폰트 크기 계산 함수 (고정 너비를 고려)
const calculatePercentFontSize = (text: string, baseFontSize: number, fixedWidthRem: number) => {
  const estimatedWidthPerChar = 0.5; // rem 단위로 문자당 예상 너비
  const availableWidth = fixedWidthRem - 0.5; // 여백을 위한 패딩 고려
  const estimatedTextWidth = text.length * estimatedWidthPerChar;
  
  if (estimatedTextWidth <= availableWidth) return baseFontSize;
  
  // 텍스트가 너무 길면 폰트 크기 축소
  const scaleFactor = availableWidth / estimatedTextWidth;
  return Math.max(baseFontSize * scaleFactor, baseFontSize * 0.6); // 최소 기본 크기의 60%까지만
};

// rem 변환 함수
const toRemSize = (size: number) => `${size}rem`;

export function Ticker({ data, className = '', onPriceChange, priceTracker, onClick }: TickerProps) {
  const { 
    tickerColorMode,
    borderAnimationEnabled,
    borderAnimationDuration,
    showPercentSymbol,
    showPercentBackground,
    bottomDisplayMode
  } = useTickerSettingStore();

  // hydration 오류 방지를 위한 클라이언트 전용 상태
  const [isClient, setIsClient] = useState(false);
  const [clientBottomDisplayMode, setClientBottomDisplayMode] = useState<BottomDisplayMode>('priceChange');

  useEffect(() => {
    setIsClient(true);
    setClientBottomDisplayMode(bottomDisplayMode);
  }, [bottomDisplayMode]);

  // 이전 가격 저장 (애니메이션 트리거용) - data.prevPrice가 있으면 사용, 없으면 현재 가격으로 초기화
  const [previousPrice, setPreviousPrice] = useState<number>(data.prevPrice ?? data.price);
  
  // 테두리 애니메이션 상태 관리
  const [borderAnimation, setBorderAnimation] = useState<boolean>(false);

  // 애니메이션 매니저 생성 (설정된 지속 시간 사용)
  const [animationManager, setAnimationManager] = useState(() => createPriceChangeAnimationManager(borderAnimationDuration));

  // 이전 데이터 참조 (무한 루프 방지)
  const prevDataRef = useRef(data);

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      animationManager.cleanup();
    };
  }, [animationManager]);

  // 애니메이션 지속 시간이 변경되면 매니저 재생성
  useEffect(() => {
    const newManager = createPriceChangeAnimationManager(borderAnimationDuration);
    setAnimationManager(prevManager => {
      prevManager.cleanup();
      return newManager;
    });
  }, [borderAnimationDuration]);

  // 가격 추적 및 포맷팅
  useEffect(() => {
    if (priceTracker) {
      priceTracker.trackPrice(data.rawSymbol, data.price);
    }
  }, [data.price, data.rawSymbol, priceTracker]);

  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num;
  };

  const formattedTurnover = formatNumber(data.turnover24h);
  const formattedVolume = formatNumber(data.volume24h);
  
  // 가격 포맷팅 (공통 유틸리티 사용)
  const maxDecimals = priceTracker ? priceTracker.getMaxDecimals(data.rawSymbol) : 0;
  const formattedLastPrice = formatPrice(data.price, maxDecimals, true);
  const formattedPriceChange = formatPriceChange(data.priceChange24h, maxDecimals, true);

  let percentAbs = Math.abs(data.priceChangePercent24h);
  let percentStr = '';
  if (percentAbs >= 1000) {
    percentStr = Math.round(data.priceChangePercent24h).toLocaleString();
  } else if (percentAbs >= 100) {
    percentStr = data.priceChangePercent24h.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  } else {
    percentStr = data.priceChangePercent24h.toFixed(2);
  }
  const formattedPriceChangePercent = `${data.priceChangePercent24h >= 0 ? '+' : ''}${percentStr}${showPercentSymbol ? '%' : ''}`;

  // 데이터 변경 감지 및 애니메이션 트리거
  useEffect(() => {
    const prevData = prevDataRef.current;
    
    // 가격이 실제로 변경되었는지 확인
    if (data.price !== prevData.price) {
      const oldPrice = data.prevPrice24h ?? prevData.price ?? previousPrice;
      const newPrice = data.price;
      
      // 가격 변동 콜백 호출
      if (onPriceChange) {
        onPriceChange(data.rawSymbol, oldPrice, newPrice);
      }

      // 애니메이션 트리거 (가격이 실제로 다를 때만)
      if (borderAnimationEnabled && oldPrice !== newPrice) {
        animationManager.triggerPriceChangeAnimation(
          data.rawSymbol,
          oldPrice,
          newPrice,
          (symbol, isAnimating) => {
            setBorderAnimation(isAnimating);
          }
        );
      }

      // 이전 가격 업데이트
      setPreviousPrice(oldPrice);
    }

    // 현재 데이터를 이전 데이터로 저장
    prevDataRef.current = data;
  }, [data, onPriceChange, animationManager, borderAnimationEnabled, previousPrice]);

  // 동적 폰트 크기 계산
  const symbolFontSize = calculateFontSize(data.integratedSymbol, 1.125, 15); // 기본 text-lg (1.125rem), 최대 20글자
  const priceFontSize = calculateFontSize(formattedLastPrice, 1.125, 10); // 기본 text-lg (1.125rem), 최대 10글자
  
  // percent 영역의 동적 너비 설정 - 배경색과 % 기호 표시 여부에 따라 조정
  let percentFixedWidth = 5; // 기본값: 5rem (80px, +100.00% 정도가 적당히 들어갈 크기)
  
  // 배경색이 disabled되면 너비 감소 (0.5rem 감소)
  if (!showPercentBackground) {
    percentFixedWidth -= 0.5;
  }
  
  // % 기호가 disabled되면 너비 추가 감소 (0.3rem 감소)
  if (!showPercentSymbol) {
    percentFixedWidth -= 1.0;
  }
  
  // 최소 너비 보장 (3rem 이하로는 줄어들지 않도록)
  percentFixedWidth = Math.max(percentFixedWidth, 3);
  
  const percentFontSize = calculatePercentFontSize(formattedPriceChangePercent, 0.875, percentFixedWidth); // 기본 text-sm (0.875rem)

  // 스토어에서 색상 및 스타일 설정 가져오기
  const priceStyle = getTickerPriceStyle(tickerColorMode, data.priceChange24h);
  const percentBackgroundStyle = getTickerPercentBackgroundStyle(tickerColorMode, data.priceChange24h, showPercentBackground);
  
  // 애니메이션용 이전 가격 계산
  const animationPrevPrice = data.prevPrice ?? previousPrice;
  const borderStyle = getTickerBorderStyle(borderAnimation, tickerColorMode, animationPrevPrice, data.price, borderAnimationEnabled);

  // 하단 표시 모드에 따른 텍스트와 스타일 계산 (클라이언트에서만)
  const getBottomDisplayContent = () => {
    if (!isClient) {
      // 서버 사이드에서는 기본값 사용
      return {
        text: formattedPriceChange,
        style: priceStyle
      };
    }

    switch (clientBottomDisplayMode) {
      case 'priceChange':
        return {
          text: formattedPriceChange,
          style: priceStyle
        };
      case 'turnover':
        return {
          text: `${formattedTurnover} ${data.quoteCode}`,
          style: { color: 'hsl(var(--muted-foreground))' }
        };
      case 'volume':
        return {
          text: `${formattedVolume} Vol`,
          style: { color: 'hsl(var(--muted-foreground))' }
        };
      default:
        return {
          text: formattedPriceChange,
          style: priceStyle
        };
    }
  };

  const bottomContent = getBottomDisplayContent();

  return (
    <div 
      className={`bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-1 border border-border cursor-pointer ${className}`}
      onClick={() => onClick?.(data)}
    >
      <div className="flex justify-between items-start">
        <div className="text-left">
          <div 
            className="px-1 py-1 font-semibold overflow-hidden"
            style={{ 
              fontSize: toRemSize(symbolFontSize),
              lineHeight: '1.2', // 2줄 표시를 위한 적절한 line-height
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              maxHeight: '2.5em',
              wordBreak: 'break-all', // 긴 단어도 줄바꿈되도록
              alignItems: 'center', // 세로 가운데 정렬
              justifyContent: 'flex-start' // 가로는 왼쪽 정렬
            }}
          >
            {data.integratedSymbol}
          </div>
          {data.warningType && (
            <div className="text-xs px-2 py-1 bg-muted/50 rounded text-muted-foreground inline-block">
              {WARNING_TYPE_LABELS[data.warningType]}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-right flex items-center justify-end gap-1">
            <span
              className="px-1 inline-flex items-center justify-center whitespace-nowrap flex-shrink-0"
              style={{ 
                ...borderStyle,
                ...priceStyle,
                borderRadius: '0rem',
                fontSize: toRemSize(priceFontSize),
                lineHeight: '1.75rem', // 기본 폰트 크기(1.125rem)에 맞는 고정 line-height
                height: '1.75em'
              }}
            >
              {formattedLastPrice}
            </span>
            <span 
              className="px-1.5 py-0.0 rounded font-semibold whitespace-nowrap overflow-hidden text-center"
              style={{ 
                ...priceStyle,
                ...percentBackgroundStyle,
                fontSize: toRemSize(percentFontSize),
                width: `${percentFixedWidth}rem`,
                minWidth: `${percentFixedWidth}rem`,
                lineHeight: '1.75rem' // 기본 폰트 크기에 맞는 고정 line-height
              }}
            >
              {formattedPriceChangePercent}
            </span>
          </div>
          <div 
            className="text-sm mt-1"
            style={bottomContent.style}
          >
            {bottomContent.text}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ticker;
