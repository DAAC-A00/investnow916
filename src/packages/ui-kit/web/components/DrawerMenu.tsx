/**
 * 데스크톱/태블릿용 Drawer 메뉴 컴포넌트
 * 1. 홈, 2. Counter, 3. 전체 메뉴 순서로 배치
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentRoute, useIsMenuOpen, useMenuItems, useNavigationActions } from '../../../shared/stores/createNavigationStore';

export function DrawerMenu() {
  const router = useRouter();
  const currentRoute = useCurrentRoute();
  const isMenuOpen = useIsMenuOpen();
  const menuItems = useMenuItems();
  const { setCurrentRoute, setMenuOpen } = useNavigationActions();

  // 메뉴 순서 정의 (하단 네비게이션과 동일)
  const menuOrder = ['home', 'counter', 'menu'];
  
  // 순서에 맞게 메뉴 아이템 정렬
  const sortedMenuItems = menuOrder
    .map(id => menuItems.find(item => item.id === id))
    .filter(Boolean) as typeof menuItems;

  const handleMenuClick = (route: string) => {
    setCurrentRoute(route);
    setMenuOpen(false); // 메뉴 선택 후 닫기
    router.push(route);
  };

  const handleOverlayClick = () => {
    setMenuOpen(false);
  };

  if (!isMenuOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleOverlayClick}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">메뉴</h2>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* 메뉴 리스트 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {sortedMenuItems.map((item) => {
                const isActive = currentRoute === item.route;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.route)}
                    disabled={item.isDisabled}
                    className={`
                      w-full flex items-center p-4 rounded-lg transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                      ${item.isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                  >
                    {item.icon && (
                      <span className="text-lg mr-3">{item.icon}</span>
                    )}
                    <div className="flex-1 text-left">
                      <span className="font-medium">{item.label}</span>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 푸터 */}
          <div className="p-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              InvestNow916 v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
