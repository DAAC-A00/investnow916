'use client';

import { useState, useEffect } from 'react';
import { useTickerSettingStore, TICKER_COLOR_MODE_LABELS, TickerColorMode, TICKER_COLOR_MODE_DESCRIPTIONS, createPriceChangeAnimationManager, BORDER_ANIMATION_DURATION_LABELS, BorderAnimationDuration } from '@/packages/shared/stores/createTickerSettingStore';
import { Toggle } from '@/packages/ui-kit/web/components';
import { getTickerColor, colorTokens } from '@/packages/ui-kit/tokens/design-tokens';
import { Ticker, TickerData } from '@/packages/shared/components';

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
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  
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
      
      const savedShowPriceChange = localStorage.getItem('ticker-setting-showPriceChange');
      if (savedShowPriceChange !== null && (savedShowPriceChange === 'true') !== store.showPriceChange) {
        setShowPriceChange(savedShowPriceChange === 'true');
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

  // 현재 테마의 색상 토큰
  const themeColors = colorTokens[currentTheme];

  // 실시간 티커 데이터 상태
  const [tickerData, setTickerData] = useState<TickerData[]>([
    {
      symbol: 'COIN1/USDT',
      displaySymbol: 'COIN1/USDT',
      price: 5100.00,
      priceChange: 100.00,
      priceChangePercent: 2.00,
      turnover: 2340000000,
      label: '상승 예시',
      initialPrice: 5000.00,
      prevPrice: 5000.00
    },
    {
      symbol: 'COIN2/USDT', 
      displaySymbol: 'COIN2/USDT',
      price: 4900.00,
      priceChange: -100.00,
      priceChangePercent: -2.00,
      turnover: 15600000,
      label: '하락 예시',
      initialPrice: 5000.00,
      prevPrice: 5000.00
    },
    {
      symbol: 'COIN3/USDT',
      displaySymbol: 'COIN3/USDT', 
      price: 73.19,
      priceChange: 0.00,
      priceChangePercent: 0.00,
      turnover: 890000,
      label: '보합 예시',
      initialPrice: 73.19,
      prevPrice: 73.19
    }
  ]);

  // 애니메이션 매니저 생성 (설정된 지속 시간 사용)
  const [animationManager, setAnimationManager] = useState(() => createPriceChangeAnimationManager(borderAnimationDuration));

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
        
        // 변동 후 가격 계산 (최소 0.01)
        const newPrice = Math.max(ticker.price + change, 0.05); 
        
        // 가격 변동 및 퍼센트 계산
        const priceChange = newPrice - ticker.initialPrice;
        const priceChangePercent = (priceChange / ticker.initialPrice) * 100;
        
        return {
          ...ticker,
          prevPrice: ticker.price, // 현재 가격을 이전 가격으로 저장
          price: newPrice,
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
        
        const newPrice = Math.max(ticker.price + change, 0.05); // 변동 후 가격
        
        const priceChange = newPrice - ticker.initialPrice;
        const priceChangePercent = (priceChange / ticker.initialPrice) * 100;
        
        return {
          ...ticker,
          prevPrice: ticker.price, // 현재 가격을 이전 가격으로 저장
          price: newPrice,
          priceChange,
          priceChangePercent,
        };
      }));
    }, 1100);
    return () => clearInterval(interval);
  }, [animationManager]);


  // 컴포넌트가 마운트되지 않았거나 테마 색상이 로드되지 않은 경우
  if (!mounted || !themeColors) {
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
              active={borderAnimationEnabled}
              onChange={(active) => setBorderAnimationEnabled(active)}
              themeColors={themeColors}
              currentTheme={currentTheme}
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
              themeColors={themeColors}
              currentTheme={currentTheme}
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
              active={showPriceChange}
              onChange={(active) => setShowPriceChange(active)}
              themeColors={themeColors}
              currentTheme={currentTheme}
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
              active={showPercentBackground}
              onChange={(active) => setShowPercentBackground(active)}
              themeColors={themeColors}
              currentTheme={currentTheme}
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
            {tickerData.map((ticker) => (
              <Ticker
                key={ticker.symbol}
                data={ticker}
                onPriceChange={(symbol, oldPrice, newPrice) => {
                  console.log(`${symbol}: ${oldPrice} → ${newPrice}`);
                }}
              />
            ))}
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
