/**
 * 가격 포맷팅 유틸리티
 * symbol별로 표기된 적이 있는 가격의 소수점 자리수 중 가장 큰 값을 기준으로 가격을 포맷팅합니다.
 */

/**
 * symbol별 최대 소수점 자리수를 관리하는 클래스
 */
export class PriceDecimalTracker {
  private maxDecimals: Record<string, number> = {};

  /**
   * 숫자의 소수점 자리수를 계산
   */
  private getDecimals(num: number): number {
    if (!isFinite(num)) return 0;
    const s = num.toString();
    if (s.includes('.')) return s.split('.')[1].length;
    return 0;
  }

  /**
   * 가격 범위에 따른 기본 소수점 자리수 계산
   */
  private getDefaultDecimals(price: number): number {
    if (price >= 1000) return 2;
    if (price >= 100) return 2;
    if (price >= 1) return 4;
    if (price >= 0.01) return 6;
    return 12;
  }

  /**
   * symbol의 가격을 추적하고 최대 소수점 자리수를 업데이트
   */
  trackPrice(symbol: string, price: number): void {
    const currentDecimals = this.getDecimals(price);
    const defaultDecimals = this.getDefaultDecimals(price);
    
    // 현재 가격의 소수점 자리수와 기본 자리수 중 큰 값을 사용
    const requiredDecimals = Math.max(currentDecimals, defaultDecimals);
    
    const existingMax = this.maxDecimals[symbol] ?? 0;
    if (requiredDecimals > existingMax) {
      this.maxDecimals[symbol] = requiredDecimals;
    }
  }

  /**
   * symbol의 최대 소수점 자리수 반환
   */
  getMaxDecimals(symbol: string): number {
    return this.maxDecimals[symbol] ?? 0;
  }

  /**
   * 모든 추적 데이터 초기화
   */
  reset(): void {
    this.maxDecimals = {};
  }

  /**
   * 특정 symbol의 추적 데이터 초기화
   */
  resetSymbol(symbol: string): void {
    delete this.maxDecimals[symbol];
  }

  /**
   * 현재 추적중인 모든 symbol과 최대 소수점 자리수 반환
   */
  getAllMaxDecimals(): Record<string, number> {
    return { ...this.maxDecimals };
  }
}

/**
 * 가격을 포맷팅하는 함수
 */
export function formatPrice(
  price: number, 
  maxDecimals: number = 0, 
  addCommas: boolean = true
): string {
  // 가격 범위에 따른 기본 소수점 자리수
  let decimals: number;
  if (price >= 1000) {
    decimals = 2;
  } else if (price >= 100) {
    decimals = 2;
  } else if (price >= 1) {
    decimals = 4;
  } else if (price >= 0.01) {
    decimals = 6;
  } else {
    decimals = 12;
  }

  // maxDecimals가 더 크면 그 값을 사용
  if (maxDecimals > decimals) {
    decimals = maxDecimals;
  }

  // 소수점 포맷팅
  let formatted = price.toFixed(decimals);

  if (maxDecimals > 0) {
    // maxDecimals가 있으면 해당 자리수까지는 0도 표기
    const [intPart, decPart] = formatted.split('.');
    if (decPart) {
      // 오른쪽 0을 자르되, 최소 maxDecimals까지는 남김
      let trimIndex = decPart.length;
      for (let i = decPart.length - 1; i >= maxDecimals; i--) {
        if (decPart[i] === '0') trimIndex = i;
        else break;
      }
      const trimmedDec = decPart.slice(0, trimIndex);
      formatted = trimmedDec ? `${intPart}.${trimmedDec}` : intPart;
      
      // 만약 모두 0이면 maxDecimals만큼 0을 붙임
      if (!trimmedDec && maxDecimals > 0) {
        formatted = `${intPart}.${'0'.repeat(maxDecimals)}`;
      }
    }
  } else {
    // maxDecimals가 0이면 소수점 뒤 0 생략
    formatted = formatted.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/\.0+$/, '');
  }

  // 1000 이상인 경우 콤마 추가
  if (addCommas && price >= 1000) {
    const [integerPart, decimalPart] = formatted.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  }

  return formatted;
}

/**
 * 가격 변동을 포맷팅하는 함수 (+ 기호 포함)
 */
export function formatPriceChange(
  priceChange: number, 
  maxDecimals: number = 0, 
  addCommas: boolean = true
): string {
  const formatted = formatPrice(Math.abs(priceChange), maxDecimals, addCommas);
  return `${priceChange >= 0 ? '+' : '-'}${formatted}`;
}

/**
 * 전역 PriceDecimalTracker 인스턴스
 * 애플리케이션 전체에서 공유되는 가격 소수점 추적기
 */
export const globalPriceTracker = new PriceDecimalTracker(); 