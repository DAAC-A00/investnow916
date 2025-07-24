# 01: 기술 스택 및 라이브러리 (Tech Stack & Libraries)

AI 에이전트는 다음 기술 스택을 기반으로 코드를 작성하고 패키지를 관리해야 합니다.

## ✨ 주요 기술 스택 (Core Tech Stack)

- **Framework**: Next.js (v15) / React (v19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4)
- **State Management**: Zustand
- **Linting**: ESLint

## 🎨 스타일링 (Styling) - Tailwind CSS

- UI는 Tailwind CSS를 사용하여 구축합니다.
- 스타일 설정은 `tailwind.config.ts` 파일을 중심으로 관리합니다.
- 조건부 또는 동적 클래스 적용 시에는 `clsx`와 `tailwind-merge` 유틸리티를 사용합니다.

```tsx
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function MyComponent({ isActive, className }) {
  const finalClassName = twMerge(clsx('p-4', { 'bg-blue-500': isActive }, className));
  return <div className={finalClassName}>...</div>;
}
```

## 📦 패키지 관리 (Package Management)

- 패키지 매니저로는 `pnpm`을 사용합니다.
- 새로운 의존성 추가 시에는 `pnpm add [package-name]` 명령을 사용하고, 개발 의존성은 `pnpm add -D [package-name]`을 사용합니다.
