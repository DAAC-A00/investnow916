'use client';

import { useState, useEffect, useRef } from 'react';
import { useTickerSettingStore, getTickerBorderStyle, getTickerPriceStyle, getTickerPercentBackgroundStyle, createPriceChangeAnimationManager, BottomDisplayMode } from '@/packages/shared/stores/createTickerSettingStore';
import { TickerData } from '@/packages/shared/types/exchange';

interface TickerProps {
  data: TickerData;
  className?: string;
  onPriceChange?: (symbol: string, oldPrice: number, newPrice: number) => void;
  maxDecimals?: number; // symbol별 최대 소수점 자리수
}

// 텍스트 길이에 따라 폰트 크기를 계산하는 함수
const calculateFontSize = (text: string, baseFontSize: number, maxLength: number) => {
  if (text.length <= maxLength) {
    return baseFontSize;
  }
  
  // 텍스트가 길어질수록 폰트 크기를 줄임 (최소 0.7배까지)
  const ratio = Math.max(0.7, maxLength / text.length);
  return baseFontSize * ratio;
};

// 고정 너비 기준으로 폰트 크기를 동적으로 계산하는 함수
const calculatePercentFontSize = (text: string, baseFontSize: number, fixedWidthRem: number) => {
  // rem을 픽셀로 변환 (보통 1rem = 16px)
  const fixedWidthPx = fixedWidthRem * 16;
  
  // 기본적으로 한 글자당 약 0.6em 정도의 너비를 가정
  const estimatedTextWidth = text.length * baseFontSize * 16 * 0.6;
  
  if (estimatedTextWidth <= fixedWidthPx) {
    return baseFontSize;
  }
  
  // 고정 너비에 맞도록 폰트 크기 조정 (최소 0.6배까지)
  const ratio = Math.max(0.6, fixedWidthPx / estimatedTextWidth);
  return baseFontSize * ratio;
};

// 폰트 크기를 rem 단위로 변환하는 함수
const toRemSize = (size: number) => `${size}rem`;

