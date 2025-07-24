/**
 * Bithumb 거래소 설정
 */

import type { ExchangeConfig, BithumbWarningType } from '../types';

// Bithumb 업데이트 간격 상수
const UPDATE_INTERVALS = {
  INSTRUMENT: 7200000, // 2시간 (ms)
  TICKER: 1000,        // 1초 (ms)
} as const;

// Bithumb API URL 상수
export const API_URLS = {
  BASE: 'https://api.bithumb.com',
  TICKER_ALL: 'https://api.bithumb.com/public/ticker/ALL_KRW',
  INSTRUMENTS: 'https://api.bithumb.com/v1/market/all?isDetails=true',
  VIRTUAL_ASSET_WARNING: 'https://api.bithumb.com/v1/market/virtual_asset_warning',
} as const;

export const BITHUMB_CONFIG: ExchangeConfig<
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
    instrument: UPDATE_INTERVALS.INSTRUMENT,
    ticker: UPDATE_INTERVALS.TICKER
  },
  apiBaseUrl: API_URLS.BASE,
  endpoints: {
    tickerAll: API_URLS.TICKER_ALL,
    ticker: (baseCode: string, quoteCode: string) =>
      `${API_URLS.BASE}/public/ticker/${baseCode}_${quoteCode}`,
    orderbook: (baseCode: string, quoteCode: string) =>
      `${API_URLS.BASE}/public/orderbook/${baseCode}_${quoteCode}`,
    instruments: API_URLS.INSTRUMENTS,
    virtualAssetWarning: API_URLS.VIRTUAL_ASSET_WARNING,
  }
};

/**
 * Bithumb 가상자산 유의종목 경고 타입별 라벨
 */
export const BITHUMB_WARNING_LABELS: Record<BithumbWarningType, string> = {
  TRADING_VOLUME_SUDDEN_FLUCTUATION: '거래량 급등',
  DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION: '입금량 급등',
  PRICE_DIFFERENCE_HIGH: '가격 차이',
  SPECIFIC_ACCOUNT_HIGH_TRANSACTION: '소수계좌 거래 집중',
  EXCHANGE_TRADING_CONCENTRATION: '거래소 거래 집중'
} as const; 