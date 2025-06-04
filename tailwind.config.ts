// Tailwind CSS 설정을 위한 타입 임포트
import type { Config } from "tailwindcss";

// Tailwind CSS 설정 객체
const config: Config = {
  // 다크 모드 설정: 'class'를 사용하면 HTML 요소의 클래스로 다크 모드 제어
  darkMode: 'class',
  
  // Tailwind가 검사할 파일 경로 패턴
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",      // 페이지 컴포넌트
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",  // 공통 컴포넌트
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",         // 앱 레이아웃 및 페이지
    "./src/packages/**/*.{js,ts,jsx,tsx,mdx}",    // 패키지 내부 컴포넌트
  ],
  
  // 테마 확장 설정
  theme: {
    extend: {
      // 색상 팔레트 정의 (CSS 변수를 사용한 동적 테마 지원)
      colors: {
        // 기본 배경색 (--background CSS 변수 사용)
        background: "hsl(var(--background))",
        // 기본 전경색 (텍스트 등)
        foreground: "hsl(var(--foreground))",
        
        // 카드 컴포넌트 색상
        card: {
          DEFAULT: "hsl(var(--card))",           // 카드 배경색
          foreground: "hsl(var(--card-foreground))", // 카드 내 텍스트 색상
        },
        
        // 팝오버 컴포넌트 색상
        popover: {
          DEFAULT: "hsl(var(--popover))",           // 팝오버 배경색
          foreground: "hsl(var(--popover-foreground))", // 팝오버 내 텍스트 색상
        },
        
        // 주요 브랜드 색상 (버튼, 링크 등에 사용)
        primary: {
          DEFAULT: "hsl(var(--primary))",           // 기본 색상
          foreground: "hsl(var(--primary-foreground))", // 기본 색상 위의 텍스트 색상
        },
        
        // 보조 색상 (두 번째 계층의 UI 요소에 사용)
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        // 비활성화된 요소나 덜 중요한 텍스트에 사용
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        // 강조 색상 (강조가 필요한 UI 요소에 사용)
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        // 파괴적 액션(삭제, 취소 등)에 사용
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        border: "hsl(var(--border))",     // 테두리 색상
        input: "hsl(var(--input))",         // 입력 필드 배경색
        ring: "hsl(var(--ring))",           // 포커스 링 색상
        
        // 차트 시리즈별 색상 (5가지 계열)
        chart: {
          "1": "hsl(var(--chart-1))",  // 1번 차트 색상
          "2": "hsl(var(--chart-2))",  // 2번 차트 색상
          "3": "hsl(var(--chart-3))",  // 3번 차트 색상
          "4": "hsl(var(--chart-4))",  // 4번 차트 색상
          "5": "hsl(var(--chart-5))",  // 5번 차트 색상
        },
      },
      
      // 모서리 둥글기 설정
      borderRadius: {
        lg: "var(--radius)",                  // 큰 모서리
        md: "calc(var(--radius) - 2px)",     // 중간 모서리 (기본에서 2px 감소)
        sm: "calc(var(--radius) - 4px)",     // 작은 모서리 (기본에서 4px 감소)
      },
    },
  },
  
  // 사용할 Tailwind 플러그인 목록 (현재는 비어있음)
  plugins: [],
  
  // PurgeCSS로 제거되지 않아야 할 클래스 명시적 지정
  // @ts-ignore - safelist는 타입 정의에는 없지만 유효한 설정
  safelist: [
    // 티커 색상 클래스 (동적으로 생성되는 클래스들)
    'text-green-500', 'border-green-500', 'bg-green-500',     // 상승 색상
    'text-red-500', 'border-red-500', 'bg-red-500',           // 하락 색상
    'text-blue-500', 'border-blue-500', 'bg-blue-500',        // 중립/기본 색상
    'text-muted-foreground', 'border-muted', 'bg-muted',      // 비활성화 상태
    'text-foreground', 'border-foreground', 'bg-background',  // 기본 전경/배경
    'text-gray-400', 'border-gray-400', 'bg-gray-100'         // 회색 계열 유틸리티
  ]
};

// 설정 객체 내보내기
export default config;
