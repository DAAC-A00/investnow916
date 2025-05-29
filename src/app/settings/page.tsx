'use client';

import React from 'react';
import { useIsAdminModeEnabled, useAdminModeActions } from '@/packages/shared/stores/createAdminModeStore';

/**
 * 설정 페이지 컴포넌트
 */
export default function SettingsPage() {
  const isAdminModeEnabled = useIsAdminModeEnabled();
  const { isAdminMode, setAdminMode } = useAdminModeActions();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">관리자 옵션</h2>
        
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <h3 className="font-medium">관리자 모드</h3>
            <p className="text-sm text-muted-foreground mt-1">
              관리자 전용 기능 및 관리자 메뉴에 접근할 수 있습니다
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={isAdminMode}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isAdminModeEnabled ? 'bg-primary' : 'bg-input'
              }`}
              aria-label={`관리자 모드 ${isAdminModeEnabled ? '비활성화' : '활성화'}`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-background shadow-md transition-all ${
                  isAdminModeEnabled ? 'translate-x-1' : 'translate-x-1'
                }`}
              >
                {isAdminModeEnabled ? (
                  <span className="text-xs">👑</span>
                ) : (
                  <span className="text-xs">👤</span>
                )}
              </span>
            </button>
          </div>
        </div>
        
        {isAdminModeEnabled && (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 관리자 모드가 활성화되었습니다. 관리자 메뉴와 관리 도구에 접근할 수 있습니다.
            </p>
          </div>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground mt-8">
        <p>InvestNow916 v1.0.0</p>
        <p className="mt-1">© 2025 InvestNow916. All rights reserved.</p>
      </div>
    </div>
  );
}
