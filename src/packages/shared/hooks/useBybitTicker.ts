import { useState, useEffect, useCallback, useRef } from 'react';
import { TickerData } from '../types/exchange';
import { TickerSortBy, TickerSortOrder } from '../types/bithumb';
import { useBybitTickerStore } from '../stores/createBybitTickerStore';
import { TickerSorter } from '../utils/tickerSort';
import { TickerSearcher } from '../utils/tickerSearch';
import { SortStorage } from '../utils/sortStorage';
import { PriceDecimalTracker } from '../utils/priceFormatter';
import { DATA_UPDATE_INTERVALS } from '../constants/exchangeConfig';
import { BybitRawCategory } from '../constants/exchangeCategories';

export interface UseBybitTickerReturn {
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
  
  // Bybit 전용
  category: BybitRawCategory;
  setCategory: (category: BybitRawCategory) => void;
}

export function useBybitTicker(initialCategory: BybitRawCategory = 'spot'): UseBybitTickerReturn {
  // 가격 추적을 위한 ref
  const priceTracker = useRef(new PriceDecimalTracker());
  
  // Bybit store 사용
  const {
    isLoading,
    error,
    tickers: tickersByCategory,
    lastUpdated,
    fetchTickers,
    getTickersForCategory,
    clearTickers,
  } = useBybitTickerStore();
  
  // 상태 관리
  const [category, setCategory] = useState<BybitRawCategory>(initialCategory);
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
        console.error(`Bybit ${category} 티커 데이터 가져오기 실패:`, err);
      }
    };

    loadData();

    const interval = setInterval(loadData, DATA_UPDATE_INTERVALS.ticker.bybit);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]); // fetchTickers는 의존성에서 제외 (zustand store 함수는 항상 최신 상태를 참조)

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((newSortBy: TickerSortBy) => {
    if (newSortBy === 'warning') {
      // 주의 정렬은 항상 경고가 있는 티커를 상단에 배치
      setSortBy('warning');
      setSortOrder('desc');
      SortStorage.saveSortSettings('warning', 'desc');
    } else if (newSortBy === sortBy) {
      // 같은 항목 클릭시 정렬 순서 변경
      const newSortOrder = TickerSorter.toggleSortOrder(sortOrder);
      setSortOrder(newSortOrder);
      SortStorage.saveSortSettings(sortBy, newSortOrder);
    } else {
      // 다른 항목 클릭시 해당 항목으로 변경하고 내림차순으로 설정
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
  const refreshData = useCallback(() => {
    fetchTickers(category).catch(err => {
      console.error(`Bybit ${category} 티커 데이터 새로고침 실패:`, err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]); // fetchTickers는 의존성에서 제외 (zustand store 함수는 항상 최신 상태를 참조)

  // 카테고리 변경 시 데이터 리셋
  const handleCategoryChange = useCallback((newCategory: BybitRawCategory) => {
    setCategory(newCategory);
    setSearchTerm(''); // 검색어 초기화
  }, []);

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
    
    // Bybit 전용
    category,
    setCategory: handleCategoryChange,
  };
} 