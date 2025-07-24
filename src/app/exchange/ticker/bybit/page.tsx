'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBybitTickerStore } from '@/packages/shared/stores/createBybitTickerStore';
import { toIntegratedCategory } from '@/packages/shared/constants/exchange/utils';
import { BybitRawCategory } from '@/packages/shared/constants/exchange/types';
import { DATA_UPDATE_INTERVALS } from '@/packages/shared/constants/exchange';

type SortField = 'symbol' | 'price' | 'priceChange' | 'priceChangePercent' | 'highPrice24h' | 'lowPrice24h' | 'volume' | 'turnover';
type SortDirection = 'asc' | 'desc';

import { useTickerSettingStore, TickerColorMode } from '@/packages/shared/stores/createTickerSettingStore';
import { getTickerColor } from '@/packages/ui-kit/tokens/design-tokens';
import { TickerData } from '@/packages/shared/types/exchange';
import { formatPrice, formatPriceChange, PriceDecimalTracker } from '@/packages/shared/utils';

export default function BybitTickersPage() {
  const router = useRouter();
  // 글로벌 티커 색상 모드 상태 사용
  const tickerColorMode = useTickerSettingStore((s) => s.tickerColorMode);
  // 가격 변동 효과: 상승/하락/없음 상태 관리 (컴포넌트 전체에서 관리)
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | 'none'>>({});
  const prevPrices = useRef<Record<string, number>>({});
  // 가격 추적기 생성
  const priceTracker = useRef(new PriceDecimalTracker());

  const [selectedCategory, setSelectedCategory] = useState<BybitRawCategory>('linear');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('turnover');
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
      }, DATA_UPDATE_INTERVALS.ticker.bybit);
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
      const integratedSymbol = ticker.integratedSymbol;
      const prev = prevPrices.current[symbol];
      
      // PriceDecimalTracker로 가격 추적 (빗썸과 동일한 방식)
      priceTracker.current.trackPrice(integratedSymbol, ticker.price);
      if (ticker.prevPrice24h && ticker.prevPrice24h !== ticker.price) {
        priceTracker.current.trackPrice(integratedSymbol, ticker.prevPrice24h);
      }
      if (ticker.priceChange24h && Math.abs(ticker.priceChange24h) > 0) {
        priceTracker.current.trackPrice(integratedSymbol, Math.abs(ticker.priceChange24h));
      }
      
      // 추적 상태 로깅 (BTC/USDT만 예시로)
      if (integratedSymbol === 'BTC/USDT') {
        console.log(`[PriceTracker] ${integratedSymbol}: maxDecimals=${priceTracker.current.getMaxDecimals(integratedSymbol)}, currentPrice=${ticker.price}`);
      }
      
      let flash: 'up' | 'down' | 'none' = 'none';
      if (prev !== undefined) {
        if (ticker.price > prev) flash = 'up';
        else if (ticker.price < prev) flash = 'down';
      }
      if (flash !== 'none') {
        setFlashStates((s) => ({ ...s, [symbol]: flash }));
        setTimeout(() => {
          setFlashStates((s) => ({ ...s, [symbol]: 'none' }));
        }, 100);
      }
      prevPrices.current[symbol] = ticker.price;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTickers.map(t => t.rawSymbol + ':' + t.price).join(',')]);

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
  const storageCategory = toIntegratedCategory('bybit', selectedCategory);
  // storage 카테고리로 instrument map 생성
  const instrumentMap = loadInstrumentMap(storageCategory);

  // rawSymbol을 integratedSymbol로 변환하는 함수
  function exchangeSymbol(rawSymbol: string, exchange: string = 'bybit', integratedCategory: string = storageCategory): string {
    const info = instrumentMap[rawSymbol];
    if (!info || !info.symbol) {
      // localStorage에 정보가 없는 경우 기본 변환 로직 적용
      return convertRawToIntegratedSymbol(rawSymbol, exchange, integratedCategory);
    }
    return info.symbol; // localStorage에서 가져온 integratedSymbol 반환
  }

  // rawSymbol을 integratedSymbol로 변환하는 기본 로직
  function convertRawToIntegratedSymbol(rawSymbol: string, exchange: string, integratedCategory: string): string {
    if (exchange !== 'bybit') return rawSymbol;

    try {
      // Bybit 심볼 파싱 로직
      let baseCode = '';
      let quoteCode = '';
      let quantity = 1;
      let restOfSymbol = '';

      // 일반적인 패턴 매칭 (예: BTCUSDT, 1000SHIBUSDT, BTCUSDT25DEC24)
      const patterns = [
        // 숫자 + 코인 + USDT + 날짜 패턴 (예: 100BTCUSDT25DEC24)
        /^(\d+)([A-Z]+)(USDT)(\d{2}[A-Z]{3}\d{2})$/,
        // 숫자 + 코인 + USDT 패턴 (예: 1000SHIBUSDT)
        /^(\d+)([A-Z]+)(USDT)$/,
        // 일반 코인 + USDT + 날짜 패턴 (예: BTCUSDT25DEC24)
        /^([A-Z]+)(USDT)(\d{2}[A-Z]{3}\d{2})$/,
        // 일반 코인 + USDT 패턴 (예: BTCUSDT)
        /^([A-Z]+)(USDT)$/,
        // 기타 패턴들 (BTC, ETH 등과 다른 quote currency)
        /^(\d+)?([A-Z]+)([A-Z]{3,4})(\d{2}[A-Z]{3}\d{2})?$/
      ];

      for (const pattern of patterns) {
        const match = rawSymbol.match(pattern);
        if (match) {
          if (match[1] && /^\d+$/.test(match[1])) {
            // 첫 번째 그룹이 숫자인 경우
            quantity = parseInt(match[1]);
            baseCode = match[2];
            quoteCode = match[3];
            restOfSymbol = match[4] || '';
          } else {
            // 첫 번째 그룹이 코인 코드인 경우
            baseCode = match[1];
            quoteCode = match[2];
            restOfSymbol = match[3] || '';
          }
          break;
        }
      }

      // 파싱 실패 시 원본 반환
      if (!baseCode || !quoteCode) {
        return rawSymbol;
      }

      // integratedSymbol 생성
      let integratedSymbol = '';
      
      if (quantity >= 10) {
        integratedSymbol = `${quantity}${baseCode}/${quoteCode}`;
      } else {
        integratedSymbol = `${baseCode}/${quoteCode}`;
      }

      if (restOfSymbol) {
        integratedSymbol += `-${restOfSymbol}`;
      }

      return integratedSymbol;
    } catch (error) {
      console.warn('Symbol conversion failed:', rawSymbol, error);
      return rawSymbol;
    }
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
          <select
            className="w-full p-2 border rounded bg-background text-foreground"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            <option value="symbol">심볼</option>
            <option value="price">현재가</option>
            <option value="priceChange">24시간 변화</option>
            <option value="priceChangePercent">24시간 변화율</option>
            <option value="highPrice24h">24시간 최고가</option>
            <option value="lowPrice24h">24시간 최저가</option>
            <option value="volume">거래량</option>
            <option value="turnover">거래대금</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            className="p-2 border rounded bg-background text-foreground hover:bg-muted/50"
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'desc' ? '내림차순 ↓' : '오름차순 ↑'}
          </button>
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
          if (filteredTickers.length === 0) {
            return (
              <div className="col-span-full p-4 text-center">
                표시할 티커 정보가 없습니다.
              </div>
            );
          }

          return filteredTickers.map((ticker: TickerData) => {
            // 색상 값들
            const priceColor = getTickerColor(tickerColorMode, ticker.priceChange24h > 0 ? 'up' : ticker.priceChange24h < 0 ? 'down' : 'unchanged');
            const borderColorClass = getTickerColor(tickerColorMode, ticker.priceChange24h > 0 ? 'up' : ticker.priceChange24h < 0 ? 'down' : 'unchanged');
            const priceBgColor = getTickerColor(tickerColorMode, ticker.priceChange24h > 0 ? 'up' : ticker.priceChange24h < 0 ? 'down' : 'unchanged');
            
            // flash 효과용 색상
            const getFlashColor = (
              mode: TickerColorMode,
              flash: 'up' | 'down' | 'none'
            ) => {
              if (flash === 'up') return getTickerColor(mode, 'up');
              if (flash === 'down') return getTickerColor(mode, 'down');
              return null;
            };
            const flashColor = getFlashColor(tickerColorMode, flashStates[ticker.rawSymbol] ?? 'none');
            
            const formattedTurnover = formatNumber(ticker.turnover24h);
            
            // PriceDecimalTracker를 사용한 가격 포맷팅 (integratedSymbol 기준)
            const formattedLastPrice = priceTracker.current.formatPrice(ticker.integratedSymbol, ticker.price, true);
            const formattedPriceChange = priceTracker.current.formatPriceChange(ticker.integratedSymbol, ticker.priceChange24h, true);
            const formattedPriceChangePercent = `${ticker.priceChangePercent24h >= 0 ? '+' : ''}${ticker.priceChangePercent24h.toFixed(2)}%`;
            
            return (
              <div
                key={ticker.rawSymbol}
                className="bg-card rounded-lg shadow-sm hover:shadow-md transition-all p-4 border border-border"
                style={{
                  borderColor: flashColor ? `hsl(${flashColor})` : undefined,
                  backgroundColor: flashColor ? `hsla(${flashColor}, 0.1)` : undefined,
                }}
              >
                {/* 심볼 */}
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-sm">
                    {exchangeSymbol(ticker.rawSymbol)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ticker.rawSymbol}
                  </div>
                </div>
                
                {/* 가격 */}
                <div
                  className="text-lg font-bold mb-1"
                  style={{
                    color: `hsl(${priceColor})`
                  }}
                >
                  {formattedLastPrice}
                </div>
                
                {/* 변동율 */}
                <div
                  className="inline-block px-2 py-1 rounded text-sm font-semibold mb-2"
                  style={{
                    backgroundColor: flashColor ? `hsla(${flashColor}, 0.3)` : `hsla(${priceBgColor}, 0.2)`,
                    color: `hsl(${priceColor})`
                  }}
                >
                  {formattedPriceChangePercent}
                </div>
                
                {/* 변동액 */}
                <div
                  className="text-sm mb-1"
                  style={{ color: `hsl(${priceColor})` }}
                >
                  {formattedPriceChange}
                </div>
                
                {/* 거래대금 */}
                <div className="text-xs text-muted-foreground">
                  거래대금: {formattedTurnover}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
