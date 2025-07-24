import { TickerData } from '../types/exchange';
import { BinanceRawCategory } from '../constants/exchange';
import { PriceDecimalTracker } from './priceFormatter';
import { defaultApiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/exchange';

// Binance exchangeInfo API 응답 타입
interface BinanceExchangeInfoResponse {
  timezone: string;
  serverTime: number;
  rateLimits: Array<{
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
  }>;
  exchangeFilters: any[];
  symbols: BinanceSymbolInfo[];
}

// Binance 심볼 정보 타입
interface BinanceSymbolInfo {
  symbol: string;
  status: 'TRADING' | 'HALT' | 'BREAK';
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  otoAllowed: boolean;
  quoteOrderQtyMarketAllowed: boolean;
  allowTrailingStop: boolean;
  cancelReplaceAllowed: boolean;
  amendAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: Array<{
    filterType: string;
    [key: string]: any;
  }>;
  permissions: string[];
  permissionSets: string[][];
  defaultSelfTradePreventionMode: string;
  allowedSelfTradePreventionModes: string[];
}

// Binance Spot 24hr 티커 통계 타입
interface BinanceSpotTickerResponse {
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

// Binance USD-M Futures 24hr 티커 통계 타입
interface BinanceUmTickerResponse {
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

// Binance COIN-M Futures 24hr 티커 통계 타입
interface BinanceCmTickerResponse {
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

// 통합 티커 응답 타입
type BinanceTickerResponse = BinanceSpotTickerResponse | BinanceUmTickerResponse | BinanceCmTickerResponse;

// Binance 심볼 정보 타입 (localStorage 저장용)
interface BinanceSymbolData {
  rawSymbol: string;
  integratedSymbol: string;
  baseCode: string;
  quoteCode: string;
  quantity?: number;
  settlementCode?: string;
  restOfSymbol?: string;
  status: string;
}

/**
 * Binance exchangeInfo 데이터를 가져옵니다
 */
export async function fetchBinanceExchangeInfo(): Promise<BinanceSymbolInfo[]> {
  try {
    const res = await defaultApiClient.get<BinanceExchangeInfoResponse>(
      (API_ENDPOINTS.binance as any).exchangeInfo,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        retryCount: 2,
      }
    );
    
    return res.data.symbols;
  } catch (error) {
    console.error('Binance exchangeInfo 가져오기 실패:', error);
    throw error;
  }
}

/**
 * Binance 카테고리별 24hr 티커 통계를 가져옵니다
 */
export async function fetchBinanceTickerByCategory(category: BinanceRawCategory): Promise<BinanceTickerResponse[]> {
  try {
    const endpoint = API_ENDPOINTS.binance.tickers[category as keyof typeof API_ENDPOINTS.binance.tickers];
    const res = await defaultApiClient.get<BinanceTickerResponse[]>(
      endpoint,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
        retryCount: 2,
      }
    );
    
    return res.data;
  } catch (error) {
    console.error(`Binance ${category} 티커 가져오기 실패:`, error);
    throw error;
  }
}

/**
 * Binance 24hr 티커 통계를 가져옵니다 (기존 호환성)
 */
export async function fetchBinance24hrTicker(): Promise<BinanceSpotTickerResponse[]> {
  return fetchBinanceTickerByCategory('spot') as Promise<BinanceSpotTickerResponse[]>;
}

// 새로운 quantity 추출 로직: 1이거나 1000 이상의 10의 배수만 허용
const extractQuantityFromSymbol = (baseSymbol: string): { quantity: number; actualBaseCode: string } => {
  let quantity = 1;
  let actualBaseCode = baseSymbol;
  
  // 왼쪽에서 숫자 확인 (예: 1000DOGE → quantity: 1000, baseCode: DOGE)
  const leftNumberMatch = baseSymbol.match(/^(\d+)(.+)$/);
  if (leftNumberMatch) {
    const extractedNumber = parseInt(leftNumberMatch[1]);
    // 1000 이상이면서 10의 배수인 경우만 유효한 quantity로 간주
    if (extractedNumber >= 1000 && extractedNumber % 10 === 0) {
      quantity = extractedNumber;
      actualBaseCode = leftNumberMatch[2];
    }
    // 그 외의 경우는 모두 quantity = 1, baseCode는 원본 그대로 (예: 100PEPE → quantity: 1, baseCode: 100PEPE)
  }
  
  return { quantity, actualBaseCode };
};

/**
 * Binance 심볼을 간소화된 형태로 변환합니다
 * README.md의 네이밍 컨벤션에 따라 integratedSymbol을 생성합니다
 */
function convertBinanceSymbol(symbol: any): BinanceSymbolData {
  const rawSymbol = symbol.symbol;
  const baseAsset = symbol.baseAsset;
  const quoteAsset = symbol.quoteAsset;
  const status = symbol.status;
  
  // 공통 quantity 추출 로직 사용
  const { quantity, actualBaseCode } = extractQuantityFromSymbol(baseAsset);
  
  // integratedSymbol 생성
  const integratedSymbol = quantity > 1 
    ? `${quantity}${actualBaseCode}/${quoteAsset}`
    : `${actualBaseCode}/${quoteAsset}`;
  
  const result = {
    rawSymbol,
    integratedSymbol,
    baseCode: actualBaseCode,
    quoteCode: quoteAsset,
    quantity,
    settlementCode: quoteAsset, // Binance spot은 항상 quoteAsset과 동일
    status
  };
  
  // 디버깅: quantity가 1이 아닌 경우만 로그 출력
  if (quantity !== 1) {
    console.log(`🔍 [convertBinanceSymbol] quantity 추출: ${baseAsset} → quantity=${quantity}, actualBaseCode=${actualBaseCode}`);
  }
  
  return result;
}

/**
 * Binance instruments 정보를 localStorage에 저장합니다 (심볼 정보만)
 */
export async function saveBinanceInstrumentsToStorage(): Promise<void> {
  try {
    console.log('🔄 Binance instruments 데이터 가져오기 시작...');
    const instruments = await fetchBinanceExchangeInfo();
    console.log(`📊 전체 instruments 수: ${instruments.length}`);
    
    const spotInstruments = instruments.filter(symbol => 
      symbol.isSpotTradingAllowed && symbol.status === 'TRADING'
    );
    console.log(`✅ 필터링된 spot instruments 수: ${spotInstruments.length}`);
    
    const symbolData: BinanceSymbolData[] = spotInstruments.map(instrument => 
      convertBinanceSymbol(instrument)
    );
    console.log(`🔄 변환된 symbol 데이터 수: ${symbolData.length}`);
    
    // 처음 5개 심볼 데이터 확인
    console.log('📋 처음 5개 심볼 데이터:', symbolData.slice(0, 5));
    
    const currentTime = new Date().toISOString();
    const symbolStrings = symbolData.map(symbol => {
      let symbolPart = '';
      
      // quantity가 1보다 큰 경우에만 quantity* 접두사 추가
      if (symbol.quantity && symbol.quantity > 1) {
        symbolPart += `${symbol.quantity}*`;
      }
      symbolPart += `${symbol.baseCode}/${symbol.quoteCode}`;
      
      const result = `${symbolPart}=${symbol.rawSymbol}`;
      return result;
    });
    
    console.log(`🔄 생성된 symbol 문자열 수: ${symbolStrings.length}`);
    console.log('📋 처음 5개 symbol 문자열:', symbolStrings.slice(0, 5));
    
    const storageKey = 'binance-spot';
    const dataToStore = `${currentTime}:::${symbolStrings.join(',')}`;
    
    console.log(`💾 저장할 데이터 길이: ${dataToStore.length} 문자`);
    console.log(`💾 저장할 데이터 미리보기: ${dataToStore.substring(0, 200)}...`);
    
    localStorage.setItem(storageKey, dataToStore);
    
    // 저장 후 검증
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      console.log(`✅ localStorage 저장 성공! 저장된 데이터 길이: ${storedData.length}`);
      const [timeInfo, symbolsData] = storedData.split(':::');
      if (symbolsData) {
        const symbolCount = symbolsData.split(',').length;
        console.log(`✅ 저장된 심볼 수: ${symbolCount}`);
      } else {
        console.error('❌ 저장된 데이터에서 심볼 데이터를 찾을 수 없습니다!');
      }
    } else {
      console.error('❌ localStorage에서 데이터를 찾을 수 없습니다!');
    }
    
    console.log(`✅ Binance spot instruments 저장 완료: ${symbolData.length}개`);
  } catch (error) {
    console.error('❌ Binance instruments 저장 실패:', error);
    throw error;
  }
}

/**
 * localStorage에서 Binance instruments 정보를 가져옵니다
 */
export function getBinanceInstrumentsFromStorage(): BinanceSymbolData[] {
  try {
    const storageKey = 'binance-spot';
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return [];
    }
    
    // 시간 정보와 데이터 분리
    const [timeInfo, symbolsData] = storedData.split(':::');
    
    if (!symbolsData) {
      return [];
    }
    
    // 심볼 문자열 파싱
    const symbolStrings = symbolsData.split(',').filter(Boolean);
    const symbols: BinanceSymbolData[] = [];
    
    for (const symbolString of symbolStrings) {
      const [symbolPart, rawSymbol] = symbolString.split('=');
      if (!symbolPart || !rawSymbol) continue;
      
      // quantity 추출
      let quantity: number | undefined;
      let remainingPart = symbolPart;
      
      const quantityMatch = symbolPart.match(/^(\d+)\*(.+)$/);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
        remainingPart = quantityMatch[2];
      }
      
      // baseCode/quoteCode 추출
      const [baseCode, quoteCode] = remainingPart.split('/');
      if (!baseCode || !quoteCode) continue;
      
      // integratedSymbol 재구성
      let integratedSymbol: string;
      if (quantity && quantity >= 10) {
        integratedSymbol = `${quantity}${baseCode}/${quoteCode}`;
      } else {
        integratedSymbol = `${baseCode}/${quoteCode}`;
      }
      
      symbols.push({
        rawSymbol,
        integratedSymbol,
        baseCode,
        quoteCode,
        quantity,
        settlementCode: quoteCode,
        status: 'TRADING'
      });
    }
    
    return symbols;
  } catch (error) {
    console.error('Binance instruments 데이터 로드 실패:', error);
    return [];
  }
}

