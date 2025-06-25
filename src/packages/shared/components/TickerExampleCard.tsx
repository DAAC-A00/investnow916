'use client';

import { useState, useEffect, useRef } from 'react';
import { createPriceChangeAnimationManager, BorderAnimationDuration } from '@/packages/shared/stores/createTickerSettingStore';
import { TickerData } from '@/packages/shared/types/exchange';
import { Ticker } from './Ticker';  
import { PriceDecimalTracker } from '@/packages/shared/utils';

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
  // 가격 추적기 생성
  const priceTracker = useRef(new PriceDecimalTracker());

  // 실시간 티커 데이터 상태
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
      prevPrice: 5000.00
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
      prevPrice: 90000.00
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
      prevPrice: 5000.00
    },
    {
      rawSymbol: 'LongNameCoin000USDT',
      integratedSymbol: 'LongNameCoin000/USDT',
      quantity: 1,
      baseCode: 'LongNameCoin000',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 0.000123455555,
      priceChange24h: -0.000123455555,
      priceChangePercent24h: -50.00,
      turnover24h: 120000,
      volume24h: 95000000,
      warningType: 'PRICE_DIFFERENCE_HIGH',
      prevPrice24h: 0.00246913578,
      prevPrice: 0.00246913578
    },
    {
      rawSymbol: 'COIN3USDT',
      integratedSymbol: 'COIN3/USDT',
      quantity: 1,
      baseCode: 'COIN3',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 73.19,
      priceChange24h: 0.00,
      priceChangePercent24h: 0.00,
      turnover24h: 890000,
      volume24h: 12000,
      warningType: 'DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION',
      prevPrice24h: 73.19,
      prevPrice: 73.19
    },
    {
      rawSymbol: 'PrettyMuchLongNameCoin777USDT',
      integratedSymbol: 'PrettyMuchLongNameCoin777/USDT',
      quantity: 1,
      baseCode: 'PrettyMuchLongNameCoin777',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 770000000.00,
      priceChange24h: 754901961.00,
      priceChangePercent24h: 5000.00,
      turnover24h: 999999999999,
      volume24h: 1500000000,
      warningType: 'PRICE_DIFFERENCE_HIGH',
      prevPrice24h: 15098039.00,
      prevPrice: 15098039.00
    },
    {
      rawSymbol: 'BigChangeCOINUSDT',
      integratedSymbol: 'BigChangeCOIN/USDT',
      quantity: 1,
      baseCode: 'BigChangeCOIN',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 282.50,
      priceChange24h: 195.50,
      priceChangePercent24h: 224.71,
      turnover24h: 1234567,
      volume24h: 4500,
      warningType: 'TRADING_VOLUME_SUDDEN_FLUCTUATION',
      prevPrice24h: 87.00,
      prevPrice: 87.00
    },
    {
      rawSymbol: 'BiggerChangeCOINUSDT',
      integratedSymbol: 'BiggerChangeCOIN/USDT',
      quantity: 1,
      baseCode: 'BiggerChangeCOIN',
      quoteCode: 'USDT',
      exchange: 'bithumb',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 190.00,
      priceChange24h: 180.00,
      priceChangePercent24h: 1800.00,
      turnover24h: 7654321,
      volume24h: 40000,
      warningType: 'EXCHANGE_TRADING_CONCENTRATION',
      prevPrice24h: 10.00,
      prevPrice: 10.00
    },
  ]);

  // 초기 데이터의 가격 추적
  useEffect(() => {
    tickerData.forEach(ticker => {
      priceTracker.current.trackPrice(ticker.rawSymbol, ticker.price);
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
        
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h: newPrice - ticker.prevPrice24h,
          priceChangePercent24h: ((newPrice - ticker.prevPrice24h) / ticker.prevPrice24h) * 100
        };
      }));
    }, 700);

    return () => clearInterval(interval);
  }, []);

  // COIN2: 1.5초마다 -5, -3, -1, 0, +1, +3, +5 중 무작위 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'COIN2USDT') return ticker;
        
        // -5, -3, -1, 0, +1, +3, +5 중 하나 무작위 선택
        const possibleChanges = [-5, -3, -1, 0, 1, 3, 5];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        // 변동 후 가격 계산 (최소 0.01)
        const newPrice = Math.max(ticker.price + change, 0.01);
        
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h: newPrice - ticker.prevPrice24h,
          priceChangePercent24h: ((newPrice - ticker.prevPrice24h) / ticker.prevPrice24h) * 100
        };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // LongNameCoin000: 2초마다 매우 소수점이 긴 변동 
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'LongNameCoin000USDT') return ticker;
        
        // 매우 작은 변동량들 중 하나 무작위 선택
        const possibleChanges = [-0.0000123, -0.0000456, -0.0000789, 0, 0.0000123, 0.0000456, 0.0000789];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        // 변동 후 가격 계산 (최소 0.00000001)
        const newPrice = Math.max(ticker.price + change, 0.00000001);
        
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h: newPrice - ticker.prevPrice24h,
          priceChangePercent24h: ((newPrice - ticker.prevPrice24h) / ticker.prevPrice24h) * 100
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // BigChangeCOINUSDT: 0.9초마다 소수점이 다양한 변동 (예: 0.5, 0.25, 0.125, 0.0625 등)
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'BigChangeCOINUSDT') return ticker;
        
        // 다양한 소수점을 가진 변동량들 중 하나 무작위 선택
        const possibleChanges = [-2.5, -1.25, -0.625, -0.3125, 0, 0.3125, 0.625, 1.25, 2.5];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        // 변동 후 가격 계산 (최소 0.01)
        const newPrice = Math.max(ticker.price + change, 0.01);
        
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h: newPrice - ticker.prevPrice24h,
          priceChangePercent24h: ((newPrice - ticker.prevPrice24h) / ticker.prevPrice24h) * 100
        };
      }));
    }, 900);

    return () => clearInterval(interval);
  }, []);

  // BiggerChangeCOINUSDT: 1.2초마다 정수 단위 변동
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(ticker => {
        if (ticker.rawSymbol !== 'BiggerChangeCOINUSDT') return ticker;
        
        // 정수 단위 변동량들 중 하나 무작위 선택
        const possibleChanges = [-10, -5, -2, -1, 0, 1, 2, 5, 10];
        const change = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
        
        // 변동 후 가격 계산 (최소 1)
        const newPrice = Math.max(ticker.price + change, 1);
        
        return {
          ...ticker,
          prevPrice: ticker.price,
          price: newPrice,
          priceChange24h: newPrice - ticker.prevPrice24h,
          priceChangePercent24h: ((newPrice - ticker.prevPrice24h) / ticker.prevPrice24h) * 100
        };
      }));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tickerData.map((ticker) => (
            <Ticker
              key={ticker.rawSymbol}
              data={ticker}
              priceTracker={priceTracker.current}
              onPriceChange={(symbol, oldPrice, newPrice) => {
                console.log(`${symbol}: ${oldPrice} → ${newPrice}`);
              }}
            />
          ))}
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