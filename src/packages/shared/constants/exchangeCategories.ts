/**
 * 다중 거래소 카테고리 관리 상수 및 유틸리티 함수
 * 각 거래소별 Raw 카테고리와 통합 Display 카테고리 간의 변환을 중앙에서 관리
 * DisplayCategory는 여러 거래소의 서로 다른 RawCategory들을 하나로 통합하는 IntegratedCategory 역할
 */

// 지원하는 거래소 목록
export type SupportedExchange = 'bybit' | 'bithumb' | 'upbit' | 'binance';

// ============================================================================
// 거래소별 Raw 카테고리 정의 (API 요청용)
// ============================================================================
export type BybitRawCategory = 'linear' | 'inverse' | 'spot' | 'option';
export type BithumbRawCategory = 'spot';
export type UpbitRawCategory = 'spot';
export type BinanceRawCategory = 'spot' | 'usdm' | 'coinm' | 'options';

// ============================================================================
// 통합 Display 카테고리 정의 (여러 거래소 통합용)
// ============================================================================
/**
 * 통합 카테고리 - 여러 거래소의 서로 다른 rawCategory를 하나로 통합
 * - spot: 현물 거래 (모든 거래소)
 * - futures-usdt: USDT 마진 선물 (Bybit linear, Binance usdm)
 * - futures-coin: 코인 마진 선물 (Bybit inverse, Binance coinm)  
 * - options: 옵션 거래 (Bybit option, Binance options)
 */
export type IntegratedCategory = 'spot' | 'futures-usdt' | 'futures-coin' | 'options';

// 레거시 호환을 위한 별칭
export type ExchangeDisplayCategory = IntegratedCategory;

// 통합 카테고리 타입 정의
export type ExchangeRawCategory = 
  | BybitRawCategory 
  | BithumbRawCategory 
  | UpbitRawCategory 
  | BinanceRawCategory;

// ============================================================================
// 거래소별 카테고리 매핑 설정 (RawCategory -> IntegratedCategory)
// ============================================================================

// Bybit 카테고리 매핑
export const BYBIT_CATEGORY_MAPPING = {
  linear: 'futures-usdt',    // USDT 무기한 선물
  inverse: 'futures-coin',   // 코인 마진 선물
  spot: 'spot',              // 현물 거래
  option: 'options'          // 옵션 거래
} as const;

// Bithumb 카테고리 매핑 (현물만)
export const BITHUMB_CATEGORY_MAPPING = {
  spot: 'spot'
} as const;

// Upbit 카테고리 매핑 (현물만)
export const UPBIT_CATEGORY_MAPPING = {
  spot: 'spot'
} as const;

// Binance 카테고리 매핑
export const BINANCE_CATEGORY_MAPPING = {
  spot: 'spot',              // 현물 거래
  usdm: 'futures-usdt',      // USDⓈ-M 선물 (USDT 마진)
  coinm: 'futures-coin',     // COIN-M 선물 (코인 마진)
  options: 'options'         // 옵션 거래
} as const;

// 통합 카테고리 매핑
export const EXCHANGE_CATEGORY_MAPPINGS = {
  bybit: BYBIT_CATEGORY_MAPPING,
  bithumb: BITHUMB_CATEGORY_MAPPING,
  upbit: UPBIT_CATEGORY_MAPPING,
  binance: BINANCE_CATEGORY_MAPPING
} as const;

// ============================================================================
// 거래소별 카테고리 목록
// ============================================================================

// 거래소별 Raw 카테고리 목록
export const EXCHANGE_RAW_CATEGORIES = {
  bybit: ['linear', 'inverse', 'spot', 'option'] as BybitRawCategory[],
  bithumb: ['spot'] as BithumbRawCategory[],
  upbit: ['spot'] as UpbitRawCategory[],
  binance: ['spot', 'usdm', 'coinm', 'options'] as BinanceRawCategory[]
} as const;

// 모든 통합 카테고리 목록
export const ALL_INTEGRATED_CATEGORIES: IntegratedCategory[] = ['spot', 'futures-usdt', 'futures-coin', 'options'];

// 거래소별로 지원하는 통합 카테고리 목록
export const EXCHANGE_SUPPORTED_CATEGORIES = {
  bybit: ['spot', 'futures-usdt', 'futures-coin', 'options'] as IntegratedCategory[],
  bithumb: ['spot'] as IntegratedCategory[],
  upbit: ['spot'] as IntegratedCategory[],
  binance: ['spot', 'futures-usdt', 'futures-coin', 'options'] as IntegratedCategory[]
} as const;

