/**
 * 데이터 갱신 관련 설정을 중앙에서 관리하는 상수 파일
 */

// 데이터 갱신 주기 설정 (시간 단위)
export const UPDATE_CONFIG = {
  // 기본 갱신 주기 (2시간)
  DEFAULT_UPDATE_INTERVAL_HOURS: 2,
  
  // 거래소별 갱신 주기 설정
  EXCHANGE_UPDATE_INTERVALS: {
    bybit: 2,    // Bybit: 2시간
    bithumb: 2,  // Bithumb: 2시간
    binance: 2,  // Binance: 2시간 (추후 구현)
    upbit: 2,    // Upbit: 2시간 (추후 구현)
  }
} as const;

/**
 * 특정 거래소의 갱신 주기를 가져오는 함수
 * @param exchange 거래소 이름
 * @returns 갱신 주기 (시간)
 */
export const getUpdateIntervalForExchange = (exchange: string): number => {
  return UPDATE_CONFIG.EXCHANGE_UPDATE_INTERVALS[exchange as keyof typeof UPDATE_CONFIG.EXCHANGE_UPDATE_INTERVALS] 
    || UPDATE_CONFIG.DEFAULT_UPDATE_INTERVAL_HOURS;
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
  return UPDATE_CONFIG.DEFAULT_UPDATE_INTERVAL_HOURS;
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
