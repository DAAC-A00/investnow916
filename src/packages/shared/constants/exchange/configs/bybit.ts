/**
 * Bybit 거래소 설정
 */

import type { ExchangeConfig, BybitRawCategory } from '../types';

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
  apiBaseUrl: 'https://api.bybit.com',
  endpoints: {
    tickers: (category: string) => `https://api.bybit.com/v5/market/tickers?category=${category}`,
    instruments: (category: string) => `https://api.bybit.com/v5/market/instruments-info?category=${category}`,
  }
}; 