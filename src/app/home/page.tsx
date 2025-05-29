'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';

export default function HomePage() {
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();

  useEffect(() => {
    setCurrentRoute('/home');
  }, [setCurrentRoute]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              InvestNow916
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            실시간 금융 데이터와 투자 분석을 위한 통합 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/exchange')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              💱 환율 정보 보기
            </button>
            <button
              onClick={() => router.push('/menu')}
              className="bg-card hover:bg-accent text-card-foreground font-semibold py-3 px-8 rounded-lg border border-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              ☰ 전체 메뉴 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
