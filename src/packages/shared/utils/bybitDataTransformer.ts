import { BybitTicker } from '../types/exchange';
import { TickerData } from '../types/exchange';
import { BybitRawCategory } from '../constants/exchange';
import { BYBIT_API_BASE_URL } from '../constants/exchange/configs/bybit';

/**
 * 심볼 파싱 결과 타입
 */
export interface BybitSymbolParseResult {
  baseCode: string;
  quoteCode: string;
  integratedSymbol: string;
  quantity: number;
  restOfSymbol?: string;
}

/**
 * 심볼 파싱용 정규식 패턴들
 */
const SYMBOL_PATTERNS = [
  // 숫자 + 코인 + USDT + 날짜 패턴 (예: 100BTCUSDT25DEC24)
  /^(\d+)([A-Z]+)(USDT)(\d{2}[A-Z]{3}\d{2})$/,
  // 숫자 + 코인 + USDT 패턴 (예: 1000SHIBUSDT)
  /^(\d+)([A-Z]+)(USDT)$/,
  // 일반 코인 + USDT + 날짜 패턴 (예: BTCUSDT25DEC24)
  /^([A-Z]+)(USDT)(\d{2}[A-Z]{3}\d{2})$/,
  // 일반 코인 + USDT 패턴 (예: BTCUSDT)
  /^([A-Z]+)(USDT)$/,
  // 일반 코인 + BTC 패턴 (예: ETHBTC)
  /^([A-Z]+)(BTC)$/,
  // 일반 코인 + ETH 패턴 (예: ADAETH)
  /^([A-Z]+)(ETH)$/,
  // 일반 코인 + USDC 패턴 (예: BTCUSDC)
  /^([A-Z]+)(USDC)$/,
] as const;

/**
 * 지원하는 Quote 코인들
 */
const SUPPORTED_QUOTE_CODES = ['USDT', 'USDC', 'BTC', 'ETH'] as const;

/**
 * Bybit 심볼을 파싱하여 구성 요소를 추출합니다
 */
export const parseBybitSymbol = (rawSymbol: string): BybitSymbolParseResult => {
  let baseCode = '';
  let quoteCode = '';
  let quantity = 1;
  let restOfSymbol = '';

  try {
    // 정규식 패턴 매칭 시도
    for (const pattern of SYMBOL_PATTERNS) {
      const match = rawSymbol.match(pattern);
      if (match) {
        const [, group1, group2, group3, group4] = match;
        
        if (group1 && /^\d+$/.test(group1)) {
          // 첫 번째 그룹이 숫자인 경우 (quantity)
          quantity = parseInt(group1, 10);
          baseCode = group2;
          quoteCode = group3;
          restOfSymbol = group4 || '';
        } else {
          // 첫 번째 그룹이 코인 코드인 경우
          baseCode = group1;
          quoteCode = group2;
          restOfSymbol = group3 || '';
        }
        break;
      }
    }

    // 패턴 매칭 실패 시 fallback 로직
    if (!baseCode || !quoteCode) {
      const parseResult = parseSymbolFallback(rawSymbol);
      baseCode = parseResult.baseCode;
      quoteCode = parseResult.quoteCode;
      quantity = parseResult.quantity;
      restOfSymbol = parseResult.restOfSymbol;
    }
  } catch (error) {
    console.warn(`심볼 파싱 실패: ${rawSymbol}, fallback 사용`);
    baseCode = rawSymbol;
    quoteCode = '';
    quantity = 1;
    restOfSymbol = '';
  }

  const integratedSymbol = buildIntegratedSymbol(baseCode, quoteCode, quantity, restOfSymbol);

  return { 
    baseCode, 
    quoteCode, 
    integratedSymbol, 
    quantity, 
    restOfSymbol: restOfSymbol || undefined 
  };
};

/**
 * 패턴 매칭 실패 시 사용하는 fallback 파싱
 */
