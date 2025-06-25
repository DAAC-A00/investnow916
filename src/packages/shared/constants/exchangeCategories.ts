/**
 * 거래소별 카테고리 관리 및 변환 유틸리티
 * 
 * 모든 거래소와 카테고리 정의는 exchangeConfig.ts에서 중앙 관리되며,
 * 이 파일은 카테고리 변환 및 유틸리티 함수만 제공합니다.
 */

// ============================================================================
// 중앙 설정에서 모든 정의 import
// ============================================================================

// 타입 정의들을 중앙 설정에서 import
export type {
  ExchangeType,
  SupportedExchange,
  IntegratedCategory,
  BybitRawCategory,
  BybitDisplayCategory,
  BinanceRawCategory,
  BinanceDisplayCategory,
  UpbitRawCategory,
  UpbitDisplayCategory,
  BithumbRawCategory,
  BithumbDisplayCategory,
  AllRawCategories
} from '@/packages/shared/constants/exchangeConfig';

// 상수들을 중앙 설정에서 import
export {
  SUPPORTED_EXCHANGES,
  EXCHANGE_RAW_CATEGORIES,
  INTEGRATED_CATEGORIES,
  EXCHANGE_CATEGORY_MAPPINGS,
  EXCHANGE_SUPPORTED_CATEGORIES
} from '@/packages/shared/constants/exchangeConfig';

// 내부에서 사용하기 위한 import
import type {
  ExchangeType,
  SupportedExchange,
  IntegratedCategory,
  AllRawCategories,
  BybitRawCategory,
  BinanceRawCategory,
  UpbitRawCategory,
  BithumbRawCategory
} from '@/packages/shared/constants/exchangeConfig';
import {
  EXCHANGE_CATEGORY_MAPPINGS,
  EXCHANGE_RAW_CATEGORIES,
  EXCHANGE_SUPPORTED_CATEGORIES,
  INTEGRATED_CATEGORIES
} from '@/packages/shared/constants/exchangeConfig';

// ============================================================================
// 유틸리티 함수들 (기존 로직 유지)
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
  return (EXCHANGE_SUPPORTED_CATEGORIES[exchange] as readonly IntegratedCategory[]).includes(integratedCategory);
};

/**
 * 유효성 검사 함수들
 * ============================================================================

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
  return INTEGRATED_CATEGORIES.includes(category as IntegratedCategory);
};

/**
 * 거래소가 통합 카테고리를 지원하는지 확인
 */
export const isValidIntegratedCategoryForExchange = <T extends SupportedExchange>(
  exchange: T,
  integratedCategory: IntegratedCategory
): boolean => {
  return (EXCHANGE_SUPPORTED_CATEGORIES[exchange] as readonly IntegratedCategory[]).includes(integratedCategory);
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
  'um': 'USDT 마진 선물',
  'cm': '코인 마진 선물', 
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
export const ALL_RAW_CATEGORIES: BybitRawCategory[] = [...EXCHANGE_RAW_CATEGORIES.bybit];

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
  return isValidIntegratedCategoryForExchange('bybit', category as IntegratedCategory);
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

// 레거시 호환용 타입 별칭들은 중앙 설정(exchangeConfig.ts)에서 관리됩니다.