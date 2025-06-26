'use client';

import React from 'react';
import { useIsAdminModeEnabled, useAdminModeActions } from '@/packages/shared/stores/createAdminModeStore';
import { useTheme, useThemeActions } from '@/packages/shared/stores/createThemeStore';
import { Toggle } from '@/packages/ui-kit/web/components/Toggle';
import { ThemeToggleButton } from '@/packages/ui-kit/web/components/ThemeToggleButton';

/**
 * 설정 페이지 컴포넌트
 */
export default function SettingsPage() {
  const isAdminModeEnabled = useIsAdminModeEnabled();
  const { setAdminMode } = useAdminModeActions();
  const theme = useTheme();
  const { toggleTheme } = useThemeActions();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      
      {/* 테마 설정 섹션 */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">테마 설정</h2>
        
        <div className="space-y-4">
          <Toggle
            active={theme === 'dark'}
            onChange={(isDark) => toggleTheme()}
            label="다크 모드"
            description={`현재 테마: ${theme === 'light' ? '라이트 모드' : '다크 모드'}`}
            size="md"
          />
        </div>
      </div>
      
      {/* 관리자 옵션 섹션 */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">관리자 옵션</h2>
        
        <div className="space-y-4">
          <Toggle
            active={isAdminModeEnabled}
            onChange={(isActive) => setAdminMode(isActive)}
            label="관리자 모드"
            description="관리자 전용 기능 및 관리자 메뉴에 접근할 수 있습니다"
            size="md"
          />
        </div>
        
        {isAdminModeEnabled && (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 관리자 모드가 활성화되었습니다. 관리자 메뉴와 관리 도구에 접근할 수 있습니다.
            </p>
          </div>
        )}
      </div>
      
      {/* 앱 정보 */}
      <div className="text-sm text-muted-foreground mt-8">
        <p>InvestNow916 v1.0.0</p>
        <p className="mt-1">© 2025 InvestNow916. All rights reserved.</p>
      </div>
    </div>
  );
}
