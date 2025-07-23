import { get, ApiError } from './apiClient';
import { 
  BinanceSpotTicker, 
  BinanceUmTicker, 
  BinanceCmTicker 
} from './binanceDataTransformer';
import { API_ENDPOINTS } from '../constants/exchangeConfig';

/**
 * Binance Spot 특정 심볼의 24hr 티커 정보 조회
 */
export const fetchBinanceSpotTicker = async (symbol: string) => {
  try {
    const response = await get<BinanceSpotTicker[]>(
      API_ENDPOINTS.binance.api.spot.tickerBySymbol(symbol)
    );

    if (response.data && response.data.length > 0) {
      return {
        data: response.data[0],
        symbol,
        category: 'spot' as const,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category: 'spot' as const,
        error: '티커 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance Spot 티커 정보 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category: 'spot' as const,
      error: error instanceof ApiError ? error.message : '티커 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Binance USD-M Futures 특정 심볼의 24hr 티커 정보 조회
 */
export const fetchBinanceUmTicker = async (symbol: string) => {
  try {
    const response = await get<BinanceUmTicker[]>(
      API_ENDPOINTS.binance.api.um.tickerBySymbol(symbol)
    );

    if (response.data && response.data.length > 0) {
      return {
        data: response.data[0],
        symbol,
        category: 'um' as const,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category: 'um' as const,
        error: '티커 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance USD-M Futures 티커 정보 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category: 'um' as const,
      error: error instanceof ApiError ? error.message : '티커 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Binance COIN-M Futures 특정 심볼의 24hr 티커 정보 조회
 */
export const fetchBinanceCmTicker = async (symbol: string) => {
  try {
    const response = await get<BinanceCmTicker[]>(
      API_ENDPOINTS.binance.api.cm.tickerBySymbol(symbol)
    );

    if (response.data && response.data.length > 0) {
      return {
        data: response.data[0],
        symbol,
        category: 'cm' as const,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category: 'cm' as const,
        error: '티커 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance COIN-M Futures 티커 정보 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category: 'cm' as const,
      error: error instanceof ApiError ? error.message : '티커 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Binance Spot 호가 정보 조회
 */
export const fetchBinanceSpotOrderbook = async (symbol: string, limit: number = 100) => {
  try {
    const response = await get<{
      lastUpdateId: number;
      bids: [string, string][]; // [price, quantity]
      asks: [string, string][]; // [price, quantity]
    }>(
      API_ENDPOINTS.binance.api.spot.depth(symbol, limit)
    );

    if (response.data) {
      const orderbook = response.data;
      return {
        data: {
          symbol,
          lastUpdateId: orderbook.lastUpdateId,
          bids: orderbook.bids.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
          asks: orderbook.asks.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
        },
        marketSymbol: symbol,
        category: 'spot' as const,
        error: null,
      };
    } else {
      return {
        data: null,
        marketSymbol: symbol,
        category: 'spot' as const,
        error: '호가 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance Spot 호가 정보 가져오기 실패:', error);
    return {
      data: null,
      marketSymbol: symbol,
      category: 'spot' as const,
      error: error instanceof ApiError ? error.message : '호가 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Binance USD-M Futures 호가 정보 조회
 */
export const fetchBinanceUmOrderbook = async (symbol: string, limit: number = 100) => {
  try {
    const response = await get<{
      lastUpdateId: number;
      E: number; // Message output time
      T: number; // Transaction time
      bids: [string, string][]; // [price, quantity]
      asks: [string, string][]; // [price, quantity]
    }>(
      API_ENDPOINTS.binance.api.um.depth(symbol, limit)
    );

    if (response.data) {
      const orderbook = response.data;
      return {
        data: {
          symbol,
          lastUpdateId: orderbook.lastUpdateId,
          messageTime: orderbook.E,
          transactionTime: orderbook.T,
          bids: orderbook.bids.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
          asks: orderbook.asks.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
        },
        marketSymbol: symbol,
        category: 'um' as const,
        error: null,
      };
    } else {
      return {
        data: null,
        marketSymbol: symbol,
        category: 'um' as const,
        error: '호가 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance USD-M Futures 호가 정보 가져오기 실패:', error);
    return {
      data: null,
      marketSymbol: symbol,
      category: 'um' as const,
      error: error instanceof ApiError ? error.message : '호가 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Binance COIN-M Futures 호가 정보 조회
 */
export const fetchBinanceCmOrderbook = async (symbol: string, limit: number = 100) => {
  try {
    const response = await get<{
      lastUpdateId: number;
      E: number; // Message output time
      T: number; // Transaction time
      bids: [string, string][]; // [price, quantity]
      asks: [string, string][]; // [price, quantity]
    }>(
      API_ENDPOINTS.binance.api.cm.depth(symbol, limit)
    );

    if (response.data) {
      const orderbook = response.data;
      return {
        data: {
          symbol,
          lastUpdateId: orderbook.lastUpdateId,
          messageTime: orderbook.E,
          transactionTime: orderbook.T,
          bids: orderbook.bids.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
          asks: orderbook.asks.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
        },
        marketSymbol: symbol,
        category: 'cm' as const,
        error: null,
      };
    } else {
      return {
        data: null,
        marketSymbol: symbol,
        category: 'cm' as const,
        error: '호가 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance COIN-M Futures 호가 정보 가져오기 실패:', error);
    return {
      data: null,
      marketSymbol: symbol,
      category: 'cm' as const,
      error: error instanceof ApiError ? error.message : '호가 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * Binance Spot 최근 거래 내역 조회
 */
export const fetchBinanceSpotRecentTrades = async (symbol: string, limit: number = 500) => {
  try {
    const response = await get<Array<{
      id: number;
      price: string;
      qty: string;
      quoteQty: string;
      time: number;
      isBuyerMaker: boolean;
      isBestMatch: boolean;
    }>>(
      API_ENDPOINTS.binance.api.spot.trades(symbol, limit)
    );

    if (response.data) {
      const trades = response.data;
      return {
        data: trades.map(trade => ({
          id: trade.id.toString(),
          symbol,
          price: parseFloat(trade.price),
          quantity: parseFloat(trade.qty),
          quoteQuantity: parseFloat(trade.quoteQty),
          side: trade.isBuyerMaker ? 'sell' : 'buy',
          timestamp: trade.time,
          isBestMatch: trade.isBestMatch,
        })),
        symbol,
        category: 'spot' as const,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category: 'spot' as const,
        error: '최근 거래 내역을 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance Spot 최근 거래 내역 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category: 'spot' as const,
      error: error instanceof ApiError ? error.message : '최근 거래 내역을 가져올 수 없습니다',
    };
  }
};

/**
 * Binance K선(캔들스틱) 데이터 조회 (Spot)
 */
export const fetchBinanceSpotKline = async (
  symbol: string,
  interval: '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M' = '1h',
  startTime?: number,
  endTime?: number,
  limit: number = 500
) => {
  try {
    const url = API_ENDPOINTS.binance.api.spot.klines(symbol, interval, limit, startTime, endTime);

    const response = await get<Array<[
      number, // Open time
      string, // Open
      string, // High
      string, // Low
      string, // Close
      string, // Volume
      number, // Close time
      string, // Quote asset volume
      number, // Number of trades
      string, // Taker buy base asset volume
      string, // Taker buy quote asset volume
      string  // Ignore
    ]>>(url);

    if (response.data) {
      const klines = response.data;
      return {
        data: klines.map(([
          openTime, open, high, low, close, volume,
          closeTime, quoteVolume, trades, takerBuyBaseVolume, takerBuyQuoteVolume
        ]) => ({
          openTime,
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
          volume: parseFloat(volume),
          closeTime,
          quoteVolume: parseFloat(quoteVolume),
          trades,
          takerBuyBaseVolume: parseFloat(takerBuyBaseVolume),
          takerBuyQuoteVolume: parseFloat(takerBuyQuoteVolume),
        })),
        symbol,
        category: 'spot' as const,
        interval,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        category: 'spot' as const,
        interval,
        error: 'K선 데이터를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('Binance Spot K선 데이터 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      category: 'spot' as const,
      interval,
      error: error instanceof ApiError ? error.message : 'K선 데이터를 가져올 수 없습니다',
    };
  }
}; 