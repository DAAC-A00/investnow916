'use client';

import { useEffect, useState } from 'react';
import { useBybitTickerStore } from '@/packages/shared/stores/createBybitTickerStore';
import { BybitCategoryType, TickerInfo } from '@/packages/shared/types/exchange';
import { BYBIT_CATEGORY_MAP } from '@/packages/shared/stores/createExchangeCoinsStore';
import { log } from 'console';

type SortField = 'symbol' | 'lastPrice' | 'priceChange24h' | 'priceChangePercent24h' | 'highPrice24h' | 'lowPrice24h' | 'volume24h' | 'turnover24h';
type SortDirection = 'asc' | 'desc';

export default function BybitTickersPage() {
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

  // 가격 변화율에 따른 색상 클래스
  const getPriceChangeColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-green-600';
    if (changePercent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Bybit instrument 정보 로딩 및 매핑
  // storage에서 "$displaySymbol=$symbol" 포맷을 파싱하여 symbol→displaySymbol 매핑
  function loadInstrumentMap(category: string) {
    try {
      const storageKey = `bybit-${category}`;
      console.log(storageKey);
      const value: string | null = localStorage.getItem(storageKey);
      console.log(value);
      if (!value) return {};
      let list: string[];
      if (value.includes('=')) {
        // 콤마로 분리된 문자열 배열
        list = value.split(',');
      } else {
        list = [];
      }
      const map: Record<string, { displaySymbol: string }> = {};
      list.forEach((entry: string) => {
        if (entry.includes('=')) {
          const [displaySymbol, symbol] = entry.split('=');
          if (symbol && displaySymbol) {
            map[symbol] = { displaySymbol };
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

  // 심볼을 baseCode-quoteCode-rest 형식으로 변환
  function getDisplaySymbol(symbol: string) {
    const info = instrumentMap[symbol];
    if (!info) return symbol;
    return info.displaySymbol || symbol;
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
            <select
              className="w-full p-2 border rounded bg-background text-foreground"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as BybitCategoryType)}
            >
              <option value="spot">현물 (Spot)</option>
              <option value="linear">선물 - USDT/USDC (Linear)</option>
              <option value="inverse">선물 - 코인 마진 (Inverse)</option>
            </select>
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
      
      {/* 티커 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th 
                className="p-2 text-left border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('symbol')}
              >
                심볼 {getSortIcon('symbol')}
              </th>
              <th 
                className="p-2 text-right border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lastPrice')}
              >
                현재가 {getSortIcon('lastPrice')}
              </th>
              <th 
                className="p-2 text-right border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('priceChange24h')}
              >
                24시간 변화 {getSortIcon('priceChange24h')}
              </th>
              <th 
                className="p-2 text-right border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('priceChangePercent24h')}
              >
                24시간 변화율 {getSortIcon('priceChangePercent24h')}
              </th>
              <th 
                className="p-2 text-right border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('highPrice24h')}
              >
                24시간 최고가 {getSortIcon('highPrice24h')}
              </th>
              <th 
                className="p-2 text-right border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lowPrice24h')}
              >
                24시간 최저가 {getSortIcon('lowPrice24h')}
              </th>
              <th 
                className="p-2 text-right border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('volume24h')}
              >
                24시간 거래량 {getSortIcon('volume24h')}
              </th>
              <th 
                className="p-2 text-right border cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('turnover24h')}
              >
                24시간 거래대금 {getSortIcon('turnover24h')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTickers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center">
                  표시할 티커 정보가 없습니다.
                </td>
              </tr>
            ) : (
              filteredTickers.map((ticker: TickerInfo) => (
                <tr key={`${ticker.category}-${ticker.symbol}`} className="hover:bg-muted/50">
                  <td className="p-2 border font-medium">{getDisplaySymbol(ticker.symbol)}</td>
                  <td className="p-2 border text-right">{ticker.lastPrice.toFixed(4)}</td>
                  <td className={`p-2 border text-right ${getPriceChangeColor(ticker.priceChange24h)}`}>
                    {ticker.priceChange24h > 0 ? '+' : ''}{ticker.priceChange24h.toFixed(4)}
                  </td>
                  <td className={`p-2 border text-right ${getPriceChangeColor(ticker.priceChangePercent24h)}`}>
                    {ticker.priceChangePercent24h > 0 ? '+' : ''}{ticker.priceChangePercent24h.toFixed(2)}%
                  </td>
                  <td className="p-2 border text-right">{ticker.highPrice24h.toFixed(4)}</td>
                  <td className="p-2 border text-right">{ticker.lowPrice24h.toFixed(4)}</td>
                  <td className="p-2 border text-right">{formatNumber(ticker.volume24h)}</td>
                  <td className="p-2 border text-right">{formatNumber(ticker.turnover24h)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
