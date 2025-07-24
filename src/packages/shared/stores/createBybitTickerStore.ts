import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TickerData } from '../types/exchange';
import { BybitRawCategory } from '../constants/exchange';
import { PriceDecimalTracker } from '../utils/priceFormatter';
import { fetchBybitTickerData } from '../utils/bybitApiClient';

export interface BybitTickerState {
  // 상태
  isLoading: boolean;
  error: string | null;
  tickers: Partial<Record<BybitRawCategory, TickerData[]>>;
  lastUpdated: Partial<Record<BybitRawCategory, string>>;
  beforePriceMap: Partial<Record<BybitRawCategory, Record<string, number>>>;

  // 액션
  fetchTickers: (rawCategory: BybitRawCategory) => Promise<boolean>;
  getTickersForCategory: (rawCategory: BybitRawCategory) => TickerData[];
  clearTickers: (rawCategory?: BybitRawCategory) => void;
}

// 초기 상태
const initialState: Omit<BybitTickerState, 'fetchTickers' | 'getTickersForCategory' | 'clearTickers'> = {
  isLoading: false,
  error: null,
  tickers: {},
  lastUpdated: {},
  beforePriceMap: {},
};

// 가격 추적기 인스턴스 생성
const priceTracker = new PriceDecimalTracker();

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

          // 함수형 API를 사용하여 티커 데이터 가져오기
          const tickerDataList = await fetchBybitTickerData(rawCategory, priceTracker);

          set((state) => {
            state.tickers[rawCategory] = tickerDataList;
            state.lastUpdated[rawCategory] = new Date().toISOString();
            state.isLoading = false;
            state.error = null;
            
            // beforePrice 맵 업데이트
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

      // 특정 카테고리의 티커 정보 가져오기
      getTickersForCategory: (rawCategory: BybitRawCategory): TickerData[] => {
        const state = get();
        return state.tickers[rawCategory] || [];
      },

      // 티커 정보 초기화
      clearTickers: (rawCategory?: BybitRawCategory) => {
        set((state) => {
          if (rawCategory) {
            // 특정 카테고리만 초기화
            delete state.tickers[rawCategory];
            delete state.lastUpdated[rawCategory];
            delete state.beforePriceMap[rawCategory];
          } else {
            // 모든 카테고리 초기화
            state.tickers = {};
            state.lastUpdated = {};
            state.beforePriceMap = {};
          }
          state.error = null;
        });
      },
    })),
    {
      name: 'bybit-ticker-store',
    }
  )
);
