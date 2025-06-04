/**
 * 환율 정보 관리 스토어 (Zustand + Immer)
 */

import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ExchangeRateResponse, ExchangeRateState } from '../types/exchange';

// API 키 및 기본 URL
let API_KEY = '';

// 초기 로드 시 로컬 스토리지에서 API 키 로드
if (typeof window !== 'undefined') {
  try {
    const savedKey = localStorage.getItem('apikey-exchangerate');
    if (savedKey) {
      API_KEY = savedKey;
    }
  } catch (error) {
    console.error('로컬 스토리지에서 API 키를 불러오는 중 오류 발생:', error);
  }
}
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// 환율 정보 액션 인터페이스
interface ExchangeRateActions {
  fetchRates: (baseCode?: string) => Promise<void>;
  changeBaseCurrency: (baseCode: string) => Promise<void>;
  setApiKey: (key: string) => void;
  getApiKey: () => string;
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

  // API 키 설정
  setApiKey: (key: string) => {
    API_KEY = key;
    // 로컬 스토리지에 API 키 저장
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apikey-exchangerate', key);
      } catch (error) {
        console.error('API 키를 로컬 스토리지에 저장하는 중 오류 발생:', error);
      }
    }
  },

  // API 키 가져오기
  getApiKey: () => {
    // 로컬 스토리지에서 API 키 로드 (없으면 전역 변수 반환)
    if (typeof window !== 'undefined') {
      try {
        const savedKey = localStorage.getItem('apikey-exchangerate');
        if (savedKey) {
          API_KEY = savedKey;
        }
      } catch (error) {
        console.error('로컬 스토리지에서 API 키를 불러오는 중 오류 발생:', error);
      }
    }
    return API_KEY;
  },

  // 환율 정보 가져오기
  fetchRates: async (baseCode?: string) => {
    if (!API_KEY) {
      set(
        (state) => {
          state.error = 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.';
          state.isLoading = false;
        },
        false,
        'fetchRates/error'
      );
      throw new Error('API 키가 설정되지 않았습니다.');
    }
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
  setApiKey: state.setApiKey,
  getApiKey: state.getApiKey,
}));
