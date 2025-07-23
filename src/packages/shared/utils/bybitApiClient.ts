import { BybitTickerResponse, BybitTicker } from '../types/exchange';
import { TickerData } from '../types/exchange';
import { BybitRawCategory } from '../constants/exchangeCategories';
import { PriceDecimalTracker } from './priceFormatter';
import { defaultApiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/exchangeConfig';

export class BybitApiClient {
  private priceTracker: PriceDecimalTracker;
  private beforePriceMap: Map<string, number> = new Map();

  constructor(priceTracker: PriceDecimalTracker) {
    this.priceTracker = priceTracker;
  }

  /**
   * Bybit 티커 데이터를 가져옵니다
   */
  async fetchTickerData(category: BybitRawCategory): Promise<TickerData[]> {
    try {
      const response = await defaultApiClient.get<BybitTickerResponse>(
        API_ENDPOINTS.bybit.tickers(category),
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

      if (!tickerResponse.result || !tickerResponse.result.list) {
        throw new Error('Bybit 티커 데이터가 없습니다');
      }

      const tickerDataList = this.transformTickerData(tickerResponse.result.list, category);
      
      // 현재 가격을 이전 가격 Map에 저장 (다음 업데이트 시 beforePrice로 사용)
      tickerDataList.forEach(ticker => {
        const key = `${category}-${ticker.rawSymbol}`;
        this.beforePriceMap.set(key, ticker.price);
      });

      return tickerDataList;
    } catch (error) {
      console.error(`Bybit ${category} 티커 데이터 가져오기 실패:`, error);
      throw error;
    }
  }

  /**
   * Bybit API 데이터를 TickerData 형식으로 변환합니다
   */
  private transformTickerData(tickers: BybitTicker[], rawCategory: BybitRawCategory): TickerData[] {
    return tickers.map((ticker) => {
      const lastPrice = parseFloat(ticker.lastPrice) || 0;
      const prevPrice = parseFloat(ticker.prevPrice24h) || 0;
      const priceChange = lastPrice - prevPrice;
      const priceChangePercent = parseFloat(ticker.price24hPcnt) || 0;

      // 이전 가격 정보를 Map에서 가져오기
      const key = `${rawCategory}-${ticker.symbol}`;
      const beforePrice = this.beforePriceMap.get(key) ?? lastPrice;

      // 심볼 파싱하여 baseCode, quoteCode 추출
      const { baseCode, quoteCode, integratedSymbol, quantity } = this.parseSymbol(ticker.symbol);

      // PriceDecimalTracker로 가격 추적
      this.priceTracker.trackPrice(integratedSymbol, lastPrice);
      if (prevPrice && prevPrice !== lastPrice) {
        this.priceTracker.trackPrice(integratedSymbol, prevPrice);
      }
      if (priceChange && Math.abs(priceChange) > 0) {
        this.priceTracker.trackPrice(integratedSymbol, Math.abs(priceChange));
      }

      // 추적 상태 로깅 (BTC/USDT만 예시로)
      if (integratedSymbol === "BTC/USDT") {
        console.log(`[PriceTracker] ${integratedSymbol}: maxDecimals=${this.priceTracker.getMaxDecimals(integratedSymbol)}, currentPrice=${lastPrice}, beforePrice=${beforePrice}`);
      }

      const transformedData: TickerData = {
        // === 기본 식별 정보 ===
        rawSymbol: ticker.symbol,
        integratedSymbol,
        baseCode,
        quoteCode,
        exchange: 'bybit' as const,
        quantity,
        
        // === 카테고리 정보 ===
        integratedCategory: this.getIntegratedCategory(rawCategory),
        rawCategory,
        
        // === 현재 가격 정보 ===
        price: lastPrice,
        beforePrice: beforePrice, // 테두리 애니메이션용 직전 가격
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

      return transformedData;
    });
  }

  /**
   * Bybit 심볼을 파싱하여 baseCode, quoteCode, integratedSymbol을 추출합니다
   */
  private parseSymbol(rawSymbol: string): { baseCode: string; quoteCode: string; integratedSymbol: string; quantity: number } {
    // 기본값 설정
    let baseCode = '';
    let quoteCode = '';
    let quantity = 1;
    
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
          } else {
            // 첫 번째 그룹이 코인 코드인 경우
            baseCode = match[1];
            quoteCode = match[2];
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
          // 숫자로 시작하는지 확인
          const numMatch = remaining.match(/^(\d+)([A-Z]+)$/);
          if (numMatch) {
            quantity = parseInt(numMatch[1]);
            baseCode = numMatch[2];
          } else {
            baseCode = remaining;
          }
        } else {
          // 기타 경우: 마지막 3-4글자를 quoteCode로 가정
          const possibleQuotes = ['USDC', 'BTC', 'ETH'];
          let found = false;
          for (const quote of possibleQuotes) {
            if (rawSymbol.endsWith(quote)) {
              quoteCode = quote;
              baseCode = rawSymbol.slice(0, -quote.length);
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
      integratedSymbol = quoteCode ? `${quantity}${baseCode}/${quoteCode}` : `${quantity}${baseCode}`;
    } else {
      integratedSymbol = quoteCode ? `${baseCode}/${quoteCode}` : baseCode;
    }

    return { baseCode, quoteCode, integratedSymbol, quantity };
  }

  /**
   * rawCategory를 integratedCategory로 매핑합니다
   */
  private getIntegratedCategory(rawCategory: BybitRawCategory): string {
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
  }

  /**
   * 테스트 데이터를 생성합니다
   */
  generateTestData(category: BybitRawCategory): TickerData[] {
    console.log(`Bybit ${category} 테스트 티커 데이터로 대체합니다...`);
    const testCoins = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'EOSUSDT'];
    
    return testCoins.map((symbol) => {
      const { baseCode, quoteCode, integratedSymbol, quantity } = this.parseSymbol(symbol);
      
      // 테스트용 랜덤 데이터 생성
      const price = Math.random() * 100 + 1;
      const changePercent = (Math.random() - 0.5) * 10;
      const priceChange = price * (changePercent / 100);
      
      return {
        rawSymbol: symbol,
        integratedSymbol,
        baseCode,
        quoteCode,
        exchange: 'bybit' as const,
        integratedCategory: this.getIntegratedCategory(category),
        rawCategory: category,
        quantity,
        price,
        beforePrice: price - priceChange, // 테두리 애니메이션용 이전 가격
        prevPrice24h: price - priceChange,
        priceChange24h: priceChange,
        priceChangePercent24h: changePercent,
        volume24h: Math.random() * 1000000,
        turnover24h: Math.random() * 10000000000,
        highPrice24h: price + Math.random() * price * 0.1,
        lowPrice24h: price - Math.random() * price * 0.1,
        bidPrice: price - 0.01,
        askPrice: price + 0.01,
        instrumentInfo: {
          status: 'Trading',
          displayName: integratedSymbol,
        },
        metadata: {
          lastUpdated: new Date(),
          dataSource: 'test-data',
          rawApiResponse: null,
          reliability: 'LOW' as const,
        },
      };
    });
  }
} 