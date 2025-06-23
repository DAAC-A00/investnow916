'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBybitTickerStore } from '@/packages/shared/stores/createBybitTickerStore';
import { 
  BybitRawCategory, 
  toDisplayCategory,
  ALL_RAW_CATEGORIES 
} from '@/packages/shared/constants/bybitCategories';

type SortField = 'symbol' | 'price' | 'priceChange' | 'priceChangePercent' | 'highPrice24h' | 'lowPrice24h' | 'volume' | 'turnover';
type SortDirection = 'asc' | 'desc';

import { useTickerSettingStore, TickerColorMode } from '@/packages/shared/stores/createTickerSettingStore';
import { getTickerColor } from '@/packages/ui-kit/tokens/design-tokens';
import { TickerData } from '@/packages/shared/types/exchange';

export default function BybitTickersPage() {
  const router = useRouter();
  // 글로벌 티커 색상 모드 상태 사용
  const tickerColorMode = useTickerSettingStore((s) => s.tickerColorMode);
  // 가격 변동 효과: 상승/하락/없음 상태 관리 (컴포넌트 전체에서 관리)
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | 'none'>>({});
  const prevPrices = useRef<Record<string, number>>({});
  // symbol별 lastPrice 최대 소수점 자리수 추적
  const symbolMaxDecimals = useRef<Record<string, number>>({});

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
  const storageCategory = toDisplayCategory(selectedCategory);
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
              <option value="price">현재가</option>
              <option value="priceChange">24시간 변화</option>
              <option value="priceChangePercent">24시간 변화율</option>
              <option value="highPrice24h">24시간 최고가</option>
              <option value="lowPrice24h">24시간 최저가</option>
              <option value="volume">24시간 거래량</option>
              <option value="turnover">24시간 거래대금</option>
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
            })(ticker.price);
            if (current > prev) symbolMaxDecimals.current[ticker.rawSymbol] = current;
          });

          if (filteredTickers.length === 0) {
            return (
              <div className="col-span-full p-4 text-center">
                표시할 티커 정보가 없습니다.
              </div>
            );
          }

          return filteredTickers.map((ticker: TickerData) => {
            const priceDecimals = symbolMaxDecimals.current[ticker.rawSymbol] ?? 0;
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
            
            // Format price change with the same rules as lastPrice
            let formattedPriceChange: string;
            let formatted = ticker.priceChange24h.toFixed(priceDecimals);
            // priceDecimals가 있으면 해당 자리수까지는 0도 표기
            const [intPart, decPart] = formatted.split('.');
            if (decPart) {
              // 오른쪽 0을 자르되, 최소 priceDecimals까지는 남김
              let trimIndex = decPart.length;
              for (let i = decPart.length - 1; i >= priceDecimals; i--) {
                if (decPart[i] === '0') trimIndex = i;
                else break;
              }
              const trimmedDec = decPart.slice(0, trimIndex);
              formatted = trimmedDec ? `${intPart}.${trimmedDec}` : intPart;
              // 만약 모두 0이면 priceDecimals만큼 0을 붙임
              if (!trimmedDec && priceDecimals > 0) {
                formatted = `${intPart}.${'0'.repeat(priceDecimals)}`;
              }
            }
            // 1000 이상인 경우 콤마 추가
            if (Math.abs(ticker.priceChange24h) >= 1000) {
              const [integerPart, decimalPart] = formatted.split('.');
              const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              formattedPriceChange = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
            } else {
              formattedPriceChange = formatted;
            }
            // Add plus sign for positive values
            formattedPriceChange = `${ticker.priceChange24h >= 0 ? '+' : ''}${formattedPriceChange}`;

            const formattedPriceChangePercent = `${ticker.priceChangePercent24h >= 0 ? '+' : ''}${ticker.priceChangePercent24h.toFixed(2)}%`;
            const formattedLastPrice = Number(ticker.price) >= 1000 
              ? Number(ticker.price).toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })
              : Number(ticker.price).toFixed(priceDecimals);

            return (
              <div
                key={`${ticker.displayCategory}-${ticker.rawSymbol}`}
                className={
                  "bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                }
                style={{ borderRadius: '0rem' }}
                onClick={() => {
                  // ticker 데이터를 localStorage에 저장 (실제로는 store나 API를 사용해야 함)
                  localStorage.setItem(`ticker_${ticker.rawSymbol}`, JSON.stringify(ticker));
                  // 일반 ticker 상세 페이지로 이동 (bybit는 기존 구조 유지)
                  router.push(`/ticker/${ticker.rawSymbol}`);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-semibold text-lg">{getDisplaySymbol(ticker.rawSymbol)}</div>
                    <div className="text-sm text-muted-foreground">{formattedTurnover} USDT</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg text-right`}>
                      <span
                        className="border px-1 inline-block"
                        style={{ 
                          borderRadius: '0rem',
                          borderColor: flashColor ? `hsl(${flashColor})` : `hsl(${borderColorClass})`,
                          color: `hsl(${priceColor})`
                        }}
                      >
                        {formattedLastPrice}
                      </span>
                      <span 
                        className="text-sm px-1.5 py-0.5 rounded ml-1"
                        style={{
                          backgroundColor: flashColor ? `hsla(${flashColor}, 0.3)` : `hsla(${priceBgColor}, 0.2)`,
                          color: `hsl(${priceColor})`
                        }}
                      >
                        {formattedPriceChangePercent}
                      </span>
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: `hsl(${priceColor})` }}
                    >
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
