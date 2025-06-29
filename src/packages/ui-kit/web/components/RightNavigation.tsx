'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentRoute, useMenuItems, useNavigationActions, useRightNavWidth } from '../../../shared/stores/createNavigationStore';
import { useIsAdminModeEnabled } from '../../../shared/stores/createAdminModeStore';
import { ThemeToggleButton } from './ThemeToggleButton';

export function RightNavigation() {
  const router = useRouter();
  const currentRoute = useCurrentRoute();
  const menuItems = useMenuItems();
  // 고정 너비 20 사용 (기존 동적 너비 대신)
  const rightNavWidth = 20;
  const { setCurrentRoute } = useNavigationActions();
  const isAdminMode = useIsAdminModeEnabled();

  // 우측 네비게이션에 표시할 메뉴 필터링 및 정렬
  // - isRightNav가 true인 메뉴만 표시
  // - 관리자 전용 메뉴는 관리자 모드에서만 표시
  // - 검색 전용 메뉴는 네비게이션에서 제외
  // - rightNavOrder 순서대로 정렬
  const rightNavItems = menuItems
    .filter(item => 
      item.isRightNav === true && // 우측 네비게이션에 표시할 메뉴만
      !item.isOnlySearchable && // 검색 전용 메뉴 제외
      (!item.isAdminOnly || (item.isAdminOnly && isAdminMode)) // 관리자 전용 메뉴 처리
    )
    .sort((a, b) => {
      // rightNavOrder로 정렬 (숫자가 작을수록 먼저 표시)
      const orderA = a.rightNavOrder ?? 999; // 순서가 없으면 마지막에 배치
      const orderB = b.rightNavOrder ?? 999;
      return orderA - orderB;
    });

  const handleMenuClick = useCallback((route: string) => {
    setCurrentRoute(route);
    router.push(route);
  }, [router, setCurrentRoute]);

  return (
    <aside className={`fixed top-0 right-0 w-14 h-full bg-background border-l border-border shadow-lg z-30 flex flex-col`}>
      <div className="p-2 border-b border-border">
        <h2 className="text-sm font-bold text-foreground text-center">메뉴</h2>
      </div>
      
      <nav className="p-1 flex-1">
        <ul className="space-y-1">
          {rightNavItems.map((item) => {
            if (!item) return null;
            
            const isActive = currentRoute === item.route || 
                          (item.route !== '/' && currentRoute.startsWith(item.route));
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.route)}
                  className={`
                    w-full flex flex-col items-center justify-center px-1.5 py-2 rounded-lg
                    ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}
                    cursor-pointer transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                  `}
                >
                  <div className="flex flex-col items-center justify-center">
                    {item.icon && (
                      <span className="text-lg mb-0.5">{item.icon}</span>
                    )}
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 테마 토글 버튼 - 최하단에 배치 */}
      <div className="p-2 border-t border-border">
        <ThemeToggleButton />
      </div>
    </aside>
  );
}
