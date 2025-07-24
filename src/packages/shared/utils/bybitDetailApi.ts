import { get, ApiError } from './apiClient';
import { API_ENDPOINTS } from '../constants/exchange';
import { BybitTickerResponse, BybitTicker } from '../types/exchange';
import { BybitRawCategory } from '../constants/exchange';

/**
 * Bybit 특정 심볼의 티커 정보 조회
 */
export const fetchBybitTicker = async (symbol: string, category: BybitRawCategory = 'spot') => {
  try {
    const tickerFunc = API_ENDPOINTS.bybit.tickers as (category: string) => string;
    const response = await get<BybitTickerResponse>(
      `${tickerFunc(category)}&symbol=${symbol}`
    );

    if (response.data.retCode === 0 && response.data.result?.list?.length > 0) {
      return {
        data: response.data.result.list[0],
        symbol,
        category,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category,
        error: '티커 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Bybit 티커 정보 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category,
      error: error instanceof ApiError ? error.message : '티커 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Bybit 호가 정보 조회
 */
export const fetchBybitOrderbook = async (symbol: string, category: BybitRawCategory = 'spot', limit: number = 25) => {
  try {
    const response = await get<{
      retCode: number;
      retMsg: string;
      result: {
        s: string; // symbol
        b: [string, string][]; // bids [price, size]
        a: [string, string][]; // asks [price, size]
        ts: number; // timestamp
        u: number; // update id
      };
    }>(
      `https://api.bybit.com/v5/market/orderbook?category=${category}&symbol=${symbol}&limit=${limit}`
    );

    if (response.data.retCode === 0 && response.data.result) {
      const orderbook = response.data.result;
      return {
        data: {
          symbol: orderbook.s,
          timestamp: orderbook.ts,
          bids: orderbook.b.map(([price, size]) => ({
            price: parseFloat(price),
            quantity: parseFloat(size),
          })),
          asks: orderbook.a.map(([price, size]) => ({
            price: parseFloat(price),
            quantity: parseFloat(size),
          })),
          updateId: orderbook.u,
        },
        marketSymbol: symbol,
        category,
        error: null,
      };
    } else {
      return {
        data: null,
        marketSymbol: symbol,
        category,
        error: '호가 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Bybit 호가 정보 가져오기 실패:', error);
    return {
      data: null,
      marketSymbol: symbol,
      category,
      error: error instanceof ApiError ? error.message : '호가 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Bybit 최근 거래 내역 조회
 */
export const fetchBybitRecentTrades = async (symbol: string, category: BybitRawCategory = 'spot', limit: number = 60) => {
  try {
    const response = await get<{
      retCode: number;
      retMsg: string;
      result: {
        category: string;
        list: Array<{
          execId: string;
          symbol: string;
          price: string;
          size: string;
          side: 'Buy' | 'Sell';
          time: string;
          isBlockTrade: boolean;
        }>;
      };
    }>(
      `https://api.bybit.com/v5/market/recent-trade?category=${category}&symbol=${symbol}&limit=${limit}`
    );

    if (response.data.retCode === 0 && response.data.result?.list) {
      const trades = response.data.result.list;
      return {
        data: trades.map(trade => ({
          id: trade.execId,
          symbol: trade.symbol,
          price: parseFloat(trade.price),
          quantity: parseFloat(trade.size),
          side: trade.side.toLowerCase() as 'buy' | 'sell',
          timestamp: parseInt(trade.time),
          isBlockTrade: trade.isBlockTrade,
        })),
        symbol,
        category,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category,
        error: '최근 거래 내역을 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Bybit 최근 거래 내역 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category,
      error: error instanceof ApiError ? error.message : '최근 거래 내역을 가져올 수 없습니다',
    };
  }
};

/**
 * Bybit K선(캔들스틱) 데이터 조회
 */
export const fetchBybitKline = async (
  symbol: string, 
  category: BybitRawCategory = 'spot',
  interval: '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '360' | '720' | 'D' | 'W' | 'M' = '1',
  start?: number,
  end?: number,
  limit: number = 200
) => {
  try {
    let url = `https://api.bybit.com/v5/market/kline?category=${category}&symbol=${symbol}&interval=${interval}&limit=${limit}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;

    const response = await get<{
      retCode: number;
      retMsg: string;
      result: {
        category: string;
        symbol: string;
        list: [string, string, string, string, string, string, string][];
        // [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
      };
    }>(url);

    if (response.data.retCode === 0 && response.data.result?.list) {
      const klines = response.data.result.list;
      return {
        data: klines.map(([startTime, open, high, low, close, volume, turnover]) => ({
          startTime: parseInt(startTime),
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
          volume: parseFloat(volume),
          turnover: parseFloat(turnover),
        })),
        symbol,
        category,
        interval,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category,
        interval,
        error: 'K선 데이터를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Bybit K선 데이터 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category,
      interval,
      error: error instanceof ApiError ? error.message : 'K선 데이터를 가져올 수 없습니다',
    };
  }
};

/**
 * Bybit 종목 정보 조회
 */
export const fetchBybitInstrumentInfo = async (symbol: string, category: BybitRawCategory = 'spot') => {
  try {
    const response = await get<{
      retCode: number;
      retMsg: string;
      result: {
        category: string;
        list: Array<{
          symbol: string;
          contractType: string;
          status: string;
          baseCoin: string;
          quoteCoin: string;
          launchTime: string;
          deliveryTime: string;
          deliveryFeeRate: string;
          priceScale: string;
          leverageFilter: {
            minLeverage: string;
            maxLeverage: string;
            leverageStep: string;
          };
          priceFilter: {
            minPrice: string;
            maxPrice: string;
            tickSize: string;
          };
          lotSizeFilter: {
            maxOrderQty: string;
            minOrderQty: string;
            qtyStep: string;
            postOnlyMaxOrderQty: string;
          };
        }>;
      };
    }>(
      `${(API_ENDPOINTS.bybit.instruments as (category: string) => string)(category)}&symbol=${symbol}`
    );

    if (response.data.retCode === 0 && response.data.result?.list?.length > 0) {
      const instrument = response.data.result.list[0];
      return {
        data: {
          symbol: instrument.symbol,
          contractType: instrument.contractType,
          status: instrument.status,
          baseCoin: instrument.baseCoin,
          quoteCoin: instrument.quoteCoin,
          launchTime: instrument.launchTime,
          deliveryTime: instrument.deliveryTime,
          deliveryFeeRate: instrument.deliveryFeeRate,
          priceScale: instrument.priceScale,
          leverage: instrument.leverageFilter,
          priceFilter: instrument.priceFilter,
          lotSizeFilter: instrument.lotSizeFilter,
        },
        symbol,
        category,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category,
        error: '종목 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Bybit 종목 정보 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category,
      error: error instanceof ApiError ? error.message : '종목 정보를 가져올 수 없습니다',
    };
  }
}; 