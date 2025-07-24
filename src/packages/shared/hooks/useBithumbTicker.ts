import { useState, useEffect, useCallback, useRef } from 'react';
import { TickerData } from '../types/exchange';
import { TickerSortBy, TickerSortOrder } from '../types/bithumb';
import { BithumbApiClient } from '../utils/bithumbApiClient';
import { TickerSorter } from '../utils/tickerSort';
import { TickerSearcher } from '../utils/tickerSearch';
import { SortStorage } from '../utils/sortStorage';
import { PriceDecimalTracker } from '../utils/priceFormatter';
import { DATA_UPDATE_INTERVALS } from '../constants/exchange';

export interface UseBithumbTickerReturn {
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
}

export function useBithumbTicker(): UseBithumbTickerReturn {
  // 가격 추적을 위한 ref
  const priceTracker = useRef(new PriceDecimalTracker());
  const apiClient = useRef(new BithumbApiClient(priceTracker.current));
  
  // 상태 관리
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [beforeTickers, setBeforeTickers] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
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

  // 티커 데이터 가져오기
  const fetchTickerData = useCallback(async () => {
    try {
      setError(null);
      
      const tickerDataList = await apiClient.current.fetchTickerData();
      
      console.log('TickerData 변환 완료:', tickerDataList.length);
      
      // 현재 티커 데이터를 이전 데이터로 저장 (애니메이션용)
      setTickers(prevTickers => {
        setBeforeTickers(prevTickers); // 이전 상태를 beforeTickers로 저장
        return tickerDataList;
      });
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error('빗썸 티커 데이터 가져오기 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, []); // 의존성 배열 제거

  // 데이터 자동 업데이트
  useEffect(() => {
    // 초기 데이터 로드
    fetchTickerData();

    const interval = setInterval(fetchTickerData, DATA_UPDATE_INTERVALS.ticker.bithumb);

    return () => clearInterval(interval);
  }, [fetchTickerData]); // 빈 의존성 배열로 마운트 시에만 실행

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
    setIsLoading(true);
    fetchTickerData();
  }, [fetchTickerData]);

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
  };
} 