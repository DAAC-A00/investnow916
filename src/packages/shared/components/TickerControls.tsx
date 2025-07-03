import React from 'react';
import { TickerSortBy, TickerSortOrder } from '../types/bithumb';

interface TickerControlsProps {
  // 정렬 관련
  sortBy: TickerSortBy;
  sortOrder: TickerSortOrder;
  onSortChange: (sortBy: TickerSortBy) => void;
  
  // 검색 관련
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  searchResultCount: number;
  totalCount: number;
}

export function TickerControls({
  sortBy,
  sortOrder,
  onSortChange,
  searchTerm,
  onSearchChange,
  searchResultCount,
  totalCount
}: TickerControlsProps) {
  const getSortIcon = (currentSortBy: TickerSortBy) => {
    if (sortBy === currentSortBy) {
      return sortOrder === 'desc' ? '↓' : '↑';
    }
    return '';
  };

  const getSortButtonClass = (currentSortBy: TickerSortBy) => {
    return `px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
      sortBy === currentSortBy
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
    }`;
  };

  return (
    <div className="space-y-4">
      {/* 정렬 옵션 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground mr-2">정렬:</span>
        <button
          onClick={() => onSortChange('changePercent')}
          className={getSortButtonClass('changePercent')}
        >
          변동률 {getSortIcon('changePercent')}
        </button>
        <button
          onClick={() => onSortChange('price')}
          className={getSortButtonClass('price')}
        >
          가격 {getSortIcon('price')}
        </button>
        <button
          onClick={() => onSortChange('volume')}
          className={getSortButtonClass('volume')}
        >
          거래량 {getSortIcon('volume')}
        </button>
        <button
          onClick={() => onSortChange('turnover')}
          className={getSortButtonClass('turnover')}
        >
          거래대금 {getSortIcon('turnover')}
        </button>
        <button
          onClick={() => onSortChange('symbol')}
          className={getSortButtonClass('symbol')}
        >
          심볼명 {getSortIcon('symbol')}
        </button>
      </div>

      {/* 검색 기능 */}
      <div>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="코인 검색 (예: BTC, ETH)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-2">
            "{searchTerm}" 검색 결과: {searchResultCount}개
          </p>
        )}
      </div>
    </div>
  );
} 