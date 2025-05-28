/**
 * 모바일용 하단 네비게이션 컴포넌트
 * 1. 홈, 2. Counter, 3. 전체 메뉴 순서로 배치
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentRoute, useMenuItems, useNavigationActions } from '../../../shared/stores/createNavigationStore';

export function BottomNavigation() {
  const router = useRouter();
  const currentRoute = useCurrentRoute();
  const menuItems = useMenuItems();
  const { setCurrentRoute, initializeDefaultMenus } = useNavigationActions();

  // 컴포넌트 마운트 시 기본 메뉴 초기화
  useEffect(() => {
    if (menuItems.length === 0) {
      initializeDefaultMenus();
    }
  }, [menuItems.length, initializeDefaultMenus]);

  // 하단 네비게이션에 표시할 메뉴 순서 정의
  const bottomNavOrder = ['home', 'counter', 'menu'];
  
  // 순서에 맞게 메뉴 아이템 정렬
  const sortedMenuItems = bottomNavOrder
    .map(id => menuItems.find(item => item.id === id))
    .filter(Boolean) as typeof menuItems;

  const handleMenuClick = (route: string) => {
    setCurrentRoute(route);
    router.push(route);
  };

  // 메뉴 아이템이 아직 로드되지 않았으면 로딩 상태 표시
  if (sortedMenuItems.length === 0) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around items-center h-16 px-4">
          <div className="text-gray-400 text-sm">메뉴 로딩 중...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16 px-4">
        {sortedMenuItems.map((item) => {
          const isActive = currentRoute === item.route;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.route)}
              disabled={item.isDisabled}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200
                ${isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
                ${item.isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {item.icon && (
                <span className="text-lg mb-1">{item.icon}</span>
              )}
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
