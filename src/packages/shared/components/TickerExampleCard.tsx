'use client';

import { useState, useEffect, useRef } from 'react';
import { createPriceChangeAnimationManager, BorderAnimationDuration } from '@/packages/shared/stores/createTickerSettingStore';
import { Ticker } from '@/packages/shared/components';
import { TickerData } from '@/packages/shared/types/exchange';

interface TickerExampleCardProps {
  title?: string;
  description?: string;
  className?: string;
  borderAnimationDuration?: BorderAnimationDuration;
}

export function TickerExampleCard({ 
  title = "예시", 
  description,
  className = "",
  borderAnimationDuration = 300 as BorderAnimationDuration
}: TickerExampleCardProps) {
  // symbol별 lastPrice 최대 소수점 자리수 추적
  const symbolMaxDecimals = useRef<Record<string, number>>({});
  
  // 숫자의 소수점 자리수를 계산하는 함수
  const getDecimals = (num: number) => {
    if (!isFinite(num)) return 0;
    const s = num.toString();
    if (s.includes('.')) return s.split('.')[1].length;
    return 0;
  };

  // 실시간 티커 데이터 상태
  const [tickerData, setTickerData] = useState<TickerData[]>([
    {
      rawSymbol: 'COIN1USDT',
      displaySymbol: 'COIN1/USDT',
      quantity: 1,
      baseCode: 'COIN1',
      quoteCode: 'USDT',
      price: 5300.00,
      priceChange24h: 300.00,
      priceChangePercent24h: 6.00,
      turnover: 2340000000,
      volume: 1200000,
      warningType: 'SPECIFIC_ACCOUNT_HIGH_TRANSACTION',
      prevPrice24h: 5000.00,
      prevPrice: 5000.00
    },
    {
      rawSymbol: 'LongNameCoin999USDT',
      displaySymbol: 'LongNameCoin999/USDT',
      quantity: 1,
      baseCode: 'LongNameCoin999',
      quoteCode: 'USDT',
      price: 630000.00,
      priceChange24h: 540000.00,
      priceChangePercent24h: 600.00,
      turnover: 50000000000,
      volume: 89000000,
      warningType: 'TRADING_VOLUME_SUDDEN_FLUCTUATION',
      prevPrice24h: 90000.00,
      prevPrice: 90000.00
    },
    {
      rawSymbol: 'COIN2USDT',
      displaySymbol: 'COIN2/USDT',
      quantity: 1,
      baseCode: 'COIN2',
      quoteCode: 'USDT',
      price: 4700.00,
      priceChange24h: -300.00,
      priceChangePercent24h: -6.00,
      turnover: 15600000,
      volume: 3500000,
      warningType: 'PRICE_DIFFERENCE_HIGH',
      prevPrice24h: 5000.00,
      prevPrice: 5000.00
    },
    {
      rawSymbol: 'LongNameCoin000USDT',
      displaySymbol: 'LongNameCoin000/USDT',
      quantity: 1,
      baseCode: 'LongNameCoin000',
      quoteCode: 'USDT',
      price: 0.000123455555,
      priceChange24h: -0.000123455555,
      priceChangePercent24h: -50.00,
      turnover: 120000,
      volume: 95000000,
      warningType: 'PRICE_DIFFERENCE_HIGH',
      prevPrice24h: 0.00246913578,
      prevPrice: 0.00246913578
    },
    {
      rawSymbol: 'COIN3USDT',
      displaySymbol: 'COIN3/USDT',
      quantity: 1,
      baseCode: 'COIN3',
      quoteCode: 'USDT',
      price: 73.19,
      priceChange24h: 0.00,
      priceChangePercent24h: 0.00,
      turnover: 890000,
      volume: 12000,
      warningType: 'DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION',
      prevPrice24h: 73.19,
      prevPrice: 73.19
    },
    {
      rawSymbol: 'PrettyMuchLongNameCoin777USDT',
      displaySymbol: 'PrettyMuchLongNameCoin777/USDT',
      quantity: 1,
      baseCode: 'PrettyMuchLongNameCoin777',
      quoteCode: 'USDT',
      price: 770000000.00,
      priceChange24h: 754901961.00,
      priceChangePercent24h: 5000.00,
      turnover: 999999999999,
      volume: 1500000000,
      warningType: 'PRICE_DIFFERENCE_HIGH',
      prevPrice24h: 15098039.00,
      prevPrice: 15098039.00
    },
    {
      rawSymbol: 'BigChangeCOINUSDT',
      displaySymbol: 'BigChangeCOIN/USDT',
      quantity: 1,
      baseCode: 'BigChangeCOIN',
      quoteCode: 'USDT',
      price: 282.50,
      priceChange24h: 195.50,
      priceChangePercent24h: 224.71,
      turnover: 1234567,
      volume: 4500,
      warningType: 'TRADING_VOLUME_SUDDEN_FLUCTUATION',
      prevPrice24h: 87.00,
      prevPrice: 87.00
    },
    {
      rawSymbol: 'BiggerChangeCOINUSDT',
      displaySymbol: 'BiggerChangeCOIN/USDT',
      quantity: 1,
      baseCode: 'BiggerChangeCOIN',
      quoteCode: 'USDT',
      price: 190.00,
      priceChange24h: 180.00,
      priceChangePercent24h: 1800.00,
      turnover: 7654321,
      volume: 40000,
      warningType: 'EXCHANGE_TRADING_CONCENTRATION',
      prevPrice24h: 10.00,
      prevPrice: 10.00
    },
  ]);

  // 초기 데이터의 소수점 자리수 추적
  useEffect(() => {
    tickerData.forEach(ticker => {
      const decimals = getDecimals(ticker.price);
      symbolMaxDecimals.current[ticker.rawSymbol] = decimals;
    });
  }, []);

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
        if (ticker.rawSymbol !== 'COIN1USDT') return ticker;
        
        // -1.0, -0.5, 0, +0.5, +1.0 중 하나 무작위 선택
        const possibleChanges = [-1.0, -0.5, 0, 0.5, 1.0];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        // 변동 후 가격 계산 (최소 0.01)
        const newPrice = Math.max(ticker.price + change, 0.05); 
        
        // 소수점 자리수 추적
        const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
        const current = getDecimals(newPrice);
        if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
        
        // 가격 변동 및 퍼센트 계산
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = (priceChange24h / ticker.prevPrice24h) * 100;
        
        return {
          ...ticker,
          prevPrice: ticker.price, // 현재 가격을 이전 가격으로 저장
          price: newPrice,
          priceChange24h,
          priceChangePercent24h,
        };
      }));
    }, 700);
    return () => clearInterval(interval);
  }, [animationManager]);

  // COIN2: 1.1초마다 -0.2, -0.1, 0, +0.1, +0.2 중 무작위 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'COIN2USDT') return ticker;
        
        // -1.0, -0.5, 0, +0.5, +1.0 중 하나 무작위 선택
        const possibleChanges = [-1.0, -0.5, 0, 0.5, 1.0];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        const newPrice = Math.max(ticker.price + change, 0.05); // 변동 후 가격
        
        // 소수점 자리수 추적
        const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
        const current = getDecimals(newPrice);
        if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
        
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = (priceChange24h / ticker.prevPrice24h) * 100;
        
        return {
          ...ticker,
          prevPrice: ticker.price, // 현재 가격을 이전 가격으로 저장
          price: newPrice,
          priceChange24h,
          priceChangePercent24h,
        };
      }));
    }, 1100);
    return () => clearInterval(interval);
  }, [animationManager]);

  // LongNameCoin999/USDT: 1초마다 +1000, 0, -1000 중 하나 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'LongNameCoin999USDT') return ticker;
        const possibleChanges = [1000, 0, -1000];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        const newPrice = Math.max(ticker.price + change, 0); // 음수 방지
        const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
        const current = getDecimals(newPrice);
        if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = (priceChange24h / ticker.prevPrice24h) * 100;
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h,
          priceChangePercent24h,
        };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [animationManager]);

  // LongNameCoin000/USDT: 1초마다 +0.00001, 0, -0.00001 중 하나 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'LongNameCoin000USDT') return ticker;
        const possibleChanges = [0.00001, 0, -0.00001];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        const newPrice = Math.max(ticker.price + change, 0); // 음수 방지
        const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
        const current = getDecimals(newPrice);
        if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = (priceChange24h / ticker.prevPrice24h) * 100;
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h,
          priceChangePercent24h,
        };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [animationManager]);

  // PrettyMuchLongNameCoin777/USDT: 8초마다 +500000, 0, -500000 중 하나 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'PrettyMuchLongNameCoin777USDT') return ticker;
        const possibleChanges = [500000, 0, -500000];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        const newPrice = Math.max(ticker.price + change, 0); // 음수 방지
        const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
        const current = getDecimals(newPrice);
        if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = (priceChange24h / ticker.prevPrice24h) * 100;
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h,
          priceChangePercent24h,
        };
      }));
    }, 800);
    return () => clearInterval(interval);
  }, [animationManager]);

  // BigChangeCOIN/USDT: 1.2초마다 -1, 0, +1 중 하나 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'BigChangeCOINUSDT') return ticker;
        const possibleChanges = [-1, 0, 1];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        const newPrice = Math.max(ticker.price + change, 0); // 음수 방지
        const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
        const current = getDecimals(newPrice);
        if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = (priceChange24h / ticker.prevPrice24h) * 100;
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h,
          priceChangePercent24h,
        };
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, [animationManager]);

  // BiggerChangeCOIN/USDT: 1.3초마다 +0.5, 0, -0.5 중 하나 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'BiggerChangeCOINUSDT') return ticker;
        const possibleChanges = [0.5, 0, -0.5];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        const newPrice = Math.max(ticker.price + change, 0); // 음수 방지
        const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
        const current = getDecimals(newPrice);
        if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
        const priceChange24h = newPrice - ticker.prevPrice24h;
        const priceChangePercent24h = (priceChange24h / ticker.prevPrice24h) * 100;
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h,
          priceChangePercent24h,
        };
      }));
    }, 1300);
    return () => clearInterval(interval);
  }, [animationManager]);

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(() => {
            // symbol별 price의 최대 소수점 자리수 추적 (렌더 직전)
            tickerData.forEach(ticker => {
              const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
              const current = getDecimals(ticker.price);
              if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
            });

            return tickerData.map((ticker) => {
              const priceDecimals = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
              
              // 포맷팅된 데이터로 업데이트
              const formattedTicker = {
                ...ticker,
                price: Number(Number(ticker.price).toFixed(priceDecimals)),
                priceChange24h: Number(Number(ticker.priceChange24h).toFixed(priceDecimals)),
              };

              return (
                <Ticker
                  key={ticker.rawSymbol}
                  data={formattedTicker}
                  maxDecimals={priceDecimals}
                  onPriceChange={(symbol, oldPrice, newPrice) => {
                    console.log(`${symbol}: ${oldPrice} → ${newPrice}`);
                  }}
                />
              );
            });
          })()}
        </div>
        
        {description && (
          <div className="mt-6 p-3 bg-muted/30 rounded-md">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
} 