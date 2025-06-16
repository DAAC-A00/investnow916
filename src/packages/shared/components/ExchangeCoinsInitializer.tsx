'use client';

import { useEffect, useState } from 'react';
import { useExchangeCoinsStore } from '../stores/createExchangeInstrumentStore';
import { BybitRawCategory, ExchangeType } from '../types/exchange';
import { ALL_RAW_CATEGORIES, toDisplayCategory } from '../constants/bybitCategories';
import { 
  getUpdateInterval,
  needsDataUpdate
} from '../constants/updateConfig';

interface ExchangeCoinsInitializerProps {
  exchanges?: ExchangeType[];
  category?: BybitRawCategory;
  autoFetch?: boolean;
}

/**
 * 거래소 코인 정보를 초기화하는 컴포넌트
 * localStorage에서 데이터를 불러오고, 필요시 API에서 최신 데이터를 가져옵니다.
 */
export const ExchangeCoinsInitializer: React.FC<ExchangeCoinsInitializerProps> = ({
  exchanges = ['bybit', 'bithumb'],
  category,
  autoFetch = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const { 
    isLoading, 
    error,
    fetchBybitCoins, 
    fetchExchangeCoins,
    getSymbolsForCategory
  } = useExchangeCoinsStore();

  // 로컬 스토리지 접근 함수들 (store에서 가져온 로직)
  const toStorageCategory = (category: string): string => {
    // Bybit 카테고리 변환 시도
    const bybitDisplayCategory = toDisplayCategory(category as BybitRawCategory);
    if (bybitDisplayCategory) {
      return bybitDisplayCategory;
    }
    
    return category;
  };

  const getStorageKey = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
    // isRawCategory가 true이면 API 요청용 카테고리이므로 저장용으로 변환
    const storageCategory = isRawCategory ? toStorageCategory(category) : category;
    return `${exchange}-${storageCategory}`;
  };

  const getUpdateTimeKey = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
    const storageKey = getStorageKey(exchange, category, isRawCategory);
    return `${storageKey}-updateTime`;
  };

  const getUpdateTime = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): Date | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = getUpdateTimeKey(exchange, category, isRawCategory);
      const timeStr = localStorage.getItem(key);
      return timeStr ? new Date(timeStr) : null;
    } catch (error) {
      console.error(`업데이트 시간 조회 실패 (${exchange}-${category}):`, error);
      return null;
    }
  };

  const getStoredSymbols = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
    if (typeof window === 'undefined') return '';
    
    const key = getStorageKey(exchange, category, isRawCategory);
    const storedValue = localStorage.getItem(key);
    return storedValue || '';
  };

  const needsUpdate = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): boolean => {
    // 1. 로컬 스토리지에 데이터가 있는지 확인
    const storedData = getStoredSymbols(exchange, category, isRawCategory);
    if (!storedData || storedData.trim() === '' || storedData === '[]') {
      console.log(`${exchange} ${category} 데이터가 로컬 스토리지에 없습니다. 갱신이 필요합니다.`);
      return true; // 데이터가 없으면 갱신 필요
    }
    
    // 2. 업데이트 시간 확인
    const updateTime = getUpdateTime(exchange, category, isRawCategory);
    if (!updateTime) {
      console.log(`${exchange} ${category} 업데이트 시간 정보가 없습니다. 갱신이 필요합니다.`);
      return true; // 업데이트 시간이 없으면 갱신 필요
    }
    
    // 3. 중앙 관리 설정을 사용하여 갱신 필요 여부 확인
    const needsRefresh = needsDataUpdate(updateTime, exchange);
    const updateInterval = getUpdateInterval(exchange);
    const now = new Date();
    const diffHours = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
    
    if (needsRefresh) {
      console.log(`${exchange} ${category} 데이터가 ${diffHours.toFixed(1)}시간 전에 업데이트되었습니다. ${updateInterval}시간 주기로 갱신이 필요합니다.`);
    } else {
      console.log(`${exchange} ${category} 데이터가 ${diffHours.toFixed(1)}시간 전에 업데이트되었습니다. ${updateInterval}시간 주기 내에서 최신 상태입니다.`);
    }
    
    return needsRefresh;
  };

  // 마운트 상태 체크 (하이드레이션 이슈 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 자동 데이터 가져오기
  useEffect(() => {
    if (!mounted || !autoFetch) return;

    const fetchData = async () => {
      // 모든 지정된 거래소에 대해 데이터 가져오기
      for (const exchange of exchanges) {
        if (exchange === 'bybit') {
          if (category) {
            // 특정 카테고리만 가져오기
            const symbols = getSymbolsForCategory(exchange, category);
            const hasData = symbols.length > 0;
            
            // 데이터가 없거나 갱신이 필요하면 가져오기
            if (!hasData || needsUpdate(exchange, category, true)) {
              console.log(`Bybit ${category} 데이터를 갱신합니다...`);
              await fetchBybitCoins(category);
            }
          } else {
            // Bybit의 모든 카테고리 데이터 가져오기
            for (const cat of ALL_RAW_CATEGORIES) {
              // 해당 카테고리의 심볼 데이터가 있는지 확인
              const symbols = getSymbolsForCategory(exchange, cat);
              const hasData = symbols.length > 0;
              
              // 데이터가 없거나 갱신이 필요하면 가져오기
              if (!hasData || needsUpdate(exchange, cat, true)) {
                console.log(`Bybit ${cat} 데이터를 갱신합니다...`);
                await fetchBybitCoins(cat);
              }
            }
          }
        } else {
          // Bithumb 등 다른 거래소 데이터 가져오기
          const symbols = getSymbolsForCategory(exchange, 'spot');
          const hasData = symbols.length > 0;
          
          // 데이터가 없거나 갱신이 필요하면 가져오기
          if (!hasData || needsUpdate(exchange, 'spot', false)) {
            console.log(`${exchange} spot 데이터를 갱신합니다...`);
            await fetchExchangeCoins(exchange);
          }
        }
      }
    };

    // 데이터 가져오기 실행
    fetchData();
  }, [mounted, autoFetch, exchanges, category, fetchBybitCoins, fetchExchangeCoins, getSymbolsForCategory]);

  // 하이드레이션 전에는 아무것도 렌더링하지 않음
  if (!mounted) return null;

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
};

export default ExchangeCoinsInitializer;
