'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { TickerData } from '@/packages/shared/types/exchange';
import { getWarningInfo, getInstrumentInfo } from '@/packages/shared/utils/tickerDataBuilder';

export default function TickerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL에서 symbol과 exchange 정보 추출
  const symbol = params?.symbol as string;

  useEffect(() => {
    setCurrentRoute(`/ticker/${symbol}`);
  }, [setCurrentRoute, symbol]);

  useEffect(() => {
    // localStorage에서 ticker 데이터 가져오기 (실제로는 API에서 가져와야 함)
    const loadTickerData = () => {
      try {
        // 여기서 실제로는 API를 호출하거나 store에서 데이터를 가져와야 합니다
        // 임시로 localStorage에서 가져오는 로직을 구현합니다
        const storedData = localStorage.getItem(`ticker_${symbol}`);
        if (storedData) {
          setTickerData(JSON.parse(storedData));
        } else {
          // 샘플 데이터
          setTickerData({
            rawSymbol: symbol,
            displaySymbol: symbol.replace(/USDT$/, '/USDT').replace(/KRW$/, '/KRW'),
            quantity: 1,
            baseCode: symbol.replace(/USDT$/, '').replace(/KRW$/, ''),
            quoteCode: symbol.includes('USDT') ? 'USDT' : 'KRW',
            exchange: 'bybit',
            displayCategory: 'spot',
            rawCategory: 'spot',
            price: 50000,
            priceChange24h: 1500,
            priceChangePercent24h: 3.09,
            turnover24h: 1500000000,
            volume24h: 30000,
            prevPrice24h: 48500,
            prevPrice: 48500,
            highPrice24h: 52000,
            lowPrice24h: 47000,
            bidPrice: 49990,
            askPrice: 50010,
            instrumentInfo: {
              status: 'Trading',
              koreanName: '비트코인',
              englishName: 'Bitcoin',
              displayName: 'Bitcoin (BTC)',
            },
            warningInfo: {
              hasActiveWarning: false,
              marketWarning: 'NONE',
            },
                         metadata: {
               lastUpdated: new Date(),
               dataSource: 'api',
             }
          });
        }
      } catch (error) {
        console.error('Failed to load ticker data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      loadTickerData();
    }
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">티커 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!tickerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">티커를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-6">요청한 티커 정보가 존재하지 않습니다.</p>
          <button
            onClick={() => router.back()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const warningInfo = getWarningInfo(tickerData);
  const instrumentInfo = getInstrumentInfo(tickerData);

  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 8 
    });
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getPriceChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-green-100 text-green-800';
    if (change < 0) return 'bg-red-100 text-red-800';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로 가기
            </button>
            <div className="text-sm text-muted-foreground">
              마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {tickerData.displaySymbol}
                </h1>
                {instrumentInfo.displayName && (
                  <p className="text-lg text-muted-foreground mb-2">
                    {instrumentInfo.displayName}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-muted text-muted-foreground px-2 py-1 rounded">
                    {tickerData.exchange.toUpperCase()}
                  </span>
                  <span className="bg-muted text-muted-foreground px-2 py-1 rounded">
                    {tickerData.displayCategory}
                  </span>
                  {instrumentInfo.status && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {instrumentInfo.status}
                    </span>
                  )}
                </div>
              </div>
              
              {warningInfo.hasWarning && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                  ⚠️ 주의종목
                </div>
              )}
            </div>

            {/* 현재 가격 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">현재가</div>
                <div className="text-3xl font-bold text-foreground">
                  {formatPrice(tickerData.price)} {tickerData.quoteCode}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">24시간 변동</div>
                <div className={`text-2xl font-semibold ${getPriceChangeColor(tickerData.priceChange24h)}`}>
                  {tickerData.priceChange24h >= 0 ? '+' : ''}{formatPrice(tickerData.priceChange24h)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">24시간 변동률</div>
                <div className={`inline-block px-3 py-1 rounded-lg text-xl font-semibold ${getPriceChangeBgColor(tickerData.priceChangePercent24h)}`}>
                  {tickerData.priceChangePercent24h >= 0 ? '+' : ''}{tickerData.priceChangePercent24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 가격 정보 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">가격 정보</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 최고가</span>
                <span className="font-medium">
                  {tickerData.highPrice24h ? formatPrice(tickerData.highPrice24h) : '-'} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 최저가</span>
                <span className="font-medium">
                  {tickerData.lowPrice24h ? formatPrice(tickerData.lowPrice24h) : '-'} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 전 가격</span>
                <span className="font-medium">
                  {formatPrice(tickerData.prevPrice24h)} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">매수호가</span>
                <span className="font-medium text-green-600">
                  {tickerData.bidPrice ? formatPrice(tickerData.bidPrice) : '-'} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">매도호가</span>
                <span className="font-medium text-red-600">
                  {tickerData.askPrice ? formatPrice(tickerData.askPrice) : '-'} {tickerData.quoteCode}
                </span>
              </div>
            </div>
          </div>

          {/* 거래 정보 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">거래 정보</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 거래량</span>
                <span className="font-medium">
                  {formatNumber(tickerData.volume24h)} {tickerData.baseCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 거래대금</span>
                <span className="font-medium">
                  {formatNumber(tickerData.turnover24h)} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">거래소</span>
                <span className="font-medium capitalize">{tickerData.exchange}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">마켓 타입</span>
                <span className="font-medium capitalize">{tickerData.displayCategory}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 경고 정보 (경고가 있는 경우만 표시) */}
        {warningInfo.hasWarning && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center gap-2">
              ⚠️ 주의사항
            </h2>
            <div className="space-y-2 text-yellow-700">
              {warningInfo.warningType && (
                <p>• 경고 유형: {warningInfo.warningType}</p>
              )}
              {warningInfo.warningEndDate && (
                <p>• 경고 종료일: {warningInfo.warningEndDate}</p>
              )}
              {warningInfo.warningMessage && (
                <p>• {warningInfo.warningMessage}</p>
              )}
              <p className="text-sm mt-4">
                투자 시 각별한 주의가 필요한 종목입니다. 투자 전 반드시 관련 정보를 확인해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => router.push(`/exchange/ticker/${tickerData.exchange}`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium"
          >
            {tickerData.exchange} 티커 목록으로
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-muted hover:bg-muted/80 text-muted-foreground px-6 py-3 rounded-lg font-medium border border-border"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
} 