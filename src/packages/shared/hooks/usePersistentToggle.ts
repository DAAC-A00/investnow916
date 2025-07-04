import { useState, useEffect } from 'react';

/**
 * 로컬스토리지와 연동되는 토글 상태 관리 훅
 */
export function usePersistentToggle(key: string, defaultValue = false) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = window.localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem(key, value ? 'true' : 'false');
  }, [key, value]);

  return [value, setValue] as const;
} 