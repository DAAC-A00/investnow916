/**
 * 환율 및 거래소 정보 관련 타입 정의
 */

// ============================================================================
// 거래소 및 카테고리 타입 (중앙 설정에서 import)
// ============================================================================

// 거래소 및 카테고리 관련 타입들을 중앙 설정에서 import
export type { 
  ExchangeType,
  SupportedExchange,
  IntegratedCategory,
  BybitRawCategory, 
  BinanceRawCategory,
  UpbitRawCategory,
  BithumbRawCategory,
  AllRawCategories,
  BithumbWarningType
} from '@/packages/shared/constants/exchangeConfig';

// Warning 관련 상수들도 중앙 설정에서 import
export { 
  BITHUMB_WARNING_LABELS 
} from '@/packages/shared/constants/exchangeConfig';

// 내부에서 사용하기 위한 import
import type { 
  ExchangeType,
  BybitRawCategory,
  BithumbRawCategory,
  BithumbWarningType 
} from '@/packages/shared/constants/exchangeConfig';
import { BITHUMB_WARNING_LABELS } from '@/packages/shared/constants/exchangeConfig';

// 환율 API 응답 타입
export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

// 환율 정보 상태 타입
export interface ExchangeRateState {
  baseCode: string;
  rates: Record<string, number>;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}

// 환율 정보 액션 타입
export type ExchangeRateAction =
  | { type: 'FETCH_RATES_START' }
  | { type: 'FETCH_RATES_SUCCESS'; payload: ExchangeRateResponse }
  | { type: 'FETCH_RATES_ERROR'; payload: string }
  | { type: 'CHANGE_BASE_CURRENCY'; payload: string };

/**
 * 거래소 관련 타입 정의
 */

// 지원하는 거래소 타입
// export type ExchangeType = 'bybit' | 'binance' | 'upbit' | 'bithumb';

// 코인 정보 공통 인터페이스
export interface CoinInfo {
  integratedSymbol: string;  // 내부 프로젝트에서 표시하는 심볼 (예: BTC/USDT)
  rawSymbol: string;      // 외부 API에서 받은 원본 심볼 (예: BTCUSDT)
  baseCode: string;       // 거래쌍의 기준(기본) 코인 (예: BTC)
  quoteCode: string;      // 거래쌍의 상대(견적) 코인 (예: USDT)
  exchange: ExchangeType;  // 거래소
  integratedCategory: string; // 내부 프로젝트에서 표시하는 카테고리 (예: um, cm)
  rawCategory: string;    // 외부 API에서 받은 카테고리 (예: linear, inverse)
  settlementCode?: string; // 정산 화폐 코드 (예: USD, USDT)
  
  // 원본 API 응답 데이터 (카테고리별로 다른 정보 포함)
  rawInstrumentData?: any; // 전체 API 응답 데이터
  
  // 공통 필드들
  status?: string;
  
  // Linear/Inverse 전용 필드들
  contractType?: string;
  launchTime?: string;
  deliveryTime?: string;
  deliveryFeeRate?: string;
  priceScale?: string;
  leverageFilter?: {
    minLeverage?: string;
    maxLeverage?: string;
    leverageStep?: string;
  };
  priceFilter?: {
    minPrice?: string;
    maxPrice?: string;
    tickSize?: string;
  };
  lotSizeFilter?: any; // 카테고리별로 구조가 다름
  unifiedMarginTrade?: boolean;
  fundingInterval?: number;
  settleCoin?: string;
  copyTrading?: string;
  upperFundingRate?: string;
  lowerFundingRate?: string;
  isPreListing?: boolean;
  preListingInfo?: any;
  riskParameters?: any;
  displayName?: string;
  
  // Spot 전용 필드들
  innovation?: string;
  marginTrading?: string;
  stTag?: string;
  
  // Option 전용 필드들
  optionsType?: string; // Put, Call
}

// Bybit API 응답 타입
export interface BybitInstrumentsResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitInstrument[];
  };
  retExtInfo: Record<string, unknown>;
  time: number;
}

export interface BybitInstrument {
  symbol: string;
  baseCoin?: string;  // API 응답에서 사용하는 필드명
  quoteCoin?: string; // API 응답에서 사용하는 필드명
  status: string;
  [key: string]: any;  // 기타 속성
}

// Bybit Ticker API 응답 타입
export interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitTicker[];
  };
  retExtInfo: Record<string, unknown>;
  time: number;
}

