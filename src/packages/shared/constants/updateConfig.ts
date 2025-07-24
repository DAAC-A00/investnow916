/**
 * 데이터 갱신 관련 유틸리티 함수를 제공하는 파일
 */

import { ExchangeType, EXCHANGE_CONFIGS } from './exchange';

/**
 * 로컬 스토리지에서 데이터를 저장하기 위한 키를 생성합니다.
 * @param exchange - 거래소
 * @param category - 카테고리
 * @param isRawCategory - 카테고리가 raw인지 여부 (기본값: false)
 * @returns 로컬 스토리지 키 (e.g., 'bybit-spot')
 */
export const getUpdateTimeKey = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): string => {
  // 새로운 구조에서는 데이터 키와 동일
  const storageCategory = isRawCategory ? category : category;
  return `${exchange}-${storageCategory}`;
};

/**
 * 특정 거래소, 특정 카테고리의 데이터가 마지막으로 업데이트된 시간을 로컬 스토리지에서 가져옵니다.
 * @param exchange - 거래소
 * @param category - 카테고리
 * @param isRawCategory - 카테고리가 raw인지 여부 (기본값: false)
 * @returns 마지막 업데이트 시간 (Date 객체) 또는 null
 */
export const getUpdateTime = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): Date | null => {
  const key = getUpdateTimeKey(exchange, category, isRawCategory);
  try {
    const storedValue = localStorage.getItem(key);
    
    if (!storedValue) return null;
    
    // 새로운 구조: 시간 정보가 포함된 형태인지 확인 (:::로 구분)
    const timeDataSeparator = ':::';
    if (storedValue.includes(timeDataSeparator)) {
      const [timeStr] = storedValue.split(timeDataSeparator);
      return timeStr ? new Date(timeStr) : null;
    }
    
    // 기존 형태의 데이터는 시간 정보가 없으므로 null 반환
    return null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

/**
 * 특정 거래소의 instrument 데이터 갱신 주기를 가져옵니다.
 * @param exchange - 거래소
 * @returns 갱신 주기 (밀리초 단위)
 */
export const getInstrumentUpdateInterval = (exchange: ExchangeType): number => {
  return EXCHANGE_CONFIGS[exchange].updateIntervals.instrument;
};

/**
 * 특정 거래소의 갱신 주기를 가져옵니다.
 * @param exchange - 거래소
 * @param dataType - 데이터 타입 ('instrument' | 'ticker')
 * @returns 갱신 주기 (밀리초 단위)
 */
export const getUpdateInterval = (exchange: ExchangeType, dataType: 'instrument' | 'ticker' = 'instrument'): number => {
  if (dataType === 'instrument') {
    return EXCHANGE_CONFIGS[exchange].updateIntervals.instrument;
  } else {
    return EXCHANGE_CONFIGS[exchange].updateIntervals.ticker;
  }
};

/**
 * 특정 거래소, 특정 카테고리의 데이터가 갱신이 필요한지 확인합니다.
 * @param exchange - 거래소
 * @param category - 카테고리
 * @param isRawCategory - 카테고리가 raw인지 여부 (기본값: false)
 * @returns 갱신이 필요하면 true, 아니면 false
 */
export const needsUpdate = (exchange: ExchangeType, category: string, isRawCategory: boolean = false): boolean => {
  // 1. 로컬 스토리지에 데이터가 있는지 확인
  const key = getUpdateTimeKey(exchange, category, isRawCategory);
  const storedValue = localStorage.getItem(key);
  
  if (!storedValue) return true;
  
  // 데이터에서 심볼 정보만 추출
  const timeDataSeparator = ':::';
  let symbolData = '';
  if (storedValue.includes(timeDataSeparator)) {
    const [, data] = storedValue.split(timeDataSeparator);
    symbolData = data || '';
  } else {
    symbolData = storedValue;
  }
  
  if (!symbolData || symbolData.trim() === '' || symbolData === '[]') {
    return true;
  }
  
  // 2. 업데이트 시간 확인
  const updateTime = getUpdateTime(exchange, category, isRawCategory);
  if (!updateTime) return true;
  
  // 3. 갱신 주기 확인 (ms 단위로 비교)
  const now = new Date();
  const diffMs = now.getTime() - updateTime.getTime();
  const intervalMs = getInstrumentUpdateInterval(exchange);
  
  return diffMs >= intervalMs;
};

/**
 * 특정 거래소의 갱신 주기에 대한 설명을 가져옵니다.
 * @param exchange - 거래소
 * @returns 갱신 주기 설명 (예: "2시간마다 자동 갱신")
 */
export const getUpdateIntervalDescription = (exchange: ExchangeType): string => {
  const intervalMs = getInstrumentUpdateInterval(exchange);
  const intervalHours = intervalMs / (1000 * 60 * 60);
  return `${intervalHours}시간마다 자동 갱신`;
};
