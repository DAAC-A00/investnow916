# 04: 데이터 관리 및 모델링 (Data Management & Modeling)

일관성 있는 데이터 처리를 위해 모든 데이터는 표준화된 모델을 따르고, 정의된 규칙에 따라 저장 및 관리되어야 합니다.

## 📦 데이터 모델 (Data Models)

AI 에이전트는 모든 거래소 API 응답을 다음 표준 모델로 변환해야 합니다. 전체 정의는 `packages/shared/types/exchange.ts`를 참조하세요.

### `TickerData`
애플리케이션에서 사용하는 표준 티커(시세) 데이터 모델입니다.

- **주요 속성**:
  - `rawSymbol`, `integratedSymbol`: 원본 및 내부 표준 심볼
  - `price`, `priceChangePercent24h`: 현재가, 24시간 등락률
  - `volume24h`, `turnover24h`: 24시간 거래량, 거래대금
  - `exchange`, `integratedCategory`: 거래소, 내부 표준 카테고리
  - `instrumentInfo`, `warningInfo`: 종목 상세 정보, 유의/경고 정보

### `SymbolInfo`
거래소의 전체 종목(instrument) 정보를 나타내는 표준 모델입니다.

- **주요 속성**:
  - `rawSymbol`, `integratedSymbol`: 원본 및 내부 표준 심볼
  - `baseCode`, `quoteCode`: 기준/견적 화폐
  - `quantity`, `settlementCode`: 수량, 정산 화폐
  - `restOfSymbol`: 만기일 등 추가 정보 (선물/옵션 등)
  - `status`: 거래 상태 (TRADING, HALT 등)

---

## 🗄️ localStorage 저장 규칙

각 거래소의 모든 종목 정보는 API 호출 최소화를 위해 `localStorage`에 캐싱됩니다. 데이터를 저장하거나 읽을 때 다음 규칙을 반드시 준수해야 합니다.

### 1. 저장 키 (Storage Key)

- **형식**: `[exchangeName]-[integratedCategory]`
- **예시**: `bybit-um`, `binance-spot`, `bithumb-spot`
- **규칙**: 키 생성 시, API의 원본 카테고리(`rawCategory`)가 아닌 내부 표준 카테고리(`integratedCategory`)를 사용해야 합니다.

### 2. 저장 값 (Storage Value)

- **형식**: `[ISO8601타임스탬프]:::[심볼 데이터]`
- **구분자**: 타임스탬프와 심볼 데이터는 `:::`로 구분합니다.
- **심볼 데이터**: 각 종목 정보를 콤마(`,`)로 구분한 단일 문자열입니다.

### 3. 심볼 데이터 상세 형식 (Symbol Data Format)

- **형식**: `[storageSymbol]=[rawSymbol]`
- **`rawSymbol`**: API에서 사용하는 원본 심볼 (예: `BTCUSDT`, `KRW-BTC`)
- **`storageSymbol`**: 내부 규칙에 따라 표준화된 심볼. 다음과 같은 형식을 가질 수 있습니다.
  - **기본**: `[baseCode]/[quoteCode]` (예: `BTC/USDT`)
  - **수량(quantity) 포함**: `[quantity]*[baseCode]/[quoteCode]` (예: `1000*SHIB/USDT`)
  - **추가 정보 포함 (선택적)**: `[baseCode]/[quoteCode]-[restOfSymbol]` (예: `BTC/USD-241227`)

### 4. 저장 로직 예시 (Storage Logic Example)

다음은 `binanceApiClient.ts`의 `saveBinanceInstrumentsToStorage` 함수에서 `localStorage` 값을 생성하는 실제 로직입니다.

```ts
// 1. SymbolInfo[] 형태의 종목 데이터를 준비합니다.
const symbolData: SymbolInfo[] = getFilteredInstruments();

// 2. 각 종목을 "storageSymbol=rawSymbol" 형식의 문자열로 변환합니다.
const symbolStrings = symbolData.map(symbol => {
  let storageSymbol = '';

  // quantity가 1보다 큰 경우에만 접두사 추가
  if (symbol.quantity && symbol.quantity > 1) {
    storageSymbol += `${symbol.quantity}*`;
  }
  storageSymbol += `${symbol.baseCode}/${symbol.quoteCode}`;

  // restOfSymbol이 있는 경우 접미사 추가 (주로 선물/옵션)
  if (symbol.restOfSymbol) {
    storageSymbol += `-${symbol.restOfSymbol}`;
  }

  return `${storageSymbol}=${symbol.rawSymbol}`;
});

// 3. 타임스탬프와 심볼 데이터를 결합하여 최종 값을 만듭니다.
const currentTime = new Date().toISOString();
const dataToStore = `${currentTime}:::${symbolStrings.join(',')}`;

// 4. 정의된 키로 localStorage에 저장합니다.
const storageKey = 'binance-spot';
localStorage.setItem(storageKey, dataToStore);
```

**AI 에이전트는 `useExchangeCoinsStore`와 같은 기존 스토어의 로직을 참조하여 이 규칙에 따라 데이터를 정확히 읽고 써야 합니다.**