export interface BybitTicker {
  symbol: string;
  bid1Price: string;
  bid1Size: string;
  ask1Price: string;
  ask1Size: string;
  lastPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  turnover24h: string;
  volume24h: string;
  usdIndexPrice?: string;
  [key: string]: any;  // 기타 속성
}

// Bithumb API 응답 타입
export interface BithumbInstrument {
  market: string;         // 예: "KRW-BTC", "BTC-ETH"
  korean_name: string;    // 예: "비트코인"
  english_name: string;   // 예: "Bitcoin"
}

// Bithumb API 응답은 배열 형태
export type BithumbInstrumentsResponse = BithumbInstrument[];

// Bithumb Market Info API 응답 타입 (더 자세한 정보 포함)
export interface BithumbMarketInfo {
  market: string;         // 예: "KRW-BTC", "BTC-ETH" 
  korean_name: string;    // 예: "비트코인"
  english_name: string;   // 예: "Bitcoin"
  market_warning: 'NONE' | 'CAUTION'; // 유의 종목 여부
}

// Bithumb Market Info API 응답은 배열 형태
export type BithumbMarketInfoResponse = BithumbMarketInfo[];

// Bithumb Virtual Asset Warning API 응답 타입
export interface BithumbVirtualAssetWarning {
  market: string;         // 예: "KRW-ORBS"
  warning_type: BithumbWarningType;
  end_date: string;       // 예: "2025-06-24 07:04:59"
}

// Bithumb Virtual Asset Warning API 응답은 배열 형태
export type BithumbVirtualAssetWarningResponse = BithumbVirtualAssetWarning[];

// Bithumb Ticker API 응답 타입
export interface BithumbTickerResponse {
  status: string;         // "0000" = 성공
  data: {
    [symbol: string]: BithumbTicker | string;
    date: string;
  };
}

export interface BithumbTicker {
  opening_price: string;
  closing_price: string;
  min_price: string;
  max_price: string;
  units_traded: string;
  acc_trade_value: string;
  prev_closing_price: string;
  units_traded_24H: string;
  acc_trade_value_24H: string;
  fluctate_24H: string;
  fluctate_rate_24H: string;
}

// Bithumb Warning API 응답 타입
export interface BithumbWarning {
  market: string;         // 예: "KRW-LINK"
  warning_type: BithumbWarningType;
  end_date: string;       // 예: "2025-06-14 07:04:59"
}

// Bithumb Warnings API 응답 구조
export interface BithumbWarningsResponse {
  status: string;         // "0000" = 성공
  message?: string;       // 에러 메시지
  data?: BithumbWarning[];
}

// 일반적인 경고 타입 (BithumbWarningType과 동일)
export type WarningType = BithumbWarningType;

// 경고 타입별 한글 설명 (통합)
export const WARNING_TYPE_LABELS: Record<WarningType, string> = BITHUMB_WARNING_LABELS;

/**
 * 통합된 티커 데이터 구조
 * 
 * 이 인터페이스는 다음 정보들을 통합적으로 관리합니다:
 * - 기본 티커 정보 (가격, 거래량 등)
 * - Instrument 정보 (거래소, 카테고리, 심볼 등)
 * - Warning 정보 (경고 유형, 시장 주의 사항 등)
 * - 메타데이터 (타임스탬프, 상태 등)
 */
export interface TickerData {
  // === 기본 식별 정보 ===
  /** 외부 API에서 받은 원본 심볼 (예: BTCUSDT, BTCKRW) */
  rawSymbol: string;
  /** 내부 프로젝트에서 표시하는 심볼 (예: BTC/USDT, BTC/KRW) */
  integratedSymbol: string;
  /** 거래쌍의 기준(기본) 코인 (예: BTC) */
  baseCode: string;
  /** 거래쌍의 상대(견적) 코인 (예: USDT, KRW) */
  quoteCode: string;
  /** 거래소 */
  exchange: ExchangeType;
  warningType?: WarningType;
  
  // === 카테고리 정보 ===
  /** 내부 프로젝트에서 표시하는 카테고리 (예: spot, um, cm) */
  integratedCategory: string;
  /** 외부 API에서 받은 카테고리 (예: linear, inverse, spot) */
  rawCategory: string;
  /** 정산 화폐 코드 (선물의 경우, 예: USD, USDT) */
  settlementCode?: string;
  
