import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { 
  BybitCategoryType, 
  BybitInstrumentsResponse, 
  CoinInfo, 
  ExchangeCoinsState, 
  ExchangeType 
} from '../types/exchange';

// 초기 상태에 포함될 데이터 부분
type ExchangeCoinsStateData = Pick<ExchangeCoinsState, 'coins' | 'lastUpdated' | 'isLoading' | 'error'>;

// 초기 상태 정의
const initialState: ExchangeCoinsStateData = {
  coins: [],
  lastUpdated: {
    bybit: {
      spot: null,
      linear: null,
      inverse: null,
      option: null,
    },
    binance: {},
    upbit: {},
  },
  isLoading: false,
  error: null,
};

// 거래소별 API URL 정의
const API_URLS = {
  bybit: {
    base: 'https://api.bybit.com/v5/market/instruments-info',
    getUrl: (category: BybitCategoryType) => `${API_URLS.bybit.base}?category=${category}`,
  },
  binance: {
    // 추후 구현
  },
  upbit: {
    // 추후 구현
  },
};

// Bybit API 응답 데이터를 CoinInfo 형식으로 변환하는 함수
const transformBybitData = (
  data: BybitInstrumentsResponse, 
  category: BybitCategoryType
): CoinInfo[] => {
  if (!data.result || !data.result.list) {
    return [];
  }

  return data.result.list
    .filter(item => item.status === 'Trading') // 거래 가능한 코인만 필터링
    .map(item => ({
      symbol: item.symbol,
      baseCoin: item.baseCoin,
      quoteCoin: item.quoteCoin,
      exchange: 'bybit' as ExchangeType,
      category,
    }));
};

// 거래소 코인 정보 스토어 생성
export const useExchangeCoinsStore = create<ExchangeCoinsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Bybit 거래소의 코인 정보 가져오기
        fetchBybitCoins: async (category: BybitCategoryType) => {
          try {
            set(state => {
              state.isLoading = true;
              state.error = null;
            });

            const response = await fetch(API_URLS.bybit.getUrl(category));
            
            if (!response.ok) {
              throw new Error(`API 요청 실패: ${response.status}`);
            }
            
            const data: BybitInstrumentsResponse = await response.json();
            
            if (data.retCode !== 0) {
              throw new Error(`API 오류: ${data.retMsg}`);
            }
            
            const newCoins = transformBybitData(data, category);
            
            set(state => {
              // 기존 코인 중 현재 거래소와 카테고리가 아닌 것만 필터링
              const filteredCoins = state.coins.filter(
                coin => !(coin.exchange === 'bybit' && coin.category === category)
              );
              
              // 새로운 코인 정보 추가
              state.coins = [...filteredCoins, ...newCoins];
              
              // 마지막 업데이트 시간 설정
              state.lastUpdated.bybit[category] = new Date().toISOString();
              state.isLoading = false;
            });
            
            return true;
          } catch (error) {
            set(state => {
              state.isLoading = false;
              state.error = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            });
            
            console.error('Bybit 코인 정보 가져오기 실패:', error);
            return false;
          }
        },

        // 모든 Bybit 카테고리의 코인 정보 가져오기
        fetchAllBybitCoins: async () => {
          const categories: BybitCategoryType[] = ['spot', 'linear', 'inverse', 'option'];
          const results = await Promise.all(
            categories.map(category => get().fetchBybitCoins(category))
          );
          
          return results.every(Boolean);
        },

        // 특정 거래소의 코인 정보 가져오기 (추후 확장)
        fetchExchangeCoins: async (exchange: ExchangeType) => {
          switch (exchange) {
            case 'bybit':
              return await get().fetchAllBybitCoins();
            case 'binance':
              // 추후 구현
              console.log('Binance 코인 정보 가져오기는 아직 구현되지 않았습니다.');
              return false;
            case 'upbit':
              // 추후 구현
              console.log('Upbit 코인 정보 가져오기는 아직 구현되지 않았습니다.');
              return false;
            default:
              console.error('지원하지 않는 거래소입니다.');
              return false;
          }
        },

        // 모든 거래소의 코인 정보 가져오기
        fetchAllExchangeCoins: async () => {
          const exchanges: ExchangeType[] = ['bybit']; // 추후 'binance', 'upbit' 추가
          const results = await Promise.all(
            exchanges.map(exchange => get().fetchExchangeCoins(exchange))
          );
          
          return results.every(Boolean);
        },

        // 코인 정보 초기화
        clearCoins: () => {
          set(state => {
            state.coins = [];
          });
        },

        // 특정 거래소의 코인 정보만 초기화
        clearExchangeCoins: (exchange: ExchangeType) => {
          set(state => {
            state.coins = state.coins.filter(coin => coin.exchange !== exchange);
          });
        },

        // 특정 거래소와 카테고리의 코인 정보만 초기화
        clearCategoryCoins: (exchange: ExchangeType, category: string) => {
          set(state => {
            state.coins = state.coins.filter(
              coin => !(coin.exchange === exchange && coin.category === category)
            );
          });
        },

        // 코인 정보 필터링 (baseCoin 또는 quoteCoin으로)
        getFilteredCoins: (filter: {
          exchange?: ExchangeType;
          category?: string;
          baseCoin?: string;
          quoteCoin?: string;
        }) => {
          const { coins } = get();
          return coins.filter(coin => {
            let match = true;
            
            if (filter.exchange && coin.exchange !== filter.exchange) {
              match = false;
            }
            
            if (filter.category && coin.category !== filter.category) {
              match = false;
            }
            
            if (filter.baseCoin && coin.baseCoin !== filter.baseCoin) {
              match = false;
            }
            
            if (filter.quoteCoin && coin.quoteCoin !== filter.quoteCoin) {
              match = false;
            }
            
            return match;
          });
        },

        // 고유한 baseCoin 목록 가져오기
        getUniqueBaseCoins: (filter?: { exchange?: ExchangeType; category?: string }) => {
          const { coins } = get();
          const filteredCoins = filter
            ? coins.filter(
                coin =>
                  (!filter.exchange || coin.exchange === filter.exchange) &&
                  (!filter.category || coin.category === filter.category)
              )
            : coins;
          
          const baseCoins = new Set(filteredCoins.map(coin => coin.baseCoin));
          return Array.from(baseCoins).sort();
        },

        // 고유한 quoteCoin 목록 가져오기
        getUniqueQuoteCoins: (filter?: { exchange?: ExchangeType; category?: string }) => {
          const { coins } = get();
          const filteredCoins = filter
            ? coins.filter(
                coin =>
                  (!filter.exchange || coin.exchange === filter.exchange) &&
                  (!filter.category || coin.category === filter.category)
              )
            : coins;
          
          const quoteCoins = new Set(filteredCoins.map(coin => coin.quoteCoin));
          return Array.from(quoteCoins).sort();
        },
      })),
      {
        name: 'exchange-coins-storage',
        partialize: (state) => ({
          coins: state.coins,
          lastUpdated: state.lastUpdated,
        }),
      }
    )
  )
);
