/**
 * 기타 거래소들 설정 (Upbit, OKX, Bitget)
 */

import type { ExchangeConfig, UpbitRawCategory, OkxRawCategory, BitgetRawCategory } from '../types';

export const UPBIT_CONFIG: ExchangeConfig<
  readonly ['spot'],
  {
    spot: 'spot';
  }
> = {
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
};

export const OKX_CONFIG: ExchangeConfig<
  readonly ['spot', 'swap', 'futures', 'option'],
  {
    spot: 'spot';
    swap: 'um';
    futures: 'cm';
    option: 'options';
  }
> = {
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
};

export const BITGET_CONFIG: ExchangeConfig<
  readonly ['spot', 'mix'],
  {
    spot: 'spot';
    mix: 'um';
  }
> = {
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
}; 