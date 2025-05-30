/**
 * 모바일용 하단 네비게이션 컴포넌트
 * 1. 홈, 2. Counter, 3. 전체 메뉴 순서로 배치
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentRoute, useMenuItems, useNavigationActions } from '../../../shared/stores/createNavigationStore';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { useIsAdminModeEnabled } from '../../../shared/stores/createAdminModeStore';

export function BottomNavigation() {
  const router = useRouter();
  const currentRoute = useCurrentRoute();
  const menuItems = useMenuItems();
  const { setCurrentRoute, initializeDefaultMenus } = useNavigationActions();
  const { isMobile, isHydrated } = useResponsive();
  const isAdminMode = useIsAdminModeEnabled();

  // 컴포넌트 마운트 시 기본 메뉴 초기화
  useEffect(() => {
    if (menuItems.length === 0) {
      initializeDefaultMenus();
    }
  }, [menuItems.length, initializeDefaultMenus]);

  // 하단 네비게이션에 표시할 메뉴 순서 정의 (고정된 메뉴 순서)
  const bottomNavOrder = ['home', 'exchange', 'exchange-bybit', 'menu'];
  
  // 순서에 맞게 메뉴 아이템 정렬 (관리자 모드와 관계없이 항상 동일한 메뉴 표시)
  const bottomNavItems = bottomNavOrder
    .map(id => menuItems.find(item => item.id === id))
    .filter((item): item is NonNullable<typeof item> => !!item);

  const handleMenuClick = useCallback((route: string) => {
    setCurrentRoute(route);
    router.push(route);
  }, [router, setCurrentRoute]);

  // 하이드레이션 완료 전이거나 모바일이 아니면 렌더링하지 않음
  if (!isHydrated || !isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="flex justify-around items-center h-16">
        {bottomNavItems.map((item) => {
          const isActive = currentRoute === item.route;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.route)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full relative
                ${isActive ? 'text-primary' : 'text-muted-foreground'}
                hover:text-primary cursor-pointer
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              `}
            >
              {item.icon && (
                <span className="text-2xl">{item.icon}</span>
              )}
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
