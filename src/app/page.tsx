/**
 * 루트 페이지 (홈으로 리다이렉트)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 루트 페이지 진입 시 /home으로 리다이렉트
    router.replace('/home');
  }, [router]);

  // 리다이렉트 중 빈 페이지 표시
  return null;
}
