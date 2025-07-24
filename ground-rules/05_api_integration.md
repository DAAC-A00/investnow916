# 05: 신규 API 연동 가이드 (New API Integration)

이 문서는 새로운 거래소 API를 프로젝트에 연동하는 전체 과정을 안내합니다. AI 에이전트는 새로운 거래소를 추가할 때 반드시 다음 4단계를 따라야 합니다.

## 🏛️ 전체 구조 (Overall Structure)

새로운 거래소 `my-exchange`를 추가하는 과정은 아래 파일들을 생성하고 수정하는 흐름으로 진행됩니다.

```
src/
├── app/
│   └── api/
│       └── my-exchange/            # 1. API 프록시 라우트
│           └── ...
└── packages/
    └── shared/
        ├── constants/
        │   └── exchange/
        │       └── configs/
        │           └── my-exchange.ts # 2. 거래소 설정 파일
        ├── utils/
        │   └── my-exchangeDataTransformer.ts # 3. 데이터 변환 로직
        └── stores/
            └── createMyExchangeTickerStore.ts # 4. 상태 관리 스토어
```

---

### 단계 1: API 프록시 라우트 추가 (Add API Proxy Route)

**목적**: 외부 API 직접 호출을 피하고, CORS 오류 방지 및 API 키를 안전하게 관리합니다.
**위치**: `src/app/api/[exchangeName]/.../route.ts`

**작업**:
- `[exchangeName]`에 해당하는 디렉토리를 생성하고, 각 엔드포인트에 맞는 `route.ts` 파일을 만듭니다.
- `EXCHANGE_CONFIGS`에서 엔드포인트 URL을 동적으로 가져와 `defaultApiClient`로 실제 API를 호출하고 결과를 반환합니다.

**예시**: `src/app/api/binance/cm/ticker24hr/route.ts`
```ts
import { NextResponse } from 'next/server';
import { defaultApiClient } from '@/packages/shared/utils/apiClient';
import { EXCHANGE_CONFIGS } from '@/packages/shared/constants/exchange';

export async function GET() {
  try {
    const binanceEndpoints = EXCHANGE_CONFIGS.binance.endpoints as any;
    const response = await defaultApiClient.get(binanceEndpoints.cm.ticker24hr, {
      timeout: 10000,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
```

---

### 단계 2: 거래소 설정 정의 (Define Exchange Configuration)

**목적**: 거래소의 기본 정보, API 엔드포인트, 카테고리 매핑 규칙을 한 곳에서 관리합니다.
**위치**: `packages/shared/constants/exchange/`

**작업**:
1.  `configs/[exchangeName].ts` 파일을 생성하고 `ExchangeConfig` 타입에 맞는 설정 객체를 정의합니다.
2.  `index.ts` 파일에 새로 추가한 설정을 `EXCHANGE_CONFIGS`에 등록합니다.
3.  `types.ts` 파일의 `Exchange` 유니온 타입에 새 거래소 이름(소문자)을 추가하여 타입 안정성을 확보합니다.

**예시**: `configs/binance.ts` 및 `types.ts` 수정
```ts
// in types.ts
export type Exchange = 'binance' | 'bithumb' | 'bybit' | 'my-exchange'; // 새 거래소 추가

// in configs/binance.ts
export const binanceExchangeConfig: ExchangeConfig = {
  name: 'Binance',
  logo: '/exchangeBinance.png',
  endpoints: { /* ... */ },
  categoryMapping: {
    spot: 'spot',
    um: 'um',
    cm: 'cm',
  },
};
```

---

### 단계 3: 데이터 변환 로직 구현 (Implement Data Transformation)

**목적**: 거래소마다 다른 API 응답 형식을 내부 표준 데이터 모델(`TickerData`)로 통일합니다.
**위치**: `packages/shared/utils/[exchangeName]DataTransformer.ts`

**작업**:
- 거래소 API 응답의 구조에 맞춰 `transform` 함수를 구현합니다.
- **중요**: 한 거래소 내에서도 카테고리별로 응답 데이터 구조가 다를 수 있습니다. 이 경우, 각 카테고리에 맞는 `transform` 함수를 별도로 구현해야 합니다. (예: `transformBinanceSpotTicker`, `transformBinanceUmTicker`)
- `parse[ExchangeName]Symbol`과 같은 헬퍼 함수를 만들어 심볼 관련 정보를 일관되게 처리합니다.

