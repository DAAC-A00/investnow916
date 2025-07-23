import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TickerData } from '../types/exchange';
import { PriceDecimalTracker } from '../utils/priceFormatter';
import { defaultApiClient } from '../utils/apiClient';
import { API_ENDPOINTS } from '../constants/exchangeConfig';
import { 
  BinanceSpotTicker,
  BinanceUmTicker,
  BinanceCmTicker,
  transformBinanceSpotTicker,
  transformBinanceUmTicker,
  transformBinanceCmTicker
} from '../utils/binanceDataTransformer';

// 바이낸스 카테고리 타입
type BinanceCategory = 'spot' | 'um' | 'cm';

// 티커 스토어 상태 타입
interface BinanceTickerState {
  isLoading: boolean;
  error: string | null;
  tickers: Record<BinanceCategory, TickerData[]>; // category별로 티커 데이터 저장
  lastUpdated: Record<BinanceCategory, string>; // category별 마지막 업데이트 시간
  beforePriceMap: Record<BinanceCategory, Record<string, number>>; // category별 이전 가격 정보 저장
  
  // 액션들
  fetchTickers: (category: BinanceCategory) => Promise<boolean>;
  fetchAllTickers: () => Promise<boolean>;
  getTickersForCategory: (category: BinanceCategory) => TickerData[];
  getFilteredTickers: (filter: {
    category?: BinanceCategory;
    symbol?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }) => TickerData[];
  clearTickers: (category?: BinanceCategory) => void;
}

// 초기 상태
const initialState = {
  isLoading: false,
  error: null,
  tickers: {} as Record<BinanceCategory, TickerData[]>,
  lastUpdated: {} as Record<BinanceCategory, string>,
  beforePriceMap: {} as Record<BinanceCategory, Record<string, number>>,
};

// 가격 추적기 인스턴스 생성
const priceTracker = new PriceDecimalTracker();

// 카테고리별 API URL 가져오기
const getApiUrl = (category: BinanceCategory): string => {
  switch (category) {
    case 'spot':
      return API_ENDPOINTS.binance.api.spot.ticker24hr;
    case 'um':
      return API_ENDPOINTS.binance.api.um.ticker24hr;
    case 'cm':
      return API_ENDPOINTS.binance.api.cm.ticker24hr;
    default:
      return API_ENDPOINTS.binance.api.spot.ticker24hr;
  }
};

