# 📦 Monorepo 기반 크로스플랫폼 프로젝트

## 📁 프로젝트 구조

```
src/
├── app/                            # Next.js (App Router) 기반 웹앱
├── app_mobile/                     # React Native (Expo) 앱 - PWA 또는 앱 스토어 배포용
├── packages/
│   ├── shared/                     # 공통 로직 모듈 (웹/모바일 공용)
│   │   ├── components/             # UI 컴포넌트 (Tamagui/Shadcn 기반)
│   │   ├── hooks/                  # 커스텀 훅
│   │   ├── stores/                 # Zustand 상태 관리
│   │   ├── types/                  # 타입 정의 (DTO, 상태 등)
│   │   ├── utils/                  # 유틸 함수
│   │   └── websocket/              # 실시간 통신 모듈
│   ├── ui-kit/
│   │   ├── tokens/                 # Tailwind + Tamagui 기반 디자인 토큰
│   │   ├── web/                    # 웹 전용 Shadcn 컴포넌트
│   │   └── native/                 # 모바일 전용 Tamagui 컴포넌트
│   ├── data-client/                # 서버 통신 계층 (React Query 기반)
│   │   ├── queries/                # API 조회
│   │   ├── mutations/              # API 생성/수정
│   │   ├── subscribers/            # 실시간 구독
│   │   └── cache/                  # 캐싱 전략
│   └── dev-tools/
│       ├── storybook/              # 웹/모바일 Storybook 설정
│       ├── mock-server/            # MSW 기반 Mock 서버
│       └── performance/            # 성능 측정 도구

```

---

## 🧠 상태관리 - Zustand

| 항목              | 내용 |
|-------------------|------|
| 상태 구조         | Flat 구조 유지 필수 |
| 파일 네이밍       | `createXXXStore.ts` 사용 |
| 미들웨어          | `devtools`, `immer` 적용 |
| 타입 정의         | `StateCreator<T>` 제네릭 사용 필수 |
| 위치              | `packages/shared/stores/` 하위 구성 |
| 접근 방식         | `selector` 기반 + `shallow` 비교 권장 |

> 모바일 성능 최적화: `React.memo`, `Tamagui` 속성 바인딩 필수

```tsx
<Button variant={isActive ? "solid" : "outline"} disabled={!isAvailable}>
  주문하기
</Button>
```

---

## 🎨 디자인 시스템 - Tailwind + Tamagui 토큰 기반

| 플랫폼    | 웹 (Next.js)             | 모바일 (Expo)          | 공통 지침                        |
| ------ | ----------------------- | ------------------- | ---------------------------- |
| 도구     | Tailwind CSS            | Tamagui             | `tokens.ts` 기준 공통 디자인 시스템 구성 |
| 설정 파일  | `tailwind.config.ts`    | `tamagui.config.ts` | `ui-kit/tokens/` 디렉토리에서만 관리  |
| 스타일 작성 | `@layer components`, 유틸 | `styled()`, `theme` | 반드시 토큰 기반으로 작성               |

---

## 🔌 실시간 통신 - WebSocket

| 단계       | 설명                                   |
| -------- | ------------------------------------ |
| 연결 수립    | `socket.connect()`                   |
| 심볼 구독    | `subscribe(symbol)`                  |
| 상태 반영    | Zustand/Valtio 활용                    |
| UI 구독 방식 | selector로 구독                         |
| 구독 최적화   | 필요한 심볼만 구독 유지                        |
| 에러 복구 전략 | 자동 재연결 + 지수적 backoff, Toast 알림 구성 필수 |

---

## 🔁 React Query 전략

| 항목                    | 설명                     |
| --------------------- | ---------------------- |
| `staleTime` 설정        | 종목 목록: 10초, 주문내역: 1분 등 |
| `errorBoundary` 활용    | 컴포넌트 경계 기반 fallback 처리 |
| `invalidateQueries()` | 주문 완료 시 강제 갱신          |
| `select()`            | 필요한 필드만 추출하여 메모리 최적화   |

---

## 🧪 테스트 전략

| 구분     | 웹                           | 모바일                                    | 공통                  |
| ------ | --------------------------- | -------------------------------------- | ------------------- |
| 단위 테스트 | Jest + Testing Library      | Jest + `@testing-library/react-native` | `*.spec.tsx` 기준     |
| 통합 테스트 | Playwright, Vitest          | Detox, Expo Preview                    | 상태 흐름 + UI 반응       |
| 성능 측정  | Chrome DevTools, Lighthouse | Reanimated DevTools, FPS 추적            | `performance.ts` 활용 |

---

## 📚 UI 문서화 & 디자인 시스템 확인

