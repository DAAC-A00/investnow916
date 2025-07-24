# 06: 코딩 컨벤션 (Coding Conventions)

일관성 있고 가독성 높은 코드베이스를 유지하기 위해 모든 기여자는 다음 코딩 컨벤션을 준수해야 합니다.

## 📝 네이밍 컨벤션 (Naming Conventions)

| 구분              | 형식                  | 예시                                    |
| :---------------- | :-------------------- | :-------------------------------------- |
| **변수/함수**       | `camelCase`           | `fetchTickers`, `marketData`            |
| **컴포넌트**        | `PascalCase`          | `TickerList`, `PriceChart`              |
| **타입/인터페이스** | `PascalCase`          | `TickerData`, `ExchangeConfig`          |
| **파일 (컴포넌트)** | `PascalCase.tsx`      | `TickerList.tsx`                        |
| **파일 (훅)**       | `use[Name].ts`        | `useResponsive.ts`                      |
| **파일 (스토어)**   | `create[Name]Store.ts`| `createBinanceTickerStore.ts`           |
| **파일 (일반)**     | `camelCase.ts`        | `apiClient.ts`, `priceFormatter.ts`     |

## ✨ 코드 스타일 및 린팅 (Code Style & Linting)

- **기본 규칙**: 프로젝트는 `Next.js`의 기본 ESLint 규칙 (`next/core-web-vitals`, `next/typescript`)을 따릅니다.
- **자동 포맷팅**: 코드 작성 후에는 저장 시 자동으로 포맷팅이 적용됩니다. (VSCode `editor.formatOnSave` 설정 권장)
- **규칙 준수**: AI 에이전트는 코드 생성 및 수정 시 반드시 ESLint 규칙을 준수해야 하며, 어떠한 경고(warning)나 오류(error)도 발생시켜서는 안 됩니다.

## 💬 주석 (Comments)

- **Why, not What**: 주석은 "무엇을" 하는 코드인지 설명하기보다는, "왜" 그렇게 작성해야 했는지 복잡한 비즈니스 로직이나 특정 해결책의 배경을 설명하는 데 사용합니다.
- **최소화**: 코드는 자체적으로 설명 가능해야 합니다. 명확한 변수명과 함수명을 통해 주석의 필요성을 최소화합니다.
- **TODO 주석**: 임시 코드나 향후 개선이 필요한 부분에는 `// TODO:` 주석을 사용하여 명시합니다.

## 🔄 카테고리 명명 규칙 (Category Naming)

애플리케이션 내에서 거래소의 시장(카테고리)을 일관되게 관리하기 위해 다음 두 가지 타입을 사용합니다.

- **`rawCategory`**: API 응답에 포함된 원본 카테고리명입니다. (예: `linear`, `inverse`)
- **`integratedCategory`**: 애플리케이션 내부에서 사용하는 표준 카테고리명입니다. (예: `um`, `cm`)

AI 에이전트는 `rawCategory`를 항상 `integratedCategory`로 변환하여 사용해야 하며, 이 매핑 규칙은 각 거래소의 설정 파일(`packages/shared/constants/exchange/configs/[exchangeName].ts`)에 정의되어 있습니다.

| 거래소   | `rawCategory` (API) | `integratedCategory` (내부) | 설명                |
| :------- | :------------------ | :-------------------------- | :------------------ |
| **Bybit**  | `linear`            | `um`                        | USDT 무기한 선물    |
|          | `inverse`           | `cm`                        | 코인마진 선물       |
|          | `spot`              | `spot`                      | 현물                |
| **Binance**| `spot`              | `spot`                      | 현물                |
|          | `um`                | `um`                        | USDT 선물           |
|          | `cm`                | `cm`                        | 코인마진 선물       |
| **Bithumb**| `spot`              | `spot`                      | 현물 (원화마켓)     |

## 💾 심볼 명명 규칙 (Symbol Naming)

데이터 변환 로직 작성 시, 이 세 가지 심볼 타입을 명확히 구분하여 사용해야 합니다.

- **`rawSymbol`**: API에서 사용하는 원본 심볼 (예: `BTCUSDT`, `KRW-BTC`)
- **`integratedSymbol`**: UI에 표시하기 위한 표준화된 심볼 (예: `BTC/USDT`)
- **`storageSymbol`**: `localStorage`에 저장하기 위한 심볼 형식. `[base]/[quote]` 또는 `[quantity]*[base]/[quote]` 등의 형식을 가집니다.

### `storageSymbol` 생성 예시

```ts
// SymbolInfo 객체가 주어졌을 때
const symbol: SymbolInfo = {
  rawSymbol: '1000SHIBUSDT',
  baseCode: 'SHIB',
  quoteCode: 'USDT',
  quantity: 1000,
};

// storageSymbol을 생성하는 로직
let storageSymbol = '';
if (symbol.quantity && symbol.quantity > 1) {
  storageSymbol += `${symbol.quantity}*`;
}
storageSymbol += `${symbol.baseCode}/${symbol.quoteCode}`;

// 최종 localStorage 저장 형식: "storageSymbol=rawSymbol"
const finalString = `${storageSymbol}=${symbol.rawSymbol}`;
// 결과: "1000*SHIB/USDT=1000SHIBUSDT"
```

## 🛡️ 에러 핸들링 (Error Handling)

애플리케이션의 안정성을 위해 API 통신 등에서 발생할 수 있는 에러를 다음과 같이 처리해야 합니다.

- **API 호출**: 모든 API 호출은 `try...catch` 블록으로 감싸야 합니다.
- **상태 업데이트**: 에러 발생 시, Zustand 스토어의 `error` 상태에 에러 메시지를 저장하고, `isLoading` 상태를 `false`로 설정해야 합니다.
- **사용자 피드백**: 치명적인 에러가 발생했거나 데이터 로드에 실패했을 경우, UI를 통해 사용자에게 "데이터를 불러오는 데 실패했습니다."와 같은 메시지를 표시해야 합니다.
- **콘솔 로그**: 에러 객체나 관련 정보는 `console.error()`를 사용하여 로그를 남겨 디버깅을 용이하게 해야 합니다.