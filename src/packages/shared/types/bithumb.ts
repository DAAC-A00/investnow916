// 빗썸 API 타입 정의 (기존 exchange.ts에서 import)
export type { BithumbTickerResponse } from './exchange';

// BithumbTicker와 동일하지만 date 필드 추가
export interface BithumbTickerData {
  opening_price: string;
  closing_price: string;
  min_price: string;
  max_price: string;
  units_traded: string;
  acc_trade_value: string;
  prev_closing_price: string;
  units_traded_24H: string;
  acc_trade_value_24H: string;
  fluctate_24H: string;
  fluctate_rate_24H: string;
  date?: string; // 옵셔널로 추가
}

// 정렬 관련 타입
export type TickerSortBy = 'changePercent' | 'price' | 'volume' | 'turnover' | 'symbol' | 'warning';
export type TickerSortOrder = 'desc' | 'asc';

export interface TickerSortSettings {
  sortBy: TickerSortBy;
  sortOrder: TickerSortOrder;
} 