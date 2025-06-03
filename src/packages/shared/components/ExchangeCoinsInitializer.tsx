'use client';

import { useEffect, useState } from 'react';
import { useExchangeCoinsStore } from '../stores/createExchangeInstrumentStore';
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
    isLoading, 
    error,
    fetchBybitCoins, 
    fetchExchangeCoins,
    getSymbolsForCategory
  } = useExchangeCoinsStore();

  // 마운트 상태 체크 (하이드레이션 이슈 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 자동 데이터 가져오기
  useEffect(() => {
    if (!mounted || !autoFetch) return;

    const fetchData = async () => {
      if (exchange === 'bybit') {
        if (category) {
          // 특정 카테고리만 가져오기
          // 해당 카테고리의 심볼 데이터가 있는지 확인
          const symbols = getSymbolsForCategory(exchange, category);
          const hasData = symbols.length > 0;
          
          // 데이터가 없으면 가져오기
          if (!hasData) {
            await fetchBybitCoins(category);
          }
        } else {
          // Bybit의 모든 카테고리 데이터 가져오기
          const categories: BybitCategoryType[] = ['spot', 'linear', 'inverse', 'option'];
          for (const cat of categories) {
            // 해당 카테고리의 심볼 데이터가 있는지 확인
            const symbols = getSymbolsForCategory(exchange, cat);
            const hasData = symbols.length > 0;
            
            // 데이터가 없으면 가져오기
            if (!hasData) {
              await fetchBybitCoins(cat);
            }
          }
        }
      } else {
        // 전체 거래소 데이터 가져오기
        await fetchExchangeCoins(exchange);
      }
    };

    // 데이터 가져오기 실행
    fetchData();
  }, [mounted, autoFetch, exchange, category, fetchBybitCoins, fetchExchangeCoins, getSymbolsForCategory]);

  // 하이드레이션 전에는 아무것도 렌더링하지 않음
  if (!mounted) return null;

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
};

export default ExchangeCoinsInitializer;
