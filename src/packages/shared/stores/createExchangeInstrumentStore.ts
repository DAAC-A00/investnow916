import { create } from 'zustand';
import { Draft } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { get as apiGet } from '@/packages/shared/utils/apiClient';
import {
  API_ENDPOINTS,
  ExchangeType,
  IntegratedCategory,
  BybitRawCategory,
  BithumbRawCategory,
  SUPPORTED_EXCHANGES,
} from '@/packages/shared/constants/exchangeConfig';
import { toIntegratedCategory } from '@/packages/shared/constants/exchangeCategories';
import type {
  CoinInfo,
  ExchangeInstrumentState,
  BybitInstrumentsResponse,
  BithumbInstrumentsResponse,
} from '@/packages/shared/types/exchange';

// SymbolInfo는 CoinInfo와 구조가 동일하므로 CoinInfo를 그대로 사용
// (이 파일 내에서만 임시로 필요한 경우에만 추가 속성 확장)
export type SymbolInfo = CoinInfo;

// ExchangeInstrumentState 타입도 export하여 selector에서 타입 명시 가능하게 함
export type { ExchangeInstrumentState };


// 초기 상태에 포함될 데이터 부분
type ExchangeInstrumentStateData = Pick<ExchangeInstrumentState, 'isLoading' | 'error'>;

const initialState: ExchangeInstrumentStateData = {
  isLoading: false,
  error: null,
};

// 거래소별 카테고리 정보를 반환하는 함수
const getCategoryInfo = (exchange: ExchangeType, rawCategory: string) => {
  if (exchange === 'bybit') {
    const integratedCategory: IntegratedCategory = rawCategory as IntegratedCategory;
    return {
      rawCategory,
      integratedCategory,
    };
  }
  if (exchange === 'bithumb') {
    const integratedCategory: IntegratedCategory = 'spot';
    return {
      rawCategory,
      integratedCategory,
    };
  }
  return {
    rawCategory,
    integratedCategory: rawCategory as IntegratedCategory,
  };
};

// 로컬 스토리지 접근 함수
const getStorageKey = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  // isRawCategory가 true이면 rawCategory를 integratedCategory로 변환
  const storageCategory = isRawCategory ? toIntegratedCategory(exchange, category) : category;
  return `${exchange}-${storageCategory}`;
};

// 업데이트 시간 조회 - 데이터에서 시간 정보 추출
const getUpdateTime = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): Date | null => {
  if (typeof window === 'undefined') return null;
  try {
    const key = getStorageKey(exchange, category, isRawCategory);
    const storedValue = localStorage.getItem(key);
    
    if (!storedValue) return null;
    
    // 시간 정보가 포함된 형태인지 확인 (:::로 구분)
    const timeDataSeparator = ':::';
    if (storedValue.includes(timeDataSeparator)) {
      const [timeStr] = storedValue.split(timeDataSeparator);
      return timeStr ? new Date(timeStr) : null;
    }
    
    // 기존 형태의 데이터는 시간 정보가 없으므로 null 반환
    return null;
  } catch (error) {
    console.error(`업데이트 시간 조회 실패 (${exchange}-${category}):`, error);
    return null;
  }
};

// 데이터 갱신 필요 여부 확인 (2시간 기준)
const needsUpdate = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): boolean => {
  // 1. 로컬 스토리지에 데이터가 있는지 확인
  const storedData = getStoredSymbols(exchange, category, isRawCategory);
  if (!storedData || storedData.trim() === '' || storedData === '[]') {
    console.log(`${exchange} ${category} 데이터가 로컬 스토리지에 없습니다. 갱신이 필요합니다.`);
    return true;
  }

  // 2. 업데이트 시간 확인
  const updateTime = getUpdateTime(exchange, category, isRawCategory);
  if (!updateTime) {
    console.log(`${exchange} ${category} 업데이트 시간 정보가 없습니다. 갱신이 필요합니다.`);
    return true;
  }

  // 3. 2시간이 지났는지 확인하여 갱신 필요 여부 결정
  const now = new Date();
  const diffHours = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
  const needsRefresh = diffHours >= 2;

  if (needsRefresh) {
    console.log(
      `${exchange} ${category} 데이터가 ${diffHours.toFixed(
        1,
      )}시간 전에 업데이트되었습니다. 2시간 주기로 갱신이 필요합니다.`,
    );
  } else {
    console.log(
      `${exchange} ${category} 데이터가 ${diffHours.toFixed(
        1,
      )}시간 전에 업데이트되었습니다. 2시간 주기 내에서 최신 상태입니다.`,
    );
  }

  return needsRefresh;
};

