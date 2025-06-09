'use client';

import React from 'react';

export interface RatingStarsProps {
  /** 별의 총 개수 */
  maxStars?: number;
  /** 초기 선택된 별 개수 */
  defaultRating?: number;
  /** 별점 변경 시 호출되는 콜백 */
  onChange?: (rating: number) => void;
  /** 별점 레이블 */
  label?: string;
  /** 테마 색상 토큰 */
  themeColors: any;
  /** 현재 테마 ('light' | 'dark') */
  currentTheme?: string;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
}

export function RatingStars({ 
  maxStars = 5, 
  defaultRating = 0, 
  onChange, 
  label,
  themeColors,
  currentTheme = 'light',
  readOnly = false
}: RatingStarsProps) {
  return (
    <div>
      {label && (
        <div className="text-sm mb-2" style={{ color: `hsl(${themeColors.neutral[700]})` }}>
          {label}
        </div>
      )}
      <div className="flex space-x-1">
        {Array.from({ length: maxStars }, (_, index) => index + 1).map((star) => (
          <div
            key={star}
            className={`w-5 h-5 transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ 
              color: star <= defaultRating 
                ? `hsl(${themeColors.accent[500]})` 
                : `hsl(${themeColors.neutral[300]})`
            }}
            onClick={(e) => {
              if (readOnly) return;
              const parent = e.currentTarget.parentElement;
              const stars = parent?.querySelectorAll('div');
              stars?.forEach((s, index) => {
                s.style.color = index < star 
                  ? `hsl(${themeColors.accent[500]})` 
                  : `hsl(${themeColors.neutral[300]})`;
              });
              onChange?.(star);
            }}
          >
            ★
          </div>
        ))}
      </div>
    </div>
  );
}
