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

// 빗썸 상세 페이지 전용 타입들
export interface OrderbookUnit {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
}

export interface OrderbookData {
  market: string;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
  orderbook_units: OrderbookUnit[];
}

export interface BithumbTickerApiData {
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
  date: string;
}

// BithumbTickerResponse는 이미 exchange.ts에서 import됨

export interface BithumbOrderbookEntry {
  price: string;
  quantity: string;
}

export interface BithumbApiOrderbookData {
  timestamp: string;
  payment_currency: string;
  order_currency: string;
  bids: BithumbOrderbookEntry[];
  asks: BithumbOrderbookEntry[];
}

export interface BithumbOrderbookResponse {
  status: string;
  data: BithumbApiOrderbookData;
} 