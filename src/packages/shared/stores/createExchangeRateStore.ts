/**
 * 환율 정보 관리 스토어 (Zustand + Immer)
 */

import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ExchangeRateResponse, ExchangeRateState } from '../types/exchange';

// API 키 및 기본 URL
const API_KEY = '842f9ce049b12b202bc6932f';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// 환율 정보 액션 인터페이스
interface ExchangeRateActions {
  fetchRates: (baseCode?: string) => Promise<void>;
  changeBaseCurrency: (baseCode: string) => Promise<void>;
}

// 전체 스토어 타입
type ExchangeRateStore = ExchangeRateState & ExchangeRateActions;

// Zustand 스토어 생성자
const exchangeRateStoreCreator: StateCreator<
  ExchangeRateStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  ExchangeRateStore
> = (set, get) => ({
  // 초기 상태
  baseCode: 'USD',
  rates: {},
  lastUpdated: null,
  isLoading: false,
  error: null,

  // 환율 정보 가져오기
  fetchRates: async (baseCode?: string) => {
    const currentBaseCode = baseCode || get().baseCode;
    
    set(
      (state) => {
        state.isLoading = true;
        state.error = null;
      },
      false,
      'fetchRates/start'
    );

    try {
      const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${currentBaseCode}`);
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      set(
        (state) => {
          state.baseCode = data.base_code;
          state.rates = data.conversion_rates;
          state.lastUpdated = data.time_last_update_utc;
          state.isLoading = false;
        },
        false,
        'fetchRates/success'
      );
    } catch (error) {
      set(
        (state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : '알 수 없는 오류 발생';
        },
        false,
        'fetchRates/error'
      );
    }
  },

  // 기준 통화 변경
  changeBaseCurrency: async (baseCode: string) => {
    if (baseCode === get().baseCode) return;
    
    await get().fetchRates(baseCode);
  },
});

// 스토어 생성
export const useExchangeRateStore = create<ExchangeRateStore>()(
  devtools(
    immer(exchangeRateStoreCreator),
    {
      name: 'exchange-rate-store',
    }
  )
);

// 선택자 훅들
export const useBaseCode = () => useExchangeRateStore((state) => state.baseCode);
export const useRates = () => useExchangeRateStore((state) => state.rates);
export const useLastUpdated = () => useExchangeRateStore((state) => state.lastUpdated);
export const useIsLoading = () => useExchangeRateStore((state) => state.isLoading);
export const useError = () => useExchangeRateStore((state) => state.error);

// 액션 훅
export const useExchangeRateActions = () => useExchangeRateStore((state) => ({
  fetchRates: state.fetchRates,
  changeBaseCurrency: state.changeBaseCurrency,
}));
