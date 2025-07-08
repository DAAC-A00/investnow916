/**
 * 거래소 및 카테고리 설정을 중앙에서 관리하는 통합 설정 파일
 * 
 * 이 파일에서 모든 거래소와 카테고리 정보를 정의하며,
 * 다른 파일들은 이 파일에서 필요한 정보를 import하여 사용합니다.
 */

// ============================================================================
// 1. 기본 거래소 정의 (단일 소스)
// ============================================================================

/**
 * 지원하는 모든 거래소 목록
 * 새로운 거래소 추가 시 이 배열에만 추가하면 됩니다.
 */
export const SUPPORTED_EXCHANGES = ['bybit', 'binance', 'upbit', 'bithumb'] as const;

/**
 * 거래소 타입 (SUPPORTED_EXCHANGES에서 자동 생성)
 */
export type ExchangeType = typeof SUPPORTED_EXCHANGES[number];

// ============================================================================
// 2. 거래소별 Raw 카테고리 정의 (단일 소스)
// ============================================================================

/**
 * 거래소별 Raw 카테고리 매핑
 * 새로운 거래소나 카테고리 추가 시 이 객체에만 추가하면 됩니다.
 */
export const EXCHANGE_RAW_CATEGORIES = {
  bybit: ['linear', 'inverse', 'spot', 'option'],
  binance: ['spot', 'usdm', 'coinm', 'options'],
  upbit: ['spot'],
  bithumb: ['spot']
} as const;

/**
 * 거래소별 Raw 카테고리 타입 (자동 생성)
 */
export type BybitRawCategory = typeof EXCHANGE_RAW_CATEGORIES.bybit[number];
export type BinanceRawCategory = typeof EXCHANGE_RAW_CATEGORIES.binance[number];
export type UpbitRawCategory = typeof EXCHANGE_RAW_CATEGORIES.upbit[number];
export type BithumbRawCategory = typeof EXCHANGE_RAW_CATEGORIES.bithumb[number];

/**
 * 모든 Raw 카테고리 유니온 타입 (자동 생성)
 */
export type AllRawCategories = 
  | BybitRawCategory 
  | BinanceRawCategory 
  | UpbitRawCategory 
  | BithumbRawCategory;

// ============================================================================
// 3. 통합 카테고리 정의 (단일 소스)
// ============================================================================

/**
 * 통합 카테고리 목록
 * 새로운 통합 카테고리 추가 시 이 배열에만 추가하면 됩니다.
 */
export const INTEGRATED_CATEGORIES = ['spot', 'um', 'cm', 'options'] as const;

/**
 * 통합 카테고리 타입 (자동 생성)
 */
export type IntegratedCategory = typeof INTEGRATED_CATEGORIES[number];

// ============================================================================
// 4. 카테고리 매핑 정의 (단일 소스)
// ============================================================================

/**
 * 거래소별 Raw 카테고리 → 통합 카테고리 매핑
 * 새로운 매핑 추가 시 이 객체에만 추가하면 됩니다.
 */
export const EXCHANGE_CATEGORY_MAPPINGS = {
  bybit: {
    linear: 'um',
    inverse: 'cm', 
    spot: 'spot',
    option: 'options'
  },
  binance: {
    spot: 'spot',
    usdm: 'um',
    coinm: 'cm',
    options: 'options'
  },
  upbit: {
    spot: 'spot'
  },
  bithumb: {
    spot: 'spot'
  }
} as const;

// ============================================================================
// 5. 거래소별 지원 카테고리 (자동 생성)
// ============================================================================

/**
 * 거래소별로 지원하는 통합 카테고리 목록 (자동 생성)
 */
export const EXCHANGE_SUPPORTED_CATEGORIES = {
  bybit: Object.values(EXCHANGE_CATEGORY_MAPPINGS.bybit),
  binance: Object.values(EXCHANGE_CATEGORY_MAPPINGS.binance),
  upbit: Object.values(EXCHANGE_CATEGORY_MAPPINGS.upbit),
  bithumb: Object.values(EXCHANGE_CATEGORY_MAPPINGS.bithumb)
} as const;

// ============================================================================
// 6. 데이터 갱신 주기 설정 (instrument, ticker)
// ============================================================================

/**
 * 데이터 유형별 갱신 주기 통합 관리
 * - instrument: 종목 정보 (단위: 시간)
 * - ticker: 실시간 시세 정보 (단위: 밀리초)
 */