// 로컬 스토리지에서 심볼 문자열 가져오기 - 시간 정보 분리
const getStoredSymbols = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  if (typeof window === 'undefined') return '';
  const key = getStorageKey(exchange, category, isRawCategory);
  const storedValue = localStorage.getItem(key);
  
  if (!storedValue) return '';
  
  // 시간 정보가 포함된 형태인지 확인 (:::로 구분)
  const timeDataSeparator = ':::';
  if (storedValue.includes(timeDataSeparator)) {
    const [, symbolData] = storedValue.split(timeDataSeparator);
    return symbolData || '';
  }
  
  // 기존 형태의 데이터는 그대로 반환
  return storedValue;
};

// 로컬 스토리지에 심볼 문자열 저장하기 - 시간 정보 포함
const storeSymbols = (
  exchange: ExchangeType,
  category: string,
  symbols: Partial<SymbolInfo>[],
  isRawCategory: boolean = false
): void => {
  if (typeof window === 'undefined') return;

  try {
    const key = getStorageKey(exchange, category, isRawCategory);
    const currentTime = new Date().toISOString();

    if (!symbols || symbols.length === 0) {
      // 빈 데이터도 시간 정보와 함께 저장
      localStorage.setItem(key, `${currentTime}:::`);
      return;
    }

    const symbolStrings = symbols
      .map(s => {
        if (!s.rawSymbol || !s.baseCode || !s.quoteCode) return null;

        let symbolPart = '';
        // quantity 필드는 CoinInfo에 없으므로 안전하게 처리
        const quantity = 'quantity' in s && typeof s.quantity === 'number' ? s.quantity : undefined;
        if (quantity && quantity > 1) {
          symbolPart += `${quantity}*`;
        }
        symbolPart += `${s.baseCode}/${s.quoteCode}`;

        // settlementCode는 CoinInfo에 존재
        if (s.settlementCode && s.settlementCode !== s.quoteCode) {
          symbolPart += `(${s.settlementCode})`;
        }

        // restOfSymbol 필드도 CoinInfo에 없음 (확장 필드로 가정)
        const restOfSymbol = 'restOfSymbol' in s ? (s as any).restOfSymbol : undefined;
        if (restOfSymbol) {
          symbolPart += `-${restOfSymbol}`;
        }

        // remark, warnings, search 필드는 CoinInfo에 없음 (확장 필드로 가정)
        const remark = 'remark' in s ? (s as any).remark : '';
        const warnings = 'warnings' in s ? (s as any).warnings : undefined;
        const search = 'search' in s ? (s as any).search : '';

        const remarkPart = remark ? `+${remark}` : '';
        const warningPart =
          warnings && Array.isArray(warnings) && warnings.length > 0 ? `@${warnings.join('@')}` : '';
        const searchPart = search ? `#${search}` : '';

        return `${symbolPart}=${s.rawSymbol}${remarkPart}${warningPart}${searchPart}`;
      })
      .filter(Boolean);

    // 시간 정보와 함께 저장
    const dataToStore = `${currentTime}:::${symbolStrings.join(',')}`;
    localStorage.setItem(key, dataToStore);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to store symbols for ${exchange}-${category}:`, message);
  }
};

// 거래소별 카테고리 매핑 (integratedCategory 반환)
const getCategoriesForExchange = (exchange: ExchangeType): string[] => {
  switch (exchange) {
    case 'bybit':
      return ['spot', 'um', 'cm']; // integratedCategory 반환
    case 'bithumb':
      return ['spot'];
    default:
      return [];
  }
}; 

// Bybit 거래소의 코인 정보 가져오기
const fetchBybitCoins = async (
  rawCategory: BybitRawCategory,
  set: (fn: (draft: Draft<ExchangeInstrumentState>) => void) => void,
  _get: () => ExchangeInstrumentState
): Promise<boolean> => {
  try {
    // option 카테고리는 현재 지원하지 않음 (API PARAMS_ERROR 발생)
    if (rawCategory === 'option') {
      console.log(`Bybit ${rawCategory} 카테고리는 현재 지원하지 않습니다.`);
      return true; // 에러로 처리하지 않고 성공으로 처리
    }

    // 갱신 필요 여부 확인
    if (!needsUpdate('bybit', rawCategory, true)) {
      console.log(`Bybit ${rawCategory} 데이터가 최신입니다. (2시간 이내 갱신됨)`);
      return true; // 갱신이 필요하지 않으면 성공으로 처리
    }

    set((state: ExchangeInstrumentState) => {
      state.isLoading = true;
      state.error = null;
    });

    console.log(`Bybit ${rawCategory} 데이터를 갱신합니다...`);

    // 중앙화된 API_ENDPOINTS 사용 - instruments API로 변경
    const response = await apiGet<BybitInstrumentsResponse>(API_ENDPOINTS.bybit.instruments(rawCategory));
    const data = response.data;
    
    if (data.retCode !== 0) {
      // API 에러 코드에 따른 상세 정보 제공
      const errorMsg = `Bybit ${rawCategory} API 에러 (코드: ${data.retCode}): ${data.retMsg}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 응답 데이터 처리
    const instruments = data.result.list.map(item => {
      const { rawCategory: apiCategory, integratedCategory } = getCategoryInfo('bybit', rawCategory);
      
      return {
        rawSymbol: item.symbol,
        integratedSymbol: `${item.baseCoin}/${item.quoteCoin}`,
        baseCode: item.baseCoin || '',
        quoteCode: item.quoteCoin || '',
        exchange: 'bybit' as ExchangeType,
        integratedCategory,
        rawCategory: apiCategory,
        settlementCode: item.settleCoin || item.quoteCoin,
        rawInstrumentData: item,
      };
    });

    // 데이터 저장
    storeSymbols('bybit', rawCategory, instruments, true);

    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
      state.error = null;
    });

    console.log(`✅ Bybit ${rawCategory} 데이터 갱신 완료:`, instruments.length, '개');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Bybit ${rawCategory} 데이터 갱신 실패:`, errorMessage);
    
    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
      state.error = errorMessage;
    });
    
    return false;
  }
};

// Bithumb 거래소의 코인 정보 가져오기
const fetchBithumbCoins = async (
  rawCategory: BithumbRawCategory,
  set: (fn: (draft: Draft<ExchangeInstrumentState>) => void) => void,
  _get: () => ExchangeInstrumentState
): Promise<boolean> => {
  try {
    // 갱신 필요 여부 확인
    if (!needsUpdate('bithumb', rawCategory, false)) {
      console.log(`Bithumb ${rawCategory} 데이터가 최신입니다. (2시간 이내 갱신됨)`);
      return true; // 갱신이 필요하지 않으면 성공으로 처리
    }

    set((state: ExchangeInstrumentState) => {
      state.isLoading = true;
      state.error = null;
    });

    console.log(`Bithumb ${rawCategory} 데이터를 갱신합니다...`);

    // API 호출 - tickerAll로 모든 코인 목록 가져오기
    const response = await apiGet<any>(API_ENDPOINTS.bithumb.tickerAll);
    const data = response.data;

    // 응답 데이터 처리 - Bithumb ticker API는 KRW 마켓 정보를 제공
    const instruments = Object.keys(data.data)
      .filter(key => key !== 'date') // date 필드 제외
      .map(baseCode => {
        const { rawCategory: apiCategory, integratedCategory } = getCategoryInfo('bithumb', rawCategory);
        
        return {
          rawSymbol: `KRW-${baseCode}`,
          integratedSymbol: `${baseCode}/KRW`,
          baseCode,
          quoteCode: 'KRW',
          exchange: 'bithumb' as ExchangeType,
          integratedCategory,
          rawCategory: apiCategory,
          rawInstrumentData: data.data[baseCode],
        };
      });

    // 데이터 저장
    storeSymbols('bithumb', rawCategory, instruments, false);

    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
      state.error = null;
    });

    console.log(`✅ Bithumb ${rawCategory} 데이터 갱신 완료:`, instruments.length, '개');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Bithumb ${rawCategory} 데이터 갱신 실패:`, errorMessage);
    
    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
      state.error = errorMessage;
    });
    
    return false;
  }
};

