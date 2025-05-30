import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  BybitCategoryType, 
  BybitTickerResponse, 
  BybitTicker,
  TickerInfo, 
  ExchangeType 
} from '../types/exchange';

// 티커 스토어 상태 타입
interface BybitTickerState {
  isLoading: boolean;
  error: string | null;
  tickers: Record<string, TickerInfo[]>; // category별로 티커 데이터 저장
  lastUpdated: Record<string, string>; // category별 마지막 업데이트 시간
  
  // 액션들
  fetchTickers: (category: BybitCategoryType) => Promise<boolean>;
  fetchAllTickers: () => Promise<boolean>;
  getTickersForCategory: (category: BybitCategoryType) => TickerInfo[];
  getFilteredTickers: (filter: {
    category?: BybitCategoryType;
    symbol?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }) => TickerInfo[];
  clearTickers: (category?: BybitCategoryType) => void;
}

// 초기 상태
const initialState = {
  isLoading: false,
  error: null,
  tickers: {},
  lastUpdated: {},
};

// Bybit 티커 API URL
const getTickerApiUrl = (category: BybitCategoryType): string => {
  return `https://api.bybit.com/v5/market/tickers?category=${category}`;
};

// Bybit 티커 데이터를 TickerInfo 형식으로 변환
const transformBybitTicker = (ticker: BybitTicker, category: BybitCategoryType): TickerInfo => {
  const lastPrice = parseFloat(ticker.lastPrice) || 0;
  const prevPrice = parseFloat(ticker.prevPrice24h) || 0;
  const priceChange = lastPrice - prevPrice;
  const priceChangePercent = parseFloat(ticker.price24hPcnt) || 0;

  return {
    symbol: ticker.symbol,
    lastPrice,
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePercent,
    highPrice24h: parseFloat(ticker.highPrice24h) || 0,
    lowPrice24h: parseFloat(ticker.lowPrice24h) || 0,
    volume24h: parseFloat(ticker.volume24h) || 0,
    turnover24h: parseFloat(ticker.turnover24h) || 0,
    bidPrice: parseFloat(ticker.bid1Price) || 0,
    askPrice: parseFloat(ticker.ask1Price) || 0,
    exchange: 'bybit' as ExchangeType,
    category,
  };
};

// Bybit 티커 스토어 생성
export const useBybitTickerStore = create<BybitTickerState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 특정 카테고리의 티커 정보 가져오기
      fetchTickers: async (category: BybitCategoryType): Promise<boolean> => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const url = getTickerApiUrl(category);
          console.log(`🔄 Bybit ${category} 티커 정보 요청:`, url);

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: BybitTickerResponse = await response.json();

          if (data.retCode !== 0) {
            throw new Error(`Bybit API error: ${data.retMsg}`);
          }

          if (!data.result || !data.result.list) {
            throw new Error('Invalid response format');
          }

          // 티커 데이터 변환
          const transformedTickers = data.result.list.map(ticker => 
            transformBybitTicker(ticker, category)
          );

          set((state) => {
            state.tickers[category] = transformedTickers;
            state.lastUpdated[category] = new Date().toISOString();
            state.isLoading = false;
            state.error = null;
          });

          console.log(`✅ Bybit ${category} 티커 정보 로드 완료:`, transformedTickers.length, '개');
          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Bybit ${category} 티커 정보 로드 실패:`, errorMessage);

          set((state) => {
            state.isLoading = false;
            state.error = errorMessage;
          });

          return false;
        }
      },

      // 모든 카테고리의 티커 정보 가져오기
      fetchAllTickers: async (): Promise<boolean> => {
        const categories: BybitCategoryType[] = ['spot', 'linear', 'inverse'];
        let allSuccess = true;

        for (const category of categories) {
          const success = await get().fetchTickers(category);
          if (!success) {
            allSuccess = false;
          }
          // API 요청 간격을 두어 rate limit 방지
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return allSuccess;
      },

      // 특정 카테고리의 티커 목록 가져오기
      getTickersForCategory: (category: BybitCategoryType): TickerInfo[] => {
        return get().tickers[category] || [];
      },

      // 필터링 및 정렬된 티커 목록 가져오기
      getFilteredTickers: (filter: {
        category?: BybitCategoryType;
        symbol?: string;
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
      }): TickerInfo[] => {
        const { category, symbol, sortField = 'volume24h', sortDirection = 'desc' } = filter;
        let result: TickerInfo[] = [];

        // 새로운 배열을 생성하여 할당
        if (category) {
          result = [...(get().tickers[category] || [])];
        } else {
          // 모든 카테고리의 티커 합치기 (새 배열 생성)
          result = Object.values(get().tickers).flat();
        }
        
        // 심볼 필터링 (새 배열 반환)
        if (symbol) {
          const searchTerm = symbol.toLowerCase();
          result = result.filter(ticker => 
            ticker.symbol.toLowerCase().includes(searchTerm)
          );
        }

        // 정렬 로직
        return [...result].sort((a, b) => {
          let aValue = a[sortField as keyof TickerInfo];
          let bValue = b[sortField as keyof TickerInfo];
          
          // 심볼인 경우 문자열 비교
          if (sortField === 'symbol') {
            return sortDirection === 'asc' 
              ? String(aValue).localeCompare(String(bValue))
              : String(bValue).localeCompare(String(aValue));
          }
          
          // 숫자 비교 (기본값 0으로 처리)
          const numA = Number(aValue) || 0;
          const numB = Number(bValue) || 0;
          
          return sortDirection === 'asc' 
            ? numA - numB 
            : numB - numA;
        });
      },

      // 티커 데이터 초기화
      clearTickers: (category?: BybitCategoryType): void => {
        set((state) => {
          if (category) {
            delete state.tickers[category];
            delete state.lastUpdated[category];
          } else {
            state.tickers = {};
            state.lastUpdated = {};
          }
        });
      },
    })),
    {
      name: 'bybit-ticker-store',
    }
  )
);