| 항목     | 웹                     | 모바일                  | 공통               |
| ------ | --------------------- | -------------------- | ---------------- |
| 문서화 도구 | Storybook             | Expo Storybook       | 모든 컴포넌트 문서화 필수   |
| 등록 방식  | Shadcn 자동 등록          | Tamagui 자동 등록        | `stories/` 경로 통일 |
| 시각화 도구 | Tailwind Theme Viewer | Tamagui Theme Viewer | tokens 기반 시각화    |

---

## 🚀 배포 및 모니터링

| 항목      | 설명                             |
| ------- | ------------------------------ |
| 웹 배포    | Vercel (ISR + Edge Runtime)    |
| 모바일 배포  | Expo EAS + CodePush 핫픽스        |
| 에러 모니터링 | Sentry 연동 필수                   |
| UX 측정   | Web Vitals (LCP, CLS 등)        |
| FPS 분석  | `performance.ts` + DevTools 활용 |

---

## 🎛 디자인 토큰 동기화 자동화

### `sync-tokens.ts`

* `packages/ui-kit/tokens/`의 내용을 기준으로 다음 파일 자동 동기화:

  * `tailwind.config.ts`
  * `tamagui.config.ts`
* 스크립트 실행:

  ```bash
  pnpm sync-tokens
  ```

### Storybook 자동 등록

* `stories/` 하위에 위치한 컴포넌트 자동 등록
* 필요 시 `autogen.ts` 활용 가능

---

## 📌 네이밍 컨벤션 (티커 및 심볼 처리)

### 기본 속성

| 키                                 | 설명                                                             |
|----------------------------------|-------------------------------------------------------------------|
| `rawSymbol`                      | API에서 받은 원본 심볼 (예: BTCUSDT, 100BTCUSDT25DEC24)                  |
| `integratedSymbol`               | 내부 표시용 심볼 (조건부 포맷)                                            |
| `baseCode` / `quoteCode`         | 기준/견적 화폐 코드 (quantity 제거된 실제 코드)                              |
| `quantity`                       | 수량 정보 (10의 배수일 때만 유효, 기본값: 1)                                 |
| `settlementCode`                 | 정산 화폐 코드 (조건부 결정)                                             |
| `restOfSymbol`                   | 기타 심볼 정보 (만료일, 옵션 정보 등)                                       |
| `rawCategory` / `integratedCategory` | API 원본 카테고리 / UI 표시용                                           |

### quantity 추출 규칙

**새로운 quantity 추출 로직:**
- quantity는 **1** 또는 **1000 이상의 10의 배수**만 허용
- 다른 모든 값은 quantity = 1로 처리
- baseCoin의 왼쪽 숫자를 우선 확인하여 추출

#### 예시:
- `C98USDT` → quantity: **1**, baseCode: **C98**
- `BANANAS31USDC` → quantity: **1**, baseCode: **BANANAS31**
- `BROCCOLI714USDT` → quantity: **1**, baseCode: **BROCCOLI714**
- `100PEPEUSDT` → quantity: **1**, baseCode: **100PEPE**
- `1000DOGEUSDT` → quantity: **1000**, baseCode: **DOGE**
- `2000BTCUSDT` → quantity: **2000**, baseCode: **BTC**
- `1500ETHUSDT` → quantity: **1500**, baseCode: **ETH**
- `1234BTCUSDT` → quantity: **1**, baseCode: **1234BTC** (1234는 10의 배수가 아니므로)

### integratedSymbol 조건부 포맷

#### quantity > 1인 경우 (1000 이상의 10의 배수):
- **restOfSymbol 있음**: `${quantity}${baseCode}/${quoteCode}-${restOfSymbol}`
- **restOfSymbol 없음**: `${quantity}${baseCode}/${quoteCode}`
- **예시**: `1000DOGE/USDT`, `1500ETH/USDT-25DEC24`

#### quantity = 1인 경우 (기본):
- **restOfSymbol 있음**: `${baseCode}/${quoteCode}-${restOfSymbol}`
- **restOfSymbol 없음**: `${baseCode}/${quoteCode}`
- **예시**: `C98/USDT`, `100PEPE/USDT`, `BANANAS31/USDC-25DEC24`

### localStorage 저장 형식

#### settlementCode와 quoteCode가 동일한 경우 (간소화):
- **quantity >= 1000**: `${quantity}*${baseCode}/${quoteCode}-${restOfSymbol}=${rawSymbol}`
- **quantity = 1**: `${baseCode}/${quoteCode}-${restOfSymbol}=${rawSymbol}`

#### settlementCode와 quoteCode가 다른 경우 (확장):
- **quantity >= 1000**: `${quantity}*${baseCode}/${quoteCode}(${settlementCode})-${restOfSymbol}=${rawSymbol}`
- **quantity = 1**: `${baseCode}/${quoteCode}(${settlementCode})-${restOfSymbol}=${rawSymbol}`

### 타입 정의

