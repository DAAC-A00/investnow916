import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// 심볼 정보 타입 정의
interface SymbolInfo {
  symbol: string;
  [key: string]: any; // 기타 추가 속성들
}

import { 
  BybitCategoryType, 
  BybitInstrumentsResponse, 
  BybitInstrument,
  CoinInfo, 
  ExchangeCoinsState, 
  ExchangeType 
} from '../types/exchange';

// 초기 상태에 포함될 데이터 부분
type ExchangeCoinsStateData = Pick<ExchangeCoinsState, 'isLoading' | 'error'>;

// 초기 상태 정의
const initialState: ExchangeCoinsStateData = {
  isLoading: false,
  error: null,
};

// 거래소별 API URL 정의
const API_URLS = {
  bybit: {
    base: 'https://api.bybit.com/v5/market/instruments-info',
    getUrl: (category: BybitCategoryType) => `${API_URLS.bybit.base}?category=${category}`,
  },
  binance: {
    // 추후 구현
  },
  upbit: {
    // 추후 구현
  },
};

// 필요한 경우 Bybit API 응답 데이터를 CoinInfo 형식으로 변환하는 함수
// 새로운 저장 방식에서는 사용하지 않지만, 후방 호환성을 위해 유지
const transformBybitData = (
  data: BybitInstrumentsResponse, 
  category: BybitCategoryType
): CoinInfo[] => {
  if (!data.result || !data.result.list) {
    return [];
  }

  return data.result.list
    .filter(item => item.status === 'Trading') // 거래 가능한 코인만 필터링
    .map(item => ({
      symbol: item.symbol,
      baseCoin: item.baseCoin,
      quoteCoin: item.quoteCoin,
      exchange: 'bybit' as ExchangeType,
      category,
    }));
};

// Bybit API 응답에서 심볼 데이터를 형식화하는 함수
const formatBybitSymbols = (
  instruments: BybitInstrument[], 
  category: BybitCategoryType
): string => {
  return instruments
    .filter(item => item.status === 'Trading') // 거래 가능한 코인만 필터링
    .map(item => {
      const { symbol, baseCoin, quoteCoin } = item;
      // 심볼에서 baseCoin과 quoteCoin을 제외한 나머지 부분 추출
      const baseQuotePattern = `${baseCoin}${quoteCoin}`;
      const restOfSymbol = symbol.replace(baseQuotePattern, '');
      
      return `${baseCoin}/${quoteCoin}${restOfSymbol}=${symbol}`;
    })
    .join(',');
};

// 저장된 심볼 문자열에서 코인 정보 배열로 변환하는 함수
const parseSymbolsString = (symbolsString: string, exchange: ExchangeType, category: string): CoinInfo[] => {
  if (!symbolsString) return [];
  
  const symbols = symbolsString.split(',');
  return symbols.map(symbolPair => {
    const [formatted, symbol] = symbolPair.split('=');
    
    // 심볼에서 기본 코인과 견적 코인 추출
    // 실제 구현에서는 Bybit API에서 제공하는 정보를 사용하는 것이 정확하지만,
    // 여기서는 예시로 간단하게 구현
    let baseCoin = '';
    let quoteCoin = '';
    
    // 실제 구현에서는 Bybit API에서 제공하는 정보 사용
    if (symbol.includes('-')) {
      // 예: BTCUSDT-PERP
      const [baseQuote] = symbol.split('-');
      baseCoin = baseQuote.slice(0, 3); // 예시로 BTC
      quoteCoin = baseQuote.slice(3);  // 예시로 USDT
    } else {
      // 예: BTCUSDT
      baseCoin = symbol.slice(0, 3);   // 예시로 BTC
      quoteCoin = symbol.slice(3, 7);  // 예시로 USDT
    }
    
    return {
      symbol,
      baseCoin,
      quoteCoin,
      exchange,
      category,
    };
  });
};

// Bybit 카테고리 매핑
const BYBIT_CATEGORY_MAP = {
  // API 요청용 카테고리: 저장용 카테고리
  'linear': 'um',
  'inverse': 'cm',
  // spot, option은 그대로 유지
  'spot': 'spot',
  'option': 'option'
} as const;

type BybitApiCategory = keyof typeof BYBIT_CATEGORY_MAP;

// 내부 저장용 카테고리로 변환
const toStorageCategory = (category: string): string => {
  return BYBIT_CATEGORY_MAP[category as BybitApiCategory] || category;
};