/**
 * Binance API 클라이언트 클래스
 */
export class BinanceApiClient {
  private priceTracker: PriceDecimalTracker;
  private beforePriceMap: Map<string, number> = new Map();

  constructor(priceTracker: PriceDecimalTracker) {
    this.priceTracker = priceTracker;
  }

  /**
   * Binance 카테고리별 티커 데이터를 가져옵니다
   */
  async fetchTickerData(category: BinanceRawCategory): Promise<TickerData[]> {
    try {
      console.log(`🔄 Binance ${category} 티커 정보 요청 시작`);

      // 티커 데이터 가져오기
      const tickers = await fetchBinanceTickerByCategory(category);

      // 티커 데이터를 표준 TickerData 형식으로 변환
      const tickerDataList = this.transformTickerData(tickers, category);
      
      // 현재 가격을 이전 가격 Map에 저장
      tickerDataList.forEach(ticker => {
        const key = `${category}-${ticker.rawSymbol}`;
        this.beforePriceMap.set(key, ticker.price);
      });

      console.log(`✅ Binance ${category} 티커 정보 로드 완료:`, tickerDataList.length, '개');
      return tickerDataList;
    } catch (error) {
      console.error(`Binance ${category} 티커 데이터 가져오기 실패:`, error);
      throw error;
    }
  }

