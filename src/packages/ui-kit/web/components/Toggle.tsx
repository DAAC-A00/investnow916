'use client';

import React, { useState } from 'react';

export interface ToggleProps {
  /** 토글의 초기 활성 상태 */
  defaultActive?: boolean;
  /** 토글의 현재 활성 상태 (controlled) */
  active?: boolean;
  /** 토글 비활성화 여부 */
  disabled?: boolean;
  /** 토글 상태 변경 시 호출되는 콜백 */
  onChange?: (active: boolean) => void;
  /** 토글 레이블 */
  label?: string;
  /** 테마 색상 토큰 */
  themeColors: any;
  /** 현재 테마 ('light' | 'dark') */
  currentTheme?: string;
}

export function Toggle({ 
  defaultActive = false, 
  active, 
  disabled = false, 
  onChange, 
  label,
  themeColors,
  currentTheme = 'light'
}: ToggleProps) {
  // React 상태 기반으로 완전히 리팩토링
  const [internalActive, setInternalActive] = useState(defaultActive);
  
  // controlled vs uncontrolled 모드 처리
  const isControlled = active !== undefined;
  const isActive = isControlled ? active : internalActive;

  const handleToggle = () => {
    if (disabled) return;
    
    const newActiveState = !isActive;
    
    if (isControlled) {
      // Controlled mode: 부모 컴포넌트가 상태 관리
      onChange?.(newActiveState);
    } else {
      // Uncontrolled mode: 내부 상태 관리
      setInternalActive(newActiveState);
      onChange?.(newActiveState);
    }
  };

  return (
    <div>
      {label && (
        <div className="text-sm mb-2" style={{ color: `hsl(${themeColors.neutral[700]})` }}>
          {label}
        </div>
      )}
      <div 
        className={`w-16 h-8 rounded-full p-1 transition-all duration-300 flex items-center relative ${
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
        style={{ 
          backgroundColor: disabled 
            ? `hsl(${themeColors.neutral[300]})` 
            : (isActive
              ? `hsl(${themeColors.primary[900]})` // Primary Action 배경색 (on)
              : `hsl(${themeColors.primary[50]})`), // Secondary Action 배경색 (off)
          border: disabled 
            ? 'none'
            : `2px solid hsl(${isActive ? themeColors.primary[900] : themeColors.primary[700]})`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}
        onClick={handleToggle}
        data-active={isActive.toString()}
        data-disabled={disabled.toString()}
      >
        <div 
          className="w-6 h-6 rounded-full transition-all duration-300 absolute border"
          style={{ 
            transform: isActive ? 'translateX(32px)' : 'translateX(0px)',
            backgroundColor: disabled 
              ? `hsl(${themeColors.neutral[100]})` 
              : (isActive 
                ? `hsl(${themeColors.primary.foreground})` 
                : `hsl(${themeColors.primary[700]})`),
            borderColor: 'transparent'
          }}
        />
      </div>
    </div>
  );
}
