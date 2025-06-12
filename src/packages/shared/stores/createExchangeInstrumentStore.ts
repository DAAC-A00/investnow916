import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// 심볼 정보 타입 정의
interface SymbolInfo {
  rawSymbol: string;
  displaySymbol: string;
  baseCode?: string;
  quoteCode?: string;
  restOfSymbol?: string;
  quantity?: number;
  settlementCode?: string;
  [key: string]: any; // 기타 추가 속성들
}

import { 
  BybitCategoryType, 
  BybitInstrumentsResponse, 
  BybitInstrument,
  CoinInfo, 
  ExchangeInstrumentState, 
  ExchangeType 
} from '../types/exchange';

// 초기 상태에 포함될 데이터 부분
type ExchangeInstrumentStateData = Pick<ExchangeInstrumentState, 'isLoading' | 'error'>;

// 초기 상태 정의
// Bybit instrument 원본 데이터를 임시로 저장
interface BybitInstrumentRawState {
  bybitInstrumentRaw: {
    [category in BybitCategoryType]?: BybitInstrument[];
  };
  fetchBybitInstrumentRaw: () => Promise<void>;
}

const initialState: ExchangeInstrumentStateData = {
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

// Bybit 카테고리 매핑
export const BYBIT_CATEGORY_RAWTODISPLAY_MAP = {
  // API 요청용 카테고리(rawCategory): 표시용 카테고리(displayCategory)
  'linear': 'um',
  'inverse': 'cm',
  // spot, option은 그대로 유지
  'spot': 'spot',
  'option': 'option'
} as const;

type BybitRawCategory = keyof typeof BYBIT_CATEGORY_RAWTODISPLAY_MAP;

// 거래소별 카테고리 정보를 반환하는 함수
const getCategoryInfo = (exchange: ExchangeType, rawCategory: string) => {
  if (exchange === 'bybit') {
    const displayCategory = BYBIT_CATEGORY_RAWTODISPLAY_MAP[rawCategory as BybitRawCategory] || rawCategory;
    return {
      rawCategory,
      displayCategory,
    };
  }
  
  // 다른 거래소의 경우 rawCategory와 displayCategory가 동일
  return {
    rawCategory,
    displayCategory: rawCategory,
  };
};

// 내부 저장용 카테고리로 변환 (displayCategory 반환)
const toStorageCategory = (category: string): string => {
  return BYBIT_CATEGORY_RAWTODISPLAY_MAP[category as BybitRawCategory] || category;
};

// API 요청용 카테고리로 변환 (rawCategory 반환)
const toRawCategory = (storageCategory: string): string => {
  return Object.entries(BYBIT_CATEGORY_RAWTODISPLAY_MAP).find(
    ([_, value]) => value === storageCategory
  )?.[0] || storageCategory;
};

// 로컬 스토리지 접근 함수
const getStorageKey = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  // isRawCategory가 true이면 API 요청용 카테고리이므로 저장용으로 변환
  const storageCategory = isRawCategory ? toStorageCategory(category) : category;
  return `${exchange}-${storageCategory}`;
};

// 로컬 스토리지에서 심볼 문자열 가져오기
const getStoredSymbols = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  if (typeof window === 'undefined') return '';
  
  const key = getStorageKey(exchange, category, isRawCategory);
  const storedValue = localStorage.getItem(key);
  return storedValue || '';
};

