import { TickerSortSettings, TickerSortBy, TickerSortOrder } from '../types/bithumb';

export class SortStorage {
  private static readonly SORT_STORAGE_KEY = 'bithumb_ticker_sort_settings';

  /**
   * 정렬 설정을 로컬 스토리지에 저장합니다
   */
  static saveSortSettings(sortBy: TickerSortBy, sortOrder: TickerSortOrder): void {
    try {
      const settings: TickerSortSettings = { sortBy, sortOrder };
      localStorage.setItem(this.SORT_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('정렬 설정을 저장하는데 실패했습니다:', error);
    }
  }

  /**
   * 로컬 스토리지에서 정렬 설정을 불러옵니다
   */
  static loadSortSettings(): TickerSortSettings | null {
    try {
      const saved = localStorage.getItem(this.SORT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as TickerSortSettings;
      }
      return null;
    } catch (error) {
      console.warn('정렬 설정을 불러오는데 실패했습니다:', error);
      return null;
    }
  }

  /**
   * 기본 정렬 설정을 반환합니다
   */
  static getDefaultSortSettings(): TickerSortSettings {
    return {
      sortBy: 'changePercent',
      sortOrder: 'desc'
    };
  }

  /**
   * 정렬 설정을 초기화합니다
   */
  static clearSortSettings(): void {
    try {
      localStorage.removeItem(this.SORT_STORAGE_KEY);
    } catch (error) {
      console.warn('정렬 설정을 초기화하는데 실패했습니다:', error);
    }
  }

  /**
   * 정렬 설정을 불러오거나 기본값을 반환합니다
   */
  static getSortSettings(): TickerSortSettings {
    const saved = this.loadSortSettings();
    return saved ?? this.getDefaultSortSettings();
  }
} 