// ============================================================================
// 카테고리 변환 함수들
// ============================================================================

/**
 * Raw 카테고리에서 통합 카테고리로 변환
 */
export const toIntegratedCategory = <T extends SupportedExchange>(
  exchange: T,
  rawCategory: string
): IntegratedCategory => {
  const mapping = EXCHANGE_CATEGORY_MAPPINGS[exchange];
  const result = (mapping as any)[rawCategory];
  return result || 'spot'; // 기본값으로 spot 반환
};

/**
 * 통합 카테고리에서 거래소별 Raw 카테고리로 변환
 */
export const toRawCategory = <T extends SupportedExchange>(
  exchange: T,
  integratedCategory: IntegratedCategory
): string => {
  const mapping = EXCHANGE_CATEGORY_MAPPINGS[exchange];
  const entry = Object.entries(mapping).find(([_, value]) => value === integratedCategory);
  return entry?.[0] || integratedCategory;
};

/**
 * @deprecated Use toIntegratedCategory instead
 */
export const toDisplayCategory = toIntegratedCategory;

/**
 * 특정 통합 카테고리를 지원하는 거래소들의 Raw 카테고리 매핑 가져오기
 */
export const getRawCategoriesForIntegratedCategory = (
  integratedCategory: IntegratedCategory
): Record<SupportedExchange, string | null> => {
  const result: Record<string, string | null> = {};
  
  (['bybit', 'bithumb', 'upbit', 'binance'] as SupportedExchange[]).forEach(exchange => {
    const mapping = EXCHANGE_CATEGORY_MAPPINGS[exchange];
    const entry = Object.entries(mapping).find(([_, value]) => value === integratedCategory);
    result[exchange] = entry?.[0] || null;
  });
  
  return result as Record<SupportedExchange, string | null>;
};

/**
 * 거래소가 특정 통합 카테고리를 지원하는지 확인
 */
export const supportsIntegratedCategory = (
  exchange: SupportedExchange, 
  integratedCategory: IntegratedCategory
): boolean => {
  return EXCHANGE_SUPPORTED_CATEGORIES[exchange].includes(integratedCategory);
};

// ============================================================================
// 유효성 검사 함수들
// ============================================================================

/**
 * 거래소의 Raw 카테고리 유효성 검사
 */
export const isValidRawCategory = (exchange: SupportedExchange, category: string): boolean => {
  return EXCHANGE_RAW_CATEGORIES[exchange].includes(category as any);
};

/**
 * 통합 카테고리 유효성 검사
 */
export const isValidIntegratedCategory = (category: string): category is IntegratedCategory => {
  return ALL_INTEGRATED_CATEGORIES.includes(category as IntegratedCategory);
};

/**
 * 거래소가 통합 카테고리를 지원하는지 확인
 */
export const isValidIntegratedCategoryForExchange = (exchange: SupportedExchange, category: string): boolean => {
  return EXCHANGE_SUPPORTED_CATEGORIES[exchange].includes(category as IntegratedCategory);
};

/**
 * @deprecated Use isValidIntegratedCategoryForExchange instead
 */
export const isValidDisplayCategory = isValidIntegratedCategoryForExchange;

/**
 * 지원하는 거래소인지 확인
 */
export const isSupportedExchange = (exchange: string): exchange is SupportedExchange => {
  return ['bybit', 'bithumb', 'upbit', 'binance'].includes(exchange);
};

// ============================================================================
// 카테고리 라벨 매핑 (UI 표시용)
// ============================================================================

// 통합 카테고리 라벨 (한국어)
export const INTEGRATED_CATEGORY_LABELS = {
  'spot': '현물 거래',
  'futures-usdt': 'USDT 마진 선물',
  'futures-coin': '코인 마진 선물', 
  'options': '옵션 거래'
} as const;

// 거래소별 Raw 카테고리 라벨 (세부 정보용)
export const EXCHANGE_RAW_CATEGORY_LABELS = {
  bybit: {
    linear: 'USDT 무기한 선물 (Linear)',
    inverse: '코인 마진 선물 (Inverse)',
    spot: '현물 거래',
    option: '옵션 거래'
  },
  bithumb: {
    spot: '현물 거래'
  },
  upbit: {
    spot: '현물 거래'
  },
  binance: {
    spot: '현물 거래',
    usdm: 'USDⓈ-M 선물',
    coinm: 'COIN-M 선물',
    options: '옵션 거래'
  }
} as const;

/**
 * 통합 카테고리 라벨 가져오기
 */
export const getIntegratedCategoryLabel = (integratedCategory: IntegratedCategory): string => {
  return INTEGRATED_CATEGORY_LABELS[integratedCategory];
};