```ts
interface SymbolInfo {
  rawSymbol: string;              // API에서 받은 원본 심볼
  integratedSymbol: string;          // 조건부 포맷 표시 심볼
  baseCode: string;               // 기준 화폐 (quantity 제거됨)
  quoteCode: string;              // 견적 화폐
  restOfSymbol?: string;          // 추가 심볼 정보
  quantity?: number;              // 수량 (기본값: 1)
  settlementCode?: string;        // 정산 화폐
  integratedCategory?: string;       // UI 표시 카테고리
  rawCategory?: string;           // API 원본 카테고리
  
  [key: string]: any;             // 추가 필드 허용
}

```

### 파싱 예시

#### Bybit 예시:
```ts
// API 응답 예시
{
  baseCoin: "100BTC",
  quoteCoin: "USDT", 
  symbol: "100BTCUSDT25DEC24"
}

// 파싱 결과
{
  rawSymbol: "100BTCUSDT25DEC24",
  integratedSymbol: "100BTC/USDT-25DEC24",
  baseCode: "BTC",
  quoteCode: "USDT",
  quantity: 100,
  restOfSymbol: "25DEC24",
  settlementCode: "USDT"
}
```

#### 빗썸 예시:
```ts
// API 응답 예시
{
  market: "KRW-BTC",
  korean_name: "비트코인",
  english_name: "Bitcoin",
  market_warning: "CAUTION"
}

// Warning API 응답 예시
[
  {
    market: "KRW-BTC",
    warning_type: "DEPOSIT_AMOUNT_SUDDEN_FLUCTUATION",
    end_date: "2025-06-14 07:04:59"
  },
  {
    market: "KRW-BTC", 
    warning_type: "TRADING_VOLUME_SUDDEN_FLUCTUATION",
    end_date: "2025-06-14 07:04:59"
  }
]

// 파싱 결과
{
  rawSymbol: "KRW-BTC",
  integratedSymbol: "BTC/KRW",
  baseCode: "BTC",
  quoteCode: "KRW",
  quantity: 1,
  settlementCode: "KRW",
}

// localStorage 저장 형식
"BTC/KRW=KRW-BTC"
```

---

## 🗄️ Instrument 정보의 localStorage 저장 구조 및 카테고리 매핑

### 저장 키(Key) 규칙
- **형식:** `$exchange-$integratedCategory`
  - 예시: `bybit-um`, `bybit-cm`, `bybit-spot`, `bithumb-spot`
- **절대 rawCategory(예: linear, inverse)로 저장하지 않음!**

### 저장 값(Value) 규칙
- **형식:** `ISO8601타임스탬프:::심볼데이터`
  - 예시: `2025-07-08T00:23:36.935Z:::BTC/USDT=BTCUSDT,ETH/USDT=ETHUSDT`
- **타임스탬프**: 마지막 데이터 갱신 시각(UTC)
- **심볼데이터**: 콤마(,)로 구분된 심볼 목록(상세 포맷은 위 [네이밍 컨벤션] 참고)

### 카테고리 매핑 (rawCategory → integratedCategory)

| 거래소   | rawCategory | integratedCategory | 저장 키 예시      |
|--------|-------------|-------------------|------------------|
| bybit  | linear      | um                | bybit-um         |
| bybit  | inverse     | cm                | bybit-cm         |
| bybit  | spot        | spot              | bybit-spot       |
| bybit  | option      | options           | bybit-options    |
| bithumb| spot        | spot              | bithumb-spot     |

- **rawCategory**: API에서 받은 원본 카테고리명
- **integratedCategory**: UI/스토리지/비즈니스 로직에서 사용하는 통합 카테고리명
- **저장 키**: 항상 `$exchange-$integratedCategory`로 저장됨

### 예시 (bybit 선물)
- bybit의 linear(USDT 무기한 선물) → integratedCategory: `um` → 저장 키: `bybit-um`
- bybit의 inverse(코인 마진 선물) → integratedCategory: `cm` → 저장 키: `bybit-cm`

### 참고
- 카테고리 매핑 로직은 `src/packages/shared/constants/exchangeCategories.ts` 및 `exchangeConfig.ts`에서 관리
- instrument 관련 스토어(`createExchangeInstrumentStore.ts`, `useExchangeCoinsStore.ts`)는 항상 integratedCategory 기준으로 localStorage에 접근/저장
- 기존에 rawCategory로 저장된 데이터가 있다면 반드시 마이그레이션 필요

---

## 🧪 개발 시작

개발 서버 실행:

```bash
pnpm dev
```

로컬에서 [http://localhost:3000](http://localhost:3000) 확인 가능

초기 페이지는 `app/page.tsx` 파일로 수정 가능하며, 실시간 반영됩니다.

---

## 📚 Next.js 참고 자료

* [Next.js 공식 문서](https://nextjs.org/docs)
* [Next.js 튜토리얼](https://nextjs.org/learn)
* [Next.js GitHub](https://github.com/vercel/next.js)
* [Vercel 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)
