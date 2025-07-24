# 03: 상태 관리 (State Management)

프로젝트의 전역 상태는 Zustand를 사용하여 관리합니다. AI 에이전트는 새로운 상태 추가 시 다음 규칙을 준수해야 합니다.

## 🧠 Zustand 사용 규칙

| 규칙            | 설명                                                               |
| :-------------- | :----------------------------------------------------------------- |
| **스토어 위치**   | 모든 Zustand 스토어는 `packages/shared/stores/` 내에 위치해야 합니다.    |
| **파일 네이밍**   | `create[StoreName]Store.ts` 형식의 파스칼/카멜 케이스를 사용합니다.      |
| **상태 구조**     | 가능한 한 Flat한 구조를 유지하여 복잡성을 최소화합니다.              |
| **불변성**        | `immer` 미들웨어를 사용하여 상태를 직접 수정하는 방식으로 업데이트합니다.    |
| **DevTools**    | `devtools` 미들웨어를 적용하여 디버깅 편의성을 확보합니다.             |
| **거래소 확장**   | 새로운 거래소 추가 시, 해당 거래소 전용 스토어를 생성합니다. (예: `createBybitTickerStore.ts`) |
| **`get()` 함수**  | 스토어 액션 내에서 다른 상태 값에 접근해야 할 경우 `get()` 함수를 사용합니다. |

## ⚙️ 스토어 구조 예시

다음은 `packages/shared/stores/createBinanceTickerStore.ts`의 실제 구조를 기반으로 한 예시입니다.

```ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TickerData } from '../types/exchange';
import { defaultApiClient } from '../utils/apiClient';
import { transformBinanceSpotTicker } from '../utils/binanceDataTransformer';

// 1. 상태와 액션을 포함하는 인터페이스 정의
interface BinanceTickerState {
  isLoading: boolean;
  error: string | null;
  tickers: Record<string, TickerData[]>;
  lastUpdated: Record<string, string>;
  beforePriceMap: Record<string, Record<string, number>>;
  
  fetchTickers: (category: string) => Promise<boolean>;
  fetchAllTickers: () => Promise<boolean>;
  // ... 기타 getter 및 action
}

// 2. 재사용성을 위해 초기 상태를 별도 객체로 정의
const initialState = {
  isLoading: false,
  error: null,
  tickers: {},
  lastUpdated: {},
  beforePriceMap: {},
};

// 3. create 함수를 사용하여 스토어 생성
export const useBinanceTickerStore = create<BinanceTickerState>()(
  // 4. devtools와 immer 미들웨어 적용
  devtools(
    immer((set, get) => ({
      // 5. 초기 상태 주입
      ...initialState,

      // 6. 액션 정의 (상태를 직접 수정하는 것처럼 작성)
      fetchTickers: async (category) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // API 클라이언트를 사용하여 데이터 요청
          const response = await defaultApiClient.get(`/api/binance/${category}/ticker24hr`);
          const apiData = response.data;

          // get() 함수로 현재 상태 값에 접근
          const currentBeforePriceMap = get().beforePriceMap[category] || {};

          // 데이터 변환 함수 호출
          const transformedTickers = apiData.map(ticker => 
            transformBinanceSpotTicker(ticker, currentBeforePriceMap[ticker.symbol])
          );

          set((state) => {
            state.tickers[category] = transformedTickers;
            state.isLoading = false;
            state.lastUpdated[category] = new Date().toISOString();
            // ... beforePriceMap 업데이트 로직 ...
          });
          return true;
        } catch (e) {
          set((state) => {
            state.error = e.message;
            state.isLoading = false;
          });
          return false;
        }
      },
    })),
    { name: 'binance-ticker-store' } // DevTools에 표시될 이름
  )
);
```

## ✅ 컴포넌트에서 상태 사용하기 (Consuming State in Components)

컴포넌트에서 Zustand 스토어의 상태를 사용할 때는 불필요한 리렌더링을 방지하기 위해 **반드시 `selector`를 사용**해야 합니다.

### 모범 사례 (Best Practice)

- 필요한 상태만 정확히 선택(select)하여 리렌더링 범위를 최소화합니다.
- 여러 상태를 사용하는 경우, `zustand/shallow` 미들웨어를 사용하여 1단계 깊이의 객체 비교를 수행함으로써 최적화할 수 있습니다.

```tsx
import { useBinanceTickerStore } from '@/packages/shared/stores/createBinanceTickerStore';
import { shallow } from 'zustand/shallow';

// 예시 1: 단일 상태 선택
const TickerList = () => {
  const tickers = useBinanceTickerStore((state) => state.tickers.spot);
  // ...
};

// 예시 2: 여러 상태 선택 (shallow 사용)
const TickerHeader = () => {
  const { isLoading, error, lastUpdated } = useBinanceTickerStore(
    (state) => ({
      isLoading: state.isLoading,
      error: state.error,
      lastUpdated: state.lastUpdated.spot,
    }),
    shallow // 얕은 비교를 통해 불필요한 리렌더링 방지
  );
  // ...
};

// 잘못된 사용 예시 (전체 상태를 구독하여 불필요한 리렌더링 유발)
const BadExample = () => {
  const state = useBinanceTickerStore(); // 전체 상태를 구독하므로 지양
  // ...
};
```