/**
 * Binance 거래소 설정
 */

import type { ExchangeConfig, BinanceRawCategory } from '../types';

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
    instrument: 7200000,  // 2 hours in ms
    ticker: 5000
  },
  apiBaseUrl: 'https://api.binance.com',
  endpoints: {
    // Internal API routes
    exchangeInfo: '/api/binance/exchangeInfo',
    
    // Base URLs for different categories
    baseUrls: {
      spot: 'https://api.binance.com',
      um: 'https://fapi.binance.com',
      cm: 'https://dapi.binance.com',
    },
    
    // External API endpoints organized by category
    spot: {
      baseUrl: 'https://api.binance.com',
      ticker24hr: 'https://api.binance.com/api/v3/ticker/24hr',
      tickerPrice: 'https://api.binance.com/api/v3/ticker/price',
      exchangeInfo: 'https://api.binance.com/api/v3/exchangeInfo',
      depth: (symbol: string, limit = 100) => 
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`,
      trades: (symbol: string, limit = 500) => 
        `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=${limit}`,
      klines: (symbol: string, interval: string, limit = 500, startTime?: number, endTime?: number) => {
        let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        if (startTime) url += `&startTime=${startTime}`;
        if (endTime) url += `&endTime=${endTime}`;
        return url;
      },
      tickerBySymbol: (symbol: string) => 
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    },
    um: {
      baseUrl: 'https://fapi.binance.com',
      ticker24hr: 'https://fapi.binance.com/fapi/v1/ticker/24hr',
      exchangeInfo: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
      depth: (symbol: string, limit = 100) => 
        `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=${limit}`,
      tickerBySymbol: (symbol: string) => 
        `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`,
    },
    cm: {
      baseUrl: 'https://dapi.binance.com',
      ticker24hr: 'https://dapi.binance.com/dapi/v1/ticker/24hr',
      exchangeInfo: 'https://dapi.binance.com/dapi/v1/exchangeInfo',
      depth: (symbol: string, limit = 100) => 
        `https://dapi.binance.com/dapi/v1/depth?symbol=${symbol}&limit=${limit}`,
      tickerBySymbol: (symbol: string) => 
        `https://dapi.binance.com/dapi/v1/ticker/24hr?symbol=${symbol}`,
    },
  }
}; 