/**
 * 데이터 갱신 관련 설정을 중앙에서 관리하는 상수 파일
 * 
 * 거래소 및 갱신 주기 정의는 exchangeConfig.ts에서 중앙 관리되며,
 * 이 파일은 갱신 관련 유틸리티 함수만 제공합니다.
 */

// ============================================================================
// 중앙 설정에서 모든 정의 import
// ============================================================================

// 타입과 상수들을 중앙 설정에서 import
export type { ExchangeType } from '@/packages/shared/constants/exchangeConfig';
export { 
  EXCHANGE_UPDATE_INTERVALS,
  DEFAULT_UPDATE_INTERVAL_HOURS,
  UPDATE_CONFIG
} from '@/packages/shared/constants/exchangeConfig';

// 내부에서 사용하기 위한 import
import { 
  EXCHANGE_UPDATE_INTERVALS,
  DEFAULT_UPDATE_INTERVAL_HOURS 
} from '@/packages/shared/constants/exchangeConfig';

// ============================================================================
// 갱신 관련 유틸리티 함수들 (기존 로직 유지)
// ============================================================================

/**
 * 특정 거래소의 갱신 주기를 가져오는 함수
 * @param exchange 거래소 이름
 * @returns 갱신 주기 (시간)
 */
export const getUpdateIntervalForExchange = (exchange: string): number => {
  return EXCHANGE_UPDATE_INTERVALS[exchange as keyof typeof EXCHANGE_UPDATE_INTERVALS] 
    || DEFAULT_UPDATE_INTERVAL_HOURS;
};

/**
 * 거래소의 갱신 주기를 가져오는 함수
 * @param exchange 거래소 이름
 * @returns 갱신 주기 (시간)
 */
export const getUpdateInterval = (exchange?: string): number => {
  // 거래소별 설정 확인
  if (exchange) {
    return getUpdateIntervalForExchange(exchange);
  }
  
  // 기본값 반환
  return DEFAULT_UPDATE_INTERVAL_HOURS;
};

/**
 * 데이터 갱신이 필요한지 확인하는 공통 함수
 * @param lastUpdateTime 마지막 업데이트 시간
 * @param exchange 거래소 이름
 * @returns 갱신 필요 여부
 */
export const needsDataUpdate = (
  lastUpdateTime: Date | null, 
  exchange?: string
): boolean => {
  if (!lastUpdateTime) return true;
  
  const updateInterval = getUpdateInterval(exchange);
  const now = new Date();
  const diffHours = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
  
  return diffHours >= updateInterval;
};

/**
 * 갱신 주기 정보를 문자열로 반환하는 함수
 * @param exchange 거래소 이름
 * @returns 갱신 주기 설명 문자열
 */
export const getUpdateIntervalDescription = (exchange?: string): string => {
  const interval = getUpdateInterval(exchange);
  return `${interval}시간마다 자동으로 갱신됩니다`;
};
