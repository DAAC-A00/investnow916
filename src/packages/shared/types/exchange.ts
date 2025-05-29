/**
 * 환율 정보 관련 타입 정의
 */

// 환율 API 응답 타입
export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

// 환율 정보 상태 타입
export interface ExchangeRateState {
  baseCode: string;
  rates: Record<string, number>;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}

// 환율 정보 액션 타입
export type ExchangeRateAction =
  | { type: 'FETCH_RATES_START' }
  | { type: 'FETCH_RATES_SUCCESS'; payload: ExchangeRateResponse }
  | { type: 'FETCH_RATES_ERROR'; payload: string }
  | { type: 'CHANGE_BASE_CURRENCY'; payload: string };