// API 요청용 카테고리로 변환
const toApiCategory = (storageCategory: string): string => {
  return Object.entries(BYBIT_CATEGORY_MAP).find(
    ([_, value]) => value === storageCategory
  )?.[0] || storageCategory;
};

// 로컬 스토리지 접근 함수
const getStorageKey = (exchange: ExchangeType, category: string, isApiCategory: boolean = false): string => {
  // isApiCategory가 true이면 API 요청용 카테고리이므로 저장용으로 변환
  const storageCategory = isApiCategory ? toStorageCategory(category) : category;
  return `${exchange}-${storageCategory}`;
};

// 로컬 스토리지에서 심볼 문자열 가져오기
const getStoredSymbols = (exchange: ExchangeType, category: string, isApiCategory: boolean = false): string => {
  if (typeof window === 'undefined') return '';
  
  const key = getStorageKey(exchange, category, isApiCategory);
  const storedValue = localStorage.getItem(key);
  return storedValue || '';
};

// 로컬 스토리지에 심볼 문자열 저장하기
const storeSymbols = (exchange: ExchangeType, category: string, symbols: any[], isApiCategory: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getStorageKey(exchange, category, isApiCategory);
    
    // 문자열 형식으로 변환하여 저장
    // 형식: "baseCode/quoteCode-restOfSymbol=symbol,baseCode/quoteCode-restOfSymbol=symbol,..."
    const stringData = symbols
      .filter(item => item.symbol) // 유효한 심볼만 처리
      .map(item => {
        // 심볼에서 baseCoin과 quoteCoin 추출
        const symbol = item.symbol;
        const baseCoin = item.baseCoin || symbol.split('/')[0];
        const quoteCoin = item.quoteCoin || symbol.split('/')[1];
        const restOfSymbol = item.restOfSymbol || '';
        
        return `${baseCoin}/${quoteCoin}-${restOfSymbol}=${symbol}`;
      })
      .join(',');
    
    localStorage.setItem(key, stringData);
  } catch (error) {
    console.error(`심볼 데이터 저장 실패 (${exchange}-${category}):`, error);
  }
};