  // === 현재 가격 정보 ===
  /** 현재 가격 */
  price: number;
  /** 이전 가격 (애니메이션용) */
  beforePrice?: number;
  /** 24시간 전 가격 */
  prevPrice24h: number;
  /** 24시간 가격 변동 */
  priceChange24h: number;
  /** 24시간 가격 변동률 (%) */
  priceChangePercent24h: number;
  
  // === 거래 정보 ===
  /** 24시간 거래량 */
  volume24h: number;
  /** 24시간 거래대금 */
  turnover24h: number;
  /** 24시간 최고가 */
  highPrice24h?: number;
  /** 24시간 최저가 */
  lowPrice24h?: number;
  /** 매수 1호가 */
  bidPrice?: number;
  /** 매도 1호가 */
  askPrice?: number;
  /** 거래 수량 (UI 표시용) */
  quantity?: number;
  
  // === Instrument 세부 정보 ===
  instrumentInfo?: {
    /** 상장 상태 */
    status?: string;
    /** 계약 타입 (선물의 경우) */
    contractType?: string;
    /** 상장 시간 */
    launchTime?: string;
    /** 만료 시간 (선물의 경우) */
    deliveryTime?: string;
    /** 만료 수수료율 (선물의 경우) */
    deliveryFeeRate?: string;
    /** 가격 스케일 */
    priceScale?: string;
    /** 레버리지 정보 */
    leverageFilter?: {
      minLeverage?: string;
      maxLeverage?: string;
      leverageStep?: string;
    };
    /** 가격 필터 */
    priceFilter?: {
      minPrice?: string;
      maxPrice?: string;
      tickSize?: string;
    };
    /** 로트 사이즈 필터 */
    lotSizeFilter?: any;
    /** 통합 마진 거래 가능 여부 */
    unifiedMarginTrade?: boolean;
    /** 펀딩 간격 (선물의 경우) */
    fundingInterval?: number;
    /** 정산 코인 */
    settleCoin?: string;
    /** 카피 트레이딩 지원 여부 */
    copyTrading?: string;
    /** 최대 펀딩률 */
    upperFundingRate?: string;
    /** 최소 펀딩률 */
    lowerFundingRate?: string;
    /** 프리 리스팅 여부 */
    isPreListing?: boolean;
    /** 프리 리스팅 정보 */
    preListingInfo?: any;
    /** 리스크 파라미터 */
    riskParameters?: any;
    /** 표시 이름 */
    displayName?: string;
    /** 혁신존 여부 (현물의 경우) */
    innovation?: string;
    /** 마진 거래 지원 여부 (현물의 경우) */
    marginTrading?: string;
    /** ST 태그 (현물의 경우) */
    stTag?: string;
    /** 옵션 타입 (옵션의 경우: Put, Call) */
    optionsType?: string;
    /** 한국어 이름 (Bithumb의 경우) */
    koreanName?: string;
    /** 영어 이름 (Bithumb의 경우) */
    englishName?: string;
  };
  
  // === Warning 정보 ===
  warningInfo?: {
    /** 경고 유형 */
    warningType?: WarningType;
    /** 경고 종료 날짜 */
    warningEndDate?: string;
    /** 시장 경고 (유의 종목 등) */
    marketWarning?: 'NONE' | 'CAUTION';
    /** 경고 활성 여부 */
    hasActiveWarning?: boolean;
    /** 사용자 정의 경고 메시지 */
    customWarningMessage?: string;
  };
  