// 로컬 스토리지에 심볼 문자열 저장하기
const storeSymbols = (exchange: ExchangeType, category: string, symbols: any[], isRawCategory: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getStorageKey(exchange, category, isRawCategory);
    
    // 문자열 형식으로 변환하여 저장
    // settlementCode와 quoteCode가 동일한 경우:
    // quantity*baseCode/quoteCode-restOfSymbol=rawSymbol (quantity > 1)
    // baseCode/quoteCode-restOfSymbol=rawSymbol (quantity = 1)
    // settlementCode와 quoteCode가 다른 경우:
    // quantity*baseCode/quoteCode(settlementCode)-restOfSymbol=rawSymbol (quantity > 1)
    // baseCode/quoteCode(settlementCode)-restOfSymbol=rawSymbol (quantity = 1)
    const stringData = symbols
      .filter(item => item.displaySymbol && item.rawSymbol) // 유효한 심볼만 처리
      .map(item => {
        const { baseCode, quoteCode, restOfSymbol, rawSymbol, quantity = 1, settlementCode } = item;
        
        // quantity와 settlementCode 정보 추출
        const qty = quantity || 1;
        const settlement = settlementCode || quoteCode;
        
        // 기본 심볼 형식 생성: baseCode/quoteCode
        let symbolPart = `${baseCode}/${quoteCode}`;
        
        // quantity가 1보다 크면 앞에 quantity* 추가
        if (qty > 1) {
          symbolPart = `${qty}*${symbolPart}`;
        }
        
        // settlementCode와 quoteCode가 동일한지 확인
        if (settlement === quoteCode) {
          // 동일한 경우: 기존 형식 사용
          // restOfSymbol이 있으면 추가: -restOfSymbol
          if (restOfSymbol && restOfSymbol !== '') {
            symbolPart += `-${restOfSymbol}`;
          }
          
          // 최종 형식: symbolPart=rawSymbol
          return `${symbolPart}=${rawSymbol}`;
        } else {
          // 다른 경우: 새로운 형식 사용
          // settlementCode 추가: (settlementCode)
          symbolPart += `(${settlement})`;
          
          // restOfSymbol이 있으면 추가: -restOfSymbol
          if (restOfSymbol && restOfSymbol !== '') {
            symbolPart += `-${restOfSymbol}`;
          }
          
          // 최종 형식: symbolPart=rawSymbol
          return `${symbolPart}=${rawSymbol}`;
        }
      })
      .join(',');
    
    localStorage.setItem(key, stringData);
  } catch (error) {
    console.error(`심볼 데이터 저장 실패 (${exchange}-${category}):`, error);
  }
};