// Binance 티커 스토어 생성
export const useBinanceTickerStore = create<BinanceTickerState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 특정 카테고리의 티커 정보 가져오기
      fetchTickers: async (category: BinanceCategory): Promise<boolean> => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const url = getApiUrl(category);
          console.log(`🔄 Binance ${category} 티커 정보 요청:`, url);

          // API 호출
          const response = await defaultApiClient.get<BinanceSpotTicker[] | BinanceUmTicker[] | BinanceCmTicker[]>(
            url,
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 15000,
              retryCount: 2,
            }
          );

          const apiData = response.data;

          if (!Array.isArray(apiData) || apiData.length === 0) {
            throw new Error('Invalid response format or empty data');
          }

          // 현재 저장된 이전 가격 정보 가져오기
          const currentBeforePriceMap = get().beforePriceMap[category] || {};
          
          // 티커 데이터 변환 (카테고리별로 다른 변환 함수 사용)
          let transformedTickers: TickerData[] = [];
          
          if (category === 'spot') {
            const spotTickers = apiData as BinanceSpotTicker[];
            transformedTickers = spotTickers.map(ticker => {
              const beforePrice = currentBeforePriceMap[ticker.symbol];
              const transformed = transformBinanceSpotTicker(ticker, beforePrice);
              
              // 가격 추적
              priceTracker.trackPrice(transformed.integratedSymbol, transformed.price);
              
              return transformed;
            });
          } else if (category === 'um') {
            const umTickers = apiData as BinanceUmTicker[];
            transformedTickers = umTickers.map(ticker => {
              const beforePrice = currentBeforePriceMap[ticker.symbol];
              const transformed = transformBinanceUmTicker(ticker, beforePrice);
              
              // 가격 추적
              priceTracker.trackPrice(transformed.integratedSymbol, transformed.price);
              
              return transformed;
            });
          } else if (category === 'cm') {
            const cmTickers = apiData as BinanceCmTicker[];
            transformedTickers = cmTickers.map(ticker => {
              const beforePrice = currentBeforePriceMap[ticker.symbol];
              const transformed = transformBinanceCmTicker(ticker, beforePrice);
              
              // 가격 추적
              priceTracker.trackPrice(transformed.integratedSymbol, transformed.price);
              
              return transformed;
            });
          }

          set((state) => {
            state.tickers[category] = transformedTickers;
            state.lastUpdated[category] = new Date().toISOString();
            state.isLoading = false;
            state.error = null;
            
            // 현재 가격을 다음 업데이트 시 beforePrice로 사용하기 위해 저장
            const newBeforePriceMap: Record<string, number> = {};
            transformedTickers.forEach(ticker => {
              newBeforePriceMap[ticker.rawSymbol] = ticker.price;
            });
            state.beforePriceMap[category] = newBeforePriceMap;
          });

          console.log(`✅ Binance ${category} 티커 정보 로드 완료:`, transformedTickers.length, '개');
          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Binance ${category} 티커 정보 로드 실패:`, errorMessage);

          // 에러 시 테스트 데이터 사용 옵션
          try {
            const testData = generateTestData(category);
            set((state) => {
              state.tickers[category] = testData;
              state.lastUpdated[category] = new Date().toISOString();
              state.isLoading = false;
              state.error = `API 오류 (테스트 데이터 사용): ${errorMessage}`;
            });
            console.log(`⚠️ Binance ${category} 테스트 데이터 로드:`, testData.length, '개');
            return true;
          } catch (testError) {
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            return false;
          }
        }
      },

      // 모든 카테고리의 티커 정보 가져오기
      fetchAllTickers: async (): Promise<boolean> => {
        const categories: BinanceCategory[] = ['spot', 'um', 'cm'];
        let allSuccess = true;

        for (const category of categories) {
          const success = await get().fetchTickers(category);
          if (!success) {
            allSuccess = false;
          }
          // API 요청 간격을 두어 rate limit 방지
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        return allSuccess;
      },

      // 특정 카테고리의 티커 목록 가져오기
      getTickersForCategory: (category: BinanceCategory): TickerData[] => {
        return get().tickers[category] || [];
      },

      // 필터링 및 정렬된 티커 목록 가져오기
      getFilteredTickers: (filter: {
        category?: BinanceCategory;
        symbol?: string;
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
      }): TickerData[] => {
        const { category, symbol, sortField = 'volume24h', sortDirection = 'desc' } = filter;
        let result: TickerData[] = [];

        if (category) {
          result = [...(get().tickers[category] || [])];
        } else {
          // 모든 카테고리의 티커 합치기
          result = Object.values(get().tickers).flat();
        }
        
        // 심볼 필터링
        if (symbol) {
          const searchTerm = symbol.toLowerCase();
          result = result.filter(ticker => 
            ticker.rawSymbol.toLowerCase().includes(searchTerm) ||
            ticker.integratedSymbol.toLowerCase().includes(searchTerm)
          );
        }

        // 정렬 로직
        return [...result].sort((a, b) => {
          let aValue = a[sortField as keyof TickerData];
          let bValue = b[sortField as keyof TickerData];
          
          // 심볼인 경우 문자열 비교
          if (sortField === 'symbol' || sortField === 'integratedSymbol') {
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
      clearTickers: (category?: BinanceCategory): void => {
        set((state) => {
          if (category) {
            delete state.tickers[category];
            delete state.lastUpdated[category];
            delete state.beforePriceMap[category];
          } else {
            state.tickers = {} as Record<BinanceCategory, TickerData[]>;
            state.lastUpdated = {} as Record<BinanceCategory, string>;
            state.beforePriceMap = {} as Record<BinanceCategory, Record<string, number>>;
          }
        });
      },
    })),
    {
      name: 'binance-ticker-store',
    }
  )
);

/**
 * 테스트 데이터를 생성합니다
 */
function generateTestData(category: BinanceCategory): TickerData[] {
  console.log(`Binance ${category} 테스트 티커 데이터로 대체합니다...`);
  
  let testSymbols: string[];
  switch (category) {
    case 'spot':
      testSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'EOSUSDT'];
      break;
    case 'um':
      testSymbols = ['BTCUSDT', 'ETHUSDT', '1000SHIBUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'EOSUSDT'];
      break;
    case 'cm':
      testSymbols = ['BTCUSD_PERP', 'ETHUSD_PERP', 'ADAUSD_PERP', 'DOTUSD_PERP', 'LINKUSD_PERP', 'LTCUSD_PERP', 'BCHUSD_PERP', 'ETCUSD_PERP', 'EOSUSD_PERP', 'BNBUSD_PERP'];
      break;
    default:
      testSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  }
  
  return testSymbols.map((symbol) => {
    // 테스트용 랜덤 데이터 생성
    const price = Math.random() * 100 + 1;
    const changePercent = (Math.random() - 0.5) * 10;
    const priceChange = price * (changePercent / 100);
    
    // 간단한 심볼 파싱 (테스트용)
    let baseCode = symbol.replace(/USDT$|USD$|BTC$|ETH$/, '');
    let quoteCode = 'USDT';
    let integratedSymbol = `${baseCode}/${quoteCode}`;
    
    // COIN-M의 경우
    if (category === 'cm') {
      const [pairPart] = symbol.split('_');
      baseCode = pairPart.replace('USD', '');
      quoteCode = 'USD';
      integratedSymbol = `${baseCode}/${quoteCode}`;
    }
    
    return {
      rawSymbol: symbol,
      integratedSymbol,
      baseCode,
      quoteCode,
      exchange: 'binance' as const,
      integratedCategory: category,
      rawCategory: category,
      quantity: 1,
      price,
      beforePrice: price - priceChange,
      prevPrice24h: price - priceChange,
      priceChange24h: priceChange,
      priceChangePercent24h: changePercent,
      volume24h: Math.random() * 1000000,
      turnover24h: Math.random() * 10000000,
      highPrice24h: price + Math.random() * price * 0.1,
      lowPrice24h: price - Math.random() * price * 0.1,
      instrumentInfo: {
        status: 'TRADING',
        displayName: integratedSymbol,
      },
      metadata: {
        lastUpdated: new Date(),
        dataSource: 'test-data',
        rawApiResponse: null,
        reliability: 'LOW' as const,
      },
    };
  });
} 