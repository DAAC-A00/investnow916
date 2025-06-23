'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { TickerData } from '@/packages/shared/types/exchange';

interface OrderbookUnit {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
}

interface OrderbookData {
  market: string;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
  orderbook_units: OrderbookUnit[];
}

interface BithumbTickerResponse {
  status: string;
  data: {
    [symbol: string]: {
      opening_price: string;
      closing_price: string;
      min_price: string;
      max_price: string;
      units_traded: string;
      acc_trade_value: string;
      prev_closing_price: string;
      units_traded_24H: string;
      acc_trade_value_24H: string;
      fluctate_24H: string;
      fluctate_rate_24H: string;
      date: string;
    };
  };
}

export default function BithumbTickerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();

  const displayCategory = params?.displayCategory as string;
  const symbol = params?.symbol as string;
  
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentRoute(`/exchange/ticker/bithumb/${displayCategory}/${symbol}`);
  }, [setCurrentRoute, displayCategory, symbol]);

  // 호가 정보 가져오기
  const fetchOrderbook = useCallback(async () => {
    try {
      // symbol이 BTCKRW 형태이므로 KRW-BTC 형태로 변환
      const baseCode = symbol.replace(/KRW$|BTC$/, '');
      const quoteCode = symbol.includes('KRW') ? 'KRW' : 'BTC';
      const market = `${quoteCode}-${baseCode}`;
      const response = await fetch(`https://api.bithumb.com/v1/orderbook?markets=${market}`);
      
      if (!response.ok) {
        throw new Error('호가 정보를 가져올 수 없습니다');
      }

      const data: OrderbookData[] = await response.json();
      if (data && data.length > 0) {
        setOrderbookData(data[0]);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('호가 정보 가져오기 실패:', error);
      setError(error instanceof Error ? error.message : '호가 정보를 가져올 수 없습니다');
    }
  }, [symbol]);

  // 티커 정보 가져오기
  const fetchTickerInfo = useCallback(async () => {
    try {
      // symbol이 BTCKRW 형태이므로 파싱하여 API 호출
      const baseCode = symbol.replace(/KRW$|BTC$/, '');
      const quoteCode = symbol.includes('KRW') ? 'KRW' : 'BTC';
      const response = await fetch(`https://api.bithumb.com/public/ticker/${baseCode}_${quoteCode}`);
      
      if (!response.ok) {
        throw new Error('티커 정보를 가져올 수 없습니다');
      }

      const data: BithumbTickerResponse = await response.json();
      
      if (data.status === '0000' && data.data) {
        const tickerInfo = data.data[baseCode];
        if (tickerInfo) {
          const newTickerData: TickerData = {
            rawSymbol: symbol,
            displaySymbol: `${baseCode}/${quoteCode}`,
            quantity: 1,
            baseCode: baseCode,
            quoteCode: quoteCode,
            exchange: 'bithumb',
            displayCategory: displayCategory,
            rawCategory: displayCategory,
            price: parseFloat(tickerInfo.closing_price),
            priceChange24h: parseFloat(tickerInfo.fluctate_24H),
            priceChangePercent24h: parseFloat(tickerInfo.fluctate_rate_24H),
            turnover24h: parseFloat(tickerInfo.acc_trade_value_24H),
            volume24h: parseFloat(tickerInfo.units_traded_24H),
            prevPrice24h: parseFloat(tickerInfo.prev_closing_price),
            prevPrice: parseFloat(tickerInfo.prev_closing_price),
            highPrice24h: parseFloat(tickerInfo.max_price),
            lowPrice24h: parseFloat(tickerInfo.min_price),
          };
          setTickerData(newTickerData);
        }
      }
    } catch (error) {
      console.error('티커 정보 가져오기 실패:', error);
      setError(error instanceof Error ? error.message : '티커 정보를 가져올 수 없습니다');
    }
  }, [displayCategory, symbol]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 저장된 ticker 데이터가 있으면 먼저 로드
        const storedData = localStorage.getItem(`ticker_${symbol}`);
        if (storedData) {
          setTickerData(JSON.parse(storedData));
        }

        // API에서 최신 데이터 가져오기
        await Promise.all([
          fetchTickerInfo(),
          fetchOrderbook()
        ]);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol && displayCategory) {
      loadInitialData();
    }
  }, [symbol, displayCategory, fetchTickerInfo, fetchOrderbook]);

  // 0.8초마다 데이터 갱신
  useEffect(() => {
    if (!symbol || !displayCategory) return;

    const interval = setInterval(async () => {
      await Promise.all([
        fetchTickerInfo(),
        fetchOrderbook()
      ]);
    }, 800);

    return () => clearInterval(interval);
  }, [symbol, displayCategory, fetchTickerInfo, fetchOrderbook]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">오류 발생</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium"
          >
            다시 시도
          </button>
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
            onClick={() => router.push('/exchange/ticker/bithumb')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium"
          >
            빗썸 티커 목록으로
          </button>
        </div>
      </div>
    );
  }

  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const formatPrice = (price: number, isKRW: boolean = true) => {
    if (isKRW) {
      return price.toLocaleString(undefined, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 8 
    });
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600'; // 빗썸은 상승시 빨간색
    if (change < 0) return 'text-blue-600'; // 하락시 파란색
    return 'text-muted-foreground';
  };

  const getPriceChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-red-100 text-red-800';
    if (change < 0) return 'bg-blue-100 text-blue-800';
    return 'bg-muted text-muted-foreground';
  };

  const isKRW = tickerData.quoteCode === 'KRW';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/exchange/ticker/bithumb')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              빗썸 티커 목록으로
            </button>
            <div className="text-sm text-muted-foreground">
              마지막 업데이트: {lastUpdate?.toLocaleTimeString('ko-KR') || '-'}
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {tickerData.displaySymbol}
                </h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                    BITHUMB
                  </span>
                  <span className="bg-muted text-muted-foreground px-2 py-1 rounded">
                    {tickerData.displayCategory.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* 현재 가격 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">현재가</div>
                <div className="text-3xl font-bold text-foreground">
                  {formatPrice(tickerData.price, isKRW)} {tickerData.quoteCode}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">24시간 변동</div>
                <div className={`text-2xl font-semibold ${getPriceChangeColor(tickerData.priceChange24h)}`}>
                  {tickerData.priceChange24h >= 0 ? '+' : ''}{formatPrice(tickerData.priceChange24h, isKRW)}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 호가 정보 */}
          {orderbookData && (
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">호가 정보</h2>
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground py-2 border-b">
                  <div className="text-right">매도호가</div>
                  <div className="text-right">매도잔량</div>
                  <div className="text-right">매수잔량</div>
                  <div className="text-right">매수호가</div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {orderbookData.orderbook_units.slice(0, 20).map((unit, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 text-sm py-1 hover:bg-muted/50">
                      <div className="text-right text-blue-600 font-medium">
                        {formatPrice(unit.ask_price, isKRW)}
                      </div>
                      <div className="text-right">
                        {unit.ask_size.toFixed(4)}
                      </div>
                      <div className="text-right">
                        {unit.bid_size.toFixed(4)}
                      </div>
                      <div className="text-right text-red-600 font-medium">
                        {formatPrice(unit.bid_price, isKRW)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground py-2 border-t">
                  <div className="text-right">총 매도잔량</div>
                  <div className="text-right">{formatNumber(orderbookData.total_ask_size)}</div>
                  <div className="text-right">{formatNumber(orderbookData.total_bid_size)}</div>
                  <div className="text-right">총 매수잔량</div>
                </div>
              </div>
            </div>
          )}

          {/* 상세 정보 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">상세 정보</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 최고가</span>
                <span className="font-medium">
                  {tickerData.highPrice24h ? formatPrice(tickerData.highPrice24h, isKRW) : '-'} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 최저가</span>
                <span className="font-medium">
                  {tickerData.lowPrice24h ? formatPrice(tickerData.lowPrice24h, isKRW) : '-'} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 전 가격</span>
                <span className="font-medium">
                  {formatPrice(tickerData.prevPrice24h, isKRW)} {tickerData.quoteCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24시간 거래량</span>
                <span className="font-medium">
                  {formatNumber(tickerData.volume24h)} {tickerData.baseCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">24시간 거래대금</span>
                <span className="font-medium">
                  {formatNumber(tickerData.turnover24h)} {tickerData.quoteCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => router.push('/exchange/ticker/bithumb')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium"
          >
            빗썸 티커 목록으로
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