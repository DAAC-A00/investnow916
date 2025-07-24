import { BybitTickerResponse, BybitTicker } from '../types/exchange';
import { TickerData } from '../types/exchange';
import { BybitRawCategory } from '../constants/exchange';
import { PriceDecimalTracker } from './priceFormatter';
import { defaultApiClient } from './apiClient';
import { BYBIT_ENDPOINTS } from '../constants/exchange/configs/bybit';
import { transformBybitTicker, parseBybitSymbol } from './bybitDataTransformer';

/**
 * 이전 가격 정보를 관리하는 Map
 */
const beforePriceMap = new Map<string, number>();

/**
 * 이전 가격 정보를 가져옵니다
 */
const getBeforePrice = (category: BybitRawCategory, symbol: string): number | undefined => {
  const key = `${category}-${symbol}`;
  return beforePriceMap.get(key);
};

/**
 * 이전 가격 정보를 저장합니다
 */
const setBeforePrice = (category: BybitRawCategory, symbol: string, price: number): void => {
  const key = `${category}-${symbol}`;
  beforePriceMap.set(key, price);
};

/**
 * 가격 추적기 업데이트
 */
const updatePriceTracker = (
  priceTracker: PriceDecimalTracker,
  ticker: BybitTicker,
  integratedSymbol: string
): void => {
  const lastPrice = parseFloat(ticker.lastPrice) || 0;
  const prevPrice = parseFloat(ticker.prevPrice24h) || 0;
  const priceChange = Math.abs(lastPrice - prevPrice);

  // 가격들을 추적
  priceTracker.trackPrice(integratedSymbol, lastPrice);
  if (prevPrice && prevPrice !== lastPrice) {
    priceTracker.trackPrice(integratedSymbol, prevPrice);
  }
  if (priceChange > 0) {
    priceTracker.trackPrice(integratedSymbol, priceChange);
  }

  // 디버깅 로그 (BTC/USDT만)
  if (integratedSymbol === "BTC/USDT") {
    console.log(
      `[PriceTracker] ${integratedSymbol}: ` +
      `maxDecimals=${priceTracker.getMaxDecimals(integratedSymbol)}, ` +
      `currentPrice=${lastPrice}`
    );
  }
};

/**
 * Bybit 티커 데이터를 가져와서 변환합니다
 */
export const fetchBybitTickerData = async (
  category: BybitRawCategory,
  priceTracker: PriceDecimalTracker
): Promise<TickerData[]> => {
  try {
    const response = await defaultApiClient.get<BybitTickerResponse>(
      BYBIT_ENDPOINTS.tickers(category),
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        retryCount: 2,
      }
    );

    const tickerResponse = response.data;

    if (tickerResponse.retCode !== 0) {
      throw new Error(`Bybit API 오류: ${tickerResponse.retCode} - ${tickerResponse.retMsg}`);
    }

    if (!tickerResponse.result?.list) {
      throw new Error('Bybit 티커 데이터가 없습니다');
    }

    // 티커 데이터 변환
    const tickerDataList = tickerResponse.result.list.map(ticker => {
      const beforePrice = getBeforePrice(category, ticker.symbol);
      const { integratedSymbol } = parseBybitSymbol(ticker.symbol);
      
      // 가격 추적기 업데이트
      updatePriceTracker(priceTracker, ticker, integratedSymbol);
      
      // 데이터 변환
      const transformedData = transformBybitTicker(ticker, category, beforePrice);
      
      // 현재 가격을 다음 업데이트를 위해 저장
      setBeforePrice(category, ticker.symbol, transformedData.price);
      
      return transformedData;
    });

    return tickerDataList;
  } catch (error) {
    console.error(`Bybit ${category} 티커 데이터 가져오기 실패:`, error);
    throw error;
  }
}; 