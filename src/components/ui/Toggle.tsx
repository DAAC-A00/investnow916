'use client';

import React from 'react';

export interface ToggleProps {
  /** 토글의 초기 활성 상태 */
  defaultActive?: boolean;
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
  disabled = false, 
  onChange, 
  label,
  themeColors,
  currentTheme = 'light'
}: ToggleProps) {
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
            : (defaultActive
              ? `hsl(${themeColors.primary[900]})` // Primary Action 배경색 (on)
              : `hsl(${themeColors.primary[50]})`), // Secondary Action 배경색 (off)
          border: disabled 
            ? 'none'
            : `2px solid hsl(${defaultActive ? themeColors.primary[900] : themeColors.primary[700]})`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => {
          if (disabled) return;
          const toggle = e.currentTarget;
          const isActive = toggle.dataset.active === 'true';
          const newActiveState = !isActive;
          toggle.dataset.active = newActiveState.toString();
          
          // 배경색 동적 적용
          toggle.style.backgroundColor = newActiveState
            ? `hsl(${themeColors.primary[900]})` // Primary Action 배경색 (on)
            : `hsl(${themeColors.primary[50]})`; // Secondary Action 배경색 (off)
          
          // 테두리색 동적 적용
          toggle.style.border = newActiveState
            ? `2px solid hsl(${themeColors.primary[900]})` // on: 배경색과 동일
            : `2px solid hsl(${themeColors.primary[700]})`; // off: Secondary Action 글자색
          
          const circle = toggle.querySelector('div:first-child') as HTMLElement;
          circle.style.transform = newActiveState ? 'translateX(32px)' : 'translateX(0px)';
          
          // 버튼(원) 색상 동적 적용
          circle.style.backgroundColor = newActiveState
            ? `hsl(${themeColors.primary.foreground})` // Primary Action 글자색 (on)
            : `hsl(${themeColors.primary[700]})`; // Secondary Action 글자색 (off)
          
          onChange?.(newActiveState);
        }}
        data-active={defaultActive.toString()}
        data-disabled={disabled.toString()}
      >
        <div 
          className="w-6 h-6 rounded-full transition-all duration-300 absolute border"
          style={{ 
            transform: defaultActive ? 'translateX(32px)' : 'translateX(0px)',
            backgroundColor: disabled 
              ? `hsl(${themeColors.neutral[100]})` 
              : (defaultActive 
                ? `hsl(${themeColors.primary.foreground})` 
                : `hsl(${themeColors.primary[700]})`),
            borderColor: 'transparent'
          }}
        />
      </div>
    </div>
  );
}
