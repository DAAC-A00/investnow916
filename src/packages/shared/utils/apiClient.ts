/**
 * 공통 GET API 클라이언트
 * 다양한 response 타입을 지원하는 제네릭 구조
 */

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  retryCount?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface IApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: unknown;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 10000,
      defaultHeaders: config.defaultHeaders || {
        'Content-Type': 'application/json',
      },
      retryCount: config.retryCount || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  /**
   * GET 요청을 수행합니다
   * @param url - 요청할 URL
   * @param options - 요청 옵션
   * @returns Promise<ApiResponse<T>>
   */
  async get<T = unknown>(
    url: string,
    options: {
      headers?: Record<string, string>;
      timeout?: number;
      retryCount?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = this.buildUrl(url);
    const headers = { ...this.config.defaultHeaders, ...options.headers };
    const timeout = options.timeout || this.config.timeout;
    const retryCount = options.retryCount ?? this.config.retryCount;

    return this.executeWithRetry(
      () => this.fetchWithTimeout(fullUrl, { headers, signal: options.signal }, timeout),
      retryCount
    );
  }

  /**
   * 여러 URL에 대해 병렬로 GET 요청을 수행합니다
   * @param urls - 요청할 URL 배열
   * @param options - 요청 옵션
   * @returns Promise<ApiResponse<T>[]>
   */
  async getMultiple<T = unknown>(
    urls: string[],
    options: {
      headers?: Record<string, string>;
      timeout?: number;
      retryCount?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<ApiResponse<T>[]> {
    const promises = urls.map(url => this.get<T>(url, options));
    return Promise.all(promises);
  }

  /**
   * 타임아웃이 있는 fetch 요청
   */
  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError({
          message: `HTTP Error: ${response.status} ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
        });
      }

      const data = await this.parseResponse<T>(response);
      const headers = this.parseHeaders(response.headers);

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  /**
   * 재시도 로직을 포함한 요청 실행
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    retryCount: number
  ): Promise<ApiResponse<T>> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        // 마지막 시도이거나 재시도 불가능한 에러인 경우
        if (attempt === retryCount || !this.isRetryableError(error)) {
          throw error;
        }

        // 재시도 전 대기
        await this.delay(this.config.retryDelay * (attempt + 1));
      }
    }

    throw lastError!;
  }

  /**
   * Response 파싱
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as Promise<T>;
    }
    
    // 기본적으로 JSON으로 시도
    try {
      return response.json();
    } catch {
      return response.text() as Promise<T>;
    }
  }

  /**
   * 헤더 파싱
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * URL 생성
   */
  private buildUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.config.baseURL}${url}`;
  }

  /**
   * 에러 핸들링
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new ApiError({
          message: '요청 시간이 초과되었습니다.',
          status: 408,
          statusText: 'Request Timeout',
        });
      }

      return new ApiError({
        message: error.message,
      });
    }

    return new ApiError({
      message: '알 수 없는 오류가 발생했습니다.',
    });
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof ApiError) {
      // 5xx 서버 에러나 네트워크 에러는 재시도 가능
      return !error.status || error.status >= 500;
    }
    return true;
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ApiError 클래스 정의
export class ApiError extends Error {
  public status?: number;
  public statusText?: string;
  public data?: unknown;

  constructor(options: {
    message: string;
    status?: number;
    statusText?: string;
    data?: unknown;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.data = options.data;
  }
}

// 기본 클라이언트 인스턴스
export const defaultApiClient = new ApiClient();

// 편의 함수들
export const get = <T = unknown>(url: string, options?: Parameters<ApiClient['get']>[1]) =>
  defaultApiClient.get<T>(url, options);

export const getMultiple = <T = unknown>(urls: string[], options?: Parameters<ApiClient['getMultiple']>[1]) =>
  defaultApiClient.getMultiple<T>(urls, options); 