// 로컬 스토리지에서 심볼 데이터 파싱
const parseStoredSymbols = (stored: string): CoinInfo[] => {
  if (!stored || stored.trim() === '') return [];
  
  try {
    const symbols = stored.split(',').map(entry => {
      const [symbolPart, rawSymbol] = entry.split('=');
      if (!symbolPart || !rawSymbol) return null;
      
      const baseQuote = symbolPart.split('/');
      if (baseQuote.length !== 2) return null;
      
      return {
        rawSymbol,
        integratedSymbol: symbolPart,
        baseCode: baseQuote[0],
        quoteCode: baseQuote[1],
        exchange: 'unknown' as ExchangeType,
        integratedCategory: 'unknown',
        rawCategory: 'unknown',
      };
    }).filter(Boolean) as CoinInfo[];
    
    return symbols;
  } catch (error) {
    console.error('Error parsing stored symbols:', error);
    return [];
  }
};

// Exchange Instrument Store 생성
export const useExchangeInstrumentStore = create<ExchangeInstrumentState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // Bybit 코인 정보 가져오기
      fetchBybitCoins: async (rawCategory: BybitRawCategory): Promise<boolean> => {
        return fetchBybitCoins(rawCategory, set, get);
      },

      // 모든 Bybit 코인 정보 가져오기
      fetchAllBybitCoins: async (): Promise<boolean> => {
        // option 카테고리는 현재 API에서 지원하지 않아 제외
        const categories: BybitRawCategory[] = ['spot', 'linear', 'inverse'];
        let allSuccess = true;

        for (const category of categories) {
          const success = await get().fetchBybitCoins(category);
          if (!success) {
            allSuccess = false;
          }
          // API 요청 간격을 두어 rate limit 방지
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return allSuccess;
      },

      // Bithumb 코인 정보 가져오기
      fetchBithumbCoins: async (rawCategory: BithumbRawCategory): Promise<boolean> => {
        return fetchBithumbCoins(rawCategory, set, get);
      },

      // 모든 Bithumb 코인 정보 가져오기
      fetchAllBithumbCoins: async (): Promise<boolean> => {
        const categories: BithumbRawCategory[] = ['spot'];
        let allSuccess = true;

        for (const category of categories) {
          const success = await get().fetchBithumbCoins(category);
          if (!success) {
            allSuccess = false;
          }
        }

        return allSuccess;
      },

      // 특정 거래소의 코인 정보 가져오기
      fetchExchangeCoins: async (exchange: ExchangeType): Promise<boolean> => {
        if (exchange === 'bybit') {
          return await get().fetchAllBybitCoins();
        } else if (exchange === 'bithumb') {
          return await get().fetchAllBithumbCoins();
        }
        return false;
      },

      // 모든 거래소의 코인 정보 가져오기
      fetchAllExchangeCoins: async (): Promise<boolean> => {
        const exchanges: ExchangeType[] = ['bybit', 'bithumb'];
        let allSuccess = true;

        for (const exchange of exchanges) {
          const success = await get().fetchExchangeCoins(exchange);
          if (!success) {
            allSuccess = false;
          }
        }

        return allSuccess;
      },

      // 특정 카테고리의 심볼 삭제
      clearSymbols: (exchange?: ExchangeType, category?: string): void => {
        if (exchange && category) {
          storeSymbols(exchange, category, [], false);
        } else if (exchange) {
          const categories = getCategoriesForExchange(exchange);
          categories.forEach(cat => storeSymbols(exchange, cat, [], false));
        } else {
          // 모든 거래소의 모든 카테고리 삭제
          SUPPORTED_EXCHANGES.forEach(ex => {
            const categories = getCategoriesForExchange(ex);
            categories.forEach(cat => storeSymbols(ex, cat, [], false));
          });
        }
      },

      // 특정 거래소-카테고리의 심볼 목록 가져오기
      getSymbolsForCategory: (exchange: ExchangeType, category: string): string[] => {
        const stored = getStoredSymbols(exchange, category, false);
        const symbols = parseStoredSymbols(stored);
        return symbols.map(s => s.integratedSymbol);
      },

      // 필터링된 코인 정보 가져오기
      getFilteredCoins: (filter: {
        exchange?: ExchangeType;
        category?: string;
        baseCode?: string;
        quoteCode?: string;
      }): CoinInfo[] => {
        const { exchange, category, baseCode, quoteCode } = filter;
        const seenSymbols = new Set<string>();
        const allCoins: CoinInfo[] = [];

        // 거래소별 처리
        const exchanges = exchange ? [exchange] : SUPPORTED_EXCHANGES;
        
        exchanges.forEach(ex => {
          const categories = category ? [category] : getCategoriesForExchange(ex);
          
          categories.forEach(cat => {
            const stored = getStoredSymbols(ex, cat, false);
            const symbols = parseStoredSymbols(stored);
            
            symbols.forEach(symbol => {
              const symbolKey = `${ex}:${symbol.integratedSymbol}`;
              if (seenSymbols.has(symbolKey)) return;
              
              // 필터링
              if (baseCode && symbol.baseCode.toUpperCase() !== baseCode.toUpperCase()) return;
              if (quoteCode && symbol.quoteCode.toUpperCase() !== quoteCode.toUpperCase()) return;
              
              seenSymbols.add(symbolKey);
              allCoins.push({
                ...symbol,
                exchange: ex,
                integratedCategory: cat,
                rawCategory: cat,
              });
            });
          });
        });

        return allCoins;
      },

      // 고유 기준 코인 목록 가져오기
      getUniqueBaseCodes: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
        const filteredCoins = get().getFilteredCoins(filter || {});
        const baseCodes = new Set(filteredCoins.map(coin => coin.baseCode).filter(Boolean));
        return Array.from(baseCodes).sort();
      },

      // 고유 견적 코인 목록 가져오기
      getUniqueQuoteCodes: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
        const filteredCoins = get().getFilteredCoins(filter || {});
        const quoteCodes = new Set(filteredCoins.map(coin => coin.quoteCode).filter(Boolean));
        return Array.from(quoteCodes).sort();
      },
    })),
    {
      name: 'exchange-instrument-store',
    }
  )
);

