import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  BybitTickerResponse, 
  BybitTicker,
  TickerData, 
  ExchangeType
} from '../types/exchange';
import { BybitRawCategory } from '../constants/exchangeCategories';
import { API_ENDPOINTS } from '../constants/exchangeConfig';
import { defaultApiClient } from '../utils/apiClient';

// 티커 스토어 상태 타입
interface BybitTickerState {
  isLoading: boolean;
  error: string | null;
  tickers: Record<string, TickerData[]>; // category별로 티커 데이터 저장
  lastUpdated: Record<string, string>; // category별 마지막 업데이트 시간
  beforePriceMap: Record<string, Record<string, number>>; // category별 이전 가격 정보 저장
  
  // 액션들
  fetchTickers: (category: BybitRawCategory) => Promise<boolean>;
  fetchAllTickers: () => Promise<boolean>;
  getTickersForCategory: (category: BybitRawCategory) => TickerData[];
  getFilteredTickers: (filter: {
    category?: BybitRawCategory;
    symbol?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }) => TickerData[];
  clearTickers: (category?: BybitRawCategory) => void;
}

// 초기 상태
const initialState = {
  isLoading: false,
  error: null,
  tickers: {},
  lastUpdated: {},
  beforePriceMap: {},
};



// Bybit 티커 데이터를 TickerData 형식으로 변환
const transformBybitTicker = (ticker: BybitTicker, rawCategory: BybitRawCategory, beforePrice?: number): TickerData => {
  const lastPrice = parseFloat(ticker.lastPrice) || 0;
  const prevPrice = parseFloat(ticker.prevPrice24h) || 0;
  const priceChange = lastPrice - prevPrice;
  const priceChangePercent = parseFloat(ticker.price24hPcnt) || 0;

  // 표시용 심볼 생성 (예: BTC/USDT)
  let symbol = ticker.symbol;
  // 기본적으로 base/quote 형식으로 변환 (예: BTCUSDT → BTC/USDT)
  if (ticker.symbol.length > 6) {
    // 예외 케이스(옵션 등)는 그대로 사용
    symbol = ticker.symbol;
  } else if (ticker.symbol.length === 6) {
    symbol = `${ticker.symbol.slice(0, 3)}/${ticker.symbol.slice(3)}`;
  }

  return {
    rawSymbol: ticker.symbol,
    integratedSymbol: symbol,
    quantity: 1,
    // TODO: localStorage에 저장된 instrumentData에서 가져오기
    baseCode: ticker.symbol.slice(0, 3),
    quoteCode: ticker.symbol.slice(3),
    price: lastPrice,
    beforePrice: beforePrice ?? lastPrice, // 이전 가격 정보 (애니메이션용)
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePercent,
    prevPrice24h: prevPrice,
    volume24h: parseFloat(ticker.volume24h) || 0,
    turnover24h: parseFloat(ticker.turnover24h) || 0,
    highPrice24h: parseFloat(ticker.highPrice24h) || 0,
    lowPrice24h: parseFloat(ticker.lowPrice24h) || 0,
    bidPrice: parseFloat(ticker.bid1Price) || 0,
    askPrice: parseFloat(ticker.ask1Price) || 0,
    exchange: 'bybit' as ExchangeType,
    integratedCategory: rawCategory,
    rawCategory,
  };
};

// Bybit 티커 스토어 생성
export const useBybitTickerStore = create<BybitTickerState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 특정 카테고리의 티커 정보 가져오기
      fetchTickers: async (rawCategory: BybitRawCategory): Promise<boolean> => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const url = API_ENDPOINTS.bybit.tickers(rawCategory);
          console.log(`🔄 Bybit ${rawCategory} 티커 정보 요청:`, url);

          // 공통 API 클라이언트를 사용하여 Bybit API 호출
          const response = await defaultApiClient.get<BybitTickerResponse>(url, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
            retryCount: 2,
          });

          const data = response.data;

          if (data.retCode !== 0) {
            throw new Error(`Bybit API error: ${data.retMsg}`);
          }

          if (!data.result || !data.result.list) {
            throw new Error('Invalid response format');
          }

          // 현재 저장된 이전 가격 정보 가져오기
          const currentBeforePriceMap = get().beforePriceMap[rawCategory] || {};
          
          // 티커 데이터 변환 (이전 가격 정보 포함)
          const transformedTickers = data.result.list.map(ticker => {
            const beforePrice = currentBeforePriceMap[ticker.symbol];
            const transformed = transformBybitTicker(ticker, rawCategory, beforePrice);
            
            // 애니메이션 디버깅을 위한 로그 (BTC 관련 심볼만)
            if (ticker.symbol.includes('BTC') && beforePrice !== undefined) {
              console.log(`[Bybit Animation] ${ticker.symbol}: beforePrice=${beforePrice}, currentPrice=${transformed.price}, hasDifference=${beforePrice !== transformed.price}`);
            }
            
            return transformed;
          });

          set((state) => {
            state.tickers[rawCategory] = transformedTickers;
            state.lastUpdated[rawCategory] = new Date().toISOString();
            state.isLoading = false;
            state.error = null;
            
            // 현재 가격을 다음 업데이트 시 beforePrice로 사용하기 위해 저장
            const newBeforePriceMap: Record<string, number> = {};
            transformedTickers.forEach(ticker => {
              newBeforePriceMap[ticker.rawSymbol] = ticker.price;
            });
            state.beforePriceMap[rawCategory] = newBeforePriceMap;
          });

          console.log(`✅ Bybit ${rawCategory} 티커 정보 로드 완료:`, transformedTickers.length, '개');
          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Bybit ${rawCategory} 티커 정보 로드 실패:`, errorMessage);

          set((state) => {
            state.isLoading = false;
            state.error = errorMessage;
          });

          return false;
        }
      },

      // 모든 카테고리의 티커 정보 가져오기
      fetchAllTickers: async (): Promise<boolean> => {
        const rawCategories: BybitRawCategory[] = ['spot', 'linear', 'inverse'];
        let allSuccess = true;

        for (const rawCategory of rawCategories) {
          const success = await get().fetchTickers(rawCategory);
          if (!success) {
            allSuccess = false;
          }
          // API 요청 간격을 두어 rate limit 방지
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return allSuccess;
      },

      // 특정 카테고리의 티커 목록 가져오기
      getTickersForCategory: (category: BybitRawCategory): TickerData[] => {
        return get().tickers[category] || [];
      },

      // 필터링 및 정렬된 티커 목록 가져오기
      getFilteredTickers: (filter: {
        category?: BybitRawCategory;
        symbol?: string;
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
      }): TickerData[] => {
        const { category, symbol, sortField = 'volume', sortDirection = 'desc' } = filter;
        let result: TickerData[] = [];

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
            ticker.rawSymbol.toLowerCase().includes(searchTerm)
          );
        }

        // 정렬 로직
        return [...result].sort((a, b) => {
          let aValue = a[sortField as keyof TickerData];
          let bValue = b[sortField as keyof TickerData];
          
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
      clearTickers: (rawCategory?: BybitRawCategory): void => {
        set((state) => {
          if (rawCategory) {
            delete state.tickers[rawCategory];
            delete state.lastUpdated[rawCategory];
            delete state.beforePriceMap[rawCategory];
          } else {
            state.tickers = {};
            state.lastUpdated = {};
            state.beforePriceMap = {};
          }
        });
      },
    })),
    {
      name: 'bybit-ticker-store',
    }
  )
);
