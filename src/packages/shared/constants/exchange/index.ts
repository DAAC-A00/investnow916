/**
 * 거래소 및 카테고리 설정 통합 관리 (리팩토링됨)
 * 
 * 이 파일은 레거시 호환성을 유지하면서 새로운 모듈화된 구조를 제공합니다.
 */

// ============================================================================
// Re-exports from modular structure
// ============================================================================

// Types
export * from './types';

// Configs
export { BYBIT_CONFIG } from './configs/bybit';
export { BINANCE_CONFIG } from './configs/binance';
export { BITHUMB_CONFIG, BITHUMB_WARNING_LABELS } from './configs/bithumb';
export { UPBIT_CONFIG, OKX_CONFIG, BITGET_CONFIG } from './configs/others';

// Utils
export * from './utils';

// ============================================================================
// Legacy Compatibility Layer
// ============================================================================

import { SUPPORTED_EXCHANGES, INTEGRATED_CATEGORIES } from './types';
import { EXCHANGE_CONFIGS } from './utils';
import { BITHUMB_WARNING_LABELS } from './configs/bithumb';
import type { ExchangeType, IntegratedCategory, BinanceRawCategory } from './types';

// Legacy EXCHANGE_CONFIG object (for backward compatibility)
export const EXCHANGE_CONFIG = EXCHANGE_CONFIGS;

// Legacy convenience accessors
export const EXCHANGE_RAW_CATEGORIES = Object.fromEntries(
  SUPPORTED_EXCHANGES.map(exchange => [
    exchange, 
    EXCHANGE_CONFIGS[exchange].rawCategories
  ])
) as { [K in ExchangeType]: typeof EXCHANGE_CONFIGS[K]['rawCategories'] };

export const EXCHANGE_CATEGORY_MAPPINGS = Object.fromEntries(
  SUPPORTED_EXCHANGES.map(exchange => [
    exchange, 
    EXCHANGE_CONFIGS[exchange].categoryMapping
  ])
) as { [K in ExchangeType]: typeof EXCHANGE_CONFIGS[K]['categoryMapping'] };

export const EXCHANGE_SUPPORTED_CATEGORIES = Object.fromEntries(
  SUPPORTED_EXCHANGES.map(exchange => [
    exchange, 
    Object.values(EXCHANGE_CONFIGS[exchange].categoryMapping)
  ])
) as { [K in ExchangeType]: Array<IntegratedCategory> };

export const DATA_UPDATE_INTERVALS = {
  instrument: Object.fromEntries(
    SUPPORTED_EXCHANGES.map(exchange => [
      exchange, 
      EXCHANGE_CONFIGS[exchange].updateIntervals.instrument
    ])
  ) as { [K in ExchangeType]: number },
  
  ticker: Object.fromEntries(
    SUPPORTED_EXCHANGES.map(exchange => [
      exchange, 
      EXCHANGE_CONFIGS[exchange].updateIntervals.ticker
    ])
  ) as { [K in ExchangeType]: number },
  
  // Bithumb의 특별한 tickerDetail interval 추가
  bithumbDetail: EXCHANGE_CONFIGS.bithumb.updateIntervals.tickerDetail || 1000
};

// Legacy API_ENDPOINTS (for backward compatibility)
export const API_ENDPOINTS = {
  bithumb: EXCHANGE_CONFIGS.bithumb.endpoints,
  bybit: EXCHANGE_CONFIGS.bybit.endpoints,
  binance: {
    ...EXCHANGE_CONFIGS.binance.endpoints,
    
    // Legacy convenience methods
    getBaseUrl: (category: BinanceRawCategory) => 
      (EXCHANGE_CONFIGS.binance.endpoints.baseUrls as any)[category],
    
    // Legacy api structure (for backward compatibility)
    api: EXCHANGE_CONFIGS.binance.endpoints,
    
    // Legacy flat structure
    tickerPrice: (EXCHANGE_CONFIGS.binance.endpoints.spot as any).tickerPrice,
    tickers: {
      spot: (EXCHANGE_CONFIGS.binance.endpoints.spot as any).ticker24hr,
      um: (EXCHANGE_CONFIGS.binance.endpoints.um as any).ticker24hr,
      cm: (EXCHANGE_CONFIGS.binance.endpoints.cm as any).ticker24hr,
    },
    instruments: {
      spot: (EXCHANGE_CONFIGS.binance.endpoints.spot as any).exchangeInfo,
      um: (EXCHANGE_CONFIGS.binance.endpoints.um as any).exchangeInfo,
      cm: (EXCHANGE_CONFIGS.binance.endpoints.cm as any).exchangeInfo,
    },
  }
};

// ============================================================================
// Re-exported Legacy Functions (now using new utils)
// ============================================================================

export {
  isValidExchange,
  isValidIntegratedCategory,
  isValidRawCategory,
  isValidSupportedCategory,
  getRawCategories,
  getCategoryMapping,
  getSupportedCategories,
  getUpdateInterval,
  getEndpoints,
} from './utils';

// Legacy type aliases for compatibility
export type SupportedExchange = ExchangeType;
export type ExchangeSupportedCategoryMap = {
  [K in ExchangeType]: typeof EXCHANGE_SUPPORTED_CATEGORIES[K][number];
};

export type ExchangeRawCategoryMap = {
  [K in ExchangeType]: typeof EXCHANGE_RAW_CATEGORIES[K][number];
};

export type ExchangeCategoryMappingMap = {
  [K in ExchangeType]: typeof EXCHANGE_CATEGORY_MAPPINGS[K];
}; 