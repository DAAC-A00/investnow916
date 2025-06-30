'use client';

import { useState, useEffect, useRef } from 'react';
import { useTickerSettingStore, TICKER_COLOR_MODE_LABELS, TickerColorMode, TICKER_COLOR_MODE_DESCRIPTIONS, BORDER_ANIMATION_DURATION_LABELS, BorderAnimationDuration, BottomDisplayMode, BOTTOM_DISPLAY_MODE_LABELS } from '@/packages/shared/stores/createTickerSettingStore';
import { Toggle } from '@/packages/ui-kit/web/components';
import { getTickerColor, colorTokens } from '@/packages/ui-kit/tokens/design-tokens';
import { Ticker } from '@/packages/shared/components';
import { TickerData } from '@/packages/shared/types/exchange';
import { PriceDecimalTracker } from '@/packages/shared/utils';

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
    showPercentBackground,
    setShowPercentBackground,
    bottomDisplayMode,
    setBottomDisplayMode
  } = useTickerSettingStore();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  
  // 가격 추적기 생성
  const priceTracker = useRef(new PriceDecimalTracker());
  
  // 예시 티커 데이터 상태
  const [tickerData, setTickerData] = useState<TickerData[]>([
    {
      rawSymbol: 'COIN1USDT',
      integratedSymbol: 'COIN1/USDT',
      quantity: 1,
      baseCode: 'COIN1',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 5300.00,
      priceChange24h: 300.00,
      priceChangePercent24h: 6.00,
      turnover24h: 2340000000,
      volume24h: 1200000,
      warningType: 'SPECIFIC_ACCOUNT_HIGH_TRANSACTION',
      prevPrice24h: 5000.00,
      beforePrice: 5000.00
    },
    {
      rawSymbol: 'LongNameCoin999USDT',
      integratedSymbol: 'LongNameCoin999/USDT',
      quantity: 1,
      baseCode: 'LongNameCoin999',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 630000.00,
      priceChange24h: 540000.00,
      priceChangePercent24h: 600.00,
      turnover24h: 50000000000,
      volume24h: 89000000,
      warningType: 'TRADING_VOLUME_SUDDEN_FLUCTUATION',
      prevPrice24h: 90000.00,
      beforePrice: 90000.00
    },
    {
      rawSymbol: 'COIN2USDT',
      integratedSymbol: 'COIN2/USDT',
      quantity: 1,
      baseCode: 'COIN2',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 4700.00,
      priceChange24h: -300.00,
      priceChangePercent24h: -6.00,
      turnover24h: 15600000,
      volume24h: 3500000,
      warningType: 'PRICE_DIFFERENCE_HIGH',
      prevPrice24h: 5000.00,
      beforePrice: 5000.00
    }
  ]);
  
  // localStorage에서 설정값 초기화 (하이드레이션 문제 해결)
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const store = useTickerSettingStore.getState();
      
      // localStorage에서 각 설정값 읽어와서 스토어 업데이트
      const savedTickerColorMode = localStorage.getItem('ticker-setting-tickerColorMode');
      if (savedTickerColorMode && savedTickerColorMode !== store.tickerColorMode) {
        setTickerColorMode(savedTickerColorMode as TickerColorMode);
      }
      
      const savedBorderAnimation = localStorage.getItem('ticker-setting-isBorderAnimation');
      if (savedBorderAnimation !== null && (savedBorderAnimation === 'true') !== store.borderAnimationEnabled) {
        setBorderAnimationEnabled(savedBorderAnimation === 'true');
      }
      
      const savedBorderDuration = localStorage.getItem('ticker-setting-borderDuration');
      if (savedBorderDuration && parseInt(savedBorderDuration) !== store.borderAnimationDuration) {
        setBorderAnimationDuration(parseInt(savedBorderDuration) as BorderAnimationDuration);
      }
      
      const savedShowPercentSymbol = localStorage.getItem('ticker-setting-showChangePercentSign');
      if (savedShowPercentSymbol !== null && (savedShowPercentSymbol === 'true') !== store.showPercentSymbol) {
        setShowPercentSymbol(savedShowPercentSymbol === 'true');
      }
      
      const savedBottomDisplayMode = localStorage.getItem('ticker-setting-bottomDisplayMode');
      if (savedBottomDisplayMode && savedBottomDisplayMode !== store.bottomDisplayMode) {
        setBottomDisplayMode(savedBottomDisplayMode as BottomDisplayMode);
      }
      
      const savedShowPercentBackground = localStorage.getItem('ticker-setting-showPercentBackground');
      if (savedShowPercentBackground !== null && (savedShowPercentBackground === 'true') !== store.showPercentBackground) {
        setShowPercentBackground(savedShowPercentBackground === 'true');
      }
    }
  }, []);
  
  // 테마 감지
  useEffect(() => {
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    };

    detectTheme();
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // 컴포넌트 마운트 상태 설정
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 가격 변동 시뮬레이션
  useEffect(() => {
    if (!mounted) return;
    
    const intervals: NodeJS.Timeout[] = [];
    
    // COIN1: 0.7초마다 변동
    intervals.push(setInterval(() => {
      setTickerData(prev => {
        const newData = [...prev];
        const ticker = newData[0];
        const variations = [1.0, 0.5, 0, -0.5, -1.0];
        const variation = variations[Math.floor(Math.random() * variations.length)];
        const newPrice = Math.max(0.01, ticker.price + variation);
        const beforePrice = ticker.price; // 애니메이션용 이전 가격을 현재 가격으로 설정
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = ((priceChange24h / ticker.prevPrice24h) * 100);
        
        newData[0] = {
          ...ticker,
          beforePrice: beforePrice,
          price: newPrice,
          priceChange24h: priceChange24h,
          priceChangePercent24h: priceChangePercent24h
        };
        return newData;
      });
    }, 700));
    
    // COIN2 (긴 이름): 1.1초마다 변동
    intervals.push(setInterval(() => {
      setTickerData(prev => {
        const newData = [...prev];
        const ticker = newData[1];
        const variations = [1000, 500, 0, -500, -1000];
        const variation = variations[Math.floor(Math.random() * variations.length)];
        const newPrice = Math.max(0.01, ticker.price + variation);
        const beforePrice = ticker.price; // 애니메이션용 이전 가격을 현재 가격으로 설정
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = ((priceChange24h / ticker.prevPrice24h) * 100);
        
        newData[1] = {
          ...ticker,
          beforePrice: beforePrice,
          price: newPrice,
          priceChange24h: priceChange24h,
          priceChangePercent24h: priceChangePercent24h
        };
        return newData;
      });
    }, 1100));
    
    // COIN3: 1.5초마다 작은 변동
    intervals.push(setInterval(() => {
      setTickerData(prev => {
        const newData = [...prev];
        const ticker = newData[2];
        const variations = [0.5, 0.2, 0, -0.2, -0.5];
        const variation = variations[Math.floor(Math.random() * variations.length)];
        const newPrice = Math.max(0.01, ticker.price + variation);
        const beforePrice = ticker.price; // 애니메이션용 이전 가격을 현재 가격으로 설정
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = ((priceChange24h / ticker.prevPrice24h) * 100);
        
        newData[2] = {
          ...ticker,
          beforePrice: beforePrice,
          price: newPrice,
          priceChange24h: priceChange24h,
          priceChangePercent24h: priceChangePercent24h
        };
        return newData;
      });
    }, 1500));
    
    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [mounted]);

  // 현재 테마의 색상 토큰
  const themeColors = colorTokens[currentTheme];

  // 컴포넌트가 마운트되지 않았거나 테마 색상이 로드되지 않은 경우
  if (!mounted || !themeColors) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <>
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
                active={borderAnimationEnabled}
                onChange={(active) => setBorderAnimationEnabled(active)}
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
                active={showPercentSymbol}
                onChange={(active) => setShowPercentSymbol(active)}
              />
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              변동률 정보에 % 기호 표시 여부
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
                active={showPercentBackground}
                onChange={(active) => setShowPercentBackground(active)}
              />
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              변동률 퍼센트 표시에 배경색 적용 여부
            </p>
          </div>
        </div>

        {/* 하단 표시 정보 설정 */}
        <div className="mb-8 p-4 bg-card rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4">하단 표시 정보 설정</h2>
          
          <div>
            <label className="block font-medium mb-2">
              표시 정보 선택
              <span className="ml-2 text-xs text-muted-foreground">
                (현재: {BOTTOM_DISPLAY_MODE_LABELS[bottomDisplayMode]})
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(BOTTOM_DISPLAY_MODE_LABELS).map(([mode, label]) => {
                const isActive = bottomDisplayMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBottomDisplayMode(mode as BottomDisplayMode)}
                    className={`p-3 rounded-md border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1
                      ${isActive
                        ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                        : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-foreground'}
                      cursor-pointer`}
                  >
                    {label}
                    {isActive && (
                      <span className="ml-1 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              티커 하단에 표시할 정보를 선택하세요
            </p>
          </div>
        </div>
      </div>

      {/* 예시 섹션 - 전체 너비 사용 */}
      <div className="w-full px-4 mb-8">
        <div className="bg-card rounded-lg border p-4 space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            현재 선택된 모드: {TICKER_COLOR_MODE_LABELS[tickerColorMode]}
          </div>
          
          <div className="space-y-3">
            {tickerData.map((ticker, index) => (
              <Ticker
                key={ticker.rawSymbol}
                data={ticker}
                priceTracker={priceTracker.current}
                onPriceChange={(symbol, oldPrice, newPrice) => {
                  console.log(`[${symbol}] 가격 변동: ${oldPrice} → ${newPrice}`);
                }}
                className="w-full"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-xl mx-auto px-4 pb-10">
        <div className="text-center text-sm text-muted-foreground">
          <p>이 설정은 앱의 모든 티커에 자동으로 적용됩니다.</p>
        </div>
      </div>
    </>
  );
}
