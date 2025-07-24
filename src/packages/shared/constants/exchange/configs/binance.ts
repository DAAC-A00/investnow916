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
const API_URLS = {
  SPOT: 'https://api.binance.com',
  UM: 'https://fapi.binance.com',
  CM: 'https://dapi.binance.com',
} as const;

// Binance API 경로 상수
const API_PATHS = {
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
  INTERNAL: {
    EXCHANGE_INFO: '/api/binance/exchangeInfo',
    SPOT_TICKER_24HR: '/api/binance/ticker24hr',
    UM_TICKER_24HR: '/api/binance/um/ticker24hr',
    CM_TICKER_24HR: '/api/binance/cm/ticker24hr',
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
  apiBaseUrl: API_URLS.SPOT,
  endpoints: {
    // Internal API routes
    exchangeInfo: API_PATHS.INTERNAL.EXCHANGE_INFO,
    
    // Base URLs for different categories
    baseUrls: {
      spot: API_URLS.SPOT,
      um: API_URLS.UM,
      cm: API_URLS.CM,
    },
    
    // Internal API endpoints to avoid CORS issues
    spot: {
      baseUrl: API_URLS.SPOT,
      ticker24hr: API_PATHS.INTERNAL.SPOT_TICKER_24HR,
      tickerPrice: `${API_URLS.SPOT}${API_PATHS.SPOT.TICKER_PRICE}`,
      exchangeInfo: `${API_URLS.SPOT}${API_PATHS.SPOT.EXCHANGE_INFO}`,
      depth: (symbol: string, limit = 100) => 
        `${API_URLS.SPOT}${API_PATHS.SPOT.DEPTH}?symbol=${symbol}&limit=${limit}`,
      trades: (symbol: string, limit = 500) => 
        `${API_URLS.SPOT}${API_PATHS.SPOT.TRADES}?symbol=${symbol}&limit=${limit}`,
      klines: (symbol: string, interval: string, limit = 500, startTime?: number, endTime?: number) => {
        let url = `${API_URLS.SPOT}${API_PATHS.SPOT.KLINES}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        if (startTime) url += `&startTime=${startTime}`;
        if (endTime) url += `&endTime=${endTime}`;
        return url;
      },
      tickerBySymbol: (symbol: string) => 
        `${API_URLS.SPOT}${API_PATHS.SPOT.TICKER_24HR}?symbol=${symbol}`,
    },
    um: {
      baseUrl: API_URLS.UM,
      ticker24hr: API_PATHS.INTERNAL.UM_TICKER_24HR,
      exchangeInfo: `${API_URLS.UM}${API_PATHS.UM.EXCHANGE_INFO}`,
      depth: (symbol: string, limit = 100) => 
        `${API_URLS.UM}${API_PATHS.UM.DEPTH}?symbol=${symbol}&limit=${limit}`,
      tickerBySymbol: (symbol: string) => 
        `${API_URLS.UM}${API_PATHS.UM.TICKER_24HR}?symbol=${symbol}`,
    },
    cm: {
      baseUrl: API_URLS.CM,
      ticker24hr: API_PATHS.INTERNAL.CM_TICKER_24HR,
      exchangeInfo: `${API_URLS.CM}${API_PATHS.CM.EXCHANGE_INFO}`,
      depth: (symbol: string, limit = 100) => 
        `${API_URLS.CM}${API_PATHS.CM.DEPTH}?symbol=${symbol}&limit=${limit}`,
      tickerBySymbol: (symbol: string) => 
        `${API_URLS.CM}${API_PATHS.CM.TICKER_24HR}?symbol=${symbol}`,
    },
  }
}; 