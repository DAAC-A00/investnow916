'use client';

import React from 'react';
import { useTheme, useThemeActions, useIsHydrated } from '../../../shared/stores/createThemeStore';

export function ThemeToggleButton() {
  const theme = useTheme();
  const isHydrated = useIsHydrated();
  const { toggleTheme } = useThemeActions();

  // 하이드레이션 완료 전까지는 렌더링하지 않음
  if (!isHydrated) {
    return (
      <div className="w-full h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="
        w-full flex items-center justify-center px-4 py-3 rounded-lg
        bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-300
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        border border-gray-200 dark:border-gray-600
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
