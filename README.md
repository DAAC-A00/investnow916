This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 개발 규칙 및 네이밍 컨벤션

### 1. Ticker 관련 네이밍
- **rawSymbol**: 외부 API에서 받은 원본 심볼 (예: BTCUSDT)
- **displaySymbol**: 내부 프로젝트에서 표시하는 심볼 (예: BTC/USDT)
- **baseCode**: 거래쌍의 기준(기본) 코인 (예: BTC)
- **quoteCode**: 거래쌍의 상대(견적) 코인 (예: USDT)
- **rawCategory**: 외부 API에서 받은 카테고리 (예: linear, inverse)
- **displayCategory**: 내부 프로젝트에서 표시하는 카테고리 (예: um, cm)

### 2. Instrument/티커 데이터 파싱 및 저장
- 로컬 스토리지 저장 포맷 & Instrument 정보 파싱
    - baseCode, quoteCode 외에 추가 정보가 없는 경우 : `baseCode/quoteCode=rawSymbol` (예: BTC/USDT=BTCUSDT)
    - baseCode, quoteCode 외에 추가 정보가 있는 경우 : `baseCode/quoteCode-restOfData=rawSymbol` (예: ETH/USDT-06JUN25=ETHUSDT-06JUN25)
- 모든 화면, 스토어, 타입에서 위 네이밍을 일관되게 사용

### 3. 타입/인터페이스 규칙
- 외부 API에서 받은 데이터는 원본 필드명을 그대로 사용하되, 내부 로직에서는 위 네이밍 컨벤션에 맞게 변환하여 사용
- 예시:
  ```ts
  interface InstrumentInfo {
    rawSymbol: string;
    displaySymbol: string;
    baseCode: string;
    quoteCode: string;
    rawCategory: string;
    displayCategory: string;
    restOfData?: string;
  }
  ```

### 5. 기타
- baseCoin, quoteCoin 등 과거 네이밍은 모두 baseCode, quoteCode로 통일
- displaySymbol, originalSymbol 등 혼용하지 않고, 반드시 symbol/rawSymbol로 구분
- 모든 화면, 스토어, 타입, 파싱, 저장, 불러오기 등에서 위 규칙을 반드시 준수

---

> ⚠️ 앞으로 프롬프트로 개발 요청 시, 위 규칙을 반드시 참고하여 일관된 네이밍과 데이터 구조를 유지해 주세요.
