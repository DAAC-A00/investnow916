import { TickerData } from '../types/exchange';
import { API_ENDPOINTS } from '../constants/exchange';

// Binance Spot 티커 타입
export interface BinanceSpotTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

// Binance USD-M Futures 티커 타입
export interface BinanceUmTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  lastQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

// Binance COIN-M Futures 티커 타입
export interface BinanceCmTicker {
  symbol: string;
  pair: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  lastQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  baseVolume: string; // COIN-M에서는 baseVolume 사용
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

/**
 * Binance 심볼을 파싱하여 baseCode, quoteCode, integratedSymbol을 추출합니다
 */
export const parseBinanceSymbol = (
  rawSymbol: string, 
  category: 'spot' | 'um' | 'cm'
): {
  baseCode: string;
  quoteCode: string;
  integratedSymbol: string;
  quantity: number;
} => {
  let baseCode = '';
  let quoteCode = '';
  let quantity = 1;
  
  try {
    if (category === 'spot') {
      // Spot: BTCUSDT, ETHBTC 등의 형태
      const patterns = [
        /^(.+)(USDT)$/, /^(.+)(USDC)$/, /^(.+)(BUSD)$/, /^(.+)(BTC)$/, /^(.+)(ETH)$/, /^(.+)(BNB)$/
      ];
      
      for (const pattern of patterns) {
        const match = rawSymbol.match(pattern);
        if (match) {
          baseCode = match[1];
          quoteCode = match[2];
          break;
        }
      }
      
      // 숫자가 포함된 경우 quantity 추출 (1000SHIBUSDT -> 1000, SHIB)
      if (baseCode) {
        const quantityMatch = baseCode.match(/^(\d+)([A-Z]+)$/);
        if (quantityMatch) {
          const extractedQuantity = parseInt(quantityMatch[1]);
          if (extractedQuantity >= 1000 && extractedQuantity % 10 === 0) {
            quantity = extractedQuantity;
            baseCode = quantityMatch[2];
          }
        }
      }
    } else if (category === 'um') {
      // USD-M Futures: BTCUSDT, 1000SHIBUSDT 등
      const match = rawSymbol.match(/^(.+)(USDT|BUSD)$/);
      if (match) {
        baseCode = match[1];
        quoteCode = match[2];
        
        // quantity 추출
        const quantityMatch = baseCode.match(/^(\d+)([A-Z]+)$/);
        if (quantityMatch) {
          const extractedQuantity = parseInt(quantityMatch[1]);
          if (extractedQuantity >= 1000 && extractedQuantity % 10 === 0) {
            quantity = extractedQuantity;
            baseCode = quantityMatch[2];
          }
        }
      }
    } else if (category === 'cm') {
      // COIN-M Futures: BTCUSD_PERP, ETHUSD_250925 등
      if (rawSymbol.includes('_')) {
        const [pairPart] = rawSymbol.split('_');
        // USD로 끝나는 경우가 대부분
        const match = pairPart.match(/^(.+)(USD)$/);
        if (match) {
          baseCode = match[1];
          quoteCode = match[2];
        }
      }
    }

    // 파싱 실패 시 fallback
    if (!baseCode || !quoteCode) {
      baseCode = rawSymbol;
      quoteCode = '';
    }
  } catch (error) {
    console.warn(`Binance 심볼 파싱 실패: ${rawSymbol}, fallback 사용`);
    baseCode = rawSymbol;
    quoteCode = '';
  }

  // integratedSymbol 생성
  let integratedSymbol = '';
  if (quantity > 1) {
    integratedSymbol = quoteCode ? `${quantity}${baseCode}/${quoteCode}` : `${quantity}${baseCode}`;
  } else {
    integratedSymbol = quoteCode ? `${baseCode}/${quoteCode}` : baseCode;
  }

  return { baseCode, quoteCode, integratedSymbol, quantity };
};

/**
 * category를 integratedCategory로 매핑합니다
 */
export const mapBinanceCategoryToIntegrated = (category: 'spot' | 'um' | 'cm'): string => {
  switch (category) {
    case 'spot':
      return 'spot';
    case 'um':
      return 'um';
    case 'cm':
      return 'cm';
    default:
      return category;
  }
};

/**
 * 카테고리별 데이터 소스 URL을 반환합니다
 */
export const getBinanceDataSource = (category: 'spot' | 'um' | 'cm'): string => {
  const binanceEndpoints = API_ENDPOINTS.binance as any;
  switch (category) {
    case 'spot':
      return binanceEndpoints.spot.baseUrl;
    case 'um':
      return binanceEndpoints.um.baseUrl;
    case 'cm':
      return binanceEndpoints.cm.baseUrl;
    default:
      return binanceEndpoints.spot.baseUrl;
  }
};

/**
 * Binance Spot 티커 데이터를 표준 TickerData 형식으로 변환합니다
 */
export const transformBinanceSpotTicker = (
  ticker: BinanceSpotTicker,
  beforePrice?: number
): TickerData => {
  const { baseCode, quoteCode, integratedSymbol, quantity } = parseBinanceSymbol(ticker.symbol, 'spot');
  
  const currentPrice = parseFloat(ticker.lastPrice) || 0;
  const priceChange = parseFloat(ticker.priceChange) || 0;
  const priceChangePercent = parseFloat(ticker.priceChangePercent) || 0;
  const prevPrice = parseFloat(ticker.prevClosePrice) || (currentPrice - priceChange);

  return {
    // === 기본 식별 정보 ===
    rawSymbol: ticker.symbol,
    integratedSymbol,
    baseCode,
    quoteCode,
    exchange: 'binance' as const,
    quantity,
    
    // === 카테고리 정보 ===
    integratedCategory: 'spot',
    rawCategory: 'spot',
    
    // === 현재 가격 정보 ===
    price: currentPrice,
    beforePrice: beforePrice ?? currentPrice,
    prevPrice24h: prevPrice,
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePercent,
    
    // === 거래 정보 ===
    volume24h: parseFloat(ticker.volume) || 0,
    turnover24h: parseFloat(ticker.quoteVolume) || 0,
    highPrice24h: parseFloat(ticker.highPrice) || currentPrice,
    lowPrice24h: parseFloat(ticker.lowPrice) || currentPrice,
    bidPrice: parseFloat(ticker.bidPrice) || 0,
    askPrice: parseFloat(ticker.askPrice) || 0,
    
    // === Instrument 세부 정보 ===
    instrumentInfo: {
      status: 'TRADING',
      displayName: integratedSymbol,
    },
    
    // === 메타데이터 ===
    metadata: {
      lastUpdated: new Date(ticker.closeTime),
      dataSource: getBinanceDataSource('spot'),
      rawApiResponse: ticker,
      reliability: 'HIGH',
    },
    
    // === 거래소별 확장 정보 ===
    exchangeSpecific: {
      binance: {
        bidPrice: parseFloat(ticker.bidPrice),
        bidQty: parseFloat(ticker.bidQty),
        askPrice: parseFloat(ticker.askPrice),
        askQty: parseFloat(ticker.askQty),
        weightedAvgPrice: parseFloat(ticker.weightedAvgPrice),
        openTime: ticker.openTime,
        closeTime: ticker.closeTime,
        count: ticker.count,
      } as any
    }
  };
};

/**
 * Binance USD-M Futures 티커 데이터를 표준 TickerData 형식으로 변환합니다
 */
export const transformBinanceUmTicker = (
  ticker: BinanceUmTicker,
  beforePrice?: number
): TickerData => {
  const { baseCode, quoteCode, integratedSymbol, quantity } = parseBinanceSymbol(ticker.symbol, 'um');
  
  const currentPrice = parseFloat(ticker.lastPrice) || 0;
  const priceChange = parseFloat(ticker.priceChange) || 0;
  const priceChangePercent = parseFloat(ticker.priceChangePercent) || 0;
  const prevPrice = currentPrice - priceChange;

  return {
    // === 기본 식별 정보 ===
    rawSymbol: ticker.symbol,
    integratedSymbol,
    baseCode,
    quoteCode,
    exchange: 'binance' as const,
    quantity,
    
    // === 카테고리 정보 ===
    integratedCategory: 'um',
    rawCategory: 'um',
    
    // === 현재 가격 정보 ===
    price: currentPrice,
    beforePrice: beforePrice ?? currentPrice,
    prevPrice24h: prevPrice,
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePercent,
    
    // === 거래 정보 ===
    volume24h: parseFloat(ticker.volume) || 0,
    turnover24h: parseFloat(ticker.quoteVolume) || 0,
    highPrice24h: parseFloat(ticker.highPrice) || currentPrice,
    lowPrice24h: parseFloat(ticker.lowPrice) || currentPrice,
    
    // === Instrument 세부 정보 ===
    instrumentInfo: {
      status: 'TRADING',
      displayName: integratedSymbol,
    },
    
    // === 메타데이터 ===
    metadata: {
      lastUpdated: new Date(ticker.closeTime),
      dataSource: getBinanceDataSource('um'),
      rawApiResponse: ticker,
      reliability: 'HIGH',
    },
    
    // === 거래소별 확장 정보 ===
    exchangeSpecific: {
      binance: {
        weightedAvgPrice: parseFloat(ticker.weightedAvgPrice),
        openTime: ticker.openTime,
        closeTime: ticker.closeTime,
        count: ticker.count,
      } as any
    }
  };
};

/**
 * Binance COIN-M Futures 티커 데이터를 표준 TickerData 형식으로 변환합니다
 */
export const transformBinanceCmTicker = (
  ticker: BinanceCmTicker,
  beforePrice?: number
): TickerData => {
  const { baseCode, quoteCode, integratedSymbol, quantity } = parseBinanceSymbol(ticker.symbol, 'cm');
  
  const currentPrice = parseFloat(ticker.lastPrice) || 0;
  const priceChange = parseFloat(ticker.priceChange) || 0;
  const priceChangePercent = parseFloat(ticker.priceChangePercent) || 0;
  const prevPrice = currentPrice - priceChange;

  return {
    // === 기본 식별 정보 ===
    rawSymbol: ticker.symbol,
    integratedSymbol,
    baseCode,
    quoteCode,
    exchange: 'binance' as const,
    quantity,
    
    // === 카테고리 정보 ===
    integratedCategory: 'cm',
    rawCategory: 'cm',
    
    // === 현재 가격 정보 ===
    price: currentPrice,
    beforePrice: beforePrice ?? currentPrice,
    prevPrice24h: prevPrice,
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePercent,
    
    // === 거래 정보 ===
    volume24h: parseFloat(ticker.volume) || 0,
    turnover24h: parseFloat(ticker.baseVolume) || 0, // COIN-M은 baseVolume 사용
    highPrice24h: parseFloat(ticker.highPrice) || currentPrice,
    lowPrice24h: parseFloat(ticker.lowPrice) || currentPrice,
    
    // === Instrument 세부 정보 ===
    instrumentInfo: {
      status: 'TRADING',
      displayName: integratedSymbol,
    },
    
    // === 메타데이터 ===
    metadata: {
      lastUpdated: new Date(ticker.closeTime),
      dataSource: getBinanceDataSource('cm'),
      rawApiResponse: ticker,
      reliability: 'HIGH',
    },
    
    // === 거래소별 확장 정보 ===
    exchangeSpecific: {
      binance: {
        pair: ticker.pair,
        weightedAvgPrice: parseFloat(ticker.weightedAvgPrice),
        openTime: ticker.openTime,
        closeTime: ticker.closeTime,
        count: ticker.count,
      } as any
    }
  };
};

/**
 * 가격 변화 방향을 계산합니다
 */
export const calculatePriceDirection = (currentPrice: number, previousPrice: number): 'up' | 'down' | 'none' => {
  if (currentPrice > previousPrice) return 'up';
  if (currentPrice < previousPrice) return 'down';
  return 'none';
};

/**
 * 가격을 포매팅합니다 (소수점 자동 조정)
 */
export const formatBinancePrice = (price: number): string => {
  if (price >= 1000) {
    return price.toFixed(2);
  } else if (price >= 10) {
    return price.toFixed(4);
  } else if (price >= 1) {
    return price.toFixed(6);
  } else {
    return price.toFixed(8);
  }
};

/**
 * 볼륨을 포매팅합니다 (K, M, B 단위)
 */
export const formatBinanceVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  } else {
    return volume.toFixed(2);
  }
}; 