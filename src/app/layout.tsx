import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "../packages/ui-kit/web/components";
import { ThemeInitializer } from "../packages/shared/components/ThemeInitializer";
import { AdminModeInitializer } from "../packages/shared/components/AdminModeInitializer";
import ExchangeCoinsInitializer from "../packages/shared/components/ExchangeCoinsInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InvestNow916",
  description: "실시간 금융 데이터 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const initialTheme = theme || systemTheme;
                  
                  if (initialTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // localStorage 접근 실패 시 기본 라이트 모드
                }
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ThemeInitializer />
        <AdminModeInitializer />
        <ExchangeCoinsInitializer autoFetch={true} />
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