// Bybit 거래소의 코인 정보 가져오기
const fetchBybitCoins = async (rawCategory: BybitCategoryType, set: any, get: any): Promise<boolean> => {
  try {
    set((state: ExchangeInstrumentState) => {
      state.isLoading = true;
      state.error = null;
    });

    // API 요청은 원래 카테고리로
    const response = await fetch(API_URLS.bybit.getUrl(rawCategory));
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }
    
    const data = await response.json() as BybitInstrumentsResponse;
    
    if (data.retCode !== 0) {
      throw new Error(`Bybit API 에러: ${data.retMsg}`);
    }
    
    // Bybit API 응답에서 심볼 데이터 추출 및 형식화
    const instruments = data.result.list.filter((item: any) => item.status === 'Trading');
    
    // 심볼 데이터를 객체 배열로 변환
    const symbolObjects = instruments.map((item: any) => {
      const { 
        symbol: rawSymbol, 
        baseCoin, 
        baseCode, 
        quoteCoin, 
        quoteCode,
        lotSizeFilter,
        settleCoin
      } = item;
      
      // 카테고리 정보 생성 (displayCategory 확인용)
      const categoryInfo = getCategoryInfo('bybit', rawCategory);
      
      // quantity 추출 로직
      // baseCoin의 왼쪽에 숫자가 있고 그 숫자가 10 이상인 경우 해당 숫자가 quantity
      let quantity = 1;
      let actualBaseCode = baseCoin || baseCode;
      let restOfSymbol = '';
      
      // baseCoin에서 왼쪽 숫자 확인
      const baseCoinLeftNumberMatch = (baseCoin || baseCode).match(/^(\d+)(.+)/);
      if (baseCoinLeftNumberMatch) {
        const extractedNumber = parseInt(baseCoinLeftNumberMatch[1]);
        // 10 이상인 경우만 유효한 quantity로 간주
        if (extractedNumber >= 10) {
          quantity = extractedNumber;
          actualBaseCode = baseCoinLeftNumberMatch[2]; // 숫자를 제거한 나머지가 실제 baseCode
        }
      }
      
      // 왼쪽에서 quantity를 찾지 못한 경우, 오른쪽에서 quantity 확보 시도
      if (quantity === 1) {
        const baseCoinRightNumberMatch = (baseCoin || baseCode).match(/^(.+?)(\d+)$/);
        if (baseCoinRightNumberMatch) {
          const extractedNumber = parseInt(baseCoinRightNumberMatch[2]);
          // 10 이상인 경우만 유효한 quantity로 간주 (SHIB1000 같은 케이스)
          if (extractedNumber >= 10) {
            quantity = extractedNumber;
            actualBaseCode = baseCoinRightNumberMatch[1]; // 숫자를 제거한 나머지가 실제 baseCode
          }
        }
      }
      
      // restOfSymbol 추출 로직 개선
      // 1. rawSymbol에서 왼쪽/오른쪽 끝에 actualBaseCode가 있는지 확인하고 제거
      // 2. 남은 문자열에서 왼쪽/오른쪽 끝에 quoteCode가 있는지 확인하고 제거
      if ((!baseCoinLeftNumberMatch || quantity === 1) && quantity === 1) {
        // baseCoin에서 quantity를 추출하지 못한 경우에만 기존 로직 사용
        let processedSymbol = rawSymbol;
        const quoteCodeToUse = quoteCoin || quoteCode;
        
        // 1. actualBaseCode 제거 (왼쪽/오른쪽 끝에서만)
        if (processedSymbol.startsWith(actualBaseCode)) {
          processedSymbol = processedSymbol.substring(actualBaseCode.length);
        } else if (processedSymbol.endsWith(actualBaseCode)) {
          processedSymbol = processedSymbol.substring(0, processedSymbol.length - actualBaseCode.length);
        }
        
        // 2. quoteCode 제거 (왼쪽/오른쪽 끝에서만)
        if (quoteCodeToUse) {
          if (processedSymbol.startsWith(quoteCodeToUse)) {
            processedSymbol = processedSymbol.substring(quoteCodeToUse.length);
          } else if (processedSymbol.endsWith(quoteCodeToUse)) {
            processedSymbol = processedSymbol.substring(0, processedSymbol.length - quoteCodeToUse.length);
          }
        }
        
        // USDC PERP 패턴 처리
        let processedRestPart = processedSymbol;
        if ((quoteCoin === 'USDC' || quoteCode === 'USDC') && processedSymbol.includes(`${actualBaseCode}PERP`)) {
          processedRestPart = processedSymbol.replace(`${actualBaseCode}PERP`, '');
        }
        
        // 가장 왼쪽에 있는 숫자 추출
        const leftmostNumberMatch = processedRestPart.match(/^(\d+)/);
        if (leftmostNumberMatch) {
          const extractedNumber = parseInt(leftmostNumberMatch[1]);
          // 10 이상인 경우에만 유효한 quantity로 간주
          if (extractedNumber >= 10) {
            quantity = extractedNumber;
            // 숫자 부분을 제외한 나머지를 restOfSymbol로 설정
            restOfSymbol = processedRestPart.substring(leftmostNumberMatch[0].length);
          } else {
            // 10 미만인 경우 전체를 restOfSymbol으로 처리
            restOfSymbol = processedRestPart;
          }
        } else {
          // 숫자가 없는 경우 전체를 restOfSymbol으로 처리
          restOfSymbol = processedRestPart;
        }
      }
      
      // restOfSymbol의 가장 왼쪽과 오른쪽 값이 -인 경우 제거
      if (restOfSymbol) {
        if (restOfSymbol.startsWith('-')) {
          restOfSymbol = restOfSymbol.substring(1);
        }
        if (restOfSymbol.endsWith('-')) {
          restOfSymbol = restOfSymbol.slice(0, -1);
        }
      }
      
      // settlementCode 추출 로직
      let settlementCode: string;
      if (categoryInfo.displayCategory === 'cm' && (quoteCoin === 'USD' || quoteCode === 'USD')) {
        // cm 카테고리이면서 quoteCode가 USD인 경우 settlementCode는 baseCode와 동일
        settlementCode = actualBaseCode;
      } else {
        // 그 외의 경우는 quoteCode와 동일
        settlementCode = quoteCoin || quoteCode;
      }
      
      // symbol: baseCode/quoteCode[-rest]
      const displaySymbol = quantity >= 10 
        ? (restOfSymbol ? `${quantity}${actualBaseCode}/${quoteCoin || quoteCode}-${restOfSymbol}` : `${quantity}${actualBaseCode}/${quoteCoin || quoteCode}`)
        : (restOfSymbol ? `${actualBaseCode}/${quoteCoin || quoteCode}-${restOfSymbol}` : `${actualBaseCode}/${quoteCoin || quoteCode}`);
      
      // 기본 심볼 객체 생성
      const symbolObj: any = {
        displaySymbol,
        rawSymbol,
        baseCode: actualBaseCode,
        quoteCode: quoteCoin || quoteCode,
        restOfSymbol,
        quantity,
        settlementCode,
        // 카테고리 정보
        rawCategory: categoryInfo.rawCategory,
        displayCategory: categoryInfo.displayCategory,
        // 원본 API 응답 데이터 저장
        rawInstrumentData: item,
        // 공통 필드들
        status: item.status,
      };
      
      // 카테고리별 특화 필드들 추가
      if (rawCategory === 'linear' || rawCategory === 'inverse') {
        // Linear/Inverse 전용 필드들
        Object.assign(symbolObj, {
          contractType: item.contractType,
          launchTime: item.launchTime,
          deliveryTime: item.deliveryTime,
          deliveryFeeRate: item.deliveryFeeRate,
          priceScale: item.priceScale,
          leverageFilter: item.leverageFilter,
          priceFilter: item.priceFilter,
          lotSizeFilter: item.lotSizeFilter,
          unifiedMarginTrade: item.unifiedMarginTrade,
          fundingInterval: item.fundingInterval,
          settleCoin: item.settleCoin,
          copyTrading: item.copyTrading,
          upperFundingRate: item.upperFundingRate,
          lowerFundingRate: item.lowerFundingRate,
          isPreListing: item.isPreListing,
          preListingInfo: item.preListingInfo,
          riskParameters: item.riskParameters,
          displayName: item.displayName,
        });
      } else if (rawCategory === 'spot') {
        // Spot 전용 필드들
        Object.assign(symbolObj, {
          innovation: item.innovation,
          marginTrading: item.marginTrading,
          stTag: item.stTag,
          lotSizeFilter: item.lotSizeFilter,
          priceFilter: item.priceFilter,
          riskParameters: item.riskParameters,
        });
      } else if (rawCategory === 'option') {
        // Option 전용 필드들
        Object.assign(symbolObj, {
          optionsType: item.optionsType,
          launchTime: item.launchTime,
          deliveryTime: item.deliveryTime,
          deliveryFeeRate: item.deliveryFeeRate,
          priceFilter: item.priceFilter,
          lotSizeFilter: item.lotSizeFilter,
          displayName: item.displayName,
          settleCoin: item.settleCoin,
        });
      }
      
      return symbolObj;
    });
    
    // 로컬 스토리지에 저장할 때는 변환된 카테고리 사용
    const storageCategory = toStorageCategory(rawCategory);
    storeSymbols('bybit', storageCategory, symbolObjects);
    
    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
    });
    
    return true;
  } catch (error) {
    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
      state.error = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    });
    
    console.error('Bybit 코인 정보 가져오기 실패:', error);
    return false;
  }
};

