'use client';

import { forwardRef } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, disabled = false, size = 'md', className = '', 'aria-label': ariaLabel, ...props }, ref) => {
    const sizeClasses = {
      sm: {
        container: 'h-4 w-8',
        handle: 'h-3 w-3',
        translate: checked ? 'translate-x-4' : 'translate-x-0.5'
      },
      md: {
        container: 'h-5 w-10',
        handle: 'h-4 w-4',
        translate: checked ? 'translate-x-5' : 'translate-x-0.5'
      },
      lg: {
        container: 'h-6 w-12',
        handle: 'h-5 w-5',
        translate: checked ? 'translate-x-6' : 'translate-x-0.5'
      }
    };

    const currentSize = sizeClasses[size];

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background
          ${currentSize.container}
          ${checked
            ? 'bg-primary shadow-lg' // ON 상태 - 테마의 primary 색상 사용
            : 'bg-muted shadow-md' // OFF 상태 - 테마의 muted 색상 사용
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-lg'
          }
          ${className}
        `}
        {...props}
      >
        {/* 토글 핸들 */}
        <span
          className={`
            inline-block rounded-full transition-all duration-300 ease-in-out shadow-sm
            ${currentSize.handle}
            ${currentSize.translate}
            ${checked
              ? 'bg-primary-foreground shadow-lg' // ON 상태 핸들 - primary-foreground 사용
              : 'bg-background shadow-md border border-border' // OFF 상태 핸들 - background와 border 사용
            }
          `}
        />
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
