'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { useBybitTickerStore } from '@/packages/shared/stores/createBybitTickerStore';
import { BybitCategoryType, TickerInfo } from '@/packages/shared/types/exchange';
import { BYBIT_CATEGORY_MAP } from '@/packages/shared/stores/createExchangeInstrumentStore';
import { log } from 'console';

type SortField = 'symbol' | 'lastPrice' | 'priceChange24h' | 'priceChangePercent24h' | 'highPrice24h' | 'lowPrice24h' | 'volume24h' | 'turnover24h';
type SortDirection = 'asc' | 'desc';

export default function BybitTickersPage() {
  // 가격 변동 효과: 상승/하락/없음 상태 관리 (컴포넌트 전체에서 관리)
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | 'none'>>({});
  const prevPrices = useRef<Record<string, number>>({});
  // symbol별 lastPrice 최대 소수점 자리수 추적
  const symbolMaxDecimals = useRef<Record<string, number>>({});

  const [selectedCategory, setSelectedCategory] = useState<BybitCategoryType>('linear');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('turnover24h');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [lastRefreshed, setLastRefreshed] = useState<string>('데이터 로드 중...');
  
  const { 
    isLoading, 
    error, 
    fetchTickers,
    getFilteredTickers,
    lastUpdated
  } = useBybitTickerStore();

  // 500ms마다 주기적으로 티커 데이터 갱신
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fetchAndSchedule = async () => {
      await fetchTickers(selectedCategory);
      timer = setInterval(() => {
        fetchTickers(selectedCategory);
      }, 500);
    };
    fetchAndSchedule();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [selectedCategory, fetchTickers]);

  // 마지막 업데이트 시간 설정
  useEffect(() => {
    const updateTime = lastUpdated[selectedCategory];
    if (updateTime) {
      const date = new Date(updateTime);
      setLastRefreshed(date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    } else {
      setLastRefreshed('저장된 데이터 없음');
    }
  }, [selectedCategory, lastUpdated]);

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // 같은 필드를 클릭하면 정렬 방향을 토글
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭하면 기본 정렬 방향으로 설정 (내림차순)
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 정렬 방향에 따른 아이콘
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // 필터링 및 정렬된 티커 목록
  const filteredTickers = getFilteredTickers({
    category: selectedCategory,
    symbol: symbolFilter || undefined,
    sortField,
    sortDirection
  });

  // 가격 변동 감지 및 flash 상태 업데이트
  useEffect(() => {
    filteredTickers.forEach((ticker) => {
      const symbol = ticker.rawSymbol;
      const prev = prevPrices.current[symbol];
      let flash: 'up' | 'down' | 'none' = 'none';
      if (prev !== undefined) {
        if (ticker.lastPrice > prev) flash = 'up';
        else if (ticker.lastPrice < prev) flash = 'down';
      }
      if (flash !== 'none') {
        setFlashStates((s) => ({ ...s, [symbol]: flash }));
        setTimeout(() => {
          setFlashStates((s) => ({ ...s, [symbol]: 'none' }));
        }, 100);
      }
      prevPrices.current[symbol] = ticker.lastPrice;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTickers.map(t => t.rawSymbol + ':' + t.lastPrice).join(',')]);

  // 가격 변화율에 따른 색상 클래스
  const getPriceChangeColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-green-600';
    if (changePercent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Bybit instrument 정보 로딩 및 매핑
  // storage에서 "$symbol=$rawSymbol" 포맷을 파싱하여 rawSymbol→symbol 매핑
  function loadInstrumentMap(category: string) {
    try {
      const storageKey = `bybit-${category}`;
      const value: string | null = localStorage.getItem(storageKey);
      if (!value) return {};
      let list: string[];
      if (value.includes('=')) {
        // 콤마로 분리된 문자열 배열
        list = value.split(',');
      } else {
        list = [];
      }
      const map: Record<string, { symbol: string }> = {};
      list.forEach((entry: string) => {
        if (entry.includes('=')) {
          const [symbol, rawSymbol] = entry.split('=');
          if (rawSymbol && symbol) {
            map[rawSymbol] = { symbol };
          }
        }
      });
      return map;
    } catch {
      return {};
    }
  }

  // selectedCategory를 storage용 카테고리로 변환
  const storageCategory = BYBIT_CATEGORY_MAP[selectedCategory] || selectedCategory;
  // storage 카테고리로 instrument map 생성
  const instrumentMap = loadInstrumentMap(storageCategory);

  // 심볼을 표시용 심볼로 변환
  function getDisplaySymbol(rawSymbol: string) {
    const info = instrumentMap[rawSymbol];
    if (!info) return rawSymbol;
    return info.symbol || rawSymbol;
  }

  // 숫자 포맷팅 함수
  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  return (
    <div className="container mx-auto p-4">
      {/* 상태 정보 */}
      <div className="mb-6 p-4 bg-muted rounded">
        <h1 className="text-2xl font-bold mb-4">Bybit 티커 정보</h1>
        <p className="text-sm">마지막 업데이트: {lastRefreshed}</p>
        <p className="text-sm">총 티커 수: {filteredTickers.length}</p>
      </div>
      
      {/* 카테고리 선택 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
  <button
    type="button"
    className={`flex-1 p-2 border rounded transition-colors text-sm font-medium ${selectedCategory === 'spot' ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-muted/50'}`}
    onClick={() => setSelectedCategory('spot')}
    aria-pressed={selectedCategory === 'spot'}
  >
    현물 (Spot)
  </button>
  <button
    type="button"
    className={`flex-1 p-2 border rounded transition-colors text-sm font-medium ${selectedCategory === 'linear' ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-muted/50'}`}
    onClick={() => setSelectedCategory('linear')}
    aria-pressed={selectedCategory === 'linear'}
  >
    선물 - USDT/USDC (Linear)
  </button>
  <button
    type="button"
    className={`flex-1 p-2 border rounded transition-colors text-sm font-medium ${selectedCategory === 'inverse' ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-muted/50'}`}
    onClick={() => setSelectedCategory('inverse')}
    aria-pressed={selectedCategory === 'inverse'}
  >
    선물 - 코인 마진 (Inverse)
  </button>
</div>
          </div>
        </div>
      </div>
      
      {/* 검색 옵션 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">심볼 검색</label>
          <input
            type="text"
            className="w-full p-2 border rounded bg-background text-foreground"
            placeholder="예: BTC, ETH, USDT"
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
          />
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">정렬 기준</label>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 p-2 border rounded bg-background text-foreground"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
            >
              <option value="symbol">심볼</option>
              <option value="lastPrice">현재가</option>
              <option value="priceChange24h">24시간 변화</option>
              <option value="priceChangePercent24h">24시간 변화율</option>
              <option value="highPrice24h">24시간 최고가</option>
              <option value="lowPrice24h">24시간 최저가</option>
              <option value="volume24h">24시간 거래량</option>
              <option value="turnover24h">24시간 거래대금</option>
            </select>
            <button
              className="p-2 border rounded hover:bg-muted/50"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? '↑ 오름차순' : '↓ 내림차순'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded">
          <p>오류: {error}</p>
        </div>
      )}
      
      {/* 티커 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {(() => {
          // symbol별 lastPrice의 최대 소수점 자리수 추적 (렌더 직전)
          filteredTickers.forEach(ticker => {
            const prev = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
            const current = (function getDecimals(num: number) {
              if (!isFinite(num)) return 0;
              const s = num.toString();
              if (s.includes('.')) return s.split('.')[1].length;
              return 0;
            })(ticker.lastPrice);
            if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
          });

          if (filteredTickers.length === 0) {
            return (
              <div className="col-span-full p-4 text-center">
                표시할 티커 정보가 없습니다.
              </div>
            );
          }

          return filteredTickers.map((ticker: TickerInfo) => {
            const priceDecimals = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
            const priceColor = getPriceChangeColor(ticker.priceChange24h);
            const priceBgColor = ticker.priceChange24h > 0 ? 'bg-green-50/70 dark:bg-green-900/30' : ticker.priceChange24h < 0 ? 'bg-red-50/70 dark:bg-red-900/30' : 'bg-muted/10 dark:bg-muted/30';
            const formattedTurnover = formatNumber(ticker.turnover24h);
            const formattedPriceChange = `${ticker.priceChange24h >= 0 ? '+' : ''}${Number(ticker.priceChange24h).toFixed(priceDecimals)}`;
            const formattedPriceChangePercent = `${ticker.priceChangePercent24h >= 0 ? '+' : ''}${ticker.priceChangePercent24h.toFixed(2)}%`;
            const formattedLastPrice = Number(ticker.lastPrice).toFixed(priceDecimals);

            return (
              <div
                key={`${ticker.rawCategory}-${ticker.rawSymbol}`}
                className={
                  "bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                }
                style={{ borderRadius: '0rem' }}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-semibold text-lg">{getDisplaySymbol(ticker.rawSymbol)}</div>
                    <div className="text-sm text-muted-foreground">{formattedTurnover} USDT</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg text-right`}>
  <span
    className={
      `${styles["ticker-border"]} ` +
      (flashStates[ticker.rawSymbol] === "up"
        ? styles["ticker-border-up"]
        : flashStates[ticker.rawSymbol] === "down"
        ? styles["ticker-border-down"]
        : styles["ticker-border-none"])
      + ` ${priceColor} px-1`
    }
    style={{ display: 'inline-block', borderRadius: '0rem' }}
  >
    {formattedLastPrice}
  </span>
  <span className={`text-sm px-1.5 py-0.5 rounded ${priceBgColor} ml-2 ${priceColor}`}>
    {formattedPriceChangePercent}
  </span>
</div>
                    <div className={`text-sm ${priceColor}`}>
                      {formattedPriceChange}
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
