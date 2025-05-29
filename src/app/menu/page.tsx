/**
 * 전체 메뉴 페이지 컴포넌트
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMenuItems, useNavigationActions, useCurrentRoute } from '../../packages/shared/stores/createNavigationStore';

export default function MenuPage() {
  const router = useRouter();
  const menuItems = useMenuItems();
  const currentRoute = useCurrentRoute();
  const { initializeDefaultMenus, setCurrentRoute } = useNavigationActions();

  // 참고: 기본 메뉴 초기화는 AppLayout에서 처리됩니다

  // 현재 경로 설정
  useEffect(() => {
    setCurrentRoute('/menu');
  }, [setCurrentRoute]);

  const handleMenuClick = (route: string) => {
    setCurrentRoute(route);
    router.push(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-muted py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            ☰ 전체 메뉴
          </h1>
          <p className="text-lg text-muted-foreground">
            사용 가능한 모든 기능을 확인하고 이동할 수 있습니다
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const isActive = currentRoute === item.route;
            
            return (
              <div
                key={item.id}
                className={`
                  bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border border-border
                  ${isActive 
                    ? 'ring-2 ring-primary bg-accent' 
                    : 'hover:scale-105'
                  }
                  ${item.isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                  }
                `}
                onClick={() => !item.isDisabled && handleMenuClick(item.route)}
              >
                <div className="text-center">
                  {item.icon && (
                    <div className="text-4xl mb-4">{item.icon}</div>
                  )}
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {item.label}
                  </h3>
                  {item.description && (
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              메뉴를 로딩 중입니다...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
