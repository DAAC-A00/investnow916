'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { Ticker, TickerData } from '@/packages/shared/components';
import { PriceDecimalTracker } from '@/packages/shared/utils';

export default function HomePage() {
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();
  
  // 가격 추적기 생성
  const priceTracker = useRef(new PriceDecimalTracker());

  useEffect(() => {
    setCurrentRoute('/home');
  }, [setCurrentRoute]);

  // 홈 페이지용 샘플 티커 데이터
  const [sampleTickers] = useState<TickerData[]>([
    {
      rawSymbol: 'TEST1COIN',
      integratedSymbol: 'TEST1/COIN',
      quantity: 1,
      baseCode: 'TEST1',
      quoteCode: 'COIN',
      exchange: 'bybit',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 43250.50,
      priceChange24h: 1250.50,
      priceChangePercent24h: 2.98,
      turnover24h: 1250000000,
      volume24h: 28901.4,
      prevPrice24h: 42000.00,
      prevPrice: 42000.00
    },
    {
      rawSymbol: 'TEST2COIN',
      integratedSymbol: 'TEST2/COIN',
      quantity: 1,
      baseCode: 'TEST2',
      quoteCode: 'COIN',
      exchange: 'bybit',
      integratedCategory: 'spot',
      rawCategory: 'spot',
      price: 2580.75,
      priceChange24h: -45.25,
      priceChangePercent24h: -1.72,
      turnover24h: 850000000,
      volume24h: 329362,
      prevPrice24h: 2626.00,
      prevPrice: 2626.00
    },
  ]);

  // 초기 데이터의 가격 추적
  useEffect(() => {
    sampleTickers.forEach(ticker => {
      priceTracker.current.trackPrice(ticker.rawSymbol, ticker.price);
    });
  }, [sampleTickers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              InvestNow916
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            실시간 금융 데이터와 투자 분석을 위한 통합 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/fiat')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              💱 환율 보기
            </button>
            <button
              onClick={() => router.push('/menu')}
              className="bg-card hover:bg-accent text-card-foreground font-semibold py-3 px-8 rounded-lg border border-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              ☰ 전체 메뉴 보기
            </button>
          </div>
        </div>

        {/* 인기 티커 섹션 */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">인기 암호화폐</h2>
            <p className="text-muted-foreground">
              실시간 가격 정보와 변동률을 확인하세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {sampleTickers.map((ticker) => (
              <Ticker
                key={ticker.rawSymbol}
                data={ticker}
                priceTracker={priceTracker.current}
                className="hover:scale-105 transition-transform duration-200"
                onPriceChange={(symbol, oldPrice, newPrice) => {
                  console.log(`홈 페이지 - ${symbol}: ${oldPrice} → ${newPrice}`);
                }}
                onClick={(data) => {
                  // ticker 데이터를 localStorage에 저장 (실제로는 store나 API를 사용해야 함)
                  localStorage.setItem(`ticker_${data.rawSymbol}`, JSON.stringify(data));
                  // 거래소별 상세 페이지로 이동 (빗썸의 경우 새 URL 구조 사용)
                  if (data.exchange === 'bithumb') {
                    router.push(`/exchange/ticker/bithumb/spot/${data.rawSymbol}`);
                  } else {
                    router.push(`/ticker/${data.rawSymbol}`);
                  }
                }}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/setting/ticker')}
              className="bg-muted hover:bg-muted/80 text-muted-foreground font-medium py-2 px-6 rounded-lg border border-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              ⚙️ 티커 설정 변경
            </button>
          </div>
        </div>

        {/* 기능 소개 섹션 */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">주요 기능</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">실시간 데이터</h3>
              <p className="text-muted-foreground">
                실시간 가격 변동과 차트를 통해 시장 동향을 파악하세요
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">커스터마이징</h3>
              <p className="text-muted-foreground">
                색상 모드, 애니메이션 등 개인 취향에 맞게 설정 가능
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">다크 모드</h3>
              <p className="text-muted-foreground">
                라이트/다크 모드를 지원하여 편안한 사용 환경 제공
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