**예시**: `binanceDataTransformer.ts`의 일부
```ts
import { TickerData } from '../types/exchange';
import { BinanceSpotTicker } from './binanceDataTransformer'; // API 원본 타입

// 심볼 파싱 로직 (재사용 가능)
export const parseBinanceSymbol = (rawSymbol: string, category: string) => {
  // ... 심볼을 base/quote/quantity 등으로 분리하는 로직 ...
  return { baseCode, quoteCode, integratedSymbol, quantity };
};

// Spot 티커 변환 함수
export const transformBinanceSpotTicker = (ticker: BinanceSpotTicker, beforePrice?: number): TickerData => {
  const { baseCode, quoteCode, integratedSymbol, quantity } = parseBinanceSymbol(ticker.symbol, 'spot');
  
  return {
    rawSymbol: ticker.symbol,
    integratedSymbol,
    baseCode,
    quoteCode,
    exchange: 'binance',
    price: parseFloat(ticker.lastPrice),
    priceChangePercent24h: parseFloat(ticker.priceChangePercent),
    // ... TickerData의 모든 필드를 API 응답에 맞게 매핑 ...
  };
};

// UM 티커 변환 함수 (다른 구조를 가질 수 있음)
export const transformBinanceUmTicker = (ticker: BinanceUmTicker, beforePrice?: number): TickerData => {
  // ... 현물(spot)과 다른 구조의 데이터를 TickerData로 매핑하는 로직 ...
};
```

---

### 단계 4: 상태 관리 스토어 생성 (Create State Store)

**목적**: 연동된 거래소의 데이터를 가져와 가공 후, 전역 상태로 관리합니다.
**위치**: `packages/shared/stores/create[ExchangeName]TickerStore.ts`

**작업**:
- Zustand 스토어를 생성하고, 비동기 `fetchTickers` 액션을 구현합니다.
- `fetchTickers` 내에서 API 프록시를 호출하고, 응답 데이터를 **3단계**에서 만든 `transform` 함수로 가공합니다.
- `isLoading`, `error` 등 데이터 요청의 전체 생명주기를 관리하는 상태를 포함합니다.

**예시**: `createBinanceTickerStore.ts`의 `fetchTickers` 액션
```ts
// ... (imports and interface definitions)

export const useBinanceTickerStore = create<BinanceTickerState>()(
  devtools(
    immer((set, get) => ({
      // ... (initial state)

      fetchTickers: async (category: 'spot' | 'um' | 'cm') => {
        set((state) => { state.isLoading = true; state.error = null; });

        try {
          const response = await defaultApiClient.get(`/api/binance/${category}/ticker24hr`);
          const apiData = response.data;

          let transformedTickers: TickerData[] = [];

          // 카테고리에 따라 적절한 변환 함수를 동적으로 선택
          if (category === 'spot') {
            transformedTickers = apiData.map(transformBinanceSpotTicker);
          } else if (category === 'um') {
            transformedTickers = apiData.map(transformBinanceUmTicker);
          } else if (category === 'cm') {
            transformedTickers = apiData.map(transformBinanceCmTicker);
          }

          set((state) => {
            state.tickers[category] = transformedTickers;
            state.isLoading = false;
          });
          return true;
        } catch (e) {
          set((state) => { state.error = e.message; state.isLoading = false; });
          return false;
        }
      },
    })),
  )
);
```

---

### 단계 5: 검증 (Verification)

**목적**: 새로 추가한 거래소의 API 연동이 정상적으로 동작하는지 최소한으로 확인합니다.

**작업**:
- 간단한 테스트 페이지나 컴포넌트를 생성하여, 새로 만든 Zustand 스토어의 `fetchTickers` 액션을 호출합니다.
- 데이터가 성공적으로 로드되고, `isLoading` 상태가 `false`로 변경되는지 확인합니다.
- 브라우저의 개발자 도구에서 Zustand 스토어의 상태 변화를 확인하고, 에러가 없는지 콘솔을 체크합니다.
- 이 과정에서 사용된 테스트 코드는 최종적으로 제거하거나, `src/app/test/`와 같은 별도의 테스트용 디렉토리에서 관리합니다.