export function Ticker({ data, className = '', onPriceChange, maxDecimals }: TickerProps) {
  const { 
    tickerColorMode,
    borderAnimationEnabled,
    borderAnimationDuration,
    showPercentSymbol,
    showPercentBackground,
    bottomDisplayMode
  } = useTickerSettingStore();

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

  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // 가격 포맷팅 함수 (1000 이상인 경우 콤마 추가)
  const formatPrice = (price: number) => {
    let decimals: number;
    
    // 가격 범위에 따라 소수점 자리수 결정
    if (price >= 1000) {
      decimals = 2;
    } else if (price >= 100) {
      decimals = 2;
    } else if (price >= 1) {
      decimals = 4;
    } else if (price >= 0.01) {
      decimals = 6;
    } else {
      decimals = 12;
    }
    // maxDecimals가 있으면 그 값과 비교해 더 큰 값을 사용
    if (typeof maxDecimals === 'number' && maxDecimals > decimals) {
      decimals = maxDecimals;
    }
    // 반올림 후 0 생략, 단 maxDecimals가 있으면 해당 자리수까지는 0도 표기
    let formatted = price.toFixed(decimals);
    if (typeof maxDecimals !== 'number') {
      // maxDecimals가 없으면 소수점 뒤 0 생략
      formatted = formatted.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/\.0+$/, '');
    } else {
      // maxDecimals가 있으면 해당 자리수까지는 0도 표기
      // 단, 소수점 이하가 모두 0이면 .0... 형태로 유지
      const [intPart, decPart] = formatted.split('.');
      if (decPart) {
        // 오른쪽 0을 자르되, 최소 maxDecimals까지는 남김
        let trimIndex = decPart.length;
        for (let i = decPart.length - 1; i >= maxDecimals; i--) {
          if (decPart[i] === '0') trimIndex = i;
          else break;
        }
        const trimmedDec = decPart.slice(0, trimIndex);
        formatted = trimmedDec ? `${intPart}.${trimmedDec}` : intPart;
        // 만약 모두 0이면 maxDecimals만큼 0을 붙임
        if (!trimmedDec && maxDecimals > 0) {
          formatted = `${intPart}.${'0'.repeat(maxDecimals)}`;
        }
      }
    }
    // 1000 이상인 경우 콤마 추가
    if (price >= 1000) {
      const [integerPart, decimalPart] = formatted.split('.');
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }
    return formatted;
  };

  const formattedTurnover = formatNumber(data.turnover);
  const formattedVolume = formatNumber(data.volume);
  
  // Calculate decimals for price
  let decimals: number;
  if (data.price >= 1000) {
    decimals = 2;
  } else if (data.price >= 100) {
    decimals = 2;
  } else if (data.price >= 1) {
    decimals = 4;
  } else if (data.price >= 0.01) {
    decimals = 6;
  } else {
    decimals = 12;
  }
  // Use maxDecimals if provided and greater than calculated decimals
  if (typeof maxDecimals === 'number' && maxDecimals > decimals) {
    decimals = maxDecimals;
  }

  // Format price change with the same rules as price
  let formattedPriceChange: string;
  let formatted = data.priceChange24h.toFixed(decimals);
  if (typeof maxDecimals !== 'number') {
    // maxDecimals가 없으면 소수점 뒤 0 생략
    formatted = formatted.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/\.0+$/, '');
  } else {
    // maxDecimals가 있으면 해당 자리수까지는 0도 표기
    // 단, 소수점 이하가 모두 0이면 .0... 형태로 유지
    const [intPart, decPart] = formatted.split('.');
    if (decPart) {
      // 오른쪽 0을 자르되, 최소 maxDecimals까지는 남김
      let trimIndex = decPart.length;
      for (let i = decPart.length - 1; i >= maxDecimals; i--) {
        if (decPart[i] === '0') trimIndex = i;
        else break;
      }
      const trimmedDec = decPart.slice(0, trimIndex);
      formatted = trimmedDec ? `${intPart}.${trimmedDec}` : intPart;
      // 만약 모두 0이면 maxDecimals만큼 0을 붙임
      if (!trimmedDec && maxDecimals > 0) {
        formatted = `${intPart}.${'0'.repeat(maxDecimals)}`;
      }
    }
  }
  // 1000 이상인 경우 콤마 추가
  if (Math.abs(data.priceChange24h) >= 1000) {
    const [integerPart, decimalPart] = formatted.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formattedPriceChange = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  } else {
    formattedPriceChange = formatted;
  }
  // Add plus sign for positive values
  formattedPriceChange = `${data.priceChange24h >= 0 ? '+' : ''}${formattedPriceChange}`;

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
  const formattedLastPrice = formatPrice(data.price);

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
  const symbolFontSize = calculateFontSize(data.displaySymbol, 1.125, 12); // 기본 text-lg (1.125rem), 최대 12글자
  const priceFontSize = calculateFontSize(formattedLastPrice, 1.125, 10); // 기본 text-lg (1.125rem), 최대 10글자
  
  // percent 영역의 고정 너비 설정 (5rem = 80px, +100.00% 정도가 적당히 들어갈 크기)
  const percentFixedWidth = 5; // rem 단위
  const percentFontSize = calculatePercentFontSize(formattedPriceChangePercent, 0.875, percentFixedWidth); // 기본 text-sm (0.875rem)

  // 스토어에서 색상 및 스타일 설정 가져오기
  const priceStyle = getTickerPriceStyle(tickerColorMode, data.priceChange24h);
  const percentBackgroundStyle = getTickerPercentBackgroundStyle(tickerColorMode, data.priceChange24h, showPercentBackground);
  
  // 애니메이션용 이전 가격 계산
  const animationPrevPrice = data.prevPrice ?? previousPrice;
  const borderStyle = getTickerBorderStyle(borderAnimation, tickerColorMode, animationPrevPrice, data.price, borderAnimationEnabled);

  return (
    <div 
      className={`bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-border ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div 
            className="font-semibold overflow-hidden flex items-center"
            style={{ 
              fontSize: toRemSize(symbolFontSize),
              lineHeight: '1.2', // 2줄 표시를 위한 적절한 line-height
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              maxHeight: '2.4em', // 2줄 높이 고정 (line-height 1.2 * 2)
              minHeight: '1.75em', // 2줄 높이 고정 (line-height 1.2 * 2)
              wordBreak: 'break-all' // 긴 단어도 줄바꿈되도록
            }}
          >
            {data.displaySymbol}
          </div>
          {data.label && (
            <div className="text-xs px-2 py-1 bg-muted/50 rounded text-muted-foreground inline-block">
              {data.label}
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
              className="px-1.5 py-0.5 rounded font-semibold whitespace-nowrap overflow-hidden text-center"
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
            style={bottomDisplayMode === 'priceChange' ? priceStyle : { color: 'hsl(var(--muted-foreground))' }}
          >
            {bottomDisplayMode === 'priceChange' 
              ? formattedPriceChange 
              : bottomDisplayMode === 'turnover' 
                ? `${formattedTurnover} USDT`
                : `${formattedVolume} Vol`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ticker;
