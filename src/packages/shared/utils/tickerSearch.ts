import { TickerData, WarningType } from '../types/exchange';
import { normalizeSearchTerm } from './keyboard';

/**
 * 검색 결과와 점수를 포함하는 인터페이스
 */
interface TickerSearchResult {
  ticker: TickerData;
  score: number;
}

/**
 * 검색 가능한 필드별 가중치 정의
 */
interface SearchFieldWeights {
  // 심볼 관련 (최우선)
  rawSymbol: number;
  integratedSymbol: number;
  baseCode: number;
  quoteCode: number;
  
  // 카테고리 관련
  integratedCategory: number;
  rawCategory: number;
  
  // 거래소 정보
  exchange: number;
  
  // 정산 및 수량 정보
  settlementCode: number;
  quantity: number;
  
  // 경고 정보
  warningType: number;
  marketWarning: number;
  
  // 이름 정보 (한국어/영어)
  koreanName: number;
  englishName: number;
  displayName: number;
  
  // 기타 메타데이터
  contractType: number;
  status: number;
  innovation: number;
  marginTrading: number;
  stTag: number;
  optionsType: number;
}

/**
 * 티커 데이터 검색을 위한 유틸리티 클래스
 */
export class TickerSearcher {
  /**
   * 검색 필드별 가중치 설정
   */
  private static readonly FIELD_WEIGHTS: SearchFieldWeights = {
    // 심볼 관련 (최우선 - 가중치 10-8)
    rawSymbol: 10,
    integratedSymbol: 10,
    baseCode: 8,
    quoteCode: 5,
    
    // 카테고리 관련 (가중치 3-2)
    integratedCategory: 3,
    rawCategory: 2,
    
    // 거래소 정보 (가중치 6)
    exchange: 6,
    
    // 정산 및 수량 정보 (가중치 4-3)
    settlementCode: 4,
    quantity: 3,
    
    // 경고 정보 (가중치 2-1)
    warningType: 2,
    marketWarning: 1,
    
    // 이름 정보 (가중치 7-5)
    koreanName: 7,
    englishName: 6,
    displayName: 5,
    
    // 기타 메타데이터 (가중치 2-1)
    contractType: 2,
    status: 2,
    innovation: 1,
    marginTrading: 1,
    stTag: 1,
    optionsType: 2,
  };

  /**
   * 검색어로 티커 목록을 필터링하고 관련성 순으로 정렬
   * @param tickers 검색할 티커 목록
   * @param searchTerm 검색어
   * @returns 필터링되고 정렬된 티커 목록
   */
  static filterTickers(tickers: TickerData[], searchTerm: string): TickerData[] {
    if (!searchTerm || !searchTerm.trim()) {
      return tickers;
    }

    // 검색어 정규화 및 다중 검색어 분리
    const normalizedSearchTerm = normalizeSearchTerm(searchTerm.trim());
    const searchTerms = normalizedSearchTerm.split(/\s+/).filter(term => term.length > 0);

    if (searchTerms.length === 0) {
      return tickers;
    }

    // 각 티커에 대해 검색 점수 계산
    const searchResults: TickerSearchResult[] = tickers
      .map(ticker => ({
        ticker,
        score: this.calculateSearchScore(ticker, searchTerms)
      }))
      .filter(result => result.score > 0); // 점수가 0보다 큰 것만 포함

    // 점수 기준 내림차순 정렬
    searchResults.sort((a, b) => b.score - a.score);

    return searchResults.map(result => result.ticker);
  }

  /**
   * 티커에 대한 전체 검색 점수 계산
   * @param ticker 검색 대상 티커
   * @param searchTerms 정규화된 검색어 배열
   * @returns 검색 점수 (0 이상)
   */
  private static calculateSearchScore(ticker: TickerData, searchTerms: string[]): number {
    let totalScore = 0;

    // 모든 검색어가 매칭되어야 함 (AND 조건)
    for (const searchTerm of searchTerms) {
      const termScore = this.getTermScore(ticker, searchTerm);
      if (termScore === 0) {
        return 0; // 하나라도 매칭되지 않으면 전체 점수 0
      }
      totalScore += termScore;
    }

    return totalScore;
  }

