/**
 * 거래소 및 카테고리 설정 통합 관리
 */

// ============================================================================
// Core Types & Constants
// ============================================================================

export const SUPPORTED_EXCHANGES = ['bybit', 'binance', 'upbit', 'bithumb', 'okx', 'bitget'] as const;
export const INTEGRATED_CATEGORIES = ['spot', 'um', 'cm', 'options'] as const;

export type ExchangeType = typeof SUPPORTED_EXCHANGES[number];
export type IntegratedCategory = typeof INTEGRATED_CATEGORIES[number];

// ============================================================================
// Exchange Configuration (Single Source of Truth)
// ============================================================================

export const EXCHANGE_CONFIG = {
  bybit: {
    rawCategories: ['linear', 'inverse', 'spot', 'option'] as const,
    categoryMapping: {
      linear: 'um',
      inverse: 'cm', 
      spot: 'spot',
      option: 'options'
    } as const,
    updateIntervals: {
      instrument: 7200000,  // 2 hours in ms
      ticker: 500           // milliseconds
    },
    apiBaseUrl: 'https://api.bybit.com',
    endpoints: {
      tickers: (category: string) => `https://api.bybit.com/v5/market/tickers?category=${category}`,
      instruments: (category: string) => `https://api.bybit.com/v5/market/instruments-info?category=${category}`,
    }
  },
  
  binance: {
    rawCategories: ['spot', 'um', 'cm'] as const,
    categoryMapping: {
      spot: 'spot',
      um: 'um',
      cm: 'cm'
    } as const,
    updateIntervals: {
      instrument: 7200000,  // 2 hours in ms
      ticker: 5000
    },
    baseUrls: {
      spot: 'https://api.binance.com',
      um: 'https://fapi.binance.com',
      cm: 'https://dapi.binance.com',
    },
    endpoints: {
      // Internal API routes
      exchangeInfo: '/api/binance/exchangeInfo',
      
      // External API endpoints
      spot: {
        ticker24hr: 'https://api.binance.com/api/v3/ticker/24hr',
        tickerPrice: 'https://api.binance.com/api/v3/ticker/price',
        exchangeInfo: 'https://api.binance.com/api/v3/exchangeInfo',
        depth: (symbol: string, limit = 100) => 
          `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`,
        tickerBySymbol: (symbol: string) => 
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      },
      um: {
        ticker24hr: 'https://fapi.binance.com/fapi/v1/ticker/24hr',
        exchangeInfo: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
        depth: (symbol: string, limit = 100) => 
          `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=${limit}`,
        tickerBySymbol: (symbol: string) => 
          `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`,
      },
      cm: {
        ticker24hr: 'https://dapi.binance.com/dapi/v1/ticker/24hr',
        exchangeInfo: 'https://dapi.binance.com/dapi/v1/exchangeInfo',
        depth: (symbol: string, limit = 100) => 
          `https://dapi.binance.com/dapi/v1/depth?symbol=${symbol}&limit=${limit}`,
        tickerBySymbol: (symbol: string) => 
          `https://dapi.binance.com/dapi/v1/ticker/24hr?symbol=${symbol}`,
      },
    }
  },
  
  bithumb: {
    rawCategories: ['spot'] as const,
    categoryMapping: {
      spot: 'spot'
    } as const,
    updateIntervals: {
      instrument: 7200000,  // 2 hours in ms
      ticker: 1000,
      tickerDetail: 1000
    },
    apiBaseUrl: 'https://api.bithumb.com',
    endpoints: {
      tickerAll: 'https://api.bithumb.com/public/ticker/ALL_KRW',
      ticker: (baseCode: string, quoteCode: string) =>
        `https://api.bithumb.com/public/ticker/${baseCode}_${quoteCode}`,
      orderbook: (baseCode: string, quoteCode: string) =>
        `https://api.bithumb.com/public/orderbook/${baseCode}_${quoteCode}`,
      instruments: 'https://api.bithumb.com/v1/market/all?isDetails=true',
      virtualAssetWarning: 'https://api.bithumb.com/v1/market/virtual_asset_warning',
    }
  },
  
  upbit: {
    rawCategories: ['spot'] as const,
    categoryMapping: {
      spot: 'spot'
    } as const,
    updateIntervals: {
      instrument: 7200000,  // 2 hours in ms
      ticker: 1000
    },
    apiBaseUrl: 'https://api.upbit.com',
    endpoints: {}
  },
  
  okx: {
    rawCategories: ['spot', 'swap', 'futures', 'option'] as const,
    categoryMapping: {
      spot: 'spot',
      swap: 'um',
      futures: 'cm',
      option: 'options'
    } as const,
    updateIntervals: {
      instrument: 7200000,  // 2 hours in ms
      ticker: 1000
    },
    apiBaseUrl: 'https://www.okx.com',
    endpoints: {}
  },
  
  bitget: {
    rawCategories: ['spot', 'mix'] as const,
    categoryMapping: {
      spot: 'spot',
      mix: 'um'
    } as const,
    updateIntervals: {
      instrument: 7200000,  // 2 hours in ms
      ticker: 1000
    },
    apiBaseUrl: 'https://api.bitget.com',
    endpoints: {}
  }
} as const;