  // === 메타데이터 ===
  metadata?: {
    /** 데이터 마지막 업데이트 시간 */
    lastUpdated?: Date;
    /** 데이터 소스 URL */
    dataSource?: string;
    /** 원본 API 응답 데이터 */
    rawApiResponse?: any;
    /** 데이터 품질 점수 (0-100) */
    qualityScore?: number;
    /** 데이터 신뢰도 */
    reliability?: 'HIGH' | 'MEDIUM' | 'LOW';
    /** 사용자 즐겨찾기 여부 */
    isFavorite?: boolean;
    /** 알림 설정 여부 */
    hasAlert?: boolean;
    /** 사용자 메모 */
    userNote?: string;
  };
  
  
  // === 거래소별 확장 정보 ===
  exchangeSpecific?: {
    /** Bybit 전용 정보 */
    bybit?: {
      /** USD 인덱스 가격 */
      usdIndexPrice?: string;
      /** 카테고리 */
      category?: string;
      /** 펀딩률 */
      fundingRate?: string;
      /** 다음 펀딩 시간 */
      nextFundingTime?: string;
      /** 오픈 인터레스트 */
      openInterest?: string;
      /** 오픈 인터레스트 값 */
      openInterestValue?: string;
    };
    /** Bithumb 전용 정보 */
    bithumb?: {
      /** 시가 */
      openingPrice?: string;
      /** 전일 종가(KST 0시 기준) */
      prevClosingPrice?: string;
      /** 거래대금 */
      accTradeValue?: string;
      /** 거래량 */
      unitsTraded?: string;
      /** 시장 분류 (KRW, BTC) */
      marketType?: 'KRW' | 'BTC';
    };
    /** Binance 전용 정보 */
    binance?: {
      /** 가중 평균 가격 */
      weightedAvgPrice?: string;
      /** 거래 횟수 */
      count?: number;
      /** 첫 거래 ID */
      firstId?: number;
      /** 마지막 거래 ID */
      lastId?: number;
    };
    /** Upbit 전용 정보 */
    upbit?: {
      /** 누적 거래량 */
      accTradeVolume?: number;
      /** 누적 거래대금 */
      accTradePrice?: number;
      /** 전일 종가(KST 0시 기준) */
      prevClosingPrice?: number;
      /** 전일 거래량 */
      prevAccTradeVolume?: number;
    };
  };
}

// 기존 warningType 필드는 warningInfo.warningType으로 이동하여 호환성 유지
// 하지만 기존 코드와의 호환성을 위해 루트 레벨에도 유지
export interface TickerDataLegacy extends TickerData {
  /** @deprecated warningInfo.warningType 사용 권장 */
  warningType?: WarningType;
}

/**
 * 티커 데이터 생성을 위한 유틸리티 함수 타입
 */
export interface TickerDataBuilder {
  /** 기본 티커 정보 설정 */
  setBasicInfo(info: {
    rawSymbol: string;
    integratedSymbol: string;
    baseCode: string;
    quoteCode: string;
    exchange: ExchangeType;
    integratedCategory: string;
    rawCategory: string;
  }): TickerDataBuilder;
  
  /** 가격 정보 설정 */
  setPriceInfo(info: {
    price: number;
    prevPrice24h: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    highPrice24h?: number;
    lowPrice24h?: number;
  }): TickerDataBuilder;
  
  /** 거래 정보 설정 */
  setTradeInfo(info: {
    volume24h: number;
    turnover24h: number;
    bidPrice?: number;
    askPrice?: number;
  }): TickerDataBuilder;
  
  /** Instrument 정보 설정 */
  setInstrumentInfo(info: NonNullable<TickerData['instrumentInfo']>): TickerDataBuilder;
  
  /** Warning 정보 설정 */
  setWarningInfo(info: NonNullable<TickerData['warningInfo']>): TickerDataBuilder;
  
  /** 메타데이터 설정 */
  setMetadata(info: NonNullable<TickerData['metadata']>): TickerDataBuilder;
  
  /** 거래소별 확장 정보 설정 */
  setExchangeSpecific(info: NonNullable<TickerData['exchangeSpecific']>): TickerDataBuilder;
  
  /** 최종 TickerData 객체 생성 */
  build(): TickerData;
}

// 거래소 코인 정보 상태 타입
export interface ExchangeInstrumentState {
  isLoading: boolean;
  error: string | null;
  
  // 함수 타입 정의
  fetchBybitCoins: (rawCategory: BybitRawCategory) => Promise<boolean>;
  fetchAllBybitCoins: () => Promise<boolean>;
  fetchBithumbCoins: (rawCategory: BithumbRawCategory) => Promise<boolean>;
  fetchAllBithumbCoins: () => Promise<boolean>;
  fetchExchangeCoins: (exchange: ExchangeType) => Promise<boolean>;
  fetchAllExchangeCoins: () => Promise<boolean>;
  clearSymbols: (exchange?: ExchangeType, category?: string) => void;
  getSymbolsForCategory: (exchange: ExchangeType, category: string) => string[];
  getFilteredCoins: (filter: {
    exchange?: ExchangeType;
    category?: string;
    baseCode?: string;
    quoteCode?: string;
  }) => CoinInfo[];
  getUniqueBaseCodes: (filter?: { exchange?: ExchangeType; category?: string }) => string[];
  getUniqueQuoteCodes: (filter?: { exchange?: ExchangeType; category?: string }) => string[];
}
