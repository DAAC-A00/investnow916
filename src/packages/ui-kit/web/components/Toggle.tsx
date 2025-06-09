'use client';

import React from 'react';

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
  const isActive = active !== undefined ? active : defaultActive;

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
        onClick={(e) => {
          if (disabled) return;
          
          if (active !== undefined) {
            // Controlled mode: onChange를 통해 상태 변경
            onChange?.(!isActive);
            return;
          }
          
          // Uncontrolled mode: 내부 상태 관리
          const toggle = e.currentTarget;
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
          
          // 핸들 위치 동적 적용
          const handle = toggle.querySelector('div') as HTMLElement;
          if (handle) {
            handle.style.transform = newActiveState ? 'translateX(32px)' : 'translateX(0px)';
            handle.style.backgroundColor = newActiveState 
              ? `hsl(${themeColors.primary.foreground})` 
              : `hsl(${themeColors.primary[700]})`;
          }
          
          onChange?.(newActiveState);
        }}
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
