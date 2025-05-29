/**
 * 환율 및 거래소 정보 관련 타입 정의
 */

// 환율 API 응답 타입
export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

// 환율 정보 상태 타입
export interface ExchangeRateState {
  baseCode: string;
  rates: Record<string, number>;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}

// 환율 정보 액션 타입
export type ExchangeRateAction =
  | { type: 'FETCH_RATES_START' }
  | { type: 'FETCH_RATES_SUCCESS'; payload: ExchangeRateResponse }
  | { type: 'FETCH_RATES_ERROR'; payload: string }
  | { type: 'CHANGE_BASE_CURRENCY'; payload: string };

/**
 * 거래소 관련 타입 정의
 */

// 지원하는 거래소 타입
export type ExchangeType = 'bybit' | 'binance' | 'upbit';

// 지원하는 카테고리 타입
export type BybitCategoryType = 'spot' | 'linear' | 'inverse' | 'option';
export type BinanceCategoryType = 'spot' | 'futures' | 'options';
export type UpbitCategoryType = 'KRW' | 'BTC' | 'USDT';

// 코인 정보 공통 인터페이스
export interface CoinInfo {
  symbol: string;        // 심볼 (예: BTCUSDT)
  baseCoin: string;      // 기본 코인 (예: BTC)
  quoteCoin: string;     // 견적 코인 (예: USDT)
  exchange: ExchangeType; // 거래소
  category: string;      // 카테고리
}

// Bybit API 응답 타입
export interface BybitInstrumentsResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitInstrument[];
  };
  retExtInfo: Record<string, unknown>;
  time: number;
}

export interface BybitInstrument {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
  [key: string]: any;  // 기타 속성
}

// 거래소 코인 정보 상태 타입
export interface ExchangeCoinsState {
  coins: CoinInfo[];
  lastUpdated: Record<ExchangeType, Record<string, string | null>>;
  isLoading: boolean;
  error: string | null;
  
  // 함수 타입 정의
  fetchBybitCoins: (category: BybitCategoryType) => Promise<boolean>;
  fetchAllBybitCoins: () => Promise<boolean>;
  fetchExchangeCoins: (exchange: ExchangeType) => Promise<boolean>;
  fetchAllExchangeCoins: () => Promise<boolean>;
  clearCoins: () => void;
  clearExchangeCoins: (exchange: ExchangeType) => void;
  clearCategoryCoins: (exchange: ExchangeType, category: string) => void;
  getFilteredCoins: (filter: {
    exchange?: ExchangeType;
    category?: string;
    baseCoin?: string;
    quoteCoin?: string;
  }) => CoinInfo[];
  getUniqueBaseCoins: (filter?: { exchange?: ExchangeType; category?: string }) => string[];
  getUniqueQuoteCoins: (filter?: { exchange?: ExchangeType; category?: string }) => string[];
}
