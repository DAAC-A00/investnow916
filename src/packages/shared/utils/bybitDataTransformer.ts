import { BybitTicker } from '../types/exchange';
import { TickerData } from '../types/exchange';
import { BybitRawCategory } from '../constants/exchangeCategories';

/**
 * Bybit 심볼을 파싱하여 baseCode, quoteCode, integratedSymbol을 추출합니다
 */
export const parseBybitSymbol = (rawSymbol: string): {
  baseCode: string;
  quoteCode: string;
  integratedSymbol: string;
  quantity: number;
  restOfSymbol?: string;
} => {
  // 기본값 설정
  let baseCode = '';
  let quoteCode = '';
  let quantity = 1;
  let restOfSymbol = '';
  
  try {
    // 일반적인 패턴 매칭 (예: BTCUSDT, 1000SHIBUSDT, BTCUSDT25DEC24)
    const patterns = [
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
      // 기타 패턴들
      /^(\d+)?([A-Z]+)([A-Z]{3,4})(\d{2}[A-Z]{3}\d{2})?$/
    ];

    for (const pattern of patterns) {
      const match = rawSymbol.match(pattern);
      if (match) {
        if (match[1] && /^\d+$/.test(match[1])) {
          // 첫 번째 그룹이 숫자인 경우
          quantity = parseInt(match[1]);
          baseCode = match[2];
          quoteCode = match[3];
          restOfSymbol = match[4] || '';
        } else {
          // 첫 번째 그룹이 코인 코드인 경우
          baseCode = match[1];
          quoteCode = match[2];
          restOfSymbol = match[3] || '';
        }
        break;
      }
    }

    // 파싱 실패 시 fallback 로직
    if (!baseCode || !quoteCode) {
      // USDT로 끝나는 경우
      if (rawSymbol.endsWith('USDT')) {
        quoteCode = 'USDT';
        const remaining = rawSymbol.slice(0, -4);
        // 날짜 패턴 확인 (예: 25DEC24)
        const dateMatch = remaining.match(/^(.+?)(\d{2}[A-Z]{3}\d{2})$/);
        if (dateMatch) {
          restOfSymbol = dateMatch[2];
          const symbolPart = dateMatch[1];
          // 숫자로 시작하는지 확인
          const numMatch = symbolPart.match(/^(\d+)([A-Z]+)$/);
          if (numMatch) {
            quantity = parseInt(numMatch[1]);
            baseCode = numMatch[2];
          } else {
            baseCode = symbolPart;
          }
        } else {
          // 숫자로 시작하는지 확인
          const numMatch = remaining.match(/^(\d+)([A-Z]+)$/);
          if (numMatch) {
            quantity = parseInt(numMatch[1]);
            baseCode = numMatch[2];
          } else {
            baseCode = remaining;
          }
        }
      } else {
        // 기타 경우: 마지막 3-4글자를 quoteCode로 가정
        const possibleQuotes = ['USDC', 'BTC', 'ETH'];
        let found = false;
        for (const quote of possibleQuotes) {
          if (rawSymbol.endsWith(quote)) {
            quoteCode = quote;
            const remaining = rawSymbol.slice(0, -quote.length);
            // 날짜 패턴 확인
            const dateMatch = remaining.match(/^(.+?)(\d{2}[A-Z]{3}\d{2})$/);
            if (dateMatch) {
              restOfSymbol = dateMatch[2];
              baseCode = dateMatch[1];
            } else {
              baseCode = remaining;
            }
            found = true;
            break;
          }
        }
        if (!found) {
          // 완전히 실패한 경우 원본 심볼 사용
          baseCode = rawSymbol;
          quoteCode = '';
        }
      }
    }
  } catch (error) {
    console.warn(`심볼 파싱 실패: ${rawSymbol}, fallback 사용`);
    baseCode = rawSymbol;
    quoteCode = '';
  }

  // integratedSymbol 생성
  let integratedSymbol = '';
  if (quantity > 1) {
    integratedSymbol = quoteCode 
      ? `${quantity}${baseCode}/${quoteCode}${restOfSymbol ? `-${restOfSymbol}` : ''}` 
      : `${quantity}${baseCode}${restOfSymbol ? `-${restOfSymbol}` : ''}`;
  } else {
    integratedSymbol = quoteCode 
      ? `${baseCode}/${quoteCode}${restOfSymbol ? `-${restOfSymbol}` : ''}` 
      : `${baseCode}${restOfSymbol ? `-${restOfSymbol}` : ''}`;
  }

  return { baseCode, quoteCode, integratedSymbol, quantity, restOfSymbol: restOfSymbol || undefined };
};

/**
 * rawCategory를 integratedCategory로 매핑합니다
 */
export const mapBybitCategoryToIntegrated = (rawCategory: BybitRawCategory): string => {
  switch (rawCategory) {
    case 'spot':
      return 'spot';
    case 'linear':
      return 'um';
    case 'inverse':
      return 'cm';
    case 'option':
      return 'option';
    default:
      return rawCategory;
  }
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
  const { baseCode, quoteCode, integratedSymbol, quantity, restOfSymbol } = parseBybitSymbol(ticker.symbol);

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
    beforePrice: beforePrice ?? lastPrice, // 테두리 애니메이션용 직전 가격
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
      dataSource: 'https://api.bybit.com',
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
export const formatBybitPrice = (price: number): string => {
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
export const formatBybitVolume = (volume: number): string => {
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