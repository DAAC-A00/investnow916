/**
 * 환율 및 거래소 정보 관련 타입 정의
 */

// Bybit 카테고리 타입들은 constants/bybitCategories.ts에서 import
export type { 
  BybitRawCategory, 
  BybitDisplayCategory 
} from '@/packages/shared/constants/bybitCategories';

// 내부에서 사용하기 위한 import
import type { BybitRawCategory } from '@/packages/shared/constants/bybitCategories';

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
export type UpbitRawCategoryType = 'KRW' | 'BTC' | 'USDT';

// 코인 정보 공통 인터페이스
export interface CoinInfo {
  displaySymbol: string;  // 내부 프로젝트에서 표시하는 심볼 (예: BTC/USDT)
  rawSymbol: string;      // 외부 API에서 받은 원본 심볼 (예: BTCUSDT)
  baseCode: string;       // 거래쌍의 기준(기본) 코인 (예: BTC)
  quoteCode: string;      // 거래쌍의 상대(견적) 코인 (예: USDT)
  exchange: ExchangeType;  // 거래소
  displayCategory: string; // 내부 프로젝트에서 표시하는 카테고리 (예: um, cm)
  rawCategory: string;    // 외부 API에서 받은 카테고리 (예: linear, inverse)
  
  // 원본 API 응답 데이터 (카테고리별로 다른 정보 포함)
  rawInstrumentData?: any; // 전체 API 응답 데이터
  
  // 공통 필드들
  status?: string;
  
  // Linear/Inverse 전용 필드들
  contractType?: string;
  launchTime?: string;
  deliveryTime?: string;
  deliveryFeeRate?: string;
  priceScale?: string;
  leverageFilter?: {
    minLeverage?: string;
    maxLeverage?: string;
    leverageStep?: string;
  };
  priceFilter?: {
    minPrice?: string;
    maxPrice?: string;
    tickSize?: string;
  };
  lotSizeFilter?: any; // 카테고리별로 구조가 다름
  unifiedMarginTrade?: boolean;
  fundingInterval?: number;
  settleCoin?: string;
  copyTrading?: string;
  upperFundingRate?: string;
  lowerFundingRate?: string;
  isPreListing?: boolean;
  preListingInfo?: any;
  riskParameters?: any;
  displayName?: string;
  
  // Spot 전용 필드들
  innovation?: string;
  marginTrading?: string;
  stTag?: string;
  
  // Option 전용 필드들
  optionsType?: string; // Put, Call
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
  baseCoin?: string;  // API 응답에서 사용하는 필드명
  quoteCoin?: string; // API 응답에서 사용하는 필드명
  status: string;
  [key: string]: any;  // 기타 속성
}

// Bybit Ticker API 응답 타입
export interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitTicker[];
  };
  retExtInfo: Record<string, unknown>;
  time: number;
}

export interface BybitTicker {
  symbol: string;
  bid1Price: string;
  bid1Size: string;
  ask1Price: string;
  ask1Size: string;
  lastPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  turnover24h: string;
  volume24h: string;
  usdIndexPrice?: string;
  [key: string]: any;  // 기타 속성
}

// 티커 정보 공통 인터페이스
export interface TickerInfo {
  rawSymbol: string;      // 외부 API에서 받은 원본 심볼 (예: BTCUSDT)
  displaySymbol: string;  // 내부 프로젝트에서 표시하는 심볼 (예: BTC/USDT)
  lastPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  highPrice24h: number;
  lowPrice24h: number;
  volume24h: number;
  turnover24h: number;
  bidPrice: number;
  askPrice: number;
  exchange: ExchangeType;
  displayCategory: string; // 내부 프로젝트에서 표시하는 카테고리 (예: um, cm)
  rawCategory: string;    // 외부 API에서 받은 카테고리 (예: linear, inverse)
}

// 거래소 코인 정보 상태 타입
export interface ExchangeInstrumentState {
  isLoading: boolean;
  error: string | null;
  
  // 함수 타입 정의
  fetchBybitCoins: (rawCategory: BybitRawCategory) => Promise<boolean>;
  fetchAllBybitCoins: () => Promise<boolean>;
  fetchExchangeCoins: (exchange: ExchangeType) => Promise<boolean>;
  fetchAllExchangeCoins: () => Promise<boolean>;
  clearSymbols: (exchange?: ExchangeType, category?: string) => void;
  getSymbolsForCategory: (exchange: ExchangeType, category: string) => string[];
  getFilteredCoins: (filter: {
    exchange?: ExchangeType;
    category?: string;
    baseCode?: string;
    quoteCode?: string;
  }) => CoinInfo[];
  getUniqueBaseCodes: (filter?: { exchange?: ExchangeType; category?: string }) => string[];
  getUniqueQuoteCodes: (filter?: { exchange?: ExchangeType; category?: string }) => string[];
}