// ============================================================================
// Derived Types (Auto-generated from config)
// ============================================================================

export type BybitRawCategory = typeof EXCHANGE_CONFIG.bybit.rawCategories[number];
export type BinanceRawCategory = typeof EXCHANGE_CONFIG.binance.rawCategories[number];
export type BithumbRawCategory = typeof EXCHANGE_CONFIG.bithumb.rawCategories[number];
export type UpbitRawCategory = typeof EXCHANGE_CONFIG.upbit.rawCategories[number];
export type OkxRawCategory = typeof EXCHANGE_CONFIG.okx.rawCategories[number];
export type BitgetRawCategory = typeof EXCHANGE_CONFIG.bitget.rawCategories[number];

export type AllRawCategories = 
  | BybitRawCategory 
  | BinanceRawCategory 
  | BithumbRawCategory
  | UpbitRawCategory
  | OkxRawCategory
  | BitgetRawCategory;

type ExchangeConfigType = typeof EXCHANGE_CONFIG;

export type ExchangeRawCategoryMap = {
  [K in ExchangeType]: ExchangeConfigType[K]['rawCategories'][number];
};

export type ExchangeCategoryMappingMap = {
  [K in ExchangeType]: ExchangeConfigType[K]['categoryMapping'];
};

// ============================================================================
// Convenience Accessors (Legacy compatibility)
// ============================================================================

export const EXCHANGE_RAW_CATEGORIES = Object.fromEntries(
  SUPPORTED_EXCHANGES.map(exchange => [
    exchange, 
    EXCHANGE_CONFIG[exchange].rawCategories
  ])
) as { [K in ExchangeType]: ExchangeConfigType[K]['rawCategories'] };

export const EXCHANGE_CATEGORY_MAPPINGS = Object.fromEntries(
  SUPPORTED_EXCHANGES.map(exchange => [
    exchange, 
    EXCHANGE_CONFIG[exchange].categoryMapping
  ])
) as { [K in ExchangeType]: ExchangeConfigType[K]['categoryMapping'] };

export const EXCHANGE_SUPPORTED_CATEGORIES = Object.fromEntries(
  SUPPORTED_EXCHANGES.map(exchange => [
    exchange, 
    Object.values(EXCHANGE_CONFIG[exchange].categoryMapping)
  ])
) as { [K in ExchangeType]: Array<IntegratedCategory> };

export const DATA_UPDATE_INTERVALS = {
  instrument: Object.fromEntries(
    SUPPORTED_EXCHANGES.map(exchange => [
      exchange, 
      EXCHANGE_CONFIG[exchange].updateIntervals.instrument
    ])
  ) as { [K in ExchangeType]: number },
  
  ticker: Object.fromEntries(
    SUPPORTED_EXCHANGES.map(exchange => [
      exchange, 
      EXCHANGE_CONFIG[exchange].updateIntervals.ticker
    ])
  ) as { [K in ExchangeType]: number }
};

