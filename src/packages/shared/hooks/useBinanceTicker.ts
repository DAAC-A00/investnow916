import { useState, useEffect, useCallback, useRef } from 'react';
import { TickerData } from '../types/exchange';
import { TickerSortBy, TickerSortOrder } from '../types/bithumb';
import { useBinanceTickerStore } from '../stores/createBinanceTickerStore';
import { TickerSorter } from '../utils/tickerSort';
import { TickerSearcher } from '../utils/tickerSearch';
import { SortStorage } from '../utils/sortStorage';
import { PriceDecimalTracker } from '../utils/priceFormatter';
import { DATA_UPDATE_INTERVALS } from '../constants/exchangeConfig';

// Binance 카테고리 타입
type BinanceCategory = 'spot' | 'um' | 'cm';

export interface UseBinanceTickerReturn {
  // 데이터 상태
  tickers: TickerData[];
  filteredTickers: TickerData[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // 검색 상태
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // 정렬 상태
  sortBy: TickerSortBy;
  sortOrder: TickerSortOrder;
  handleSortChange: (newSortBy: TickerSortBy) => void;
  
  // 유틸리티
  priceTracker: PriceDecimalTracker;
  refreshData: () => void;
  
  // Binance 전용
  category: BinanceCategory;
  setCategory: (category: BinanceCategory) => void;
}

export function useBinanceTicker(initialCategory: BinanceCategory = 'spot'): UseBinanceTickerReturn {
  // 가격 추적을 위한 ref
  const priceTracker = useRef(new PriceDecimalTracker());
  
  // Binance store 사용
  const {
    isLoading,
    error,
    tickers: tickersByCategory,
    lastUpdated,
    fetchTickers,
    getTickersForCategory,
    clearTickers,
  } = useBinanceTickerStore();
  
  // 상태 관리
  const [category, setCategory] = useState<BinanceCategory>(initialCategory);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // 정렬 설정 초기화
  const [sortBy, setSortBy] = useState<TickerSortBy>('changePercent');
  const [sortOrder, setSortOrder] = useState<TickerSortOrder>('desc');

  // 컴포넌트 마운트 시 localStorage에서 정렬 설정 복원
  useEffect(() => {
    const savedSettings = SortStorage.getSortSettings();
    setSortBy(savedSettings.sortBy);
    setSortOrder(savedSettings.sortOrder);
  }, []);

  // 현재 카테고리의 티커 데이터 가져오기
  const tickers = getTickersForCategory(category);

  // 마지막 업데이트 시간 설정
  useEffect(() => {
    if (lastUpdated[category]) {
      setLastUpdate(new Date(lastUpdated[category]));
    }
  }, [lastUpdated, category]);

  // 데이터 자동 업데이트
  useEffect(() => {
    // 초기 데이터 로드
    const loadData = async () => {
      try {
        await fetchTickers(category);
      } catch (err) {
        console.error(`Binance ${category} 티커 데이터 가져오기 실패:`, err);
      }
    };

    loadData();

    // Binance ticker 갱신 주기 사용
    const interval = setInterval(loadData, DATA_UPDATE_INTERVALS.ticker.binance);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((newSortBy: TickerSortBy) => {
    if (newSortBy === 'warning') {
      setSortBy('warning');
      setSortOrder('desc');
      SortStorage.saveSortSettings('warning', 'desc');
    } else if (newSortBy === sortBy) {
      const newSortOrder = TickerSorter.toggleSortOrder(sortOrder);
      setSortOrder(newSortOrder);
      SortStorage.saveSortSettings(sortBy, newSortOrder);
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
      SortStorage.saveSortSettings(newSortBy, 'desc');
    }
  }, [sortBy, sortOrder]);

  // 정렬된 티커 목록
  const sortedTickers = TickerSorter.sortTickers(tickers, sortBy, sortOrder);

  // 검색 필터링된 티커 목록
  const filteredTickers = TickerSearcher.filterTickers(sortedTickers, searchTerm);

  // 수동 새로고침
  const refreshData = useCallback(async () => {
    try {
      await fetchTickers(category);
    } catch (err) {
      console.error(`Binance ${category} 티커 데이터 새로고침 실패:`, err);
    }
  }, [category, fetchTickers]);

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((newCategory: BinanceCategory) => {
    setCategory(newCategory);
    setSearchTerm(''); // 검색어 초기화
    clearTickers(category); // 이전 카테고리 데이터 정리
  }, [category, clearTickers]);

  return {
    // 데이터 상태
    tickers,
    filteredTickers,
    isLoading,
    error,
    lastUpdate,
    
    // 검색 상태
    searchTerm,
    setSearchTerm,
    
    // 정렬 상태
    sortBy,
    sortOrder,
    handleSortChange,
    
    // 유틸리티
    priceTracker: priceTracker.current,
    refreshData,
    
    // Binance 전용
    category,
    setCategory: handleCategoryChange,
  };
} 