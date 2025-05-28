/**
 * 메뉴 토글 버튼 컴포넌트 (데스크톱용)
 */

'use client';

import React from 'react';
import { useNavigationActions } from '../../../shared/stores/createNavigationStore';
import { cn } from '../../../shared/utils/cn';

interface MenuToggleButtonProps {
  className?: string;
}

export const MenuToggleButton: React.FC<MenuToggleButtonProps> = ({ className }) => {
  const { toggleMenu } = useNavigationActions();

  return (
    <button
      onClick={toggleMenu}
      className={cn(
        'fixed top-4 right-4 z-30',
        'p-3 bg-white rounded-full shadow-lg',
        'border border-gray-200',
        'hover:bg-gray-50 hover:shadow-xl',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      aria-label="메뉴 열기"
    >
      <svg 
        className="w-6 h-6 text-gray-700" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 6h16M4 12h16M4 18h16" 
        />
      </svg>
    </button>
  );
};