// Legacy API_ENDPOINTS (for backward compatibility)
export const API_ENDPOINTS = {
  bithumb: EXCHANGE_CONFIG.bithumb.endpoints,
  bybit: EXCHANGE_CONFIG.bybit.endpoints,
  binance: {
    ...EXCHANGE_CONFIG.binance.endpoints,
    baseUrls: EXCHANGE_CONFIG.binance.baseUrls,
    getBaseUrl: (category: BinanceRawCategory) => EXCHANGE_CONFIG.binance.baseUrls[category],
    
    // Legacy flat structure
    tickerPrice: EXCHANGE_CONFIG.binance.endpoints.spot.tickerPrice,
    tickers: {
      spot: EXCHANGE_CONFIG.binance.endpoints.spot.ticker24hr,
      um: EXCHANGE_CONFIG.binance.endpoints.um.ticker24hr,
      cm: EXCHANGE_CONFIG.binance.endpoints.cm.ticker24hr,
    },
    instruments: {
      spot: EXCHANGE_CONFIG.binance.endpoints.spot.exchangeInfo,
      um: EXCHANGE_CONFIG.binance.endpoints.um.exchangeInfo,
      cm: EXCHANGE_CONFIG.binance.endpoints.cm.exchangeInfo,
    },
  }
};

// ============================================================================
// Bithumb Specific Types
// ============================================================================

export type BithumbWarningType = 
  | 'TRADING_VOLUME_SUDDEN_FLUCTUATION'
  | 'DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION'
  | 'PRICE_DIFFERENCE_HIGH'
  | 'SPECIFIC_ACCOUNT_HIGH_TRANSACTION'
  | 'EXCHANGE_TRADING_CONCENTRATION';

export const BITHUMB_WARNING_LABELS: Record<BithumbWarningType, string> = {
  TRADING_VOLUME_SUDDEN_FLUCTUATION: '거래량 급등',
  DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION: '입금량 급등', 
  PRICE_DIFFERENCE_HIGH: '가격 차이',
  SPECIFIC_ACCOUNT_HIGH_TRANSACTION: '소수계좌 거래 집중',
  EXCHANGE_TRADING_CONCENTRATION: '거래소 거래 집중'
};

// ============================================================================
// Utility Functions
// ============================================================================

export const isValidExchange = (exchange: string): exchange is ExchangeType => {
  return SUPPORTED_EXCHANGES.includes(exchange as ExchangeType);
};

export const isValidIntegratedCategory = (category: string): category is IntegratedCategory => {
  return INTEGRATED_CATEGORIES.includes(category as IntegratedCategory);
};

export const isValidRawCategory = (exchange: ExchangeType, category: string): boolean => {
  return EXCHANGE_CONFIG[exchange].rawCategories.includes(category as any);
};

export const isValidSupportedCategory = (exchange: ExchangeType, category: IntegratedCategory): boolean => {
  const supportedCategories = Object.values(EXCHANGE_CONFIG[exchange].categoryMapping);
  return supportedCategories.includes(category as any);
};

export const getRawCategories = (exchange: ExchangeType) => {
  return EXCHANGE_CONFIG[exchange].rawCategories;
};

export const getCategoryMapping = (exchange: ExchangeType) => {
  return EXCHANGE_CONFIG[exchange].categoryMapping;
};

export const getSupportedCategories = (exchange: ExchangeType): IntegratedCategory[] => {
  return Object.values(EXCHANGE_CONFIG[exchange].categoryMapping);
};

export const getUpdateInterval = (exchange: ExchangeType, dataType: 'instrument' | 'ticker') => {
  return EXCHANGE_CONFIG[exchange].updateIntervals[dataType];
};

export const getEndpoints = (exchange: ExchangeType) => {
  return EXCHANGE_CONFIG[exchange].endpoints;
};

// Legacy type aliases for compatibility
export type SupportedExchange = ExchangeType;
export type ExchangeSupportedCategoryMap = {
  [K in ExchangeType]: typeof EXCHANGE_SUPPORTED_CATEGORIES[K][number];
};
