'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { useExchangeInstrumentStore } from '@/packages/shared/stores/createExchangeInstrumentStore';
import { Ticker } from '@/packages/shared/components';
import { 
  TickerData, 
} from '@/packages/shared/types/exchange';
import { PriceDecimalTracker } from '@/packages/shared/utils';
import { defaultApiClient } from '@/packages/shared/utils/apiClient';

// 빗썸 API 타입 정의
interface BithumbTickerResponse {
  status: string;
  data: {
    [key: string]: BithumbTickerData;
  };
}

interface BithumbTickerData {
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
}

// 정렬 상태 저장/복원을 위한 키 상수
const SORT_STORAGE_KEY = 'bithumb_ticker_sort_settings';

export default function BithumbTickerPage() {
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();
  const { getFilteredCoins } = useExchangeInstrumentStore();
  
  // 가격 추적기 생성
  const priceTracker = useRef(new PriceDecimalTracker());

  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 정렬 설정을 저장하는 함수
  const saveSortSettings = useCallback((sortBy: string, sortOrder: string) => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ sortBy, sortOrder }));
    } catch (error) {
      console.warn('정렬 설정을 저장하는데 실패했습니다:', error);
    }
  }, []);

  // 초기 정렬 상태 설정 (기본값)
  const [sortBy, setSortBy] = useState<'changePercent' | 'price' | 'volume' | 'turnover' | 'symbol' | 'warning'>('changePercent');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 컴포넌트 마운트 시 localStorage에서 정렬 설정 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      if (saved) {
        const { sortBy: savedSortBy, sortOrder: savedSortOrder } = JSON.parse(saved);
        setSortBy(savedSortBy);
        setSortOrder(savedSortOrder);
      }
    } catch (error) {
      console.warn('정렬 설정을 불러오는데 실패했습니다:', error);
    }
  }, []);

  useEffect(() => {
    setCurrentRoute('/exchange/ticker/bithumb');
  }, [setCurrentRoute]);

  // 티커 데이터 가져오기
  const fetchTickerData = useCallback(async () => {
    try {
      setError(null);
      
      console.log('빗썸 티커 데이터 가져오기 시작...');
      
      // 공통 API 클라이언트를 사용하여 빗썸 API 호출
      const response = await defaultApiClient.get<BithumbTickerResponse>(
        'https://api.bithumb.com/public/ticker/ALL_KRW',
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
          retryCount: 2,
        }
      );
      
      console.log('빗썸 API 응답 상태:', response.status);
      
      const tickerResponse = response.data;
      
      console.log('빗썸 티커 데이터 파싱 성공:', tickerResponse.status);

      if (tickerResponse.status !== '0000') {
        throw new Error(`빗썸 API 오류: ${tickerResponse.status}`);
      }

      if (!tickerResponse.data) {
        throw new Error('빗썸 티커 데이터가 없습니다');
      }

      // TickerData 형식으로 변환
      const tickerDataList: TickerData[] = Object.entries(tickerResponse.data)
        .filter(([symbol, data]) => symbol !== 'date') // date 필드 제외
        .map(([symbol, data]) => {
          const baseCode = symbol;
          const quoteCode = 'KRW';
          const rawSymbol = `${baseCode}${quoteCode}`;
          const displaySymbol = `${baseCode}/${quoteCode}`;
          
          // 가격 정보 계산
          const currentPrice = parseFloat(data.closing_price);
          const prevPrice = parseFloat(data.prev_closing_price);
          const priceChange = parseFloat(data.fluctate_24H);
          const priceChangePercent = parseFloat(data.fluctate_rate_24H);

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
            price: currentPrice,
            prevPrice24h: prevPrice,
            priceChange24h: priceChange,
            priceChangePercent24h: priceChangePercent,
            
            // === 거래 정보 ===
            volume24h: parseFloat(data.units_traded_24H) || 0,
            turnover24h: parseFloat(data.acc_trade_value_24H) || 0,
            highPrice24h: parseFloat(data.max_price) || currentPrice,
            lowPrice24h: parseFloat(data.min_price) || currentPrice,
            quantity: 1,
            
            // === Instrument 세부 정보 ===
            instrumentInfo: {
              status: 'Trading',
              koreanName: symbol,
              englishName: symbol,
            },
            
            // === 메타데이터 ===
            metadata: {
              lastUpdated: new Date(),
              dataSource: 'https://api.bithumb.com',
              rawApiResponse: data,
              reliability: 'HIGH',
            },
            
            // === 거래소별 확장 정보 ===
            exchangeSpecific: {
              bithumb: {
                openingPrice: parseFloat(data.opening_price),
                unitsTraded: parseFloat(data.units_traded),
                accTradeValue: parseFloat(data.acc_trade_value),
                date: data.date,
              } as any
            }
          };
        });

      console.log('TickerData 변환 완료:', tickerDataList.length);

      setTickers(tickerDataList);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error('빗썸 티커 데이터 가져오기 실패:', err);
      
      // API 호출 실패 시 테스트 데이터 사용
      console.log('테스트 티커 데이터로 대체합니다...');
      const testCoins = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'LINK', 'LTC', 'BCH', 'ETC', 'EOS'];
      const testTickerData: TickerData[] = testCoins.map((symbol) => {
        const baseCode = symbol;
        const quoteCode = 'KRW';
        const rawSymbol = `${baseCode}${quoteCode}`;
        const displaySymbol = `${baseCode}/${quoteCode}`;
        
        // 테스트용 랜덤 데이터 생성
        const price = Math.random() * 100000 + 1000;
        const changePercent = (Math.random() - 0.5) * 10;
        const priceChange = price * (changePercent / 100);
        
        return {
          rawSymbol,
          displaySymbol,
          baseCode,
          quoteCode,
          exchange: 'bithumb' as const,
          displayCategory: 'spot',
          rawCategory: 'spot',
          price,
          prevPrice24h: price - priceChange,
          priceChange24h: priceChange,
          priceChangePercent24h: changePercent,
          volume24h: Math.random() * 1000000,
          turnover24h: Math.random() * 10000000000,
          highPrice24h: price + Math.random() * price * 0.1,
          lowPrice24h: price - Math.random() * price * 0.1,
          quantity: 1,
          instrumentInfo: {
            status: 'Trading',
            koreanName: symbol,
            englishName: symbol,
          },
          metadata: {
            lastUpdated: new Date(),
            dataSource: 'test-data',
            rawApiResponse: null,
            reliability: 'LOW' as const,
          },
        };
      });
      
      setTickers(testTickerData);
      setLastUpdate(new Date());
      setIsLoading(false);
      setError(`빗썸 API 연결 실패 (테스트 데이터 사용 중): ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  }, []);

  // 3초마다 티커 데이터 갱신 (빗썸 API 제한 고려)
  useEffect(() => {
    // 초기 데이터 로드
    fetchTickerData();

    // 3초마다 갱신
    const interval = setInterval(fetchTickerData, 3000);

    return () => clearInterval(interval);
  }, [fetchTickerData]);

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
  }, [sortBy, sortOrder]);

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

  // 정렬 변경 핸들러 (localStorage 저장 기능 추가)
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === 'warning') {
      // 주의 정렬은 항상 경고가 있는 티커를 상단에 배치 (정렬 순서 변경 없음)
      setSortBy('warning');
      setSortOrder('desc'); // 기본값으로 설정하지만 실제로는 사용되지 않음
      saveSortSettings('warning', 'desc');
    } else if (newSortBy === sortBy) {
      // 같은 항목 클릭시 정렬 순서 변경
      const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
      setSortOrder(newSortOrder);
      saveSortSettings(sortBy, newSortOrder);
    } else {
      // 다른 항목 클릭시 해당 항목으로 변경하고 내림차순으로 설정
      setSortBy(newSortBy);
      setSortOrder('desc');
      saveSortSettings(newSortBy, 'desc');
    }
  };

  if (error && tickers.length === 0) {
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
                KRW 마켓의 실시간 가격 정보
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
            {error && (
              <div className="text-yellow-600">
                ⚠️ {error}
              </div>
            )}
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
                placeholder="코인 검색 (예: BTC, ETH)"
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
              <p className="text-muted-foreground">빗썸에서 데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickers.map((ticker) => (
              <Ticker
                key={ticker.rawSymbol}
                data={ticker}
                priceTracker={priceTracker.current}
                className="hover:scale-105 transition-transform duration-200"
                onPriceChange={handlePriceChange}
                onClick={(data) => {
                  // ticker 데이터를 localStorage에 저장
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
              빗썸 API에서 데이터를 가져올 수 없습니다
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