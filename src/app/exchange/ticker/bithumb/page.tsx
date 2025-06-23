'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { useExchangeInstrumentStore } from '@/packages/shared/stores/createExchangeInstrumentStore';
import { Ticker } from '@/packages/shared/components';
import { TickerData, BithumbTickerResponse, BithumbTicker } from '@/packages/shared/types/exchange';

interface BithumbCombinedTicker {
  symbol: string;
  baseCode: string;
  quoteCode: string;
  ticker: BithumbTicker;
}

export default function BithumbTickerPage() {
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();
  const { getFilteredCoins } = useExchangeInstrumentStore();

  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<'changePercent' | 'price' | 'volume' | 'turnover' | 'symbol'>('changePercent');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    setCurrentRoute('/exchange/ticker/bithumb');
  }, [setCurrentRoute]);

  // 빗썸 API에서 티커 데이터 가져오기
  const fetchTickerData = useCallback(async () => {
    try {
      setError(null);
      
      // 두 API를 병렬로 호출
      const [krwResponse, btcResponse] = await Promise.all([
        fetch('https://api.bithumb.com/public/ticker/ALL_KRW'),
        fetch('https://api.bithumb.com/public/ticker/ALL_BTC')
      ]);

      if (!krwResponse.ok || !btcResponse.ok) {
        throw new Error('API 요청 실패');
      }

      const krwData: BithumbTickerResponse = await krwResponse.json();
      const btcData: BithumbTickerResponse = await btcResponse.json();

      if (krwData.status !== '0000' || btcData.status !== '0000') {
        throw new Error('API 응답 오류');
      }

      // 데이터 변환
      const combinedTickers: BithumbCombinedTicker[] = [];

      // KRW 마켓 데이터 추가
      Object.entries(krwData.data).forEach(([symbol, ticker]) => {
        if (symbol !== 'date' && typeof ticker === 'object') {
          combinedTickers.push({
            symbol,
            baseCode: symbol,
            quoteCode: 'KRW',
            ticker: ticker as BithumbTicker
          });
        }
      });

      // BTC 마켓 데이터 추가
      Object.entries(btcData.data).forEach(([symbol, ticker]) => {
        if (symbol !== 'date' && typeof ticker === 'object') {
          combinedTickers.push({
            symbol,
            baseCode: symbol,
            quoteCode: 'BTC',
            ticker: ticker as BithumbTicker
          });
        }
      });

      // localStorage에서 빗썸 instrument 정보 가져오기
      const bithumbCoins = getFilteredCoins({
        exchange: 'bithumb',
        category: 'spot'
      });

      // TickerData 형식으로 변환
      const tickerDataList: TickerData[] = combinedTickers.map(({ symbol, baseCode, quoteCode, ticker }) => {
        const rawSymbol = `${symbol}${quoteCode}`;
        const displaySymbol = `${baseCode}/${quoteCode}`;
        
        // 가격 관련 값들을 숫자로 변환
        const price = parseFloat(ticker.closing_price);
        const prevPrice24h = parseFloat(ticker.prev_closing_price);
        const priceChange24h = parseFloat(ticker.fluctate_24H);
        const priceChangePercent24h = parseFloat(ticker.fluctate_rate_24H);
        const volume = parseFloat(ticker.units_traded_24H);
        const turnover = parseFloat(ticker.acc_trade_value_24H);
        const highPrice24h = parseFloat(ticker.max_price);
        const lowPrice24h = parseFloat(ticker.min_price);

        return {
          rawSymbol,
          displaySymbol,
          quantity: 1,
          baseCode,
          quoteCode,
          price,
          priceChange24h,
          priceChangePercent24h,
          prevPrice24h,
          volume,
          turnover,
          highPrice24h,
          lowPrice24h,
          exchange: 'bithumb',
          displayCategory: 'spot',
          rawCategory: 'spot'
        };
      });

             setTickers(tickerDataList);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error('티커 데이터 가져오기 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setIsLoading(false);
    }
  }, [getFilteredCoins]);

  // 1초마다 데이터 갱신
  useEffect(() => {
    // 초기 데이터 로드
    fetchTickerData();

    // 1초마다 갱신
    const interval = setInterval(fetchTickerData, 1000);

    return () => clearInterval(interval);
  }, [fetchTickerData]);

  const handlePriceChange = (symbol: string, oldPrice: number, newPrice: number) => {
    console.log(`빗썸 티커 - ${symbol}: ${oldPrice} → ${newPrice}`);
  };

  // 정렬 함수
  const sortTickers = useCallback((tickersToSort: TickerData[]) => {
    const sorted = [...tickersToSort].sort((a, b) => {
      let valueA: number | string;
      let valueB: number | string;

      switch (sortBy) {
        case 'changePercent':
          valueA = a.priceChangePercent24h;
          valueB = b.priceChangePercent24h;
          break;
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'volume':
          valueA = a.volume;
          valueB = b.volume;
          break;
        case 'turnover':
          valueA = a.turnover;
          valueB = b.turnover;
          break;
        case 'symbol':
          valueA = a.displaySymbol;
          valueB = b.displaySymbol;
          break;
        default:
          valueA = a.priceChangePercent24h;
          valueB = b.priceChangePercent24h;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'desc' 
          ? valueB.localeCompare(valueA)
          : valueA.localeCompare(valueB);
      }

      const numA = valueA as number;
      const numB = valueB as number;
      return sortOrder === 'desc' ? numB - numA : numA - numB;
    });

    return sorted;
  }, [sortBy, sortOrder]);

  // 정렬된 티커 목록
  const sortedTickers = sortTickers(tickers);

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      // 같은 항목 클릭시 정렬 순서 변경
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // 다른 항목 클릭시 해당 항목으로 변경하고 내림차순으로 설정
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">오류 발생</h2>
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={fetchTickerData}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                빗썸 실시간 티커
              </h1>
              <p className="text-muted-foreground mt-1">
                KRW 및 BTC 마켓의 실시간 가격 정보
              </p>
            </div>
            <button
              onClick={() => router.push('/exchange')}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg border border-border"
            >
              ← 거래소 메뉴
            </button>
          </div>

          {/* 상태 표시 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span>{isLoading ? '데이터 로딩 중...' : '실시간 업데이트'}</span>
            </div>
            {lastUpdate && (
              <div>
                마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
              </div>
            )}
            <div>
              총 {tickers.length}개 코인
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-medium text-foreground mr-2">정렬:</span>
            <button
              onClick={() => handleSortChange('changePercent')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                sortBy === 'changePercent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              변동률 {sortBy === 'changePercent' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSortChange('price')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                sortBy === 'price'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              가격 {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSortChange('volume')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                sortBy === 'volume'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              거래량 {sortBy === 'volume' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSortChange('turnover')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                sortBy === 'turnover'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              거래대금 {sortBy === 'turnover' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSortChange('symbol')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                sortBy === 'symbol'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              심볼명 {sortBy === 'symbol' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* 티커 목록 */}
        {isLoading && tickers.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {sortedTickers.map((ticker) => (
              <Ticker
                key={ticker.rawSymbol}
                data={ticker}
                className="hover:scale-105 transition-transform duration-200"
                onPriceChange={handlePriceChange}
              />
            ))}
          </div>
        )}

        {/* 빈 상태 */}
                 {!isLoading && sortedTickers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              티커 데이터가 없습니다
            </h3>
            <p className="text-muted-foreground mb-4">
              잠시 후 다시 시도해주세요
            </p>
            <button
              onClick={fetchTickerData}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
            >
              새로고침
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 