/**
 * 거래소 관련 타입 정의
 */

// 기본 거래소 및 카테고리 타입들
export const SUPPORTED_EXCHANGES = ['bybit', 'binance', 'upbit', 'bithumb', 'okx', 'bitget'] as const;
export const INTEGRATED_CATEGORIES = ['spot', 'um', 'cm', 'options'] as const;

export type ExchangeType = typeof SUPPORTED_EXCHANGES[number];
export type IntegratedCategory = typeof INTEGRATED_CATEGORIES[number];

// 각 거래소별 Raw Category 타입들
export type BybitRawCategory = 'linear' | 'inverse' | 'spot' | 'option';
export type BinanceRawCategory = 'spot' | 'um' | 'cm';
export type BithumbRawCategory = 'spot';
export type UpbitRawCategory = 'spot';
export type OkxRawCategory = 'spot' | 'swap' | 'futures' | 'option';
export type BitgetRawCategory = 'spot' | 'mix';

export type AllRawCategories = 
  | BybitRawCategory 
  | BinanceRawCategory 
  | BithumbRawCategory
  | UpbitRawCategory
  | OkxRawCategory
  | BitgetRawCategory;

// 카테고리 매핑 타입들
export type CategoryMapping<T extends AllRawCategories> = {
  [K in T]: IntegratedCategory;
};

// 거래소별 설정 인터페이스
export interface ExchangeEndpoints {
  [key: string]: string | ((...args: any[]) => string) | ExchangeEndpoints;
}

export interface ExchangeUpdateIntervals {
  instrument: number;
  ticker: number;
  [key: string]: number;
}

export interface ExchangeConfig<
  TRawCategories extends readonly AllRawCategories[],
  TMapping extends CategoryMapping<TRawCategories[number]>
> {
  rawCategories: TRawCategories;
  categoryMapping: TMapping;
  updateIntervals: ExchangeUpdateIntervals;
  apiBaseUrl: string;
  endpoints: ExchangeEndpoints;
}

// Bithumb 특화 타입들
export type BithumbWarningType = 
  | 'TRADING_VOLUME_SUDDEN_FLUCTUATION'
  | 'DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION'
  | 'PRICE_DIFFERENCE_HIGH'
  | 'SPECIFIC_ACCOUNT_HIGH_TRANSACTION'
  | 'EXCHANGE_TRADING_CONCENTRATION';

// 레거시 호환성을 위한 타입 별칭들
export type SupportedExchange = ExchangeType; 