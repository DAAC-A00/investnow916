import { TickerData } from '../types/exchange';
import { defaultApiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/exchangeConfig';

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

// Binance 24hr 티커 통계 타입
interface Binance24hrTickerResponse {
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
      API_ENDPOINTS.binance.exchangeInfo,
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
 * Binance 24hr 티커 통계를 가져옵니다
 */
export async function fetchBinance24hrTicker(): Promise<Binance24hrTickerResponse[]> {
  try {
    const res = await defaultApiClient.get<Binance24hrTickerResponse[]>(
      API_ENDPOINTS.binance.ticker24hr,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        retryCount: 2,
      }
    );
    
    return res.data;
  } catch (error) {
    console.error('Binance 24hr 티커 가져오기 실패:', error);
    throw error;
  }
}

/**
 * Binance 심볼을 간소화된 형태로 변환합니다
 * README.md의 네이밍 컨벤션에 따라 integratedSymbol을 생성합니다
 */
function convertBinanceSymbol(symbol: any): BinanceSymbolData {
  const rawSymbol = symbol.symbol;
  const baseAsset = symbol.baseAsset;
  const quoteAsset = symbol.quoteAsset;
  const status = symbol.status;
  
  let quantity = 1;
  let actualBaseCode = baseAsset;
  
  // baseAsset에서 quantity 추출 시도 (왼쪽 숫자)
  const leftQuantityMatch = baseAsset.match(/^(\d+)(.+)$/);
  if (leftQuantityMatch) {
    const extractedQuantity = parseInt(leftQuantityMatch[1]);
    if (extractedQuantity >= 10) {
      quantity = extractedQuantity;
      actualBaseCode = leftQuantityMatch[2];
    }
  }
  
  // 왼쪽에서 찾지 못한 경우 오른쪽 숫자 확인
  if (quantity === 1) {
    const rightQuantityMatch = baseAsset.match(/^(.+?)(\d+)$/);
    if (rightQuantityMatch) {
      const extractedQuantity = parseInt(rightQuantityMatch[2]);
      if (extractedQuantity >= 10) {
        quantity = extractedQuantity;
        actualBaseCode = rightQuantityMatch[1];
      }
    }
  }
  
  // integratedSymbol 생성
  const quantityPrefix = quantity >= 10 ? `${quantity}` : '';
  const integratedSymbol = `${quantityPrefix}${actualBaseCode}/${quoteAsset}`;
  
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
  private beforePriceMap: Map<string, number> = new Map();

  /**
   * Binance 티커 데이터를 가져옵니다
   */
  async fetchTickerData(): Promise<TickerData[]> {
    try {
      // instruments와 24hr 티커 데이터를 병렬로 요청
      const [instruments, tickers] = await Promise.all([
        fetchBinanceExchangeInfo(),
        fetchBinance24hrTicker(),
      ]);

      // spot 거래 가능한 심볼만 필터링
      const spotInstruments = instruments.filter(symbol => 
        symbol.isSpotTradingAllowed && symbol.status === 'TRADING'
      );

      // 티커 데이터와 instruments 정보를 매칭하여 변환
      const tickerDataList = this.transformTickerData(tickers, spotInstruments);
      
      // 현재 가격을 이전 가격 Map에 저장
      tickerDataList.forEach(ticker => {
        this.beforePriceMap.set(ticker.rawSymbol, ticker.price);
      });

      return tickerDataList;
    } catch (error) {
      console.error('Binance 티커 데이터 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * Binance API 데이터를 TickerData 형식으로 변환합니다
   */
  private transformTickerData(
    tickers: Binance24hrTickerResponse[],
    instruments: BinanceSymbolInfo[]
  ): TickerData[] {
    return tickers
      .map(ticker => {
        // 해당 심볼의 instrument 정보 찾기
        const instrument = instruments.find(inst => inst.symbol === ticker.symbol);
        
        // spot 거래 불가능한 심볼은 제외
        if (!instrument || !instrument.isSpotTradingAllowed || instrument.status !== 'TRADING') {
          return null;
        }

        const baseCode = instrument.baseAsset;
        const quoteCode = instrument.quoteAsset;
        const rawSymbol = ticker.symbol;
        const integratedSymbol = `${baseCode}/${quoteCode}`;
        
        // 가격 정보 계산
        const currentPrice = parseFloat(ticker.lastPrice) || 0;
        const beforePrice = this.beforePriceMap.get(rawSymbol) || currentPrice;
        const prevPrice = parseFloat(ticker.prevClosePrice) || currentPrice;
        const priceChange = parseFloat(ticker.priceChange) || 0;
        const priceChangePercent = parseFloat(ticker.priceChangePercent) || 0;

        const transformedData: TickerData = {
          // === 기본 식별 정보 ===
          rawSymbol,
          integratedSymbol,
          baseCode,
          quoteCode,
          exchange: 'binance',
          integratedCategory: 'spot',
          rawCategory: 'spot',
          
          // === 현재 가격 정보 ===
          price: currentPrice,
          beforePrice: beforePrice,
          prevPrice24h: prevPrice,
          priceChange24h: priceChange,
          priceChangePercent24h: priceChangePercent,
          
          // === 거래 정보 ===
          volume24h: parseFloat(ticker.volume) || 0,
          turnover24h: parseFloat(ticker.quoteVolume) || 0,
          highPrice24h: parseFloat(ticker.highPrice) || currentPrice,
          lowPrice24h: parseFloat(ticker.lowPrice) || currentPrice,
          quantity: parseFloat(ticker.lastQty) || 0,
          
          // === Instrument 세부 정보 ===
          instrumentInfo: {
            status: instrument.status,
            baseAssetPrecision: instrument.baseAssetPrecision,
            quoteAssetPrecision: instrument.quoteAssetPrecision,
            orderTypes: instrument.orderTypes,
            isSpotTradingAllowed: instrument.isSpotTradingAllowed,
            isMarginTradingAllowed: instrument.isMarginTradingAllowed,
            permissions: instrument.permissions,
            displayName: `${baseCode}/${quoteCode}`,
          } as any,
          
          // === 메타데이터 ===
          metadata: {
            lastUpdated: new Date(ticker.closeTime),
            dataSource: 'https://api.binance.com',
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
              filters: instrument.filters,
            } as any
          }
        };

        return transformedData;
      })
      .filter((ticker): ticker is NonNullable<typeof ticker> => ticker !== null);
  }

  /**
   * 테스트 데이터를 생성합니다
   */
  generateTestData(): TickerData[] {
    console.log('Binance 테스트 티커 데이터로 대체합니다...');
    const testCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'EOSUSDT'];
    
    return testCoins.map((symbol) => {
      const baseCode = symbol.replace('USDT', '');
      const quoteCode = 'USDT';
      const rawSymbol = symbol;
      const integratedSymbol = `${baseCode}/${quoteCode}`;
      
      // 테스트용 랜덤 데이터 생성
      const price = Math.random() * 100 + 1;
      const changePercent = (Math.random() - 0.5) * 10;
      const priceChange = price * (changePercent / 100);
      
      return {
        rawSymbol,
        integratedSymbol,
        baseCode,
        quoteCode,
        exchange: 'binance' as const,
        integratedCategory: 'spot',
        rawCategory: 'spot',
        price,
        beforePrice: price - priceChange,
        prevPrice24h: price - priceChange,
        priceChange24h: priceChange,
        priceChangePercent24h: changePercent,
        volume24h: Math.random() * 1000000,
        turnover24h: Math.random() * 10000000,
        highPrice24h: price + Math.random() * price * 0.1,
        lowPrice24h: price - Math.random() * price * 0.1,
        quantity: Math.random() * 100,
        instrumentInfo: {
          status: 'TRADING',
          displayName: `${baseCode}/${quoteCode}`,
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
