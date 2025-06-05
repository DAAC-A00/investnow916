
```markdown
# 📦 Monorepo 기반 크로스플랫폼 프로젝트

## 📁 프로젝트 구조

```

src/
├── app/                            # Next.js (App Router) 기반 웹앱
├── app\_mobile/                     # React Native (Expo) 앱 - PWA 또는 앱 스토어 배포용
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

````

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
````

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

| 키                                 | 설명                                                             |
| --------------------------------- | -------------------------------------------------------------- |
| `rawSymbol`                       | 외부 API 심볼 (ex: BTCUSDT)                                        |
| `displaySymbol`                   | 내부 표시용 (ex: BTC/USDT)                                          |
| `baseCode` / `quoteCode`          | 기준/견적 화폐 코드                                                    |
| `rawCategory` / `displayCategory` | API 원본 카테고리 / UI 표시용                                           |
| 파싱/저장 규칙                          | `BTC/USDT=BTCUSDT` 또는 `ETH/USDT-06JUN25=ETHUSDT-06JUN25` 형식 저장 |
| 타입 예시                             |                                                                |

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

```

---
