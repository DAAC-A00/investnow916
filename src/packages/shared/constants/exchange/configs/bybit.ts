/**
 * Bybit 거래소 설정
 */

import type { ExchangeConfig, BybitRawCategory } from '../types';

export const BYBIT_API_BASE_URL = 'https://api.bybit.com' as const;

export const BYBIT_ENDPOINTS = {
  tickers: (category: string) => `${BYBIT_API_BASE_URL}/v5/market/tickers?category=${category}`,
  instruments: (category: string) => `${BYBIT_API_BASE_URL}/v5/market/instruments-info?category=${category}`,
  orderbook: (category: string, symbol: string, limit: number = 25) => 
    `${BYBIT_API_BASE_URL}/v5/market/orderbook?category=${category}&symbol=${symbol}&limit=${limit}`,
  recentTrades: (category: string, symbol: string, limit: number = 60) => 
    `${BYBIT_API_BASE_URL}/v5/market/recent-trade?category=${category}&symbol=${symbol}&limit=${limit}`,
  kline: (category: string, symbol: string, interval: string, limit: number = 200) => 
    `${BYBIT_API_BASE_URL}/v5/market/kline?category=${category}&symbol=${symbol}&interval=${interval}&limit=${limit}`,
} as const;

export const BYBIT_CONFIG: ExchangeConfig<
  readonly ['linear', 'inverse', 'spot', 'option'],
  {
    linear: 'um';
    inverse: 'cm';
    spot: 'spot';
    option: 'options';
  }
> = {
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
  apiBaseUrl: BYBIT_API_BASE_URL,
  endpoints: {
    tickers: BYBIT_ENDPOINTS.tickers,
    instruments: BYBIT_ENDPOINTS.instruments,
  }
}; 