import { get, ApiError } from './apiClient';
import { EXCHANGE_CONFIGS } from '../constants/exchange';
import { BithumbOrderbookResponse, BithumbTickerResponse } from '../types/bithumb';

/**
 * 빗썸 호가 정보 조회
 */
export const fetchBithumbOrderbook = async (symbol: string) => {
  const baseCode = symbol.replace(/KRW$|BTC$/, '');
  const quoteCode = symbol.includes('KRW') ? 'KRW' : 'BTC';
  
  try {
    const response = await get<BithumbOrderbookResponse>(
      (EXCHANGE_CONFIGS.bithumb.endpoints.orderbook as (baseCode: string, quoteCode: string) => string)(baseCode, quoteCode)
    );
    
    if (response.data.status === '0000' && response.data.data) {
      return {
        data: response.data.data,
        marketSymbol: `${baseCode}/${quoteCode}`,
        error: null,
      };
    } else {
      return {
        data: null,
        marketSymbol: `${baseCode}/${quoteCode}`,
        error: '호가 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('호가 정보 가져오기 실패:', error);
    return {
      data: null,
      marketSymbol: `${baseCode}/${quoteCode}`,
      error: error instanceof ApiError ? error.message : '호가 정보를 가져올 수 없습니다',
    };
  }
};

/**
 * 빗썸 티커 정보 조회
 */
export const fetchBithumbTicker = async (symbol: string) => {
  const baseCode = symbol.replace(/KRW$|BTC$/, '');
  const quoteCode = symbol.includes('KRW') ? 'KRW' : 'BTC';
  
  try {
    const response = await get<BithumbTickerResponse>(
      (EXCHANGE_CONFIGS.bithumb.endpoints.ticker as (baseCode: string, quoteCode: string) => string)(baseCode, quoteCode)
    );
    
    if (response.data.status === '0000' && response.data.data) {
      return {
        data: response.data.data,
        symbol,
        error: null,
      };
    } else {
      return {
        data: null,
        symbol,
        error: '티커 정보를 가져올 수 없습니다',
      };
    }
  } catch (error) {
    console.error('티커 정보 가져오기 실패:', error);
    return {
      data: null,
      symbol,
      error: error instanceof ApiError ? error.message : '티커 정보를 가져올 수 없습니다',
    };
  }
}; 