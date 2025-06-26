'use client';

import React from 'react';
import { useTheme, useThemeActions, useIsHydrated } from '../../../shared/stores/createThemeStore';

export function ThemeToggleButton() {
  const theme = useTheme();
  const isHydrated = useIsHydrated();
  const { toggleTheme } = useThemeActions();

  // 하이드레이션 완료 전까지는 로딩 상태 표시
  if (!isHydrated) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-muted rounded-full animate-pulse" />
        <div className="flex flex-col gap-1">
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />
          <div className="w-20 h-3 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="
        w-full flex items-center justify-center px-4 py-3 rounded-lg
        bg-muted/50 hover:bg-muted/60 dark:bg-muted/60 dark:hover:bg-muted/70
        text-muted-foreground
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        border border-border dark:border-border
      "
      title={`${theme === 'light' ? '다크' : '라이트'} 모드로 전환`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">
          {theme === 'light' ? '☀️' : '🌙'}
        </span>
      </div>
    </button>
  );
}
