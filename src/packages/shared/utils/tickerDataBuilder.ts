import { TickerData, TickerDataBuilder, ExchangeType, WarningType } from '../types/exchange';

/**
 * TickerData 객체를 쉽게 생성하기 위한 Builder 클래스
 * 
 * @example
 * ```typescript
 * const tickerData = new TickerDataBuilderImpl()
 *   .setBasicInfo({
 *     rawSymbol: 'BTCUSDT',
 *     integratedSymbol: 'BTC/USDT',
 *     baseCode: 'BTC',
 *     quoteCode: 'USDT',
 *     exchange: 'bybit',
 *     integratedCategory: 'spot',
 *     rawCategory: 'spot'
 *   })
 *   .setPriceInfo({
 *     price: 50000,
 *     prevPrice24h: 49000,
 *     priceChange24h: 1000,
 *     priceChangePercent24h: 2.04
 *   })
 *   .setTradeInfo({
 *     volume24h: 1000000,
 *     turnover24h: 50000000000
 *   })
 *   .build();
 * ```
 */
export class TickerDataBuilderImpl implements TickerDataBuilder {
  private data: Partial<TickerData> = {};

  setBasicInfo(info: {
    rawSymbol: string;
    integratedSymbol: string;
    baseCode: string;
    quoteCode: string;
    exchange: ExchangeType;
    integratedCategory: string;
    rawCategory: string;
  }): TickerDataBuilder {
    this.data.rawSymbol = info.rawSymbol;
    this.data.integratedSymbol = info.integratedSymbol;
    this.data.baseCode = info.baseCode;
    this.data.quoteCode = info.quoteCode;
    this.data.exchange = info.exchange;
    this.data.integratedCategory = info.integratedCategory;
    this.data.rawCategory = info.rawCategory;
    return this;
  }

  setPriceInfo(info: {
    price: number;
    prevPrice24h: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    highPrice24h?: number;
    lowPrice24h?: number;
  }): TickerDataBuilder {
    this.data = {
      ...this.data,
      price: info.price,
      prevPrice24h: info.prevPrice24h,
      priceChange24h: info.priceChange24h,
      priceChangePercent24h: info.priceChangePercent24h,
      highPrice24h: info.highPrice24h,
      lowPrice24h: info.lowPrice24h,
    };
    return this;
  }

  setTradeInfo(info: {
    volume24h: number;
    turnover24h: number;
    bidPrice?: number;
    askPrice?: number;
  }): TickerDataBuilder {
    this.data = {
      ...this.data,
      volume24h: info.volume24h,
      turnover24h: info.turnover24h,
      bidPrice: info.bidPrice,
      askPrice: info.askPrice,
    };
    return this;
  }

  setInstrumentInfo(info: NonNullable<TickerData['instrumentInfo']>): TickerDataBuilder {
    this.data = {
      ...this.data,
      instrumentInfo: info,
    };
    return this;
  }

  setWarningInfo(info: NonNullable<TickerData['warningInfo']>): TickerDataBuilder {
    this.data = {
      ...this.data,
      warningInfo: info,
    };
    return this;
  }

  setMetadata(info: NonNullable<TickerData['metadata']>): TickerDataBuilder {
    this.data = {
      ...this.data,
      metadata: info,
    };
    return this;
  }

  setExchangeSpecific(info: NonNullable<TickerData['exchangeSpecific']>): TickerDataBuilder {
    this.data = {
      ...this.data,
      exchangeSpecific: info,
    };
    return this;
  }

  build(): TickerData {
    // 필수 필드 검증
    if (!this.data.rawSymbol || !this.data.integratedSymbol || !this.data.baseCode || 
        !this.data.quoteCode || !this.data.exchange || !this.data.integratedCategory || 
        !this.data.rawCategory || this.data.price === undefined || 
        this.data.prevPrice24h === undefined || this.data.priceChange24h === undefined || 
        this.data.priceChangePercent24h === undefined || this.data.volume24h === undefined || 
        this.data.turnover24h === undefined) {
      throw new Error('TickerData 생성에 필요한 필수 필드가 누락되었습니다.');
    }

    return this.data as TickerData;
  }
}

/**
 * TickerDataBuilder 인스턴스를 생성하는 팩토리 함수
 */
export function createTickerDataBuilder(): TickerDataBuilder {
  return new TickerDataBuilderImpl();
}

/**
 * 기존 TickerData에서 특정 정보만 업데이트하는 헬퍼 함수
 */
export function updateTickerData(
  existing: TickerData, 
  updates: Partial<TickerData>
): TickerData {
  return {
    ...existing,
    ...updates,
    // 중첩된 객체들은 깊은 병합 수행
    instrumentInfo: updates.instrumentInfo 
      ? { ...existing.instrumentInfo, ...updates.instrumentInfo }
      : existing.instrumentInfo,
    warningInfo: updates.warningInfo 
      ? { ...existing.warningInfo, ...updates.warningInfo }
      : existing.warningInfo,
    metadata: updates.metadata 
      ? { ...existing.metadata, ...updates.metadata }
      : existing.metadata,
    exchangeSpecific: updates.exchangeSpecific 
      ? { ...existing.exchangeSpecific, ...updates.exchangeSpecific }
      : existing.exchangeSpecific,
  };
}

/**
 * TickerData에서 경고 관련 정보를 추출하는 헬퍼 함수
 */
export function getWarningInfo(tickerData: TickerData): {
  hasWarning: boolean;
  warningType?: WarningType;
  warningEndDate?: string;
  marketWarning?: 'NONE' | 'CAUTION';
  warningMessage?: string;
} {
  const warningInfo = tickerData.warningInfo;
  
  return {
    hasWarning: !!warningInfo?.hasActiveWarning,
    warningType: warningInfo?.warningType,
    warningEndDate: warningInfo?.warningEndDate,
    marketWarning: warningInfo?.marketWarning,
    warningMessage: warningInfo?.customWarningMessage,
  };
}

/**
 * TickerData에서 Instrument 관련 정보를 추출하는 헬퍼 함수
 */
export function getInstrumentInfo(tickerData: TickerData): {
  status?: string;
  koreanName?: string;
  englishName?: string;
  contractType?: string;
  isPreListing?: boolean;
  displayName?: string;
} {
  const instrumentInfo = tickerData.instrumentInfo;
  
  return {
    status: instrumentInfo?.status,
    koreanName: instrumentInfo?.koreanName,
    englishName: instrumentInfo?.englishName,
    contractType: instrumentInfo?.contractType,
    isPreListing: instrumentInfo?.isPreListing,
    displayName: instrumentInfo?.displayName,
  };
}

/**
 * TickerData를 레거시 형식으로 변환하는 헬퍼 함수 (하위 호환성 유지)
 */
export function toLegacyTickerData(tickerData: TickerData): TickerData & { warningType?: WarningType } {
  return {
    ...tickerData,
    warningType: tickerData.warningInfo?.warningType,
  };
} 