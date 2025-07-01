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
    prevPriceUtc9?: number;
    openingPriceUtc9?: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    priceChangeUtc9?: number;
    priceChangePercentUtc9?: number;
    highPrice24h?: number;
    lowPrice24h?: number;
  }): TickerDataBuilder {
    this.data = {
      ...this.data,
      price: info.price,
      prevPrice24h: info.prevPrice24h,
      prevPriceUtc9: info.prevPriceUtc9,
      openingPriceUtc9: info.openingPriceUtc9,
      priceChange24h: info.priceChange24h,
      priceChangePercent24h: info.priceChangePercent24h,
      priceChangeUtc9: info.priceChangeUtc9,
      priceChangePercentUtc9: info.priceChangePercentUtc9,
      highPrice24h: info.highPrice24h,
      lowPrice24h: info.lowPrice24h,
    };
    return this;
  }

  setTradeInfo(info: {
    volume24h: number;
    turnover24h: number;
    volumeUtc9?: number;
    turnoverUtc9?: number;
    bidPrice?: number;
    askPrice?: number;
  }): TickerDataBuilder {
    this.data = {
      ...this.data,
      volume24h: info.volume24h,
      turnover24h: info.turnover24h,
      volumeUtc9: info.volumeUtc9,
      turnoverUtc9: info.turnoverUtc9,
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

/**
 * Bithumb API 응답을 TickerData로 변환
 * @param d Bithumb API의 단일 티커 데이터
 * @param symbol 심볼(예: BTC_KRW)
 * @param integratedCategory 내부 카테고리(예: spot)
 * @returns TickerData
 */
export function toBithumbTickerData(d: any, symbol: string, integratedCategory: string): TickerData {
  // symbol 파싱
  const baseCode = symbol.replace(/KRW$|BTC$/, '');
  const quoteCode = symbol.includes('KRW') ? 'KRW' : 'BTC';
  return createTickerDataBuilder()
    .setBasicInfo({
      rawSymbol: symbol,
      integratedSymbol: `${baseCode}/${quoteCode}`,
      baseCode,
      quoteCode,
      exchange: 'bithumb',
      integratedCategory,
      rawCategory: integratedCategory,
    })
    .setPriceInfo({
      price: parseFloat(d.trade_price ?? d.closing_price ?? '0'),
      prevPrice24h: parseFloat(d.trade_price ?? d.closing_price ?? '0') - parseFloat(d.signed_change_price ?? d.fluctate_24H ?? '0'),
      prevPriceUtc9: parseFloat(d.prev_closing_price ?? '0'),
      openingPriceUtc9: parseFloat(d.opening_price ?? '0'),
      priceChange24h: parseFloat(d.signed_change_price ?? d.fluctate_24H ?? '0'),
      priceChangePercent24h: parseFloat(d.signed_change_rate ?? d.fluctate_rate_24H ?? '0'),
      priceChangeUtc9: parseFloat(d.signed_change_price ?? d.fluctate_24H ?? '0'),
      priceChangePercentUtc9: parseFloat(d.signed_change_rate ?? d.fluctate_rate_24H ?? '0'),
      highPrice24h: parseFloat(d.high_price ?? d.max_price ?? '0'),
      lowPrice24h: parseFloat(d.low_price ?? d.min_price ?? '0'),
    })
    .setTradeInfo({
      volume24h: parseFloat(d.acc_trade_volume_24h ?? d.units_traded_24H ?? '0'),
      turnover24h: parseFloat(d.acc_trade_price_24h ?? d.acc_trade_value_24H ?? '0'),
      volumeUtc9: parseFloat(d.acc_trade_volume ?? d.units_traded ?? '0'),
      turnoverUtc9: parseFloat(d.acc_trade_price ?? d.acc_trade_value ?? '0'),
    })
    .setExchangeSpecific({
      bithumb: {
        openingPrice: d.opening_price,
        prevClosingPrice: d.prev_closing_price,
        accTradeValue: d.acc_trade_value,
        unitsTraded: d.units_traded,
        marketType: quoteCode,
        tradeDate: d.trade_date,
        tradeTime: d.trade_time,
        tradeTimestamp: d.trade_timestamp,
        highest52WeekPrice: d.highest_52_week_price,
        highest52WeekDate: d.highest_52_week_date,
        lowest52WeekPrice: d.lowest_52_week_price,
        lowest52WeekDate: d.lowest_52_week_date,
        accTradePrice: d.acc_trade_price,
        accTradePrice24h: d.acc_trade_price_24h,
        accTradeVolume: d.acc_trade_volume,
        accTradeVolume24h: d.acc_trade_volume_24h,
        change: d.change,
        changePrice: d.change_price,
        changeRate: d.change_rate,
        signedChangePrice: d.signed_change_price,
        signedChangeRate: d.signed_change_rate,
        date: d.date,
      }
    })
    .build();
} 