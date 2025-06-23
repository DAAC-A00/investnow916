'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { useExchangeInstrumentStore } from '@/packages/shared/stores/createExchangeInstrumentStore';
import { Ticker } from '@/packages/shared/components';
import { 
  TickerData, 
  BithumbTickerResponse, 
  BithumbTicker,
  BithumbMarketInfoResponse,
  BithumbMarketInfo,
  BithumbVirtualAssetWarningResponse,
  BithumbVirtualAssetWarning,
  BithumbWarningType
} from '@/packages/shared/types/exchange';

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
  const [sortBy, setSortBy] = useState<'changePercent' | 'price' | 'volume' | 'turnover' | 'symbol' | 'warning'>('changePercent');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [marketInfo, setMarketInfo] = useState<BithumbMarketInfo[]>([]);
  const [virtualAssetWarnings, setVirtualAssetWarnings] = useState<BithumbVirtualAssetWarning[]>([]);
  const [lastMarketInfoUpdate, setLastMarketInfoUpdate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setCurrentRoute('/exchange/ticker/bithumb');
  }, [setCurrentRoute]);

  // 빗썸 시장 정보 및 경고 정보 가져오기 (1분마다)
  const fetchMarketInfoAndWarnings = useCallback(async () => {
    try {
      // 두 API를 병렬로 호출
      const [marketInfoResponse, warningsResponse] = await Promise.all([
        fetch('https://api.bithumb.com/v1/market/all?isDetails=true'),
        fetch('https://api.bithumb.com/v1/market/virtual_asset_warning')
      ]);

      if (!marketInfoResponse.ok || !warningsResponse.ok) {
        throw new Error('시장 정보 API 요청 실패');
      }

      const marketInfoData: BithumbMarketInfoResponse = await marketInfoResponse.json();
      const warningsData: BithumbVirtualAssetWarningResponse = await warningsResponse.json();

      setMarketInfo(marketInfoData);
      setVirtualAssetWarnings(warningsData);
      setLastMarketInfoUpdate(new Date());
      
      console.log(`시장 정보 업데이트: ${marketInfoData.length}개 코인, ${warningsData.length}개 경고`);
    } catch (err) {
      console.error('시장 정보 가져오기 실패:', err);
    }
  }, []);

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

      // TickerData 형식으로 변환 (새로운 통합 구조 사용)
      const tickerDataList: TickerData[] = combinedTickers.map(({ symbol, baseCode, quoteCode, ticker }) => {
        const rawSymbol = `${symbol}${quoteCode}`;
        const displaySymbol = `${baseCode}/${quoteCode}`;
        const marketSymbol = `${quoteCode}-${symbol}`;
        
        // 가격 관련 값들을 숫자로 변환
        const price = parseFloat(ticker.closing_price);
        const prevPrice24h = parseFloat(ticker.prev_closing_price);
        const priceChange24h = parseFloat(ticker.fluctate_24H);
        const priceChangePercent24h = parseFloat(ticker.fluctate_rate_24H);
        const volume24h = parseFloat(ticker.units_traded_24H);
        const turnover24h = parseFloat(ticker.acc_trade_value_24H);
        const highPrice24h = parseFloat(ticker.max_price);
        const lowPrice24h = parseFloat(ticker.min_price);

        // 경고 정보 찾기
        const warning = virtualAssetWarnings.find(w => w.market === marketSymbol);
        const warningType: BithumbWarningType | undefined = warning?.warning_type;

        // 시장 정보 찾기 (유의 종목 여부)
        const market = marketInfo.find(m => m.market === marketSymbol);
        const hasMarketWarning = market?.market_warning === 'CAUTION';

        // 최종 경고 유형 결정
        const finalWarningType = warningType || (hasMarketWarning ? 'TRADING_VOLUME_SUDDEN_FLUCTUATION' as BithumbWarningType : undefined);

        return {
          // === 기본 식별 정보 ===
          rawSymbol,
          displaySymbol,
          baseCode,
          quoteCode,
          exchange: 'bithumb' as const,
          
          // === 카테고리 정보 ===
          displayCategory: 'spot',
          rawCategory: 'spot',
          
          // === 현재 가격 정보 ===
          price,
          prevPrice24h,
          priceChange24h,
          priceChangePercent24h,
          
          // === 거래 정보 ===
          volume24h,
          turnover24h,
          highPrice24h,
          lowPrice24h,
          quantity: 1,
          
          // === Instrument 세부 정보 ===
          instrumentInfo: {
            status: 'Trading',
            koreanName: market?.korean_name,
            englishName: market?.english_name,
          },
          
          // === Warning 정보 ===
          warningInfo: finalWarningType ? {
            warningType: finalWarningType,
            warningEndDate: warning?.end_date,
            marketWarning: hasMarketWarning ? 'CAUTION' : 'NONE',
            hasActiveWarning: !!finalWarningType,
          } : undefined,
          
          // === 메타데이터 ===
          metadata: {
            lastUpdated: new Date(),
            dataSource: 'https://api.bithumb.com',
            rawApiResponse: ticker,
            reliability: 'HIGH',
          },
          
          // === 거래소별 확장 정보 ===
          exchangeSpecific: {
            bithumb: {
              openingPrice: ticker.opening_price,
              prevClosingPrice: ticker.prev_closing_price,
              accTradeValue: ticker.acc_trade_value_24H,
              unitsTraded: ticker.units_traded_24H,
              marketType: quoteCode as 'KRW' | 'BTC',
            }
          }
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

  // 1초마다 티커 데이터 갱신
  useEffect(() => {
    // 초기 데이터 로드
    fetchTickerData();

    // 1초마다 갱신
    const interval = setInterval(fetchTickerData, 1000);

    return () => clearInterval(interval);
  }, [fetchTickerData]);

  // 1분마다 시장 정보 및 경고 정보 갱신
  useEffect(() => {
    // 초기 시장 정보 로드
    fetchMarketInfoAndWarnings();

    // 1분마다 갱신 (60초)
    const marketInfoInterval = setInterval(fetchMarketInfoAndWarnings, 60000);

    return () => clearInterval(marketInfoInterval);
  }, [fetchMarketInfoAndWarnings]);

  const handlePriceChange = (symbol: string, oldPrice: number, newPrice: number) => {
    console.log(`빗썸 티커 - ${symbol}: ${oldPrice} → ${newPrice}`);
  };

  // 정렬 함수
  const sortTickers = useCallback((tickersToSort: TickerData[]) => {
    if (sortBy === 'warning') {
      // 주의 정렬: 경고가 있는 티커를 상단에, 없는 티커를 하단에 배치
      // 각 그룹 내에서는 거래대금 내림차순으로 정렬
      const withWarnings: TickerData[] = [];
      const withoutWarnings: TickerData[] = [];

      tickersToSort.forEach(ticker => {
        const hasWarning = ticker.warningInfo?.warningType !== undefined;
        const hasMarketWarning = ticker.warningInfo?.marketWarning === 'CAUTION';
        
        if (hasWarning || hasMarketWarning) {
          withWarnings.push(ticker);
        } else {
          withoutWarnings.push(ticker);
        }
      });

      // 각 그룹 내에서 거래대금 내림차순 정렬
      const sortByTurnover = (a: TickerData, b: TickerData) => b.turnover24h - a.turnover24h;
      withWarnings.sort(sortByTurnover);
      withoutWarnings.sort(sortByTurnover);

      // 경고가 있는 티커를 상단에, 없는 티커를 하단에 배치
      return [...withWarnings, ...withoutWarnings];
    }

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
          valueA = a.volume24h;
          valueB = b.volume24h;
          break;
        case 'turnover':
          valueA = a.turnover24h;
          valueB = b.turnover24h;
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
  }, [sortBy, sortOrder, marketInfo]);

  // 정렬된 티커 목록
  const sortedTickers = sortTickers(tickers);

  // 검색 필터링된 티커 목록
  const filteredTickers = sortedTickers.filter(ticker => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const searchableText = `${ticker.rawSymbol}${ticker.displaySymbol}${ticker.baseCode}${ticker.quoteCode}${ticker.displayCategory}${ticker.rawCategory}`.toLowerCase();

    // 검색어를 공백으로 분리하여 AND 검색 수행
    const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
    return searchTerms.every(term => searchableText.includes(term));
  });

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === 'warning') {
      // 주의 정렬은 항상 경고가 있는 티커를 상단에 배치 (정렬 순서 변경 없음)
      setSortBy('warning');
      setSortOrder('desc'); // 기본값으로 설정하지만 실제로는 사용되지 않음
    } else if (newSortBy === sortBy) {
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
                가격 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
              </div>
            )}
            {lastMarketInfoUpdate && (
              <div>
                시장 정보 업데이트: {lastMarketInfoUpdate.toLocaleTimeString('ko-KR')}
              </div>
            )}
            <div>
              총 {tickers.length}개 코인 ({tickers.filter(t => t.warningInfo?.hasActiveWarning).length}개 경고)
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
            <button
              onClick={() => handleSortChange('warning')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                sortBy === 'warning'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              ⚠️ 주의 {sortBy === 'warning' && '📌'}
            </button>
          </div>

          {/* 검색 기능 */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="코인 검색 (예: BTC KRW, ETH spot)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                "{searchTerm}" 검색 결과: {filteredTickers.length}개
              </p>
            )}
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
            {filteredTickers.map((ticker) => (
              <Ticker
                key={ticker.rawSymbol}
                data={ticker}
                className="hover:scale-105 transition-transform duration-200"
                onPriceChange={handlePriceChange}
                onClick={(data) => {
                  // ticker 데이터를 localStorage에 저장 (실제로는 store나 API를 사용해야 함)
                  localStorage.setItem(`ticker_${data.rawSymbol}`, JSON.stringify(data));
                  router.push(`/exchange/ticker/bithumb/spot/${data.rawSymbol}`);
                }}
              />
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && filteredTickers.length === 0 && tickers.length > 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-muted-foreground mb-4">
              "{searchTerm}" 검색어와 일치하는 코인이 없습니다
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
            >
              검색 초기화
            </button>
          </div>
        )}

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