import { TickerData } from '../types/exchange';

export class TickerSearcher {
  /**
   * 티커 데이터를 검색 조건으로 필터링합니다
   */
  static filterTickers(tickers: TickerData[], searchTerm: string): TickerData[] {
    if (!searchTerm) return tickers;
    
    const searchLower = searchTerm.toLowerCase();
    
    return tickers.filter(ticker => {
      const searchableText = this.getSearchableText(ticker).toLowerCase();
      
      // 검색어를 공백으로 분리하여 AND 검색 수행
      const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * 티커 데이터에서 검색 가능한 텍스트를 추출합니다
   */
  private static getSearchableText(ticker: TickerData): string {
    return `${ticker.rawSymbol}${ticker.integratedSymbol}${ticker.baseCode}${ticker.quoteCode}${ticker.integratedCategory}${ticker.rawCategory}`;
  }

  /**
   * 검색어를 정규화합니다 (공백 제거, 소문자 변환)
   */
  static normalizeSearchTerm(searchTerm: string): string {
    return searchTerm.trim().toLowerCase();
  }

  /**
   * 검색어가 유효한지 확인합니다
   */
  static isValidSearchTerm(searchTerm: string): boolean {
    const normalized = this.normalizeSearchTerm(searchTerm);
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