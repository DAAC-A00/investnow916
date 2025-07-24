import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { CoinInfo, ExchangeInstrumentState } from '@/packages/shared/types/exchange';
import { SUPPORTED_EXCHANGES, ExchangeType } from '@/packages/shared/constants/exchange';
import { toIntegratedCategory } from '@/packages/shared/constants/exchange/utils';
import { useExchangeInstrumentStore } from './createExchangeInstrumentStore';

// getStoredSymbols 직접 구현 (복사)
const getStoredSymbols = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  if (typeof window === 'undefined') return '';
  // isRawCategory가 true이면 rawCategory를 integratedCategory로 변환
  const storageCategory = isRawCategory ? toIntegratedCategory(exchange, category) : category;
  const key = `${exchange}-${storageCategory}`;
  const storedValue = localStorage.getItem(key);
  
  if (!storedValue) return '';
  
  // 시간 정보가 포함된 형태인지 확인 (:::로 구분)
  const timeDataSeparator = ':::';
  if (storedValue.includes(timeDataSeparator)) {
    const [, symbolData] = storedValue.split(timeDataSeparator);
    return symbolData || '';
  }
  
  // 기존 형태의 데이터는 그대로 반환
  return storedValue;
};

// 내부 getCategoriesForExchange 함수 복사 (integratedCategory 반환)
const getCategoriesForExchange = (exchange: ExchangeType): string[] => {
  switch (exchange) {
    case 'bybit':
      return ['spot', 'um', 'cm']; // integratedCategory 반환
    case 'bithumb':
      return ['spot'];
    default:
      return [];
  }
};

// 초기 상태 (필요시 확장)
const initialState = {
  isLoading: false,
  error: null,
};

export type { ExchangeInstrumentState };

export const useExchangeCoinsStore = create<ExchangeInstrumentState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,
      fetchBybitCoins: async () => true,
      fetchBithumbCoins: async () => true,
      fetchAllBybitCoins: async () => true,
      fetchAllBithumbCoins: async () => true,
      fetchBinanceCoins: async () => {
        const instrumentStore = useExchangeInstrumentStore.getState();
        return await instrumentStore.fetchBinanceCoins();
      },
      fetchAllBinanceCoins: async () => {
        const instrumentStore = useExchangeInstrumentStore.getState();
        return await instrumentStore.fetchAllBinanceCoins();
      },
      fetchExchangeCoins: async () => true,
      fetchAllExchangeCoins: async () => true,
      getSymbolsForCategory: () => [],
      getFilteredCoins: (filter: {
        exchange?: ExchangeType;
        category?: string;
        baseCode?: string;
        quoteCode?: string;
      }) => {
        const seenSymbols = new Set<string>();
        const allCoins: CoinInfo[] = [];
        // SUPPORTED_EXCHANGES를 mutable 배열로 변환
        const exchanges: ExchangeType[] = filter.exchange ? [filter.exchange] : [...SUPPORTED_EXCHANGES];
        for (const ex of exchanges) {
          const categories: string[] = filter.category ? [filter.category] : getCategoriesForExchange(ex);
          for (const cat of categories) {
            const stored = getStoredSymbols(ex, cat, false) || '';
            let symbols: any[] = [];
            try {
              symbols = JSON.parse(stored);
            } catch {}
            for (const symbol of symbols) {
              // displaySymbol이 없을 경우 대비 any 처리
              const symbolKey = `${ex}:${(symbol as any).displaySymbol}`;
              if (seenSymbols.has(symbolKey)) continue;
              if (filter.baseCode && (symbol as any).baseCode?.toUpperCase() !== filter.baseCode.toUpperCase()) continue;
              if (filter.quoteCode && (symbol as any).quoteCode?.toUpperCase() !== filter.quoteCode.toUpperCase()) continue;
              seenSymbols.add(symbolKey);
              const coin: CoinInfo = {
                ...(symbol as any),
                exchange: ex,
                integratedCategory: cat,
                rawCategory: (symbol as any).rawCategory || cat,
              };
              allCoins.push(coin);
            }
          }
        }
        return allCoins;
      },
      getUniqueBaseCodes: (filter?: { exchange?: ExchangeType; category?: string }) => {
        const filteredCoins = get().getFilteredCoins(filter || {});
        const baseCodes = new Set(filteredCoins.map(coin => (coin as any).baseCode).filter(Boolean) as string[]);
        return Array.from(baseCodes).sort();
      },
      getUniqueQuoteCodes: (filter?: { exchange?: ExchangeType; category?: string }) => {
        const filteredCoins = get().getFilteredCoins(filter || {});
        const quoteCodes = new Set(filteredCoins.map(coin => (coin as any).quoteCode).filter(Boolean) as string[]);
        return Array.from(quoteCodes).sort();
      },
      clearSymbols: () => {
        // 실제 clearSymbols 로직은 기존 내부 구현을 사용해야 함
      },
    }))
  )
);