// 거래소 코인 정보 스토어 생성
export const useExchangeCoinsStore = create<ExchangeInstrumentState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

        // Bybit 거래소의 코인 정보 가져오기
        fetchBybitCoins: async (rawCategory: BybitCategoryType) => {
          return await fetchBybitCoins(rawCategory, set, get);
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
              [...Object.values(BYBIT_CATEGORY_RAWTODISPLAY_MAP), 'um', 'cm'] : // um, cm도 함께 삭제
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
            const rawCategory = toRawCategory(category);
            
            const keysToRemove = new Set([
              getStorageKey(exchange, storageCategory),
              getStorageKey(exchange, rawCategory)
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
          // 새로운 형식에서 심볼 부분만 추출
          // quantity*baseCode/quoteCode(settlementCode)-restOfSymbol=rawSymbol
          // quantity*baseCode/quoteCode(settlementCode)-restOfSymbol 부분 반환
          return symbolsString.split(',').map(pair => {
            const parts = pair.split('=');
            if (parts.length < 2) return '';
            
            // 새로운 형식에서 심볼 부분만 추출
            // quantity*baseCode/quoteCode(settlementCode)-restOfSymbol=rawSymbol
            // quantity*baseCode/quoteCode(settlementCode)-restOfSymbol 부분 반환
            return parts.slice(0, -1).join('=');
          }).filter(Boolean);
        },

        // 코인 정보 필터링 (baseCode 또는 quoteCode로)
        getFilteredCoins: (filter: {
          exchange?: ExchangeType;
          category?: string;
          baseCode?: string;
          quoteCode?: string;
        }): CoinInfo[] => {
          const { exchange, category, baseCode, quoteCode } = filter;
          
          // 로컬 스토리지에서 데이터 조회 (저장된 카테고리로 조회 시도)
          const loadSymbols = (ex: ExchangeType, cat: string): SymbolInfo[] => {
            try {
              const data = getStoredSymbols(ex, cat);
              if (!data) return [];
              
              // 새로운 형식 파싱
              // settlementCode와 quoteCode가 동일한 경우: quantity*baseCode/quoteCode-restOfSymbol=rawSymbol
              // settlementCode와 quoteCode가 다른 경우: quantity*baseCode/quoteCode(settlementCode)-restOfSymbol=rawSymbol
              const symbolEntries = data.split(',');
              return symbolEntries.map(entry => {
                const parts = entry.split('=');
                if (parts.length < 2) return null;
                
                const rawSymbol = parts[parts.length - 1]; // 마지막 부분이 rawSymbol
                const symbolPart = parts.slice(0, -1).join('='); // 심볼 부분
                
                // quantity 추출
                let quantity = 1;
                let restPart = symbolPart;
                
                if (symbolPart.includes('*')) {
                  const [qtyStr, rest] = symbolPart.split('*', 2);
                  quantity = parseInt(qtyStr) || 1;
                  restPart = rest;
                }
                
                // settlementCode가 포함된 형식인지 확인 (괄호 포함 여부)
                if (restPart.includes('(') && restPart.includes(')')) {
                  // settlementCode가 다른 경우: baseCode/quoteCode(settlementCode)-restOfSymbol
                  const [baseQuotePart, restOfSymbolPart] = restPart.split('-', 2);
                  const baseQuoteSettlementSplit = baseQuotePart.split('/');
                  if (baseQuoteSettlementSplit.length < 2) return null;
                  
                  const baseCodeVal = baseQuoteSettlementSplit[0];
                  let quoteCodeVal = baseQuoteSettlementSplit[1];
                  
                  // settlementCode 추출
                  let settlementCode = quoteCodeVal;
                  if (quoteCodeVal.includes('(')) {
                    const parenMatch = quoteCodeVal.match(/^([^(]+)\(([^)]+)\)$/);
                    if (parenMatch) {
                      quoteCodeVal = parenMatch[1];
                      settlementCode = parenMatch[2];
                    }
                  }
                  
                  // restOfSymbol 처리 (- 제거)
                  let restOfSymbolVal = restOfSymbolPart || '';
                  if (restOfSymbolVal && restOfSymbolVal.startsWith('-')) {
                    restOfSymbolVal = restOfSymbolVal.substring(1);
                  }
                  
                  const displaySymbol = quantity > 1 
                    ? (restOfSymbolVal ? `${quantity}${baseCodeVal}/${quoteCodeVal}-${restOfSymbolVal}` : `${quantity}${baseCodeVal}/${quoteCodeVal}`)
                    : (restOfSymbolVal ? `${baseCodeVal}/${quoteCodeVal}-${restOfSymbolVal}` : `${baseCodeVal}/${quoteCodeVal}`);
                  
                  return {
                    displaySymbol,
                    rawSymbol,
                    baseCode: baseCodeVal,
                    quoteCode: quoteCodeVal,
                    restOfSymbol: restOfSymbolVal,
                    quantity,
                    settlementCode
                  };
                } else {
                  // settlementCode와 quoteCode가 동일한 경우: baseCode/quoteCode-restOfSymbol
                  const [baseQuotePart, restOfSymbolPart] = restPart.split('-', 2);
                  const baseQuoteSplit = baseQuotePart.split('/');
                  if (baseQuoteSplit.length < 2) return null;
                  
                  const baseCodeVal = baseQuoteSplit[0];
                  const quoteCodeVal = baseQuoteSplit[1];
                  const settlementCode = quoteCodeVal; // settlementCode는 quoteCode와 동일
                  
                  // restOfSymbol 처리 (- 제거)
                  let restOfSymbolVal = restOfSymbolPart || '';
                  if (restOfSymbolVal && restOfSymbolVal.startsWith('-')) {
                    restOfSymbolVal = restOfSymbolVal.substring(1);
                  }
                  
                  const displaySymbol = quantity > 1 
                    ? (restOfSymbolVal ? `${quantity}${baseCodeVal}/${quoteCodeVal}-${restOfSymbolVal}` : `${quantity}${baseCodeVal}/${quoteCodeVal}`)
                    : (restOfSymbolVal ? `${baseCodeVal}/${quoteCodeVal}-${restOfSymbolVal}` : `${baseCodeVal}/${quoteCodeVal}`);
                  
                  return {
                    displaySymbol,
                    rawSymbol,
                    baseCode: baseCodeVal,
                    quoteCode: quoteCodeVal,
                    restOfSymbol: restOfSymbolVal,
                    quantity,
                    settlementCode
                  };
                }
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
              [...Object.values(BYBIT_CATEGORY_RAWTODISPLAY_MAP), 'um', 'cm'] : // um, cm도 함께 검색
              exchange === 'binance' ? ['spot', 'futures', 'options'] :
              exchange === 'upbit' ? ['KRW', 'BTC', 'USDT'] : [];
          } else {
            // 카테고리 필터가 있으면 해당 카테고리와 변환된 카테고리 모두 검색
            categories = [category, toStorageCategory(category), toRawCategory(category)];
            // 중복 제거
            categories = [...new Set(categories)];
          }
          
          const result: CoinInfo[] = [];
          const seenSymbols = new Set<string>();
          
          for (const ex of exchanges) {
            for (const cat of categories) {
              const symbols = loadSymbols(ex, cat);
              
              for (const symbol of symbols) {
                const [base, quote] = symbol.displaySymbol.split('/');
                const symbolKey = `${ex}:${symbol.displaySymbol}`;
                
                // 이미 처리된 심볼은 건너뜀 (중복 방지)
                if (seenSymbols.has(symbolKey)) continue;
                seenSymbols.add(symbolKey);
                
                // 필터링 조건 적용
                if (baseCode && base !== baseCode) continue;
                if (quoteCode && quote !== quoteCode) continue;
                
                // 원본 카테고리 유지 (API 카테고리로 변환)
                const originalCategory = toRawCategory(cat) || cat;
                
                // 카테고리 정보 생성
                const categoryInfo = getCategoryInfo(ex, originalCategory);
                
                // symbol 속성 중복을 피하기 위해 나머지 속성을 먼저 펼치고 필요한 속성들을 덮어씁니다.
                const { displaySymbol: _, ...restSymbol } = symbol;
                
                result.push({
                  ...restSymbol,
                  exchange: ex,
                  rawCategory: categoryInfo.rawCategory,
                  displayCategory: categoryInfo.displayCategory,
                  displaySymbol: symbol.displaySymbol,
                  baseCode: base,
                  quoteCode: quote
                });
              }
            }
          }
          
          return result;
        },

        // 고유한 baseCode 목록 가져오기
        getUniqueBaseCodes: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
          // 필터링된 코인 정보 가져오기
          const filteredCoins = get().getFilteredCoins({
            exchange: filter?.exchange,
            category: filter?.category
          });
          const baseCodes = new Set(filteredCoins.map(coin => coin.baseCode));
          return Array.from(baseCodes).sort();
        },

        // 고유한 quoteCode 목록 가져오기
        getUniqueQuoteCodes: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
          // 필터링된 코인 정보 가져오기
          const filteredCoins = get().getFilteredCoins({
            exchange: filter?.exchange,
            category: filter?.category
          });
          const quoteCodes = new Set(filteredCoins.map(coin => coin.quoteCode));
          return Array.from(quoteCodes).sort();
        },
        
        // Bybit instrument 원본 데이터 임시 저장 상태 및 fetch 함수 추가
        bybitInstrumentRaw: {},
        fetchBybitInstrumentRaw: async () => {
          const categories: BybitCategoryType[] = ['linear', 'inverse', 'spot', 'option'];
          const results: { [cat: string]: BybitInstrument[] } = {};
          await Promise.all(
            categories.map(async (cat) => {
              try {
                const url = API_URLS.bybit.getUrl(cat);
                const res = await fetch(url);
                const data = (await res.json()) as BybitInstrumentsResponse;
                if (data.retCode === 0 && data.result?.list) {
                  results[cat] = data.result.list;
                } else {
                  results[cat] = [];
                }
              } catch (e) {
                results[cat] = [];
              }
            })
          );
          // set으로 상태 반영 (persist에는 저장하지 않음)
          set((state: any) => {
            state.bybitInstrumentRaw = results;
          });
        },
      }))
  )
);
