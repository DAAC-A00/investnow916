/**
 * 앱 전체 레이아웃 컴포넌트
 * 태블릿(768px 이상)은 데스크톱으로 처리
 */

'use client';

import React from 'react';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { BottomNavigation } from './BottomNavigation';
import { DrawerMenu } from './DrawerMenu';
import { MenuToggleButton } from './MenuToggleButton';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobile, isDesktop, isHydrated } = useResponsive();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 데스크톱/태블릿용 메뉴 토글 버튼 */}
      {isHydrated && isDesktop && (
        <div className="fixed top-4 right-4 z-50">
          <MenuToggleButton />
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className={`
        ${isMobile ? 'pb-20' : 'pb-8'}
        ${isDesktop ? 'pt-8' : 'pt-4'}
        px-4 min-h-screen
      `}>
        {children}
      </main>

      {/* 모바일용 하단 네비게이션 - 하이드레이션 완료 후 표시 */}
      {isHydrated && isMobile && <BottomNavigation />}

      {/* 데스크톱/태블릿용 Drawer 메뉴 */}
      {isHydrated && isDesktop && <DrawerMenu />}
    </div>
  );
}
