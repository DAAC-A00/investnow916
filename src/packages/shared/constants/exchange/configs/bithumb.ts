/**
 * Bithumb 거래소 설정
 */

import type { ExchangeConfig, BithumbRawCategory, BithumbWarningType } from '../types';

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
};

export const BITHUMB_WARNING_LABELS: Record<BithumbWarningType, string> = {
  TRADING_VOLUME_SUDDEN_FLUCTUATION: '거래량 급등',
  DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION: '입금량 급등', 
  PRICE_DIFFERENCE_HIGH: '가격 차이',
  SPECIFIC_ACCOUNT_HIGH_TRANSACTION: '소수계좌 거래 집중',
  EXCHANGE_TRADING_CONCENTRATION: '거래소 거래 집중'
}; 