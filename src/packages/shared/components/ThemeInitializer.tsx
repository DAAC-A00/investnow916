'use client';

import { useEffect } from 'react';
import { useThemeActions } from '../stores/createThemeStore';

export function ThemeInitializer() {
  const { initializeTheme } = useThemeActions();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return null;
}
