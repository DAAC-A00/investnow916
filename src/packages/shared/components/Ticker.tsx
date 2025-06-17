'use client';

import { useState, useEffect, useRef } from 'react';
import { useTickerSettingStore, getTickerBorderStyle, getTickerPriceStyle, getTickerPercentBackgroundStyle, createPriceChangeAnimationManager } from '@/packages/shared/stores/createTickerSettingStore';

export interface TickerData {
  symbol: string;
  displaySymbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  turnover: number;
  label?: string;
  prevPrice24h: number;
  prevPrice?: number; // 이전 가격 (애니메이션용)
}

interface TickerProps {
  data: TickerData;
  className?: string;
  onPriceChange?: (symbol: string, oldPrice: number, newPrice: number) => void;
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

// 폰트 크기를 rem 단위로 변환하는 함수
const toRemSize = (size: number) => `${size}rem`;

export function Ticker({ data, className = '', onPriceChange }: TickerProps) {
  const { 
    tickerColorMode,
    borderAnimationEnabled,
    borderAnimationDuration,
    showPercentSymbol,
    showPriceChange,
    showPercentBackground
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

  // 데이터 변경 감지 및 애니메이션 트리거
  useEffect(() => {
    const prevData = prevDataRef.current;
    
    // 가격이 실제로 변경되었는지 확인
    if (data.price !== prevData.price) {
      const oldPrice = data.prevPrice24h ?? prevData.price ?? previousPrice;
      const newPrice = data.price;
      
      // 가격 변동 콜백 호출
      if (onPriceChange) {
        onPriceChange(data.symbol, oldPrice, newPrice);
      }

      // 애니메이션 트리거 (가격이 실제로 다를 때만)
      if (borderAnimationEnabled && oldPrice !== newPrice) {
        animationManager.triggerPriceChangeAnimation(
          data.symbol,
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
      decimals = 2; // 1000 이상: 소수점 2자리
    } else if (price >= 100) {
      decimals = 2; // 100 이상: 소수점 2자리
    } else if (price >= 1) {
      decimals = 4; // 1 이상: 소수점 4자리
    } else if (price >= 0.01) {
      decimals = 6; // 0.01 이상: 소수점 6자리
    } else {
      decimals = 12; // 매우 작은 가격: 소수점 12자리
    }
    
    const formattedPrice = price.toFixed(decimals);
    
    // 1000 이상인 경우 콤마 추가
    if (price >= 1000) {
      const [integerPart, decimalPart] = formattedPrice.split('.');
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }
    
    return formattedPrice;
  };

  const formattedTurnover = formatNumber(data.turnover);
  const formattedPriceChange = `${data.priceChange >= 0 ? '+' : ''}${data.priceChange.toFixed(2)}`;
  const formattedPriceChangePercent = `${data.priceChangePercent >= 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}${showPercentSymbol ? '%' : ''}`;
  const formattedLastPrice = formatPrice(data.price);

  // 동적 폰트 크기 계산
  const symbolFontSize = calculateFontSize(data.displaySymbol, 1.125, 12); // 기본 text-lg (1.125rem), 최대 12글자
  const priceFontSize = calculateFontSize(formattedLastPrice, 1.125, 10); // 기본 text-lg (1.125rem), 최대 10글자
  const percentFontSize = calculateFontSize(formattedPriceChangePercent, 0.875, 8); // 기본 text-sm (0.875rem), 최대 8글자

  // 스토어에서 색상 및 스타일 설정 가져오기
  const priceStyle = getTickerPriceStyle(tickerColorMode, data.priceChange);
  const percentBackgroundStyle = getTickerPercentBackgroundStyle(tickerColorMode, data.priceChange, showPercentBackground);
  
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
            className="font-semibold whitespace-nowrap overflow-hidden"
            style={{ fontSize: toRemSize(symbolFontSize) }}
          >
            {data.displaySymbol}
          </div>
          <div className="text-sm text-muted-foreground">{formattedTurnover} USDT</div>
          {data.label && (
            <div className="text-xs px-2 py-1 bg-muted/50 rounded text-muted-foreground inline-block">
              {data.label}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-right">
            <span
              className="px-1 inline-block whitespace-nowrap"
              style={{ 
                ...borderStyle,
                ...priceStyle,
                borderRadius: '0rem',
                fontSize: toRemSize(priceFontSize)
              }}
            >
              {formattedLastPrice}
            </span>
            <span 
              className="px-1.5 py-0.5 rounded ml-1 font-semibold whitespace-nowrap"
              style={{ 
                ...priceStyle,
                ...percentBackgroundStyle,
                fontSize: toRemSize(percentFontSize)
              }}
            >
              {formattedPriceChangePercent}
            </span>
          </div>
          {showPriceChange && (
            <div 
              className="text-sm mt-1"
              style={priceStyle}
            >
              {formattedPriceChange}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ticker;
