import { useState, useEffect, useCallback, useRef } from 'react';
import { TickerData } from '../types/exchange';
import { TickerSortBy, TickerSortOrder } from '../types/bithumb';
import { useBithumbTicker } from './useBithumbTicker';
import { useBybitTicker } from './useBybitTicker';
import { TickerSorter } from '../utils/tickerSort';
import { TickerSearcher } from '../utils/tickerSearch';
import { SortStorage } from '../utils/sortStorage';
import { PriceDecimalTracker } from '../utils/priceFormatter';
import { BybitRawCategory } from '../constants/exchangeCategories';

export type IntegratedCategory = 'spot' | 'um' | 'cm';

export interface UseIntegratedTickerReturn {
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
  
  // 통합 전용
  category: IntegratedCategory;
  setCategory: (category: IntegratedCategory) => void;
  
  // 통계 정보
  stats: {
    bithumbCount: number;
    bybitCount: number;
    totalCount: number;
  };
}

// 카테고리 매핑 함수
const getBybitCategoryFromIntegrated = (integratedCategory: IntegratedCategory): BybitRawCategory => {
  switch (integratedCategory) {
    case 'spot':
      return 'spot';
    case 'um':
      return 'linear';
    case 'cm':
      return 'inverse';
    default:
      return 'spot';
  }
};

// 티커 데이터 필터링 함수
const filterTickersByCategory = (tickers: TickerData[], category: IntegratedCategory): TickerData[] => {
  return tickers.filter(ticker => {
    // Bithumb은 항상 spot으로 간주
    if (ticker.exchange === 'bithumb') {
      return category === 'spot';
    }
    
    // Bybit의 경우 카테고리 매핑
    if (ticker.exchange === 'bybit') {
      const bybitCategory = getBybitCategoryFromIntegrated(category);
      return ticker.rawCategory === bybitCategory;
    }
    
    return false;
  });
};

export function useIntegratedTicker(initialCategory: IntegratedCategory = 'spot'): UseIntegratedTickerReturn {
  // 가격 추적을 위한 ref
  const priceTracker = useRef(new PriceDecimalTracker());
  
  // 개별 거래소 훅들
  const bithumbTicker = useBithumbTicker();
  const bybitTicker = useBybitTicker('spot');
  
  // 상태 관리
  const [category, setCategory] = useState<IntegratedCategory>(initialCategory);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 정렬 설정 초기화
  const [sortBy, setSortBy] = useState<TickerSortBy>('changePercent');
  const [sortOrder, setSortOrder] = useState<TickerSortOrder>('desc');

  // 컴포넌트 마운트 시 localStorage에서 정렬 설정 복원
  useEffect(() => {
    const savedSettings = SortStorage.getSortSettings();
    setSortBy(savedSettings.sortBy);
    setSortOrder(savedSettings.sortOrder);
  }, []);

  // 카테고리 변경 시 Bybit 카테고리도 업데이트
  useEffect(() => {
    const bybitCategory = getBybitCategoryFromIntegrated(category);
    bybitTicker.setCategory(bybitCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]); // bybitTicker는 의존성에서 제외 - 훅 객체는 항상 최신 상태를 참조

  // 통합 티커 데이터 계산
  const allTickers = [
    ...bithumbTicker.tickers,
    ...bybitTicker.tickers,
  ];

  // 카테고리별 필터링된 티커 데이터
  const categoryFilteredTickers = filterTickersByCategory(allTickers, category);

  // 로딩 상태 계산
  const isLoading = bithumbTicker.isLoading || bybitTicker.isLoading;
  
  // 에러 상태 계산 (두 거래소 모두 에러인 경우만 에러로 처리)
  const error = (bithumbTicker.error && bybitTicker.error) 
    ? `Bithumb: ${bithumbTicker.error}, Bybit: ${bybitTicker.error}`
    : null;

  // 마지막 업데이트 시간 계산
  const lastUpdate = [bithumbTicker.lastUpdate, bybitTicker.lastUpdate]
    .filter(Boolean)
    .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null;

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
  const sortedTickers = TickerSorter.sortTickers(categoryFilteredTickers, sortBy, sortOrder);

  // 검색 필터링된 티커 목록
  const filteredTickers = TickerSearcher.filterTickers(sortedTickers, searchTerm);

  // 수동 새로고침
  const refreshData = useCallback(() => {
    bithumbTicker.refreshData();
    bybitTicker.refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열 제거 - 티커 훅들의 refreshData 함수는 항상 최신 상태를 참조

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((newCategory: IntegratedCategory) => {
    setCategory(newCategory);
    setSearchTerm(''); // 검색어 초기화
  }, []);

  // 통계 정보 계산
  const stats = {
    bithumbCount: filterTickersByCategory(bithumbTicker.tickers, category).length,
    bybitCount: filterTickersByCategory(bybitTicker.tickers, category).length,
    totalCount: categoryFilteredTickers.length,
  };

  return {
    // 데이터 상태
    tickers: categoryFilteredTickers,
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
    
    // 통합 전용
    category,
    setCategory: handleCategoryChange,
    
    // 통계 정보
    stats,
  };
} 