const parseSymbolFallback = (rawSymbol: string): { baseCode: string; quoteCode: string; quantity: number; restOfSymbol: string } => {
  let baseCode = rawSymbol;
  let quoteCode = '';
  let quantity = 1;
  let restOfSymbol = '';

  // 지원하는 Quote 코인으로 끝나는지 확인
  for (const quote of SUPPORTED_QUOTE_CODES) {
    if (rawSymbol.endsWith(quote)) {
      quoteCode = quote;
      const remaining = rawSymbol.slice(0, -quote.length);
      
      // 날짜 패턴 확인 (예: 25DEC24)
      const dateMatch = remaining.match(/^(.+?)(\d{2}[A-Z]{3}\d{2})$/);
      if (dateMatch) {
        restOfSymbol = dateMatch[2];
        const symbolPart = dateMatch[1];
        
        // 숫자로 시작하는지 확인
        const numMatch = symbolPart.match(/^(\d+)([A-Z]+)$/);
        if (numMatch) {
          quantity = parseInt(numMatch[1], 10);
          baseCode = numMatch[2];
        } else {
          baseCode = symbolPart;
        }
      } else {
        // 숫자로 시작하는지 확인
        const numMatch = remaining.match(/^(\d+)([A-Z]+)$/);
        if (numMatch) {
          quantity = parseInt(numMatch[1], 10);
          baseCode = numMatch[2];
        } else {
          baseCode = remaining;
        }
      }
      break;
    }
  }

  return { baseCode, quoteCode, quantity, restOfSymbol };
};

/**
 * 통합 심볼을 구성합니다
 */
const buildIntegratedSymbol = (
  baseCode: string, 
  quoteCode: string, 
  quantity: number, 
  restOfSymbol: string
): string => {
  const quantityPrefix = quantity > 1 ? `${quantity}` : '';
  const symbolSuffix = restOfSymbol ? `-${restOfSymbol}` : '';
  
  if (quoteCode) {
    return `${quantityPrefix}${baseCode}/${quoteCode}${symbolSuffix}`;
  } else {
    return `${quantityPrefix}${baseCode}${symbolSuffix}`;
  }
};

/**
 * rawCategory를 integratedCategory로 매핑합니다
 */
const mapBybitCategoryToIntegrated = (rawCategory: BybitRawCategory): string => {
  const categoryMap: Record<BybitRawCategory, string> = {
    spot: 'spot',
    linear: 'um',
    inverse: 'cm',
    option: 'option',
  };
  
  return categoryMap[rawCategory] ?? rawCategory;
};

/**
 * Bybit 티커 데이터를 표준 TickerData 형식으로 변환합니다
 */
export const transformBybitTicker = (
  ticker: BybitTicker, 
  rawCategory: BybitRawCategory,
  beforePrice?: number
): TickerData => {
  const lastPrice = parseFloat(ticker.lastPrice) || 0;
  const prevPrice = parseFloat(ticker.prevPrice24h) || 0;
  const priceChange = lastPrice - prevPrice;
  const priceChangePercent = parseFloat(ticker.price24hPcnt) || 0;

  // 심볼 파싱
  const { baseCode, quoteCode, integratedSymbol, quantity } = parseBybitSymbol(ticker.symbol);

  return {
    // === 기본 식별 정보 ===
    rawSymbol: ticker.symbol,
    integratedSymbol,
    baseCode,
    quoteCode,
    exchange: 'bybit' as const,
    quantity,
    
    // === 카테고리 정보 ===
    integratedCategory: mapBybitCategoryToIntegrated(rawCategory),
    rawCategory,
    
    // === 현재 가격 정보 ===
    price: lastPrice,
    beforePrice: beforePrice ?? lastPrice,
    prevPrice24h: prevPrice,
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePercent,
    
    // === 거래 정보 ===
    volume24h: parseFloat(ticker.volume24h) || 0,
    turnover24h: parseFloat(ticker.turnover24h) || 0,
    highPrice24h: parseFloat(ticker.highPrice24h) || lastPrice,
    lowPrice24h: parseFloat(ticker.lowPrice24h) || lastPrice,
    bidPrice: parseFloat(ticker.bid1Price) || 0,
    askPrice: parseFloat(ticker.ask1Price) || 0,
    
    // === Instrument 세부 정보 ===
    instrumentInfo: {
      status: 'Trading',
      displayName: integratedSymbol,
    },
    
    // === 메타데이터 ===
    metadata: {
      lastUpdated: new Date(),
      dataSource: BYBIT_API_BASE_URL,
      rawApiResponse: ticker,
      reliability: 'HIGH',
    },
    
    // === 거래소별 확장 정보 ===
    exchangeSpecific: {
      bybit: {
        bid1Size: ticker.bid1Size,
        ask1Size: ticker.ask1Size,
        usdIndexPrice: ticker.usdIndexPrice,
      } as any
    }
  };
}; 