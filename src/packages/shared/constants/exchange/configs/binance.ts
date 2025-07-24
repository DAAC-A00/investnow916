/**
 * Binance 거래소 설정
 */

import type { ExchangeConfig, BinanceRawCategory } from '../types';

// Binance 업데이트 간격 상수
const UPDATE_INTERVALS = {
  INSTRUMENT: 7200000, // 2시간 (ms)
  TICKER: 5000,        // 5초 (ms)
} as const;

// Binance API URL 상수
export const API_URLS = {
  BASE: {
    SPOT: 'https://api.binance.com',
    UM: 'https://fapi.binance.com',
    CM: 'https://dapi.binance.com',
  },
  PATHS: {
    SPOT: {
      TICKER_24HR: '/api/v3/ticker/24hr',
      TICKER_PRICE: '/api/v3/ticker/price',
      EXCHANGE_INFO: '/api/v3/exchangeInfo',
      DEPTH: '/api/v3/depth',
      TRADES: '/api/v3/trades',
      KLINES: '/api/v3/klines',
    },
    UM: {
      TICKER_24HR: '/fapi/v1/ticker/24hr',
      EXCHANGE_INFO: '/fapi/v1/exchangeInfo',
      DEPTH: '/fapi/v1/depth',
    },
    CM: {
      TICKER_24HR: '/dapi/v1/ticker/24hr',
      EXCHANGE_INFO: '/dapi/v1/exchangeInfo',
      DEPTH: '/dapi/v1/depth',
    },
  },
  INTERNAL: {
    EXCHANGE_INFO: '/api/binance/exchangeInfo',
    SPOT_TICKER_24HR: '/api/binance/ticker24hr',
    UM_TICKER_24HR: '/api/binance/um/ticker24hr',
    CM_TICKER_24HR: '/api/binance/cm/ticker24hr',
  }
} as const;

// 전체 URL 생성 헬퍼 함수
export const getFullUrl = {
  spot: {
    ticker24hr: () => `${API_URLS.BASE.SPOT}${API_URLS.PATHS.SPOT.TICKER_24HR}`,
    tickerPrice: () => `${API_URLS.BASE.SPOT}${API_URLS.PATHS.SPOT.TICKER_PRICE}`,
    exchangeInfo: () => `${API_URLS.BASE.SPOT}${API_URLS.PATHS.SPOT.EXCHANGE_INFO}`,
    depth: (symbol: string, limit = 100) => 
      `${API_URLS.BASE.SPOT}${API_URLS.PATHS.SPOT.DEPTH}?symbol=${symbol}&limit=${limit}`,
    trades: (symbol: string, limit = 500) => 
      `${API_URLS.BASE.SPOT}${API_URLS.PATHS.SPOT.TRADES}?symbol=${symbol}&limit=${limit}`,
    klines: (symbol: string, interval: string, limit = 500, startTime?: number, endTime?: number) => {
      let url = `${API_URLS.BASE.SPOT}${API_URLS.PATHS.SPOT.KLINES}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      if (startTime) url += `&startTime=${startTime}`;
      if (endTime) url += `&endTime=${endTime}`;
      return url;
    },
  },
  um: {
    ticker24hr: () => `${API_URLS.BASE.UM}${API_URLS.PATHS.UM.TICKER_24HR}`,
    exchangeInfo: () => `${API_URLS.BASE.UM}${API_URLS.PATHS.UM.EXCHANGE_INFO}`,
    depth: (symbol: string, limit = 100) => 
      `${API_URLS.BASE.UM}${API_URLS.PATHS.UM.DEPTH}?symbol=${symbol}&limit=${limit}`,
  },
  cm: {
    ticker24hr: () => `${API_URLS.BASE.CM}${API_URLS.PATHS.CM.TICKER_24HR}`,
    exchangeInfo: () => `${API_URLS.BASE.CM}${API_URLS.PATHS.CM.EXCHANGE_INFO}`,
    depth: (symbol: string, limit = 100) => 
      `${API_URLS.BASE.CM}${API_URLS.PATHS.CM.DEPTH}?symbol=${symbol}&limit=${limit}`,
  }
} as const;

export const BINANCE_CONFIG: ExchangeConfig<
  readonly ['spot', 'um', 'cm'],
  {
    spot: 'spot';
    um: 'um';
    cm: 'cm';
  }
> = {
  rawCategories: ['spot', 'um', 'cm'] as const,
  categoryMapping: {
    spot: 'spot',
    um: 'um',
    cm: 'cm'
  } as const,
  updateIntervals: {
    instrument: UPDATE_INTERVALS.INSTRUMENT,
    ticker: UPDATE_INTERVALS.TICKER
  },
  apiBaseUrl: API_URLS.BASE.SPOT,
  endpoints: {
    // Internal API routes
    exchangeInfo: API_URLS.INTERNAL.EXCHANGE_INFO,
    
    // Base URLs for different categories
    baseUrls: {
      spot: API_URLS.BASE.SPOT,
      um: API_URLS.BASE.UM,
      cm: API_URLS.BASE.CM,
    },
    
    // Internal API endpoints to avoid CORS issues
    spot: {
      baseUrl: API_URLS.BASE.SPOT,
      ticker24hr: API_URLS.INTERNAL.SPOT_TICKER_24HR,
      tickerPrice: getFullUrl.spot.tickerPrice(),
      exchangeInfo: getFullUrl.spot.exchangeInfo(),
      depth: getFullUrl.spot.depth,
      trades: getFullUrl.spot.trades,
      klines: getFullUrl.spot.klines,
      tickerBySymbol: (symbol: string) => getFullUrl.spot.ticker24hr() + `?symbol=${symbol}`,
    },
    um: {
      baseUrl: API_URLS.BASE.UM,
      ticker24hr: API_URLS.INTERNAL.UM_TICKER_24HR,
      exchangeInfo: getFullUrl.um.exchangeInfo(),
      depth: getFullUrl.um.depth,
      tickerBySymbol: (symbol: string) => getFullUrl.um.ticker24hr() + `?symbol=${symbol}`,
    },
    cm: {
      baseUrl: API_URLS.BASE.CM,
      ticker24hr: API_URLS.INTERNAL.CM_TICKER_24HR,
      exchangeInfo: getFullUrl.cm.exchangeInfo(),
      depth: getFullUrl.cm.depth,
      tickerBySymbol: (symbol: string) => getFullUrl.cm.ticker24hr() + `?symbol=${symbol}`,
    },
  }
}; 