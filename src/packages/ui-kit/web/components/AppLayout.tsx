/**
 * 앱 전체 레이아웃 컴포넌트
 * 태블릿(768px 이상)은 데스크톱으로 처리
 */

'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { BottomNavigation } from './BottomNavigation';
import { RightNavigation } from './RightNavigation';
import { 
  useNavigationActions, 
  useRightNavWidth,
  useMenuItems 
} from '../../../shared/stores/createNavigationStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { isMobile, isDesktop, isHydrated } = useResponsive();
  const rightNavWidth = useRightNavWidth();
  const menuItems = useMenuItems();
  const { setCurrentRoute, initializeDefaultMenus } = useNavigationActions();

  // 컴포넌트 마운트 시 기본 메뉴 초기화
  useEffect(() => {
    if (menuItems.length === 0) {
      console.log('메뉴 아이템 초기화');
      initializeDefaultMenus();
    }
  }, [menuItems.length, initializeDefaultMenus]);

  // 현재 경로가 변경될 때마다 현재 라우트 업데이트
  useEffect(() => {
    setCurrentRoute(pathname);
  }, [pathname, setCurrentRoute]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className={`flex min-h-full ${isDesktop ? `pr-${rightNavWidth}` : ''}`}>
        {/* 메인 콘텐츠 */}
        <main className={`
          flex-1 w-full
          ${isMobile ? 'pb-20' : 'pb-8'}
          ${isDesktop ? 'pt-8' : 'pt-4'}
          px-4 min-h-screen
        `}>
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>

        {/* 데스크톱/태블릿용 우측 네비게이션 */}
        {isHydrated && isDesktop && <RightNavigation />}
      </div>

      {/* 모바일용 하단 네비게이션 - 하이드레이션 완료 후 표시 */}
      {isHydrated && isMobile && <BottomNavigation />}
    </div>
  );
}
