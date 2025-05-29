'use client';

import { useEffect, useState } from 'react';
import { useExchangeCoinsStore } from '../stores/createExchangeCoinsStore';
import { BybitCategoryType, ExchangeType } from '../types/exchange';

interface ExchangeCoinsInitializerProps {
  exchange?: ExchangeType;
  category?: BybitCategoryType;
  autoFetch?: boolean;
}

/**
 * 거래소 코인 정보를 초기화하는 컴포넌트
 * localStorage에서 데이터를 불러오고, 필요시 API에서 최신 데이터를 가져옵니다.
 */
export const ExchangeCoinsInitializer: React.FC<ExchangeCoinsInitializerProps> = ({
  exchange = 'bybit',
  category,
  autoFetch = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const { 
    coins, 
    lastUpdated, 
    isLoading, 
    error,
    fetchBybitCoins, 
    fetchExchangeCoins 
  } = useExchangeCoinsStore();

  // 마운트 상태 체크 (하이드레이션 이슈 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 자동 데이터 가져오기
  useEffect(() => {
    if (!mounted || !autoFetch) return;

    const fetchData = async () => {
      if (exchange === 'bybit' && category) {
        // 특정 카테고리만 가져오기
        await fetchBybitCoins(category);
      } else {
        // 전체 거래소 데이터 가져오기
        await fetchExchangeCoins(exchange);
      }
    };

    // 마지막 업데이트 시간 확인
    const lastUpdate = category 
      ? lastUpdated[exchange]?.[category] 
      : Object.values(lastUpdated[exchange] || {}).find(Boolean);

    // 데이터가 없거나 마지막 업데이트가 1시간 이상 지났으면 새로 가져오기
    const needsUpdate = !lastUpdate || 
      (new Date().getTime() - new Date(lastUpdate).getTime() > 60 * 60 * 1000);

    if (needsUpdate) {
      fetchData();
    }
  }, [mounted, autoFetch, exchange, category, lastUpdated, fetchBybitCoins, fetchExchangeCoins]);

  // 하이드레이션 전에는 아무것도 렌더링하지 않음
  if (!mounted) return null;

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
};

export default ExchangeCoinsInitializer;
