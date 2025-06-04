'use client';

import { useState, useEffect } from 'react';
import { useTickerSettingStore, getTickerColorClass, TICKER_COLOR_MODE_LABELS, TickerColorMode, TICKER_COLOR_MODE_DESCRIPTIONS, getTickerBorderStyle, getTickerBackgroundColor, createPriceChangeAnimationManager } from '@/packages/shared/stores/createTickerSettingStore';

interface TickerData {
  symbol: string;
  displaySymbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  turnover: number;
  label: string;
  initialPrice: number;
}

export default function TickerSettingPage() {
  const { tickerColorMode, setTickerColorMode } = useTickerSettingStore();
  const [mounted, setMounted] = useState(false);
  
  // 실시간 티커 데이터 상태
  const [tickerData, setTickerData] = useState<TickerData[]>([
    {
      symbol: 'COIN1/USDT',
      displaySymbol: 'COIN1/USDT',
      lastPrice: 5100.00,
      priceChange: 100.00,
      priceChangePercent: 2.00,
      turnover: 2340000000,
      label: '상승 예시',
      initialPrice: 5000.00
    },
    {
      symbol: 'COIN2/USDT', 
      displaySymbol: 'COIN2/USDT',
      lastPrice: 4900.00,
      priceChange: -100.00,
      priceChangePercent: -2.00,
      turnover: 1560000000,
      label: '하락 예시',
      initialPrice: 5000.00
    },
    {
      symbol: 'COIN3/USDT',
      displaySymbol: 'COIN3/USDT', 
      lastPrice: 0.4567,
      priceChange: 0.00,
      priceChangePercent: 0.00,
      turnover: 890000000,
      label: '보합 예시',
      initialPrice: 0.4567
    }
  ]);

  // 이전 가격 저장 (애니메이션 트리거용)
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});

  // 테두리 애니메이션 상태 관리
  const [borderAnimations, setBorderAnimations] = useState<{[key: string]: boolean}>({});

  // 애니메이션 매니저 생성
  const [animationManager] = useState(() => createPriceChangeAnimationManager());

  useEffect(() => {
    setMounted(true);
  }, []);

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      animationManager.cleanup();
    };
  }, [animationManager]);

  // COIN1: 0.7초마다 -0.2, -0.1, 0, +0.1, +0.2 중 무작위 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.symbol !== 'COIN1/USDT') return ticker;
        
        // -1.0, -0.5, 0, +0.5, +1.0 중 하나 무작위 선택
        const possibleChanges = [-1.0, -0.5, 0, 0.5, 1.0];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        // 변동 전 가격 저장
        const previousPrice = ticker.lastPrice; 
        // 변동 후 가격 계산 (최소 0.01)
        const newPrice = Math.max(ticker.lastPrice + change, 0.05); 
        
        // 가격 변동 여부와 관계없이 무조건 애니메이션 트리거
        animationManager.triggerPriceChangeAnimation(
          ticker.symbol,
          previousPrice,
          newPrice,
          (symbol, isAnimating) => {
            setBorderAnimations(prev => ({ ...prev, [symbol]: isAnimating }));
          }
        );
        
        // 이전 가격 저장
        setPreviousPrices(prev => ({ ...prev, [ticker.symbol]: previousPrice }));
        // 가격 변동 및 퍼센트 계산
        const priceChange = newPrice - ticker.initialPrice;
        const priceChangePercent = (priceChange / ticker.initialPrice) * 100;
        
        return {
          ...ticker,
          lastPrice: newPrice,
          priceChange,
          priceChangePercent,
        };
      }));
    }, 700);
    return () => clearInterval(interval);
  }, [animationManager]);

  // COIN2: 1.1초마다 -0.2, -0.1, 0, +0.1, +0.2 중 무작위 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.symbol !== 'COIN2/USDT') return ticker;
        
        // -1.0, -0.5, 0, +0.5, +1.0 중 하나 무작위 선택
        const possibleChanges = [-1.0, -0.5, 0, 0.5, 1.0];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        const previousPrice = ticker.lastPrice; // 변동 전 가격
        const newPrice = Math.max(ticker.lastPrice + change, 0.05); // 변동 후 가격
        
        // 가격 변동 여부와 관계없이 무조건 애니메이션 트리거
        animationManager.triggerPriceChangeAnimation(
          ticker.symbol,
          previousPrice,
          newPrice,
          (symbol, isAnimating) => {
            setBorderAnimations(prev => ({ ...prev, [symbol]: isAnimating }));
          }
        );
        
        setPreviousPrices(prev => ({ ...prev, [ticker.symbol]: previousPrice }));
        const priceChange = newPrice - ticker.initialPrice;
        const priceChangePercent = (priceChange / ticker.initialPrice) * 100;
        
        return {
          ...ticker,
          lastPrice: newPrice,
          priceChange,
          priceChangePercent,
        };
      }));
    }, 1100);
    return () => clearInterval(interval);
  }, [animationManager]);


  if (!mounted) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="container max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">티커 색상 모드 설정</h1>
      
      {/* 색상 모드 선택 섹션 */}
      <div className="mb-8 p-4 bg-card rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">색상 모드 선택</h2>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(TICKER_COLOR_MODE_LABELS).map(([mode, label]) => {
            const isActive = tickerColorMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTickerColorMode(mode as TickerColorMode)}
                className={`p-4 rounded-lg border-2 transition-all text-left
                  ${isActive 
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                    : 'border-border hover:border-primary/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-base">{label}</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      {TICKER_COLOR_MODE_DESCRIPTIONS[mode as TickerColorMode]}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTickerColorClass(mode as TickerColorMode, 1, 'text')}`}>
                      ▲
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTickerColorClass(mode as TickerColorMode, -1, 'text')}`}>
                      ▼
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTickerColorClass(mode as TickerColorMode, 0, 'text')}`}>
                      ━
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 예시 */}
      <div className="mb-6 p-4 bg-card rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">예시</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {tickerData.map((ticker) => {
              // 숫자 포맷팅 함수
              const formatNumber = (num: number) => {
                if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
                if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
                if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
                return num.toFixed(2);
              };
              
              const formattedTurnover = formatNumber(ticker.turnover);
              const formattedPriceChange = `${ticker.priceChange >= 0 ? '+' : ''}${ticker.priceChange.toFixed(2)}`;
              const formattedPriceChangePercent = `${ticker.priceChangePercent >= 0 ? '+' : ''}${ticker.priceChangePercent.toFixed(2)}%`;
              const formattedLastPrice = ticker.lastPrice.toFixed(ticker.lastPrice < 1 ? 4 : 2);
              
              // 스토어에서 색상 및 스타일 설정 가져오기
              const priceColor = getTickerColorClass(tickerColorMode, ticker.priceChange, 'text');
              const isAnimating = borderAnimations[ticker.symbol];
              const previousPrice = previousPrices[ticker.symbol] || ticker.initialPrice;
              const borderStyle = getTickerBorderStyle(isAnimating, tickerColorMode, previousPrice, ticker.lastPrice);
              
              return (
                <div 
                  key={ticker.symbol}
                  className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-border"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">{ticker.displaySymbol}</div>
                      <div className="text-sm text-muted-foreground">{formattedTurnover} USDT</div>
                      <div className="text-xs px-2 py-1 bg-muted/50 rounded text-muted-foreground inline-block">
                        {ticker.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-right">
                        <span
                          className={`px-1 inline-block ${priceColor}`}
                          style={{ 
                            ...borderStyle,
                            borderRadius: '0rem' 
                          }}
                        >
                          {formattedLastPrice}
                        </span>
                        <span 
                          className={`text-sm px-1.5 py-0.5 rounded ml-1 font-semibold ${priceColor}`}
                          style={{ 
                            backgroundColor: getTickerBackgroundColor(tickerColorMode, ticker.priceChange)
                          }}
                        >
                          {formattedPriceChangePercent}
                        </span>
                      </div>
                      <div className={`text-sm ${priceColor} mt-1`}>
                        {formattedPriceChange}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-3 bg-muted/30 rounded-md">
            <h3 className="text-sm font-medium mb-2">현재 선택된 모드: <span className="font-bold text-primary">{TICKER_COLOR_MODE_LABELS[tickerColorMode]}</span></h3>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>이 설정은 앱의 모든 티커에 자동으로 적용됩니다.</p>
      </div>
    </div>
  );
}
