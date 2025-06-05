'use client';

import { useState, useEffect } from 'react';
import { useTickerSettingStore, TICKER_COLOR_MODE_LABELS, TickerColorMode, TICKER_COLOR_MODE_DESCRIPTIONS, getTickerBorderStyle, getTickerPriceStyle, getTickerBackgroundColor, getTickerPercentBackgroundStyle, createPriceChangeAnimationManager, BORDER_ANIMATION_DURATION_LABELS, BorderAnimationDuration } from '@/packages/shared/stores/createTickerSettingStore';
import { Toggle } from '@/packages/ui-kit/web/components';
import { getTickerColor } from '@/packages/ui-kit/tokens/design-tokens';

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
  const { 
    tickerColorMode, 
    setTickerColorMode,
    borderAnimationEnabled,
    setBorderAnimationEnabled,
    borderAnimationDuration,
    setBorderAnimationDuration,
    showPercentSymbol,
    setShowPercentSymbol,
    showPriceChange,
    setShowPriceChange,
    showPercentBackground,
    setShowPercentBackground
  } = useTickerSettingStore();
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
      turnover: 15600000,
      label: '하락 예시',
      initialPrice: 5000.00
    },
    {
      symbol: 'COIN3/USDT',
      displaySymbol: 'COIN3/USDT', 
      lastPrice: 73.19,
      priceChange: 0.00,
      priceChangePercent: 0.00,
      turnover: 890000,
      label: '보합 예시',
      initialPrice: 73.19
    }
  ]);

  // 이전 가격 저장 (애니메이션 트리거용)
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});

  // 테두리 애니메이션 상태 관리
  const [borderAnimations, setBorderAnimations] = useState<{[key: string]: boolean}>({});

  // 애니메이션 매니저 생성 (설정된 지속 시간 사용)
  const [animationManager, setAnimationManager] = useState(() => createPriceChangeAnimationManager(borderAnimationDuration));

  useEffect(() => {
    setMounted(true);
  }, []);

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      animationManager.cleanup();
    };
  }, [animationManager]);

  // 애니메이션 지속 시간이 변경되면 매니저 재생성
  useEffect(() => {
    setAnimationManager(createPriceChangeAnimationManager(borderAnimationDuration));
  }, [borderAnimationDuration]);

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
          {(Object.entries(TICKER_COLOR_MODE_LABELS) as [TickerColorMode, string][]).map(([mode, label]) => {
            const isActive = tickerColorMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTickerColorMode(mode)}
                className={`p-4 rounded-lg border-2 transition-all text-left
                  ${isActive 
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                    : 'border-border hover:border-primary/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-base">{label}</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      {TICKER_COLOR_MODE_DESCRIPTIONS[mode]}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ color: `hsl(${getTickerColor(mode, 'up')})` }}
                    >
                      ▲
                    </span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ color: `hsl(${getTickerColor(mode, 'down')})` }}
                    >
                      ▼
                    </span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ color: `hsl(${getTickerColor(mode, 'unchanged')})` }}
                    >
                      ━
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 테두리 애니메이션 설정 */}
      <div className="mb-8 p-4 bg-card rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">테두리 애니메이션 설정</h2>
        
        {/* 애니메이션 활성화/비활성화 */}
        <div className="mb-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">테두리 애니메이션</span>
              {borderAnimationEnabled && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                  활성화
                </span>
              )}
            </div>
            <Toggle
              checked={borderAnimationEnabled}
              onChange={() => setBorderAnimationEnabled(!borderAnimationEnabled)}
            />
          </label>
          <p className="text-sm text-muted-foreground mt-1">
            가격 변동 시 테두리 색상 강조 표시 여부
          </p>
        </div>

        {/* 애니메이션 지속 시간 */}
        <div className="mb-4">
          <label className="block font-medium mb-2">
            애니메이션 지속 시간
            {borderAnimationEnabled && (
              <span className="ml-2 text-xs text-muted-foreground">
                (현재: {BORDER_ANIMATION_DURATION_LABELS[borderAnimationDuration]})
              </span>
            )}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(BORDER_ANIMATION_DURATION_LABELS).map(([duration, label]) => {
              const isActive = borderAnimationDuration === Number(duration);
              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setBorderAnimationDuration(Number(duration) as BorderAnimationDuration)}
                  disabled={!borderAnimationEnabled}
                  className={`p-2 rounded-md border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1
                    ${isActive && borderAnimationEnabled
                      ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                      : borderAnimationEnabled
                        ? 'border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-foreground'
                        : 'border-border/50 bg-muted/50 text-muted-foreground'}
                    ${!borderAnimationEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {label}
                  {isActive && borderAnimationEnabled && (
                    <span className="ml-1 text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 표시 옵션 설정 */}
      <div className="mb-8 p-4 bg-card rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">표시 옵션</h2>
        
        {/* 퍼센트 기호 표시 */}
        <div className="mb-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">퍼센트 기호 (%) 표시</span>
              {showPercentSymbol && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                  활성화
                </span>
              )}
            </div>
            <Toggle
              checked={showPercentSymbol}
              onChange={() => setShowPercentSymbol(!showPercentSymbol)}
            />
          </label>
          <p className="text-sm text-muted-foreground mt-1">
            변동률 정보에 % 기호 표시 여부
          </p>
        </div>

        {/* 가격 변동 정보 표시 */}
        <div className="mb-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">가격 변동 정보 표시</span>
              {showPriceChange && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                  활성화
                </span>
              )}
            </div>
            <Toggle
              checked={showPriceChange}
              onChange={() => setShowPriceChange(!showPriceChange)}
            />
          </label>
          <p className="text-sm text-muted-foreground mt-1">
            가격 변동 금액 정보 표시 여부 (예: +100.00)
          </p>
        </div>

        {/* 변동률 배경색 표시 */}
        <div className="mb-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">변동률 배경색 표시</span>
              {showPercentBackground && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                  활성화
                </span>
              )}
            </div>
            <Toggle
              checked={showPercentBackground}
              onChange={() => setShowPercentBackground(!showPercentBackground)}
            />
          </label>
          <p className="text-sm text-muted-foreground mt-1">
            변동률 퍼센트 표시에 배경색 적용 여부
          </p>
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
              const formattedPriceChangePercent = `${ticker.priceChangePercent >= 0 ? '+' : ''}${ticker.priceChangePercent.toFixed(2)}${showPercentSymbol ? '%' : ''}`;
              const formattedLastPrice = ticker.lastPrice.toFixed(ticker.lastPrice < 1 ? 4 : 2);
              
              // 스토어에서 색상 및 스타일 설정 가져오기
              const priceStyle = getTickerPriceStyle(tickerColorMode, ticker.priceChange);
              const percentBackgroundStyle = getTickerPercentBackgroundStyle(tickerColorMode, ticker.priceChange, showPercentBackground);
              const isAnimating = borderAnimations[ticker.symbol];
              const borderStyle = getTickerBorderStyle(isAnimating, tickerColorMode, previousPrices[ticker.symbol] || ticker.initialPrice, ticker.lastPrice, borderAnimationEnabled);
              
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
                          className="px-1 inline-block"
                          style={{ 
                            ...borderStyle,
                            ...priceStyle,
                            borderRadius: '0rem' 
                          }}
                        >
                          {formattedLastPrice}
                        </span>
                        <span 
                          className="text-sm px-1.5 py-0.5 rounded ml-1 font-semibold"
                          style={{ 
                            ...priceStyle,
                            ...percentBackgroundStyle
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
