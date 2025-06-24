/**
 * API 클라이언트 사용 예시
 */

import { ApiClient, get, getMultiple, ApiResponse, ApiError } from './apiClient';

// 1. 기본 사용법 - 간단한 API 호출
export async function basicUsageExample() {
  try {
    // 단일 API 호출
    const response = await get<{ message: string }>('https://api.example.com/data');
    console.log('데이터:', response.data);
    console.log('상태 코드:', response.status);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API 에러:', error.message, error.status);
    }
  }
}

// 2. 타입 정의와 함께 사용하는 예시
interface UserData {
  id: number;
  name: string;
  email: string;
}

interface PostData {
  id: number;
  title: string;
  content: string;
  userId: number;
}

export async function typedApiExample() {
  try {
    // 타입이 지정된 API 호출
    const userResponse = await get<UserData>('https://jsonplaceholder.typicode.com/users/1');
    const user = userResponse.data; // TypeScript가 UserData 타입으로 인식
    
    console.log(`사용자: ${user.name} (${user.email})`);
    
    // 여러 API 병렬 호출
    const postUrls = [
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://jsonplaceholder.typicode.com/posts/2',
      'https://jsonplaceholder.typicode.com/posts/3'
    ];
    
    const postResponses = await getMultiple<PostData>(postUrls);
    postResponses.forEach((response, index) => {
      console.log(`포스트 ${index + 1}: ${response.data.title}`);
    });
    
  } catch (error) {
    console.error('API 호출 실패:', error);
  }
}

// 3. 커스텀 설정을 사용한 예시
export async function customConfigExample() {
  // 특정 설정으로 클라이언트 생성
  const apiClient = new ApiClient({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    defaultHeaders: {
      'Authorization': 'Bearer your-token-here',
      'X-API-Version': 'v1'
    },
    retryCount: 2,
    retryDelay: 500
  });

  try {
    // 상대 경로로 호출 (baseURL이 자동으로 붙음)
    const response = await apiClient.get<any>('/users/profile');
    console.log('프로필 데이터:', response.data);
    
    // 추가 헤더와 함께 호출
    const detailResponse = await apiClient.get<any>('/users/details', {
      headers: { 'X-Include-Extra': 'true' },
      timeout: 3000 // 개별 타임아웃 설정
    });
    console.log('상세 데이터:', detailResponse.data);
    
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API 에러 [${error.status}]: ${error.message}`);
    }
  }
}

// 4. 실제 암호화폐 거래소 API 사용 예시
interface BithumbTickerData {
  status: string;
  data: {
    opening_price: string;
    closing_price: string;
    min_price: string;
    max_price: string;
    units_traded: string;
    acc_trade_value: string;
    prev_closing_price: string;
    units_traded_24H: string;
    acc_trade_value_24H: string;
    fluctate_24H: string;
    fluctate_rate_24H: string;
    date: string;
  };
}

interface BybitTickerData {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: Array<{
      symbol: string;
      lastPrice: string;
      indexPrice: string;
      markPrice: string;
      prevPrice24h: string;
      price24hPcnt: string;
      highPrice24h: string;
      lowPrice24h: string;
      prevPrice1h: string;
      openInterest: string;
      openInterestValue: string;
      turnover24h: string;
      volume24h: string;
      fundingRate: string;
      nextFundingTime: string;
      predictedDeliveryPrice: string;
      basisRate: string;
      deliveryFeeRate: string;
      deliveryTime: string;
      ask1Size: string;
      bid1Price: string;
      ask1Price: string;
      bid1Size: string;
    }>;
  };
  retExtInfo: {};
  time: number;
}

export async function cryptoExchangeExample() {
  const exchangeClient = new ApiClient({
    timeout: 15000,
    retryCount: 3,
    retryDelay: 1000
  });

  try {
    // 빗썸 티커 데이터
    const bithumbResponse = await exchangeClient.get<BithumbTickerData>(
      'https://api.bithumb.com/public/ticker/BTC_KRW'
    );
    
    console.log('빗썸 BTC 가격:', bithumbResponse.data.data.closing_price);
    
    // 바이비트 티커 데이터
    const bybitResponse = await exchangeClient.get<BybitTickerData>(
      'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT'
    );
    
    if (bybitResponse.data.result.list.length > 0) {
      console.log('바이비트 BTC 가격:', bybitResponse.data.result.list[0].lastPrice);
    }
    
    // 두 거래소 데이터를 병렬로 가져오기
    const [bithumb, bybit] = await getMultiple<BithumbTickerData | BybitTickerData>([
      'https://api.bithumb.com/public/ticker/ETH_KRW',
      'https://api.bybit.com/v5/market/tickers?category=spot&symbol=ETHUSDT'
    ]);
    
    console.log('병렬 요청 완료');
    
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('거래소 API 에러:', error.message);
      if (error.status === 429) {
        console.log('API 요청 한도 초과. 잠시 후 다시 시도해주세요.');
      }
    }
  }
}

// 5. 요청 취소 예시
export async function cancelRequestExample() {
  const controller = new AbortController();
  
  // 5초 후 요청 취소
  setTimeout(() => {
    controller.abort();
    console.log('요청이 취소되었습니다.');
  }, 5000);
  
  try {
    const response = await get<any>('https://httpbin.org/delay/10', {
      signal: controller.signal
    });
    console.log('응답:', response.data);
  } catch (error) {
    if (error instanceof ApiError && error.message.includes('초과')) {
      console.log('요청이 정상적으로 취소되었습니다.');
    }
  }
}

// 6. 다양한 응답 형식 처리 예시
export async function variousResponseFormatsExample() {
  try {
    // JSON 응답
    const jsonResponse = await get<{ message: string }>('https://httpbin.org/json');
    console.log('JSON 데이터:', jsonResponse.data);
    
    // 텍스트 응답
    const textResponse = await get<string>('https://httpbin.org/uuid');
    console.log('텍스트 데이터:', textResponse.data);
    
    // HTML 응답 (텍스트로 처리됨)
    const htmlResponse = await get<string>('https://httpbin.org/html');
    console.log('HTML 길이:', htmlResponse.data.length);
    
  } catch (error) {
    console.error('응답 처리 에러:', error);
  }
}

// 실행 예시 (실제 프로젝트에서는 필요에 따라 호출)
export async function runAllExamples() {
  console.log('=== 기본 사용법 ===');
  await basicUsageExample();
  
  console.log('\n=== 타입 정의 사용법 ===');
  await typedApiExample();
  
  console.log('\n=== 커스텀 설정 사용법 ===');
  await customConfigExample();
  
  console.log('\n=== 암호화폐 거래소 API 사용법 ===');
  await cryptoExchangeExample();
  
  console.log('\n=== 다양한 응답 형식 처리 ===');
  await variousResponseFormatsExample();
} 