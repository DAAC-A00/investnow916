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

// 내부 저장용 카테고리로 변환 (integratedCategory 반환)
const toStorageCategory = (category: string): string => {
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

    localStorage.setItem(key, symbolStrings.join(','));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to store symbols for ${exchange}-${category}:`, message);
  }
};

// 거래소별 카테고리 매핑
const getCategoriesForExchange = (exchange: ExchangeType): string[] => {
  switch (exchange) {
    case 'bybit':
      return ['spot', 'inverse', 'linear'];
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

    // 중앙화된 API_ENDPOINTS 사용
    const response = await apiGet<BybitInstrumentsResponse>(API_ENDPOINTS.bybit.tickers(rawCategory));
    const data = response.data;
    
    if (data.retCode !== 0) {
      throw new Error(`Bybit API 에러: ${data.retMsg}`);
    }

    // ...

    return true;
  } catch (error) {
    console.error(`Bybit ${rawCategory} 데이터 갱신 실패:`, error);
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

    // ...

    return true;
  } catch (error) {
    console.error(`Bithumb ${rawCategory} 데이터 갱신 실패:`, error);
    return false;
  }
};