/**
 * 거래소의 Raw 카테고리 라벨 가져오기
 */
export const getRawCategoryLabel = (exchange: SupportedExchange, rawCategory: string): string => {
  const labels = EXCHANGE_RAW_CATEGORY_LABELS[exchange];
  return (labels as any)[rawCategory] || rawCategory;
};

/**
 * 거래소의 통합 카테고리 라벨 가져오기
 */
export const getCategoryLabel = (exchange: SupportedExchange, integratedCategory: IntegratedCategory): string => {
  return getIntegratedCategoryLabel(integratedCategory);
};

/**
 * @deprecated Use getCategoryLabel instead
 */
export const getDisplayCategoryLabel = getCategoryLabel;

/**
 * 거래소의 모든 카테고리와 라벨 목록 가져오기
 */
export const getExchangeCategoriesWithLabels = (exchange: SupportedExchange) => {
  const rawCategories = EXCHANGE_RAW_CATEGORIES[exchange];
  const rawLabels = EXCHANGE_RAW_CATEGORY_LABELS[exchange];
  
  return rawCategories.map(category => ({
    raw: category,
    integrated: toIntegratedCategory(exchange, category),
    rawLabel: (rawLabels as any)[category] || category,
    integratedLabel: getIntegratedCategoryLabel(toIntegratedCategory(exchange, category))
  }));
};

/**
 * 특정 통합 카테고리를 지원하는 모든 거래소의 정보 가져오기
 */
export const getExchangesForIntegratedCategory = (integratedCategory: IntegratedCategory) => {
  const result: Array<{
    exchange: SupportedExchange;
    rawCategory: string;
    rawLabel: string;
  }> = [];
  
  (['bybit', 'bithumb', 'upbit', 'binance'] as SupportedExchange[]).forEach(exchange => {
    if (supportsIntegratedCategory(exchange, integratedCategory)) {
      const rawCategory = toRawCategory(exchange, integratedCategory);
      const rawLabel = getRawCategoryLabel(exchange, rawCategory);
      
      result.push({
        exchange,
        rawCategory,
        rawLabel
      });
    }
  });
  
  return result;
};

// ============================================================================
// 레거시 호환성을 위한 함수들 (Deprecated)
// ============================================================================

/**
 * @deprecated Use toIntegratedCategory('bybit', rawCategory) instead
 */
export const bybitToDisplayCategory = (rawCategory: BybitRawCategory): IntegratedCategory => {
  return toIntegratedCategory('bybit', rawCategory);
};

/**
 * @deprecated Use toRawCategory('bybit', integratedCategory) instead  
 */
export const bybitToRawCategory = (integratedCategory: IntegratedCategory): BybitRawCategory => {
  return toRawCategory('bybit', integratedCategory) as BybitRawCategory;
};

/**
 * @deprecated Use EXCHANGE_RAW_CATEGORIES.bybit instead
 */
export const ALL_RAW_CATEGORIES: BybitRawCategory[] = EXCHANGE_RAW_CATEGORIES.bybit;

/**
 * @deprecated Use EXCHANGE_SUPPORTED_CATEGORIES.bybit instead
 */
export const ALL_DISPLAY_CATEGORIES: IntegratedCategory[] = EXCHANGE_SUPPORTED_CATEGORIES.bybit;

/**
 * @deprecated Use isValidRawCategory('bybit', category) instead
 */
export const isValidBybitRawCategory = (category: string): category is BybitRawCategory => {
  return isValidRawCategory('bybit', category);
};

/**
 * @deprecated Use isValidIntegratedCategoryForExchange('bybit', category) instead
 */
export const isValidBybitDisplayCategory = (category: string): category is IntegratedCategory => {
  return isValidIntegratedCategoryForExchange('bybit', category);
};

/**
 * @deprecated Use getRawCategoryLabel('bybit', rawCategory) instead
 */
export const getBybitRawCategoryLabel = (rawCategory: BybitRawCategory): string => {
  return getRawCategoryLabel('bybit', rawCategory);
};

/**
 * @deprecated Use getCategoryLabel('bybit', integratedCategory) instead
 */
export const getBybitDisplayCategoryLabel = (integratedCategory: IntegratedCategory): string => {
  return getCategoryLabel('bybit', integratedCategory);
};

// 레거시 호환용 타입 별칭
export type BybitDisplayCategory = IntegratedCategory;
export type BithumbDisplayCategory = IntegratedCategory;
export type UpbitDisplayCategory = IntegratedCategory; 
export type BinanceDisplayCategory = IntegratedCategory;