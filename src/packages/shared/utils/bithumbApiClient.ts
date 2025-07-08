import { BithumbTickerResponse, BithumbTicker } from '../types/exchange';
import { TickerData } from '../types/exchange';
import { PriceDecimalTracker } from './priceFormatter';
import { defaultApiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/exchangeConfig';
import type { BithumbWarningType } from '../constants/exchangeConfig';

// [수정] 빗썸 instrument(시장 정보) 타입
interface BithumbMarketInfo {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning: 'NONE' | 'CAUTION';
}

// [수정] 빗썸 경보(virtual_asset_warning) 타입
interface BithumbWarningInfo {
  market: string;
  warning_type: BithumbWarningType;
  end_date: string;
}

// [수정] instrument(시장 정보) fetch 함수 (defaultApiClient 사용)
export async function fetchBithumbMarketAll(): Promise<BithumbMarketInfo[]> {
  const res = await defaultApiClient.get<BithumbMarketInfo[]>(API_ENDPOINTS.bithumb.instruments);
  return res.data;
}

// [수정] warning(경보) fetch 함수 (defaultApiClient 사용)
export async function fetchBithumbVirtualAssetWarning(): Promise<BithumbWarningInfo[]> {
  const res = await defaultApiClient.get<BithumbWarningInfo[]>(API_ENDPOINTS.bithumb.virtualAssetWarning);
  return res.data;
}

export class BithumbApiClient {
  private priceTracker: PriceDecimalTracker;
  private beforePriceMap: Map<string, number> = new Map();

  constructor(priceTracker: PriceDecimalTracker) {
    this.priceTracker = priceTracker;
  }

  /**
   * 빗썸 티커 데이터를 가져옵니다
   */
  async fetchTickerData(): Promise<TickerData[]> {
    try {
      // [변경] ticker, instrument, warning 데이터를 병렬로 요청
      const [tickerRes, marketAll, warningList] = await Promise.all([
        defaultApiClient.get<BithumbTickerResponse>(
          API_ENDPOINTS.bithumb.tickerAll,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 10000,
            retryCount: 2,
          }
        ),
        fetchBithumbMarketAll(),
        fetchBithumbVirtualAssetWarning(),
      ]);
      const tickerResponse = tickerRes.data;

      if (tickerResponse.status !== '0000') {
        throw new Error(`빗썸 API 오류: ${tickerResponse.status}`);
      }

      if (!tickerResponse.data) {
        throw new Error('빗썸 티커 데이터가 없습니다');
      }

      // [변경] marketAll, warningList를 transformTickerData에 전달
      const tickerDataList = this.transformTickerData(tickerResponse.data, marketAll, warningList);
      
      // 현재 가격을 이전 가격 Map에 저장 (다음 업데이트 시 beforePrice로 사용)
      tickerDataList.forEach(ticker => {
        this.beforePriceMap.set(ticker.rawSymbol, ticker.price);
      });

      return tickerDataList;
    } catch (error) {
      console.error('빗썸 티커 데이터 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 빗썸 API 데이터를 TickerData 형식으로 변환합니다
   */
  private transformTickerData(
    data: { [symbol: string]: BithumbTicker | string; date: string },
    marketAll: BithumbMarketInfo[],
    warningList: BithumbWarningInfo[]
  ): TickerData[] {
    return Object.entries(data)
      .filter(([symbol, _]) => symbol !== 'date') // date 필드 제외
      .map(([symbol, rawTickerData]) => {
        // tickerData가 string인 경우 스킵
        if (typeof rawTickerData === 'string') {
          return null;
        }

        const baseCode = symbol;
        const quoteCode = 'KRW';
        const rawSymbol = `${baseCode}${quoteCode}`;
        const integratedSymbol = `${baseCode}/${quoteCode}`;
        // [추가] instrument 정보 매칭
        const marketKey = `KRW-${baseCode}`;
        const instrument = marketAll.find(m => m.market === marketKey);
        // [추가] warning 정보 매칭
        const warning = warningList.find(w => w.market === marketKey);
        
        // 가격 정보 계산
        const currentPrice = parseFloat(rawTickerData.closing_price);
        const prevPrice = parseFloat(rawTickerData.prev_closing_price);
        const priceChange = parseFloat(rawTickerData.fluctate_24H);
        const priceChangePercent = parseFloat(rawTickerData.fluctate_rate_24H);

        // 이전 가격 정보를 Map에서 가져오기
        const beforePrice = this.beforePriceMap.get(rawSymbol) ?? currentPrice;

        // PriceDecimalTracker로 가격 추적
        this.priceTracker.trackPrice(integratedSymbol, currentPrice);
        if (prevPrice && prevPrice !== currentPrice) {
          this.priceTracker.trackPrice(integratedSymbol, prevPrice);
        }
        if (priceChange && Math.abs(priceChange) > 0) {
          this.priceTracker.trackPrice(integratedSymbol, Math.abs(priceChange));
        }

        // 추적 상태 로깅 (BTC/KRW만 예시로)
        if (integratedSymbol === "BTC/KRW") {
          console.log(`[PriceTracker] ${integratedSymbol}: maxDecimals=${this.priceTracker.getMaxDecimals(integratedSymbol)}, currentPrice=${currentPrice}, beforePrice=${beforePrice}`);
        }

        // [변경] instrumentInfo, warningInfo에 실제 데이터 반영
        const transformedData: TickerData = {
          // === 기본 식별 정보 ===
          rawSymbol,
          integratedSymbol,
          baseCode,
          quoteCode,
          exchange: 'bithumb' as const,
          
          // === 카테고리 정보 ===
          integratedCategory: 'spot',
          rawCategory: 'spot',
          
          // === 현재 가격 정보 ===
          price: currentPrice,
          beforePrice: beforePrice, // 테두리 애니메이션용 직전 가격
          prevPrice24h: prevPrice,
          priceChange24h: priceChange,
          priceChangePercent24h: priceChangePercent,
          
          // === 거래 정보 ===
          volume24h: parseFloat(rawTickerData.units_traded_24H) || 0,
          turnover24h: parseFloat(rawTickerData.acc_trade_value_24H) || 0,
          highPrice24h: parseFloat(rawTickerData.max_price) || currentPrice,
          lowPrice24h: parseFloat(rawTickerData.min_price) || currentPrice,
          quantity: 1,
          
          // === Instrument 세부 정보 ===
          instrumentInfo: {
            status: 'Trading',
            koreanName: instrument?.korean_name ?? symbol,
            englishName: instrument?.english_name ?? symbol,
            displayName: instrument ? `${instrument.korean_name} (${instrument.english_name})` : symbol,
            marketWarning: instrument?.market_warning,
          },
          
          // === 경보 정보 ===
          warningInfo: warning
            ? {
                warningType: warning.warning_type,
                warningEndDate: warning.end_date,
                hasActiveWarning: true,
                marketWarning: instrument?.market_warning,
              }
            : instrument?.market_warning === 'CAUTION'
            ? {
                hasActiveWarning: false,
                marketWarning: 'CAUTION',
              }
            : undefined,
          
          // === 메타데이터 ===
          metadata: {
            lastUpdated: new Date(),
            dataSource: 'https://api.bithumb.com',
            rawApiResponse: rawTickerData,
            reliability: 'HIGH',
          },
          
          // === 거래소별 확장 정보 ===
          exchangeSpecific: {
            bithumb: {
              openingPrice: parseFloat(rawTickerData.opening_price),
              unitsTraded: parseFloat(rawTickerData.units_traded),
              accTradeValue: parseFloat(rawTickerData.acc_trade_value),
              date: data.date,
            } as any
          }
        };

        return transformedData;
      })
      .filter((ticker): ticker is NonNullable<typeof ticker> => ticker !== null); // null 값 필터링
  }

  /**
   * 테스트 데이터를 생성합니다
   */
  generateTestData(): TickerData[] {
    console.log('테스트 티커 데이터로 대체합니다...');
    const testCoins = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'LINK', 'LTC', 'BCH', 'ETC', 'EOS'];
    
    return testCoins.map((symbol) => {
      const baseCode = symbol;
      const quoteCode = 'KRW';
      const rawSymbol = `${baseCode}${quoteCode}`;
      const integratedSymbol = `${baseCode}/${quoteCode}`;
      
      // 테스트용 랜덤 데이터 생성
      const price = Math.random() * 100000 + 1000;
      const changePercent = (Math.random() - 0.5) * 10;
      const priceChange = price * (changePercent / 100);
      
      return {
        rawSymbol,
        integratedSymbol,
        baseCode,
        quoteCode,
        exchange: 'bithumb' as const,
        integratedCategory: 'spot',
        rawCategory: 'spot',
        price,
        beforePrice: price - priceChange, // 테두리 애니메이션용 이전 가격
        prevPrice24h: price - priceChange,
        priceChange24h: priceChange,
        priceChangePercent24h: changePercent,
        volume24h: Math.random() * 1000000,
        turnover24h: Math.random() * 10000000000,
        highPrice24h: price + Math.random() * price * 0.1,
        lowPrice24h: price - Math.random() * price * 0.1,
        quantity: 1,
        instrumentInfo: {
          status: 'Trading',
          koreanName: symbol,
          englishName: symbol,
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