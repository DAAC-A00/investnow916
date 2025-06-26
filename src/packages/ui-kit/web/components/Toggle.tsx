'use client';

import React, { useState } from 'react';
import { useTheme } from '../../../shared/stores/createThemeStore';
import { colorTokens } from '../../tokens/design-tokens';

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
  /** 토글 설명 */
  description?: string;
  /** 토글 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 커스텀 클래스명 */
  className?: string;
}

export function Toggle({ 
  defaultActive = false, 
  active, 
  disabled = false, 
  onChange, 
  label,
  description,
  size = 'md',
  className = ''
}: ToggleProps) {
  const theme = useTheme();
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

  // 크기별 스타일 설정
  const sizeStyles = {
    sm: { width: 'w-10', height: 'h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    md: { width: 'w-12', height: 'h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
    lg: { width: 'w-14', height: 'h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
  };

  const currentSize = sizeStyles[size];
  const colors = colorTokens[theme];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 토글 스위치 */}
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          ${currentSize.width} ${currentSize.height} 
          relative inline-flex items-center rounded-full 
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isActive 
            ? 'bg-primary shadow-inner' 
            : 'bg-muted border border-border'
          }
        `}
        style={{
          backgroundColor: disabled 
            ? `hsl(${colors.neutral[300]})` 
            : (isActive
              ? `hsl(${colors.primary[900]})` 
              : `hsl(${colors.neutral[200]})`),
        }}
      >
        <span
          className={`
            ${currentSize.thumb}
            inline-block rounded-full bg-background shadow-lg
            transform transition-transform duration-200 ease-in-out
            ${isActive ? currentSize.translate : 'translate-x-0.5'}
          `}
          style={{
            backgroundColor: disabled 
              ? `hsl(${colors.neutral[100]})` 
              : `hsl(${colors.primary.foreground})`,
          }}
        />
      </button>

      {/* 레이블 및 설명 */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label 
              className="text-sm font-medium text-foreground cursor-pointer"
              onClick={!disabled ? handleToggle : undefined}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