// 거래소 코인 정보 스토어 생성
export const useExchangeCoinsStore = create<ExchangeCoinsState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

        // Bybit 거래소의 코인 정보 가져오기
        fetchBybitCoins: async (apiCategory: BybitCategoryType) => {
          try {
            set((state: ExchangeCoinsState) => {
              state.isLoading = true;
              state.error = null;
            });

            // API 요청은 원래 카테고리로
            const response = await fetch(API_URLS.bybit.getUrl(apiCategory));
            
            if (!response.ok) {
              throw new Error(`API 요청 실패: ${response.status}`);
            }
            
            const data = await response.json() as BybitInstrumentsResponse;
            
            if (data.retCode !== 0) {
              throw new Error(`Bybit API 에러: ${data.retMsg}`);
            }
            
            // Bybit API 응답에서 심볼 데이터 추출 및 형식화
            const instruments = data.result.list.filter(item => item.status === 'Trading');
            
            // 심볼 데이터를 객체 배열로 변환
            const symbolObjects = instruments.map(item => {
              const { symbol, baseCoin, quoteCoin } = item;
              // 심볼에서 baseCoin과 quoteCoin을 제외한 나머지 부분 추출
              const baseQuotePattern = `${baseCoin}${quoteCoin}`;
              const restOfSymbol = symbol.replace(baseQuotePattern, '');
              
              return {
                symbol: `${baseCoin}/${quoteCoin}`, // 표준화된 심볼 형식
                baseCoin,
                quoteCoin,
                restOfSymbol,
                originalSymbol: symbol,
                // 추가 정보 저장
                status: item.status,
                leverage: item.leverage,
                price: item.lastPriceOnmarket,
                fundingRate: item.fundingRate,
                category: apiCategory
              };
            });
            
            // 로컬 스토리지에 저장할 때는 변환된 카테고리 사용
            const storageCategory = toStorageCategory(apiCategory);
            storeSymbols('bybit', storageCategory, symbolObjects);
            
            set((state: ExchangeCoinsState) => {
              state.isLoading = false;
            });
            
            return true;
          } catch (error) {
            set((state: ExchangeCoinsState) => {
              state.isLoading = false;
              state.error = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            });
            
            console.error('Bybit 코인 정보 가져오기 실패:', error);
            return false;
          }
        },

        // 모든 Bybit 카테고리의 코인 정보 가져오기
        fetchAllBybitCoins: async () => {
          const categories: BybitCategoryType[] = ['spot', 'linear', 'inverse', 'option'];
          const results = await Promise.all(
            categories.map(category => get().fetchBybitCoins(category))
          );
          
          return results.every(Boolean);
        },

        // 특정 거래소의 코인 정보 가져오기 (추후 확장)
        fetchExchangeCoins: async (exchange: ExchangeType) => {
          switch (exchange) {
            case 'bybit':
              return await get().fetchAllBybitCoins();
            case 'binance':
              // 추후 구현
              console.log('Binance 코인 정보 가져오기는 아직 구현되지 않았습니다.');
              return false;
            case 'upbit':
              // 추후 구현
              console.log('Upbit 코인 정보 가져오기는 아직 구현되지 않았습니다.');
              return false;
            default:
              console.error('지원하지 않는 거래소입니다.');
              return false;
          }
        },

        // 모든 거래소의 코인 정보 가져오기
        fetchAllExchangeCoins: async () => {
          const exchanges: ExchangeType[] = ['bybit']; // 추후 'binance', 'upbit' 추가
          const results = await Promise.all(
            exchanges.map(exchange => get().fetchExchangeCoins(exchange))
          );
          
          return results.every(Boolean);
        },

        // 심볼 데이터 초기화
        clearSymbols: (exchange?: ExchangeType, category?: string) => {
          if (typeof window === 'undefined') return;
          
          if (!exchange) {
            // 모든 심볼 데이터 초기화 (localStorage에서 exchange-category로 시작하는 모든 키 삭제)
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith('bybit-') || 
                key.startsWith('binance-') || 
                key.startsWith('upbit-'))
              ) {
                localStorage.removeItem(key);
              }
            }
          } else if (!category) {
            // 특정 거래소의 모든 카테고리 심볼 데이터 초기화
            const categories = exchange === 'bybit' ? 
              [...Object.values(BYBIT_CATEGORY_MAP), 'um', 'cm'] : // um, cm도 함께 삭제
              exchange === 'binance' ? ['spot', 'futures', 'options'] :
              exchange === 'upbit' ? ['KRW', 'BTC', 'USDT'] : [];
            
            // 모든 카테고리와 변환된 카테고리에 대해 삭제
            const allCategories = new Set([
              ...categories,
              ...categories.map(cat => toStorageCategory(cat))
            ]);
            
            allCategories.forEach(cat => {
              const key = getStorageKey(exchange, cat);
              localStorage.removeItem(key);
            });
          } else {
            // 특정 거래소와 카테고리의 심볼 데이터 초기화
            // API 카테고리와 저장용 카테고리 모두 삭제
            const storageCategory = toStorageCategory(category);
            const apiCategory = toApiCategory(category);
            
            const keysToRemove = new Set([
              getStorageKey(exchange, storageCategory),
              getStorageKey(exchange, apiCategory)
            ]);
            
            keysToRemove.forEach(key => {
              if (key) localStorage.removeItem(key);
            });
          }
          
          // 상태 업데이트 (로딩 상태 초기화)
          set(state => {
            state.isLoading = false;
            state.error = null;
          });
        },
        
        // 특정 거래소와 카테고리의 심볼 목록 가져오기
        getSymbolsForCategory: (exchange: ExchangeType, category: string): string[] => {
          const symbolsString = getStoredSymbols(exchange, category);
          if (!symbolsString) return [];
          
          return symbolsString.split(',').map(pair => pair.split('=')[1]);
        },

        // 코인 정보 필터링 (baseCoin 또는 quoteCoin으로)
        getFilteredCoins: (filter: {
          exchange?: ExchangeType;
          category?: string;
          baseCoin?: string;
          quoteCoin?: string;
        }): CoinInfo[] => {
          const { exchange, category, baseCoin, quoteCoin } = filter;
          
          // 로컬 스토리지에서 데이터 조회 (저장된 카테고리로 조회 시도)
          const loadSymbols = (ex: ExchangeType, cat: string): SymbolInfo[] => {
            // 먼저 저장된 카테고리로 시도
            const storageKey = getStorageKey(ex, cat, false);
            const apiKey = getStorageKey(ex, cat, true);
            
            try {
              // 저장된 카테고리로 먼저 시도
              let data = localStorage.getItem(storageKey);
              
              // 없으면 API 카테고리로 시도 (이전 버전 호환성)
              if (!data && apiKey !== storageKey) {
                data = localStorage.getItem(apiKey);
              }
              
              if (!data) return [];
              
              // 문자열 형태로 저장된 데이터 처리
              // 형식: "baseCode/quoteCode-restOfSymbol=symbol,baseCode/quoteCode-restOfSymbol=symbol,..."
              const symbolEntries = data.split(',');
              return symbolEntries.map(entry => {
                const [symbolData, originalSymbol] = entry.split('=');
                if (!symbolData || !originalSymbol) return null;
                
                const [baseQuote, restOfSymbol] = symbolData.split('-');
                const [baseCoin, quoteCoin] = baseQuote.split('/');
                
                return {
                  symbol: originalSymbol,
                  baseCoin,
                  quoteCoin,
                  restOfSymbol: restOfSymbol || ''
                };
              }).filter(Boolean) as SymbolInfo[];
            } catch (error) {
              console.error(`Failed to load symbols for ${ex}-${cat}:`, error);
              return [];
            }
          };
          
          // 모든 거래소와 카테고리 조합에 대해 필터링
          const exchanges = exchange ? [exchange] : (['bybit', 'binance', 'upbit'] as ExchangeType[]);
          let categories: string[] = [];
          
          // 카테고리 필터가 없으면 모든 카테고리 사용
          if (!category) {
            categories = exchange === 'bybit' ? 
              [...Object.values(BYBIT_CATEGORY_MAP), 'um', 'cm'] : // um, cm도 함께 검색
              exchange === 'binance' ? ['spot', 'futures', 'options'] :
              exchange === 'upbit' ? ['KRW', 'BTC', 'USDT'] : [];
          } else {
            // 카테고리 필터가 있으면 해당 카테고리와 변환된 카테고리 모두 검색
            categories = [category, toStorageCategory(category), toApiCategory(category)];
            // 중복 제거
            categories = [...new Set(categories)];
          }
          
          const result: CoinInfo[] = [];
          const seenSymbols = new Set<string>();
          
          for (const ex of exchanges) {
            for (const cat of categories) {
              const symbols = loadSymbols(ex, cat);
              
              for (const symbol of symbols) {
                const [base, quote] = symbol.symbol.split('/');
                const symbolKey = `${ex}:${symbol.symbol}`;
                
                // 이미 처리된 심볼은 건너뜀 (중복 방지)
                if (seenSymbols.has(symbolKey)) continue;
                seenSymbols.add(symbolKey);
                
                // 필터링 조건 적용
                if (baseCoin && base !== baseCoin) continue;
                if (quoteCoin && quote !== quoteCoin) continue;
                
                // 원본 카테고리 유지 (API 카테고리로 변환)
                const originalCategory = toApiCategory(cat) || cat;
                
                // symbol 속성 중복을 피하기 위해 나머지 속성을 먼저 펼치고 필요한 속성들을 덮어씁니다.
                const { symbol: _, ...restSymbol } = symbol;
                
                result.push({
                  ...restSymbol,
                  exchange: ex,
                  category: originalCategory, // API 카테고리로 변환하여 반환
                  symbol: symbol.symbol,
                  baseCoin: base,
                  quoteCoin: quote
                });
              }
            }
          }
          
          return result;
        },

        // 고유한 baseCoin 목록 가져오기
        getUniqueBaseCoins: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
          // 필터링된 코인 정보 가져오기
          const filteredCoins = get().getFilteredCoins({
            exchange: filter?.exchange,
            category: filter?.category
          });
          
          const baseCoins = new Set(filteredCoins.map(coin => coin.baseCoin));
          return Array.from(baseCoins).sort();
        },

        // 고유한 quoteCoin 목록 가져오기
        getUniqueQuoteCoins: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
          // 필터링된 코인 정보 가져오기
          const filteredCoins = get().getFilteredCoins({
            exchange: filter?.exchange,
            category: filter?.category
          });
          
          const quoteCoins = new Set(filteredCoins.map(coin => coin.quoteCoin));
          return Array.from(quoteCoins).sort();
        },
      }))
  )
);
