import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  TickerData, 
} from '../types/exchange';
import { BybitRawCategory } from '../constants/exchange';
import { BybitApiClient } from '../utils/bybitApiClient';
import { PriceDecimalTracker } from '../utils/priceFormatter';

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

// 가격 추적기와 API 클라이언트 인스턴스 생성
const priceTracker = new PriceDecimalTracker();
const apiClient = new BybitApiClient(priceTracker);

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
          console.log(`🔄 Bybit ${rawCategory} 티커 정보 요청 시작`);

          // BybitApiClient를 사용하여 티커 데이터 가져오기
          const tickerDataList = await apiClient.fetchTickerData(rawCategory);

          set((state) => {
            state.tickers[rawCategory] = tickerDataList;
            state.lastUpdated[rawCategory] = new Date().toISOString();
            state.isLoading = false;
            state.error = null;
            
            // beforePrice 맵은 이미 apiClient 내부에서 관리되므로 
            // 스토어에서는 제거하거나 참조용으로만 사용
            const newBeforePriceMap: Record<string, number> = {};
            tickerDataList.forEach(ticker => {
              newBeforePriceMap[ticker.rawSymbol] = ticker.price;
            });
            state.beforePriceMap[rawCategory] = newBeforePriceMap;
          });

          console.log(`✅ Bybit ${rawCategory} 티커 정보 로드 완료:`, tickerDataList.length, '개');
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