  /**
   * 단일 검색어에 대한 티커의 점수 계산
   * @param ticker 검색 대상 티커
   * @param searchTerm 정규화된 검색어
   * @returns 검색 점수 (0 이상)
   */
  private static getTermScore(ticker: TickerData, searchTerm: string): number {
    let maxScore = 0;

    // 기본 검색 필드들
    const basicFields = [
      { value: ticker.rawSymbol, weight: this.FIELD_WEIGHTS.rawSymbol },
      { value: ticker.integratedSymbol, weight: this.FIELD_WEIGHTS.integratedSymbol },
      { value: ticker.baseCode, weight: this.FIELD_WEIGHTS.baseCode },
      { value: ticker.quoteCode, weight: this.FIELD_WEIGHTS.quoteCode },
      { value: ticker.integratedCategory, weight: this.FIELD_WEIGHTS.integratedCategory },
      { value: ticker.rawCategory, weight: this.FIELD_WEIGHTS.rawCategory },
      { value: ticker.exchange, weight: this.FIELD_WEIGHTS.exchange },
      { value: ticker.settlementCode, weight: this.FIELD_WEIGHTS.settlementCode },
    ];

    // 수량 정보 (숫자를 문자열로 변환)
    if (ticker.quantity !== undefined && ticker.quantity !== null) {
      basicFields.push({ 
        value: ticker.quantity.toString(), 
        weight: this.FIELD_WEIGHTS.quantity 
      });
    }

    // 경고 정보
    if (ticker.warningInfo?.warningType) {
      basicFields.push({ 
        value: ticker.warningInfo.warningType, 
        weight: this.FIELD_WEIGHTS.warningType 
      });
    }
    if (ticker.warningInfo?.marketWarning) {
      basicFields.push({ 
        value: ticker.warningInfo.marketWarning, 
        weight: this.FIELD_WEIGHTS.marketWarning 
      });
    }

    // Instrument 정보에서 추가 검색 필드들
    if (ticker.instrumentInfo) {
      const instrumentFields = [
        { value: ticker.instrumentInfo.koreanName, weight: this.FIELD_WEIGHTS.koreanName },
        { value: ticker.instrumentInfo.englishName, weight: this.FIELD_WEIGHTS.englishName },
        { value: ticker.instrumentInfo.displayName, weight: this.FIELD_WEIGHTS.displayName },
        { value: ticker.instrumentInfo.contractType, weight: this.FIELD_WEIGHTS.contractType },
        { value: ticker.instrumentInfo.status, weight: this.FIELD_WEIGHTS.status },
        { value: ticker.instrumentInfo.innovation, weight: this.FIELD_WEIGHTS.innovation },
        { value: ticker.instrumentInfo.marginTrading, weight: this.FIELD_WEIGHTS.marginTrading },
        { value: ticker.instrumentInfo.stTag, weight: this.FIELD_WEIGHTS.stTag },
        { value: ticker.instrumentInfo.optionsType, weight: this.FIELD_WEIGHTS.optionsType },
        { value: ticker.instrumentInfo.settleCoin, weight: this.FIELD_WEIGHTS.settlementCode }, // settleCoin도 정산 코드로 취급
      ];
      basicFields.push(...instrumentFields);
    }

    // 모든 필드에 대해 점수 계산
    for (const field of basicFields) {
      if (!field.value) continue;

      const normalizedValue = normalizeSearchTerm(field.value.toLowerCase());
      const score = this.calculateFieldScore(normalizedValue, searchTerm, field.weight);
      maxScore = Math.max(maxScore, score);
    }

    return maxScore;
  }

  /**
   * 필드 점수 계산
   * @param normalizedValue 필드 값 (정규화된)
   * @param searchTerm 검색어 (정규화된)
   * @param weight 필드 가중치
   * @returns 필드 점수
   */
  private static calculateFieldScore(normalizedValue: string, searchTerm: string, weight: number): number {
    if (!normalizedValue.includes(searchTerm)) {
      return 0;
    }

    // 정확한 매칭일수록 높은 점수
    let matchScore = weight;
    
    // 완전 일치 시 보너스 점수
    if (normalizedValue === searchTerm) {
      matchScore *= 2;
    }
    // 시작 부분 매칭 시 보너스 점수
    else if (normalizedValue.startsWith(searchTerm)) {
      matchScore *= 1.5;
    }
    
    return matchScore;
  }

  /**
   * 단일 검색어가 티커와 매칭되는지 확인 (하위 호환성을 위한 메서드)
   * @param ticker 검색 대상 티커
   * @param searchTerm 검색어
   * @returns 매칭 여부
   */
  private static matchesSearchTerm(ticker: TickerData, searchTerm: string): boolean {
    if (!searchTerm || !searchTerm.trim()) {
      return true;
    }

    const normalizedSearchTerm = normalizeSearchTerm(searchTerm.trim().toLowerCase());
    
    // 확장된 검색 대상 필드들
    const searchableFields = [
      // 기본 필드들
      ticker.rawSymbol,
      ticker.integratedSymbol,
      ticker.baseCode,
      ticker.quoteCode,
      ticker.integratedCategory,
      ticker.rawCategory,
      ticker.exchange,
      ticker.settlementCode,
      
      // 수량 정보
      ticker.quantity?.toString(),
      
      // 경고 정보
      ticker.warningInfo?.warningType,
      ticker.warningInfo?.marketWarning,
      
      // Instrument 정보
      ticker.instrumentInfo?.koreanName,
      ticker.instrumentInfo?.englishName,
      ticker.instrumentInfo?.displayName,
      ticker.instrumentInfo?.contractType,
      ticker.instrumentInfo?.status,
      ticker.instrumentInfo?.innovation,
      ticker.instrumentInfo?.marginTrading,
      ticker.instrumentInfo?.stTag,
      ticker.instrumentInfo?.optionsType,
      ticker.instrumentInfo?.settleCoin,
    ].filter(Boolean);

    return searchableFields.some(field => {
      const normalizedField = normalizeSearchTerm(field!.toLowerCase());
      return normalizedField.includes(normalizedSearchTerm);
    });
  }

  /**
   * 검색어가 유효한지 확인합니다
   */
  static isValidSearchTerm(searchTerm: string): boolean {
    const normalized = normalizeSearchTerm(searchTerm);
    return normalized.length > 0;
  }

  /**
   * 검색 결과 통계를 반환합니다
   */
  static getSearchStats(totalCount: number, filteredCount: number, searchTerm: string): {
    totalCount: number;
    filteredCount: number;
    searchTerm: string;
    isFiltered: boolean;
  } {
    return {
      totalCount,
      filteredCount,
      searchTerm,
      isFiltered: searchTerm.length > 0
    };
  }
} 