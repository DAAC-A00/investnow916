import { create } from 'zustand';
import { Draft } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { get as apiGet } from '@/packages/shared/utils/apiClient';

// 이 파일 내에서만 사용되는 로컬 타입 정의
export type SymbolInfo = {
  rawSymbol: string;
  integratedSymbol: string;
  baseCode: string;
  quoteCode: string;
  restOfSymbol?: string;
  quantity?: number;
  settlementCode?: string;
  remark?: string;
  search?: string;
  warnings?: string[];
  [key: string]: unknown; // 기타 추가 속성들
};

import { 
  BybitRawCategory, 
  IntegratedCategory,
  toIntegratedCategory,
  toRawCategory,
  EXCHANGE_RAW_CATEGORIES
} from '@/packages/shared/constants/exchangeCategories';



import { 
  BybitInstrumentsResponse, 
  BithumbInstrumentsResponse,
  BithumbWarningType,
  BithumbRawCategory,
  type CoinInfo,
  ExchangeInstrumentState, 
  ExchangeType 
} from '../types/exchange';

// 초기 상태에 포함될 데이터 부분
type ExchangeInstrumentStateData = Pick<ExchangeInstrumentState, 'isLoading' | 'error'>;

const initialState: ExchangeInstrumentStateData = {
  isLoading: false,
  error: null,
};

// 거래소별 API URL 정의
const API_URLS = {
  bybit: {
    base: 'https://api.bybit.com/v5/market/instruments-info',
    getInstrumentUrl: (category: BybitRawCategory) => `${API_URLS.bybit.base}?category=${category}`,
  },
  bithumb: {
    base: 'https://api.bithumb.com/v1/market/all',
    getInstrumentUrl: () => `${API_URLS.bithumb.base}?isDetails=false`,
  },
  binance: {
    // 추후 구현
  },
  upbit: {
    // 추후 구현
  },
};

// 거래소별 카테고리 정보를 반환하는 함수
const getCategoryInfo = (exchange: ExchangeType, rawCategory: string) => {
  if (exchange === 'bybit') {
    const integratedCategory = toIntegratedCategory('bybit', rawCategory as BybitRawCategory) || rawCategory;
    return {
      rawCategory,
      integratedCategory,
    };
  }
  
  if (exchange === 'bithumb') {
    const integratedCategory = toBithumbIntegratedCategory() || rawCategory.toLowerCase();
    return {
      rawCategory,
      integratedCategory,
    };
  }
  
  // 다른 거래소의 경우 rawCategory와 integratedCategory가 동일
  return {
    rawCategory,
    integratedCategory: rawCategory,
  };
};

// 빗썸 카테고리 변환 함수들
const toBithumbIntegratedCategory = (): IntegratedCategory => {
  // 빗썸은 spot만 지원
  return 'spot';
};

const toBithumbRawCategory = (integratedCategory: IntegratedCategory): BithumbRawCategory => {
  // 빗썸은 spot만 지원하므로 통합 카테고리가 spot인 경우만 처리
  if (integratedCategory === 'spot') {
    return 'spot';
  }
  // 빗썸이 지원하지 않는 카테고리인 경우 spot으로 기본 처리
  return 'spot';
};

// 내부 저장용 카테고리로 변환 (integratedCategory 반환)
const toStorageCategory = (category: string): string => {
  // Bybit 카테고리 변환 시도
  const bybitIntegratedCategory = toIntegratedCategory('bybit', category as BybitRawCategory);
  if (bybitIntegratedCategory) {
    return bybitIntegratedCategory;
  }
  
  // Bithumb 카테고리 변환 시도
  const bithumbIntegratedCategory = toBithumbIntegratedCategory();
  if (bithumbIntegratedCategory) {
    return bithumbIntegratedCategory;
  }
  
  return category;
};

// 로컬 스토리지 접근 함수
const getStorageKey = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  // isRawCategory가 true이면 API 요청용 카테고리이므로 저장용으로 변환
  const storageCategory = isRawCategory ? toStorageCategory(category) : category;
  return `${exchange}-${storageCategory}`;
};

