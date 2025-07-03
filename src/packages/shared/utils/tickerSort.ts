import { TickerData } from '../types/exchange';
import { TickerSortBy, TickerSortOrder } from '../types/bithumb';

export class TickerSorter {
  /**
   * 티커 데이터를 정렬합니다
   */
  static sortTickers(
    tickers: TickerData[], 
    sortBy: TickerSortBy, 
    sortOrder: TickerSortOrder
  ): TickerData[] {
    if (sortBy === 'warning') {
      return this.sortByWarning(tickers);
    }

    const sorted = [...tickers].sort((a, b) => {
      let valueA: number | string;
      let valueB: number | string;

      switch (sortBy) {
        case 'changePercent':
          valueA = a.priceChangePercent24h;
          valueB = b.priceChangePercent24h;
          break;
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'volume':
          valueA = a.volume24h;
          valueB = b.volume24h;
          break;
        case 'turnover':
          valueA = a.turnover24h;
          valueB = b.turnover24h;
          break;
        case 'symbol':
          valueA = a.integratedSymbol;
          valueB = b.integratedSymbol;
          break;
        default:
          valueA = a.priceChangePercent24h;
          valueB = b.priceChangePercent24h;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'desc' 
          ? valueB.localeCompare(valueA)
          : valueA.localeCompare(valueB);
      }

      const numA = valueA as number;
      const numB = valueB as number;
      return sortOrder === 'desc' ? numB - numA : numA - numB;
    });

    return sorted;
  }

  /**
   * 주의/경고 기준으로 정렬합니다
   */
  private static sortByWarning(tickers: TickerData[]): TickerData[] {
    // 주의 정렬: 경고가 있는 티커를 상단에, 없는 티커를 하단에 배치
    // 각 그룹 내에서는 거래대금 내림차순으로 정렬
    const withWarnings: TickerData[] = [];
    const withoutWarnings: TickerData[] = [];

    tickers.forEach(ticker => {
      const hasWarning = ticker.warningInfo?.warningType !== undefined;
      const hasMarketWarning = ticker.warningInfo?.marketWarning === 'CAUTION';
      
      if (hasWarning || hasMarketWarning) {
        withWarnings.push(ticker);
      } else {
        withoutWarnings.push(ticker);
      }
    });

    // 각 그룹 내에서 거래대금 내림차순 정렬
    const sortByTurnover = (a: TickerData, b: TickerData) => b.turnover24h - a.turnover24h;
    withWarnings.sort(sortByTurnover);
    withoutWarnings.sort(sortByTurnover);

    // 경고가 있는 티커를 상단에, 없는 티커를 하단에 배치
    return [...withWarnings, ...withoutWarnings];
  }

  /**
   * 정렬 방향을 토글합니다
   */
  static toggleSortOrder(currentOrder: TickerSortOrder): TickerSortOrder {
    return currentOrder === 'desc' ? 'asc' : 'desc';
  }
} 