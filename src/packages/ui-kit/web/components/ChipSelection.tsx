'use client';

import React from 'react';

export interface ChipSelectionProps {
  /** 칩 옵션들 */
  options: string[];
  /** 초기 선택된 칩들 */
  defaultSelected?: string[];
  /** 다중 선택 허용 여부 */
  multiple?: boolean;
  /** 선택 변경 시 호출되는 콜백 */
  onChange?: (selected: string[]) => void;
  /** 칩 선택 레이블 */
  label?: string;
  /** 테마 색상 토큰 */
  themeColors: any;
  /** 현재 테마 ('light' | 'dark') */
  currentTheme?: string;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
}

export function ChipSelection({ 
  options, 
  defaultSelected = [], 
  multiple = true, 
  onChange, 
  label,
  themeColors,
  currentTheme = 'light',
  readOnly = false
}: ChipSelectionProps) {
  return (
    <div>
      {label && (
        <div className="text-sm mb-2" style={{ color: `hsl(${themeColors.neutral[700]})` }}>
          {label}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = defaultSelected.includes(option);
          return (
            <div
              key={option}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                readOnly ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{
                backgroundColor: isSelected 
                  ? `hsl(${themeColors.tertiary[500]})` 
                  : `hsl(${themeColors.tertiary[100]})`,
                color: isSelected 
                  ? `hsl(${themeColors.tertiary.foreground})` 
                  : `hsl(${themeColors.tertiary[700]})`,
                border: `1px solid hsl(${themeColors.tertiary[300]})`
              }}
              onClick={(e) => {
                if (readOnly) return;
                const currentSelected = e.currentTarget.dataset.selected === 'true';
                const newSelected = !currentSelected;
                e.currentTarget.dataset.selected = newSelected.toString();
                
                // 스타일 업데이트
                e.currentTarget.style.backgroundColor = newSelected 
                  ? `hsl(${themeColors.tertiary[500]})` 
                  : `hsl(${themeColors.tertiary[100]})`;
                e.currentTarget.style.color = newSelected 
                  ? `hsl(${themeColors.tertiary.foreground})` 
                  : `hsl(${themeColors.tertiary[700]})`;
                
                // 콜백 호출
                if (onChange) {
                  const allChips = e.currentTarget.parentElement?.querySelectorAll('div');
                  const selectedOptions: string[] = [];
                  allChips?.forEach((chip, index) => {
                    if (chip.dataset.selected === 'true') {
                      selectedOptions.push(options[index]);
                    }
                  });
                  onChange(selectedOptions);
                }
              }}
              data-selected={isSelected.toString()}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}
