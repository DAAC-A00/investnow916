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
// 6. 갱신 주기 설정 (updateConfig.ts와의 호환성)
// ============================================================================

// 기본 갱신 주기 (시간 단위)
export const DEFAULT_UPDATE_INTERVAL_HOURS = 2;

// 거래소별 갱신 주기 설정 (시간 단위)
export const EXCHANGE_UPDATE_INTERVALS = {
  bybit: 2,    // Bybit: 2시간
  bithumb: 2,  // Bithumb: 2시간
  binance: 2,  // Binance: 2시간
  upbit: 2,    // Upbit: 2시간
} as const;

// 거래소별 갱신 주기 설정 (밀리초 단위) - 기존 호환성 유지
export const UPDATE_CONFIG = {
  intervals: {
    bybit: 2 * 60 * 60 * 1000, // 2시간
    bithumb: 2 * 60 * 60 * 1000,
    upbit: 2 * 60 * 60 * 1000,
    binance: 2 * 60 * 60 * 1000,
  },
  getUpdateInterval(exchange: ExchangeType) {
    return this.intervals[exchange] || 2 * 60 * 60 * 1000;
  },
} as const;

// ============================================================================
// 7. 거래소별 Display 카테고리 타입 (호환성 유지)
// ============================================================================

/**
 * 거래소별 Display 카테고리 타입 (IntegratedCategory와 동일, 호환성 유지)
 */
export type BybitDisplayCategory = IntegratedCategory;
export type BinanceDisplayCategory = IntegratedCategory;
export type UpbitDisplayCategory = IntegratedCategory;
export type BithumbDisplayCategory = IntegratedCategory;

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