export const DATA_UPDATE_INTERVALS = {
  /**
   * 종목 정보(instrument) 갱신 주기 (단위: 시간)
   * - 이 시간이 지나면 데이터를 다시 불러옵니다.
   */
  instrument: {
    default: 2, // 기본 갱신 주기
    bybit: 2,
    bithumb: 2,
    binance: 2,
    upbit: 2,
  },
  /**
   * 실시간 시세(ticker) API 요청 주기 (단위: 밀리초)
   * - 이 주기마다 API를 호출하여 화면을 업데이트합니다.
   */
  ticker: {
    bybit: 500,       // Bybit 전체 티커
    bithumb: 1000,      // Bithumb 전체 티커
    bithumbDetail: 1000, // Bithumb 상세 티커
  },
} as const;

// ============================================================================
// 8. Bithumb Warning 관련 정의
// ============================================================================

/**
 * Bithumb Warning 타입 정의
 */
export type BithumbWarningType = 
  | 'TRADING_VOLUME_SUDDEN_FLUCTUATION'    // 거래량 급등
  | 'DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION'    // 입금량 급등
  | 'PRICE_DIFFERENCE_HIGH'                // 가격 차이
  | 'SPECIFIC_ACCOUNT_HIGH_TRANSACTION'    // 소수계좌 거래 집중
  | 'EXCHANGE_TRADING_CONCENTRATION';      // 거래소 거래 집중

/**
 * Bithumb Warning 타입별 한글 라벨
 */
export const BITHUMB_WARNING_LABELS: Record<BithumbWarningType, string> = {
  TRADING_VOLUME_SUDDEN_FLUCTUATION: '거래량 급등',
  DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION: '입금량 급등', 
  PRICE_DIFFERENCE_HIGH: '가격 차이',
  SPECIFIC_ACCOUNT_HIGH_TRANSACTION: '소수계좌 거래 집중',
  EXCHANGE_TRADING_CONCENTRATION: '거래소 거래 집중'
};

/**
 * API 엔드포인트 정의
 */
export const API_ENDPOINTS = {
  bithumb: {
    tickerAll: 'https://api.bithumb.com/public/ticker/ALL_KRW',
    ticker: (baseCode: string, quoteCode: string) =>
      `https://api.bithumb.com/public/ticker/${baseCode}_${quoteCode}`,
    orderbook: (baseCode: string, quoteCode: string) =>
      `https://api.bithumb.com/public/orderbook/${baseCode}_${quoteCode}`,
  },
  bybit: {
    tickers: (category: string) => `https://api.bybit.com/v5/market/tickers?category=${category}`,
    instruments: (category: string) => `https://api.bybit.com/v5/market/instruments-info?category=${category}`,
  },
} as const;

// ============================================================================
// 9. 유틸리티 타입 (자동 생성)
// ============================================================================

/**
 * 지원하는 거래소 타입 (호환성 유지)
 */
export type SupportedExchange = ExchangeType;

/**
 * 거래소별 Raw 카테고리 매핑 타입
 */
export type ExchangeRawCategoryMap = {
  [K in ExchangeType]: typeof EXCHANGE_RAW_CATEGORIES[K][number];
};

/**
 * 거래소별 지원 카테고리 매핑 타입
 */
export type ExchangeSupportedCategoryMap = {
  [K in ExchangeType]: typeof EXCHANGE_SUPPORTED_CATEGORIES[K][number];
};

// ============================================================================
// 10. 검증 함수들
// ============================================================================

/**
 * 유효한 거래소인지 확인
 */
export const isValidExchange = (exchange: string): exchange is ExchangeType => {
  return SUPPORTED_EXCHANGES.includes(exchange as ExchangeType);
};

/**
 * 유효한 통합 카테고리인지 확인
 */
export const isValidIntegratedCategory = (category: string): category is IntegratedCategory => {
  return INTEGRATED_CATEGORIES.includes(category as IntegratedCategory);
};

/**
 * 거래소에서 지원하는 Raw 카테고리인지 확인
 */
export const isValidRawCategory = (exchange: ExchangeType, category: string): boolean => {
  return EXCHANGE_RAW_CATEGORIES[exchange].includes(category as any);
};

/**
 * 거래소에서 지원하는 통합 카테고리인지 확인
 */
export const isValidSupportedCategory = (exchange: ExchangeType, category: IntegratedCategory): boolean => {
  return EXCHANGE_SUPPORTED_CATEGORIES[exchange].includes(category as any);
};
