'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentRoute, useMenuItems, useNavigationActions, useRightNavWidth } from '../../../shared/stores/createNavigationStore';

export function RightNavigation() {
  const router = useRouter();
  const currentRoute = useCurrentRoute();
  const menuItems = useMenuItems();
  const rightNavWidth = useRightNavWidth();
  const { setCurrentRoute } = useNavigationActions();

  // 우측 네비게이션에 표시할 메뉴 순서 정의 (menu 제외)
  const rightNavOrder = ['home', 'counter'];
  
  // 순서에 맞게 메뉴 아이템 정렬
  const rightNavItems = rightNavOrder
    .map(id => menuItems.find(item => item.id === id))
    .filter(Boolean);

  const handleMenuClick = useCallback((route: string) => {
    setCurrentRoute(route);
    router.push(route);
  }, [router, setCurrentRoute]);

  return (
    <aside className={`fixed top-0 right-0 w-${rightNavWidth} h-full bg-white border-l border-gray-200 shadow-lg z-30`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">메뉴</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {rightNavItems.map((item) => {
            if (!item) return null;
            
            const isActive = currentRoute === item.route || 
                          (item.route !== '/' && currentRoute.startsWith(item.route));
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.route)}
                  disabled={item.isDisabled}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg
                    ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                    ${item.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  `}
                >
                  <div className="flex items-center">
                    {item.icon && (
                      <span className="mr-3 text-xl">{item.icon}</span>
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
