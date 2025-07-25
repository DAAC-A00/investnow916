'use client';

import { useEffect, useState } from 'react';
import { useExchangeCoinsStore, ExchangeInstrumentState } from '../stores/useExchangeCoinsStore';
import { BybitRawCategory, ExchangeType } from '../types/exchange';
import { EXCHANGE_CONFIGS } from '../constants/exchange';
import { needsUpdate } from '../constants/updateConfig';

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
  exchanges = ['bybit', 'bithumb', 'binance'],
  category,
  autoFetch = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const fetchBybitCoins = useExchangeCoinsStore((state: ExchangeInstrumentState) => state.fetchBybitCoins); // selector에서 state 파라미터에 타입 명시 (타입 안전)
  const fetchExchangeCoins = useExchangeCoinsStore((state: ExchangeInstrumentState) => state.fetchExchangeCoins);
  const getSymbolsForCategory = useExchangeCoinsStore((state: ExchangeInstrumentState) => state.getSymbolsForCategory);

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
            for (const cat of EXCHANGE_CONFIGS.bybit.rawCategories) {
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
