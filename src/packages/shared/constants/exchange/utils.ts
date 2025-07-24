/**
 * 거래소 설정 접근을 위한 유틸리티 함수들
 */

import type { ExchangeType, IntegratedCategory } from './types';
import { BYBIT_CONFIG } from './configs/bybit';
import { BINANCE_CONFIG } from './configs/binance';
import { BITHUMB_CONFIG } from './configs/bithumb';
import { UPBIT_CONFIG, OKX_CONFIG, BITGET_CONFIG } from './configs/others';

// 모든 거래소 설정을 통합
export const EXCHANGE_CONFIGS = {
  bybit: BYBIT_CONFIG,
  binance: BINANCE_CONFIG,
  bithumb: BITHUMB_CONFIG,
  upbit: UPBIT_CONFIG,
  okx: OKX_CONFIG,
  bitget: BITGET_CONFIG,
} as const;

/**
 * 거래소가 유효한지 확인
 */
export const isValidExchange = (exchange: string): exchange is ExchangeType => {
  return exchange in EXCHANGE_CONFIGS;
};

/**
 * 통합 카테고리가 유효한지 확인
 */
export const isValidIntegratedCategory = (category: string): category is IntegratedCategory => {
  return ['spot', 'um', 'cm', 'options'].includes(category);
};

/**
 * 거래소의 Raw 카테고리가 유효한지 확인
 */
export const isValidRawCategory = (exchange: ExchangeType, category: string): boolean => {
  if (!isValidExchange(exchange)) return false;
  return EXCHANGE_CONFIGS[exchange].rawCategories.includes(category as any);
};

/**
 * 거래소가 지원하는 통합 카테고리인지 확인
 */
export const isValidSupportedCategory = (exchange: ExchangeType, category: IntegratedCategory): boolean => {
  if (!isValidExchange(exchange)) return false;
  const supportedCategories = Object.values(EXCHANGE_CONFIGS[exchange].categoryMapping);
  return supportedCategories.includes(category);
};

/**
 * 거래소의 Raw 카테고리 목록 가져오기
 */
export const getRawCategories = (exchange: ExchangeType) => {
  if (!isValidExchange(exchange)) return [];
  return EXCHANGE_CONFIGS[exchange].rawCategories;
};

/**
 * 거래소의 카테고리 매핑 가져오기
 */
export const getCategoryMapping = (exchange: ExchangeType) => {
  if (!isValidExchange(exchange)) return {};
  return EXCHANGE_CONFIGS[exchange].categoryMapping;
};

/**
 * 거래소가 지원하는 통합 카테고리 목록 가져오기
 */
export const getSupportedCategories = (exchange: ExchangeType): IntegratedCategory[] => {
  if (!isValidExchange(exchange)) return [];
  return Object.values(EXCHANGE_CONFIGS[exchange].categoryMapping);
};

/**
 * Raw 카테고리에서 통합 카테고리로 변환
 */
export const toIntegratedCategory = <T extends ExchangeType>(
  exchange: T,
  rawCategory: string
): IntegratedCategory => {
  const mapping = getCategoryMapping(exchange);
  const result = (mapping as any)[rawCategory];
  return result || 'spot'; // 기본값으로 spot 반환
};

/**
 * 통합 카테고리에서 거래소별 Raw 카테고리로 변환
 */
export const toRawCategory = <T extends ExchangeType>(
  exchange: T,
  integratedCategory: IntegratedCategory
): string => {
  const mapping = getCategoryMapping(exchange);
  const entry = Object.entries(mapping).find(([_, value]) => value === integratedCategory);
  return entry?.[0] || integratedCategory;
};

/**
 * 거래소의 업데이트 간격 가져오기
 */
export const getUpdateInterval = (exchange: ExchangeType, dataType: 'instrument' | 'ticker') => {
  if (!isValidExchange(exchange)) return 0;
  return EXCHANGE_CONFIGS[exchange].updateIntervals[dataType] || 0;
};

/**
 * 거래소의 엔드포인트 설정 가져오기
 */
export const getEndpoints = (exchange: ExchangeType) => {
  if (!isValidExchange(exchange)) return {};
  return EXCHANGE_CONFIGS[exchange].endpoints;
};

/**
 * 거래소의 기본 API URL 가져오기
 */
export const getApiBaseUrl = (exchange: ExchangeType) => {
  if (!isValidExchange(exchange)) return '';
  return EXCHANGE_CONFIGS[exchange].apiBaseUrl;
}; 