  /**
   * Binance API 데이터를 TickerData 형식으로 변환합니다
   */
  private transformTickerData(
    tickers: BinanceTickerResponse[],
    category: BinanceRawCategory
  ): TickerData[] {
    return tickers
      .map(ticker => {
        // 심볼 파싱하여 baseCode, quoteCode 추출
        const { baseCode, quoteCode, integratedSymbol, quantity } = this.parseSymbol(ticker.symbol, category);
        const rawSymbol = ticker.symbol;
        
        // 이전 가격 정보를 Map에서 가져오기
        const key = `${category}-${rawSymbol}`;
        const beforePrice = this.beforePriceMap.get(key) ?? parseFloat(ticker.lastPrice);
        
        // 가격 정보 계산
        const currentPrice = parseFloat(ticker.lastPrice) || 0;
        const priceChange = parseFloat(ticker.priceChange) || 0;
        const priceChangePercent = parseFloat(ticker.priceChangePercent) || 0;

        // 이전 가격은 카테고리별로 다르게 계산
        let prevPrice = currentPrice - priceChange;
        if (category === 'spot') {
          const spotTicker = ticker as BinanceSpotTickerResponse;
          prevPrice = parseFloat(spotTicker.prevClosePrice) || prevPrice;
        }

        // 거래량/거래대금 처리 (카테고리별 차이)
        let volume24h = parseFloat(ticker.volume) || 0;
        let turnover24h = 0;
        
        if (category === 'cm') {
          // COIN-M의 경우 baseVolume 사용
          const cmTicker = ticker as BinanceCmTickerResponse;
          turnover24h = parseFloat(cmTicker.baseVolume) || 0;
        } else {
          // spot, um의 경우 quoteVolume 사용
          const quoteTicker = ticker as BinanceSpotTickerResponse | BinanceUmTickerResponse;
          turnover24h = parseFloat(quoteTicker.quoteVolume) || 0;
        }

        // PriceDecimalTracker로 가격 추적
        this.priceTracker.trackPrice(integratedSymbol, currentPrice);
        if (prevPrice && prevPrice !== currentPrice) {
          this.priceTracker.trackPrice(integratedSymbol, prevPrice);
        }
        if (priceChange && Math.abs(priceChange) > 0) {
          this.priceTracker.trackPrice(integratedSymbol, Math.abs(priceChange));
        }

        const transformedData: TickerData = {
          // === 기본 식별 정보 ===
          rawSymbol,
          integratedSymbol,
          baseCode,
          quoteCode,
          exchange: 'binance' as const,
          quantity,
          
          // === 카테고리 정보 ===
          integratedCategory: this.getIntegratedCategory(category),
          rawCategory: category,
          
          // === 현재 가격 정보 ===
          price: currentPrice,
          beforePrice: beforePrice,
          prevPrice24h: prevPrice,
          priceChange24h: priceChange,
          priceChangePercent24h: priceChangePercent,
          
          // === 거래 정보 ===
          volume24h,
          turnover24h,
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
            dataSource: this.getDataSource(category),
            rawApiResponse: ticker,
            reliability: 'HIGH',
          },
          
          // === 거래소별 확장 정보 ===
          exchangeSpecific: {
            binance: {
              weightedAvgPrice: parseFloat(ticker.weightedAvgPrice || '0'),
              openTime: ticker.openTime,
              closeTime: ticker.closeTime,
              count: ticker.count,
              // spot만 bid/ask 정보 있음
              ...(category === 'spot' && {
                bidPrice: parseFloat((ticker as BinanceSpotTickerResponse).bidPrice),
                bidQty: parseFloat((ticker as BinanceSpotTickerResponse).bidQty),
                askPrice: parseFloat((ticker as BinanceSpotTickerResponse).askPrice),
                askQty: parseFloat((ticker as BinanceSpotTickerResponse).askQty),
              }),
              // COIN-M의 경우 pair 정보 추가
              ...(category === 'cm' && {
                pair: (ticker as BinanceCmTickerResponse).pair,
              }),
            } as any
          }
        };

        return transformedData;
      })
      .filter((ticker): ticker is NonNullable<typeof ticker> => ticker !== null);
  }

  /**
   * Binance 심볼을 파싱하여 baseCode, quoteCode, integratedSymbol을 추출합니다
   */
  private parseSymbol(rawSymbol: string, category: BinanceRawCategory): { baseCode: string; quoteCode: string; integratedSymbol: string; quantity: number } {
    let baseCode = '';
    let quoteCode = '';
    let quantity = 1;
    
    try {
      if (category === 'spot') {
        // Spot: BTCUSDT, ETHBTC 등의 형태
        // 일반적인 패턴들 시도
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
        // 기본적으로 USDT로 끝나는 패턴
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
          const [pairPart, suffixPart] = rawSymbol.split('_');
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
  }

  /**
   * rawCategory를 integratedCategory로 매핑합니다
   */
  private getIntegratedCategory(rawCategory: BinanceRawCategory): string {
    switch (rawCategory) {
      case 'spot':
        return 'spot';
      case 'um':
        return 'um';
      case 'cm':
        return 'cm';
      default:
        return rawCategory;
    }
  }

  /**
   * 카테고리별 데이터 소스 URL을 반환합니다
   */
  private getDataSource(category: BinanceRawCategory): string {
    const binanceEndpoints = API_ENDPOINTS.binance as any;
    switch (category) {
      case 'spot':
        return binanceEndpoints.spot?.baseUrl || 'https://api.binance.com';
      case 'um':
        return binanceEndpoints.um?.baseUrl || 'https://fapi.binance.com';
      case 'cm':
        return binanceEndpoints.cm?.baseUrl || 'https://dapi.binance.com';
      default:
        return binanceEndpoints.spot?.baseUrl || 'https://api.binance.com';
    }
  }

  /**
   * 테스트 데이터를 생성합니다
   */
  generateTestData(category: BinanceRawCategory): TickerData[] {
    console.log(`Binance ${category} 테스트 티커 데이터로 대체합니다...`);
    
    let testSymbols: string[];
    switch (category) {
      case 'spot':
        testSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'EOSUSDT'];
        break;
      case 'um':
        testSymbols = ['BTCUSDT', 'ETHUSDT', '1000SHIBUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'EOSUSDT'];
        break;
      case 'cm':
        testSymbols = ['BTCUSD_PERP', 'ETHUSD_PERP', 'ADAUSD_PERP', 'DOTUSD_PERP', 'LINKUSD_PERP', 'LTCUSD_PERP', 'BCHUSD_PERP', 'ETCUSD_PERP', 'EOSUSD_PERP', 'BNBUSD_PERP'];
        break;
      default:
        testSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    }
    
    return testSymbols.map((symbol) => {
      const { baseCode, quoteCode, integratedSymbol, quantity } = this.parseSymbol(symbol, category);
      
      // 테스트용 랜덤 데이터 생성
      const price = Math.random() * 100 + 1;
      const changePercent = (Math.random() - 0.5) * 10;
      const priceChange = price * (changePercent / 100);
      
      return {
        rawSymbol: symbol,
        integratedSymbol,
        baseCode,
        quoteCode,
        exchange: 'binance' as const,
        integratedCategory: this.getIntegratedCategory(category),
        rawCategory: category,
        quantity,
        price,
        beforePrice: price - priceChange,
        prevPrice24h: price - priceChange,
        priceChange24h: priceChange,
        priceChangePercent24h: changePercent,
        volume24h: Math.random() * 1000000,
        turnover24h: Math.random() * 10000000,
        highPrice24h: price + Math.random() * price * 0.1,
        lowPrice24h: price - Math.random() * price * 0.1,
        instrumentInfo: {
          status: 'TRADING',
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