// 업데이트 시간 저장용 키 생성
const getUpdateTimeKey = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  const storageKey = getStorageKey(exchange, category, isRawCategory);
  return `${storageKey}-updated`;
};

// 업데이트 시간 저장
const storeUpdateTime = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getUpdateTimeKey(exchange, category, isRawCategory);
    const currentTime = new Date().toISOString();
    localStorage.setItem(key, currentTime);
  } catch (error) {
    console.error(`업데이트 시간 저장 실패 (${exchange}-${category}):`, error);
  }
};

// 업데이트 시간 조회
const getUpdateTime = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): Date | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = getUpdateTimeKey(exchange, category, isRawCategory);
    const timeStr = localStorage.getItem(key);
    return timeStr ? new Date(timeStr) : null;
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

// 로컬 스토리지에서 심볼 문자열 가져오기
const getStoredSymbols = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  if (typeof window === 'undefined') return '';
  
  const key = getStorageKey(exchange, category, isRawCategory);
  const storedValue = localStorage.getItem(key);
  return storedValue || '';
};

// 로컬 스토리지에 심볼 문자열 저장하기
const storeSymbols = (
  exchange: ExchangeType,
  category: string,
  symbols: Partial<SymbolInfo>[],
  isRawCategory: boolean = false
): void => {
  if (typeof window === 'undefined') return;

  try {
    const key = getStorageKey(exchange, category, isRawCategory);

    if (!symbols || symbols.length === 0) {
      localStorage.setItem(key, '');
      return;
    }

    const symbolStrings = symbols
      .map(s => {
        if (!s.rawSymbol || !s.baseCode || !s.quoteCode) return null;

        let symbolPart = '';
        if (s.quantity && s.quantity > 1) {
          symbolPart += `${s.quantity}*`;
        }
        symbolPart += `${s.baseCode}/${s.quoteCode}`;

        if (s.settlementCode && s.settlementCode !== s.quoteCode) {
          symbolPart += `(${s.settlementCode})`;
        }

        if (s.restOfSymbol) {
          symbolPart += `-${s.restOfSymbol}`;
        }

        const remarkPart = s.remark ? `+${s.remark}` : '';
        const warningPart =
          s.warnings && s.warnings.length > 0 ? `@${s.warnings.join('@')}` : '';
        const searchPart = s.search ? `#${s.search}` : '';

        return `${symbolPart}=${s.rawSymbol}${remarkPart}${warningPart}${searchPart}`;
      })
      .filter(Boolean);

    localStorage.setItem(key, symbolStrings.join(','));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to store symbols for ${exchange}-${category}:`, message);
  }
};

// Bybit 거래소의 코인 정보 가져오기
const fetchBybitCoins = async (
  rawCategory: BybitRawCategory,
  set: (fn: (draft: Draft<ExchangeInstrumentState>) => void) => void,
  _get: () => ExchangeInstrumentState
): Promise<boolean> => {
  try {
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

    // API 요청은 원래 카테고리로 (공통 API 클라이언트 사용)
    const response = await apiGet<BybitInstrumentsResponse>(API_URLS.bybit.getInstrumentUrl(rawCategory));
    const data = response.data;
    
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
      
      // 카테고리 정보 생성 (integratedCategory 확인용)
      const categoryInfo = getCategoryInfo('bybit', rawCategory);
      
      // quantity 추출 로직
      // baseCoin의 왼쪽에 숫자가 있고 그 숫자가 10으로 나누어 떨어지는 경우에만 해당 숫자가 quantity
      let quantity = 1;
      let actualBaseCode = baseCoin || baseCode;
      
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
      
      // settlementCode 결정 로직
      let settlement = settleCoin || quoteCode || quoteCoin;
      
      // cm 카테고리(inverse)이면서 USD 견적인 경우 settlementCode는 baseCode
      if (rawCategory === 'inverse' && (quoteCode === 'USD' || quoteCoin === 'USD')) {
        settlement = actualBaseCode;
      }
      
      // restOfSymbol 추출 (rawSymbol에서 baseCode와 quoteCode를 제거한 나머지)
      const restPart = rawSymbol.replace(actualBaseCode, '').replace(quoteCode || quoteCoin, '');
      
      // quoteCode가 USDC이면서 restPart가 "${baseCode}PERP"를 포함하는 경우 제거
      let processedRestPart = restPart;
      if ((quoteCoin === 'USDC' || quoteCode === 'USDC') && restPart.includes(`${actualBaseCode}PERP`)) {
        processedRestPart = restPart.replace(`${actualBaseCode}PERP`, '');
      }
      
      // processedRestPart에서 왼쪽 숫자 추출 (quantity가 1인 경우에만)
      if (quantity === 1 && processedRestPart) {
        const restPartLeftNumberMatch = processedRestPart.match(/^(\d+)(.*)$/);
        if (restPartLeftNumberMatch) {
          const extractedNumber = parseInt(restPartLeftNumberMatch[1]);
          if (extractedNumber >= 10) {
            quantity = extractedNumber;
            processedRestPart = restPartLeftNumberMatch[2]; // 숫자를 제거한 나머지
          }
        }
      }
      
      // restOfSymbol의 가장 왼쪽 값이 -인 경우 제거
      let restOfSymbol = processedRestPart;
      if (restOfSymbol && restOfSymbol.startsWith('-')) {
        restOfSymbol = restOfSymbol.substring(1);
      }
      
      // integratedSymbol 생성
      let integratedSymbol;
      if (restOfSymbol) {
        integratedSymbol = restOfSymbol 
          ? `${quantity > 1 ? `${quantity}${actualBaseCode}` : actualBaseCode}/${quoteCode || quoteCoin}-${restOfSymbol}`
          : `${quantity > 1 ? `${quantity}${actualBaseCode}` : actualBaseCode}/${quoteCode || quoteCoin}`;
      } else {
        integratedSymbol = restOfSymbol 
          ? `${quantity > 1 ? `${quantity}${actualBaseCode}` : actualBaseCode}/${quoteCode || quoteCoin}-${restOfSymbol}`
          : `${quantity > 1 ? `${quantity}${actualBaseCode}` : actualBaseCode}/${quoteCode || quoteCode}`;
      }
      
      // SymbolInfo 객체 생성
      const symbolObj: SymbolInfo = {
        rawSymbol,
        integratedSymbol,
        baseCode: actualBaseCode,
        quoteCode: quoteCode || quoteCoin,
        quantity,
        restOfSymbol,
        settlementCode: settlement,
        // Bybit 전용 필드들
        status: item.status,
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
      };
      
      return symbolObj;
    });
    
    console.log(`Bybit ${rawCategory} 카테고리에서 ${symbolObjects.length}개의 심볼을 처리했습니다.`);
    
    // 로컬 스토리지에 저장 (integratedCategory로 저장)
    storeSymbols('bybit', rawCategory, symbolObjects, true);
    
    // 업데이트 시간 저장
    storeUpdateTime('bybit', rawCategory, true);
    
    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
    });
    
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Bybit ${rawCategory} instrument 정보를 가져오는 데 실패했습니다:`, error);
    set(state => {
      state.isLoading = false;
      state.error = message;
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
      return true; // 갱신이 필요하지 않으면 성공으로 처리
    }

    set((state: ExchangeInstrumentState) => {
      state.isLoading = true;
      state.error = null;
    });

    console.log(`Bithumb ${rawCategory} 데이터를 갱신합니다...`);

    // 빗썸은 spot 카테고리만 지원하므로 spot이 아닌 경우 빈 배열 반환
    if (rawCategory !== 'spot') {
      console.log(`Bithumb은 ${rawCategory} 카테고리를 지원하지 않습니다.`);
      
      // 빈 데이터를 저장하고 업데이트 시간 기록
      storeSymbols('bithumb', rawCategory, [], false);
      storeUpdateTime('bithumb', rawCategory, false);
      
      set((state: ExchangeInstrumentState) => {
        state.isLoading = false;
      });
      
      return true;
    }

    // Bithumb API 요청 (공통 API 클라이언트 사용)
    console.log(`Bithumb API 요청 중... (${API_URLS.bithumb.getInstrumentUrl()})`);
    const response = await apiGet<BithumbInstrumentsResponse>(API_URLS.bithumb.getInstrumentUrl());
    const instrumentData = response.data;
    
    // 배열이 아니거나 비어있는 경우 에러 처리
    if (!Array.isArray(instrumentData) || instrumentData.length === 0) {
      throw new Error('Bithumb API 응답 형식이 올바르지 않거나 데이터가 비어있습니다.');
    }

    console.log(`Bithumb API에서 ${instrumentData.length}개의 원시 데이터를 받았습니다.`);

    const symbolObjects: SymbolInfo[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    // Bithumb API 응답에서 심볼 데이터 추출
    for (const item of instrumentData) {
      // market 형식: KRW-BTC
      const [quoteCode, baseCode] = item.market.split('-');
      if (!baseCode || !quoteCode) {
        skippedCount++;
        continue;
      }
      
      // settlementCode는 빗썸의 경우 항상 quoteCode와 동일 (spot 거래만 지원)
      const settlementCode = quoteCode;
      
      // integratedSymbol 생성: baseCode/quoteCode 형식
      const integratedSymbol = `${baseCode}/${quoteCode}`;

      // SymbolInfo 객체 생성
      const symbolObj: SymbolInfo = {
        rawSymbol: item.market,
        integratedSymbol,
        baseCode,
        quoteCode,
        quantity: 1, // 빗썸은 항상 1
        settlementCode,
      };

      symbolObjects.push(symbolObj);
      processedCount++;
    }

    console.log(`Bithumb spot 카테고리에서 ${processedCount}개의 심볼을 처리했습니다. (${skippedCount}개 건너뜀)`);
    
    // 로컬 스토리지에 저장할 때는 spot 카테고리 사용
    storeSymbols('bithumb', 'spot', symbolObjects, false);
    
    // 업데이트 시간 저장
    storeUpdateTime('bithumb', 'spot', false);
    
    const updateTime = new Date().toLocaleString('ko-KR');
    console.log(`Bithumb 데이터가 로컬 스토리지에 저장되었습니다. (업데이트 시간: ${updateTime})`);
    
    set((state: ExchangeInstrumentState) => {
      state.isLoading = false;
    });
    
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bithumb 코인 정보 가져오기 실패:', errorMessage);
    
    // 기존 데이터가 있는지 확인
    const existingData = getStoredSymbols('bithumb', rawCategory, false);
    const hasExistingData = existingData && existingData.trim() !== '' && existingData !== '[]';
    
    if (hasExistingData) {
      console.log('기존 Bithumb 데이터를 유지합니다.');
      // 기존 데이터가 있으면 에러 상태를 설정하지 않고 로딩만 해제
      set((state: ExchangeInstrumentState) => {
        state.isLoading = false;
        // 기존 데이터가 있으면 에러를 설정하지 않음
      });
      return true; // 기존 데이터 사용으로 성공 처리
    } else {
      // 기존 데이터가 없으면 에러 상태 설정
      set((state: ExchangeInstrumentState) => {
        state.isLoading = false;
        state.error = `Bithumb 데이터 로드 실패: ${errorMessage}`;
      });
      return false;
    }
  }
};

// 로컬 스토리지에서 데이터 조회 (저장된 카테고리로 조회 시도)
const loadSymbols = (ex: ExchangeType, cat: string): SymbolInfo[] => {
  try {
    const data = getStoredSymbols(ex, cat);
    if (!data) return [];
    
    // 새로운 형식 파싱: ${quantity}*${baseCode}/${quoteCode}(${settlementCode})-${restOfSymbol}=${rawSymbol}+${remark}@${warning1}@${warning2}#{search}
    const symbolEntries = data.split(',');
    return symbolEntries.map(entry => {
      // remark, warning, search 분리
      let remark = '';
      let warningPart = '';
      let search = '';
      
      // search 추출 (#으로 분리) - 가장 먼저 처리
      if (entry.includes('#')) {
        const hashParts = entry.split('#');
        entry = hashParts[0];
        search = hashParts[1] || '';
      }
      
      // warning 추출 (@로 분리) - search 제거 후 처리
      if (entry.includes('@')) {
        const atParts = entry.split('@');
        entry = atParts[0];
        warningPart = atParts.slice(1).join('@'); // 여러 warning을 다시 @로 연결
      }
      
      // remark 추출 (+로 분리) - warning 제거 후 처리
      if (entry.includes('+')) {
        const plusParts = entry.split('+');
        entry = plusParts[0];
        remark = plusParts[1] || '';
      }
      
      // rawSymbol 분리 (=로 분리)
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
      
      // settlementCode 추출 (괄호로 감싸진 부분)
      let baseQuotePart = restPart;
      let restOfSymbolPart = '';
      let settlementCode = '';
      
      // restOfSymbol 분리 (-로 분리)
      if (restPart.includes('-')) {
        const dashParts = restPart.split('-');
        baseQuotePart = dashParts[0];
        restOfSymbolPart = dashParts.slice(1).join('-');
      }
      
      // baseCode/quoteCode(settlementCode) 파싱
      const baseQuoteSplit = baseQuotePart.split('/');
      if (baseQuoteSplit.length < 2) return null;
      
      const baseCodeVal = baseQuoteSplit[0];
      let quoteCodeVal = baseQuoteSplit[1];
      
      // settlementCode 추출 (괄호 안의 내용)
      if (quoteCodeVal.includes('(') && quoteCodeVal.includes(')')) {
        const parenMatch = quoteCodeVal.match(/^([^(]+)\(([^)]+)\)$/);
        if (parenMatch) {
          quoteCodeVal = parenMatch[1];
          settlementCode = parenMatch[2];
        }
      } else {
        settlementCode = quoteCodeVal; // 괄호가 없으면 quoteCode와 동일
      }
      
      // integratedSymbol 생성
      const integratedSymbol = quantity > 1 
        ? (restOfSymbolPart ? `${quantity}${baseCodeVal}/${quoteCodeVal}-${restOfSymbolPart}` : `${quantity}${baseCodeVal}/${quoteCodeVal}`)
        : (restOfSymbolPart ? `${baseCodeVal}/${quoteCodeVal}-${restOfSymbolPart}` : `${baseCodeVal}/${quoteCodeVal}`);
      
      return {
        integratedSymbol,
        rawSymbol,
        baseCode: baseCodeVal,
        quoteCode: quoteCodeVal,
        restOfSymbol: restOfSymbolPart,
        quantity,
        settlementCode,
        remark,
        search,
        warnings: warningPart ? warningPart.split('@') : undefined
      };
    }).filter(Boolean) as SymbolInfo[];
  } catch (error: unknown) {
    console.error(`Failed to load symbols for ${ex}-${cat}:`, error);
    return [];
  }
};

// 거래소 코인 정보 스토어 생성
export const useExchangeCoinsStore = create<ExchangeInstrumentState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

        // Bybit 거래소의 코인 정보 가져오기
        fetchBybitCoins: async (rawCategory: BybitRawCategory) => {
          return await fetchBybitCoins(rawCategory, set, get);
        },

        // Bithumb 거래소의 코인 정보 가져오기
        fetchBithumbCoins: async (rawCategory: BithumbRawCategory) => {
          return await fetchBithumbCoins(rawCategory, set, get);
        },

        // 모든 Bybit 카테고리의 코인 정보 가져오기
        fetchAllBybitCoins: async () => {
          const categories: BybitRawCategory[] = [...EXCHANGE_RAW_CATEGORIES.bybit];
          const results = await Promise.all(
            categories.map(category => get().fetchBybitCoins(category))
          );
          
          return results.every(Boolean);
        },

        // 모든 Bithumb 카테고리의 코인 정보 가져오기
        fetchAllBithumbCoins: async () => {
          // 빗썸은 spot 카테고리만 지원
          return await get().fetchBithumbCoins('spot');
        },

        // 특정 거래소의 코인 정보 가져오기 (추후 확장)
        fetchExchangeCoins: async (exchange: ExchangeType) => {
          switch (exchange) {
            case 'bybit':
              return await get().fetchAllBybitCoins();
            case 'bithumb':
              return await get().fetchAllBithumbCoins();
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
          const exchanges: ExchangeType[] = ['bybit', 'bithumb']; // 추후 'binance', 'upbit' 추가
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
                key.startsWith('upbit-') ||
                key.startsWith('bithumb-'))
              ) {
                localStorage.removeItem(key);
              }
            }
          } else if (!category) {
            // 특정 거래소의 모든 카테고리 심볼 데이터 초기화
            const categories = exchange === 'bybit' ? 
              [...EXCHANGE_RAW_CATEGORIES.bybit] : // raw 카테고리들 삭제
              exchange === 'binance' ? ['spot', 'um', 'cm', 'options'] :
              exchange === 'upbit' ? ['spot'] :
              exchange === 'bithumb' ? ['spot'] : [];
            
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
            
            // 거래소별 rawCategory 변환
            let rawCategory = category;
            if (exchange === 'bybit') {
              rawCategory = toRawCategory('bybit', category as IntegratedCategory);
            } else if (exchange === 'bithumb') {
              rawCategory = toBithumbRawCategory(category as IntegratedCategory);
            }
            
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
        getFilteredCoins: (
          filter?: { exchange?: ExchangeType; category?: string; baseCode?: string; quoteCode?: string }
        ): CoinInfo[] => {
          try {
            const allCoins: CoinInfo[] = [];
            const seenSymbols = new Set<string>();

            const exchanges: ExchangeType[] = filter?.exchange
              ? [filter.exchange]
              : (Object.keys(API_URLS).filter(k => 'base' in API_URLS[k as ExchangeType]) as ExchangeType[]);

            for (const ex of exchanges) {
              const categories = filter?.category
                ? [filter.category]
                : (EXCHANGE_RAW_CATEGORIES[ex] || []).map(rawCat => toIntegratedCategory(ex, rawCat) || rawCat).filter(Boolean);

              for (const cat of [...new Set(categories)]) {
                const symbols = loadSymbols(ex, cat);

                for (const symbol of symbols) {
                  const symbolKey = `${ex}:${symbol.integratedSymbol}`;
                  if (seenSymbols.has(symbolKey)) {
                    continue;
                  }

                  // 필터링 로직
                  if (filter) {
                    if (filter.baseCode && symbol.baseCode.toUpperCase() !== filter.baseCode.toUpperCase()) {
                      continue;
                    }
                    if (filter.quoteCode && symbol.quoteCode.toUpperCase() !== filter.quoteCode.toUpperCase()) {
                      continue;
                    }
                  }

                  seenSymbols.add(symbolKey);

                  // SymbolInfo를 CoinInfo로 변환
                  const coin: CoinInfo = {
                    ...symbol,
                    exchange: ex,
                    integratedCategory: cat,
                    rawCategory: toRawCategory(ex, cat as IntegratedCategory) || '',
                  };
                  allCoins.push(coin);
                }
              }
            }
            return allCoins;
          } catch (error) {
            console.error('Error in getFilteredCoins:', error);
            return [];
          }
        },

        // 고유한 baseCode 목록 가져오기
        getUniqueBaseCodes: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
          const filteredCoins = get().getFilteredCoins(filter || {});
          const baseCodes = new Set(filteredCoins.map(coin => coin.baseCode).filter(Boolean) as string[]);
          return Array.from(baseCodes).sort();
        },

        // 고유한 quoteCode 목록 가져오기
        getUniqueQuoteCodes: (filter?: { exchange?: ExchangeType; category?: string }): string[] => {
          const filteredCoins = get().getFilteredCoins(filter || {});
          const quoteCodes = new Set(filteredCoins.map(coin => coin.quoteCode).filter(Boolean) as string[]);
          return Array.from(quoteCodes).sort();
        },
      }))
  )
);

// Export the store hook
export const useExchangeInstrumentStore = useExchangeCoinsStore;
