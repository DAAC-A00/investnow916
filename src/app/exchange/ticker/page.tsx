'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { 
  Ticker, 
  TickerHeader, 
  TickerControls, 
  TickerEmptyState 
} from '@/packages/shared/components';
import { useIntegratedTicker, IntegratedCategory } from '@/packages/shared/hooks';

// 카테고리 선택 컴포넌트
const CategorySelector = ({ 
  selectedCategory, 
  onCategoryChange,
  stats 
}: {
  selectedCategory: IntegratedCategory;
  onCategoryChange: (category: IntegratedCategory) => void;
  stats: {
    bithumbCount: number;
    bybitCount: number;
    totalCount: number;
  };
}) => {
  const getCategoryDisplay = (cat: IntegratedCategory) => {
    switch (cat) {
      case 'spot':
        return 'SPOT';
      case 'um':
        return 'USDⓈ-M';
      case 'cm':
        return 'COIN-M';
      default:
        return String(cat).toUpperCase();
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* 카테고리 선택 */}
      <div className="flex gap-2">
        {(['spot', 'um', 'cm'] as IntegratedCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getCategoryDisplay(cat)}
          </button>
        ))}
      </div>

      {/* 거래소별 통계 */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span>총 {stats.totalCount}개</span>
        <span>Bithumb: {stats.bithumbCount}개</span>
        <span>Bybit: {stats.bybitCount}개</span>
      </div>
    </div>
  );
};

// quoteCode filter의 localStorage key 생성 함수
const getQuoteCodeStorageKey = (category: string) => `integrated-ticker-quoteCode-${category}`;

export default function IntegratedTickerPage() {
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();
  
  // [수정] 카테고리별 quoteCode 필터 상태 (localStorage 연동)
  const [selectedQuoteCodes, setSelectedQuoteCodes] = useState<{ [cat: string]: string }>({ spot: '', um: '', cm: '' });
  const [selectedQuoteCode, setSelectedQuoteCode] = useState<string>('');

  // 통합 티커 훅 사용
  const {
    tickers,
    filteredTickers: baseFilteredTickers,
    isLoading,
    error,
    lastUpdate,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    handleSortChange,
    priceTracker,
    refreshData,
    category,
    setCategory,
    stats,
  } = useIntegratedTicker('spot');

  // 카테고리 변경 시 해당 카테고리의 quoteCode 필터값을 localStorage에서 불러옴
  useEffect(() => {
    const key = getQuoteCodeStorageKey(category);
    const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    setSelectedQuoteCode(saved || '');
  }, [category]);

  // quoteCode 선택 시 상태/로컬스토리지 동기화
  const handleQuoteCodeChange = (qc: string) => {
    setSelectedQuoteCode(qc);
    setSelectedQuoteCodes(prev => ({ ...prev, [category]: qc }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(getQuoteCodeStorageKey(category), qc);
    }
  };

  // [수정] quoteCode별 개수 집계 및 인기순 정렬
  const quoteCodes = useMemo(() => {
    const countMap = new Map<string, number>();
    tickers.forEach(t => {
      if (t.quoteCode) {
        countMap.set(t.quoteCode, (countMap.get(t.quoteCode) || 0) + 1);
      }
    });
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1]) // 개수 내림차순
      .map(([qc]) => qc);
  }, [tickers]);

  // [수정] quoteCode로 2차 필터링
  const filteredTickers = useMemo(() => {
    if (!selectedQuoteCode) return baseFilteredTickers;
    return baseFilteredTickers.filter(t => t.quoteCode === selectedQuoteCode);
  }, [baseFilteredTickers, selectedQuoteCode]);

  useEffect(() => {
    setCurrentRoute('/exchange/ticker');
  }, [setCurrentRoute]);

  // 가격 변경 핸들러 - 고유 키 기반으로 가격 변화 추적
  const handlePriceChange = useCallback((symbol: string, oldPrice: number, newPrice: number) => {
    // 현재 활성화된 ticker를 찾아서 고유 키 생성
    const currentTicker = filteredTickers.find(t => t.rawSymbol === symbol);
    if (currentTicker) {
      const uniqueKey = `${currentTicker.exchange}-${currentTicker.rawCategory || 'spot'}-${currentTicker.rawSymbol}`;
      console.log(`티커 - ${uniqueKey}: ${oldPrice} → ${newPrice}`);
    } else {
      console.log(`티커 - ${symbol}: ${oldPrice} → ${newPrice}`);
    }
  }, [filteredTickers]);

  // 티커 클릭 핸들러
  const handleTickerClick = useCallback((data: any) => {
    if (data.exchange === 'bithumb') {
      router.push(`/exchange/ticker/bithumb/spot/${data.rawSymbol}`);
    } else {
      // Bybit의 경우 카테고리 정보 포함
      router.push(`/exchange/ticker/bybit/${data.rawCategory}/${data.rawSymbol}`);
    }
  }, [router]);

  // 카테고리별 제목 및 부제목
  const getCategoryInfo = () => {
    switch (category) {
      case 'spot':
        return {
          title: 'SPOT 실시간 티커',
          subtitle: '현물 마켓의 실시간 가격 정보',
        };
      case 'um':
        return {
          title: 'USDⓈ-M 실시간 티커',
          subtitle: 'USDⓈ 마진 선물 마켓의 실시간 가격 정보',
        };
      case 'cm':
        return {
          title: 'COIN-M 실시간 티커',
          subtitle: '코인 마진 선물 마켓의 실시간 가격 정보',
        };
      default:
        return {
          title: '실시간 티커',
          subtitle: '실시간 가격 정보',
        };
    }
  };

  const { title, subtitle } = getCategoryInfo();

  // 오류 상태 및 데이터 없음 처리
  if (error && tickers.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <CategorySelector
            selectedCategory={category}
            onCategoryChange={setCategory}
            stats={stats}
          />
          <TickerEmptyState
            type="error"
            title="오류 발생"
            description=""
            errorMessage={error}
            onAction={refreshData}
            actionLabel="다시 시도"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 카테고리 선택 */}
        <CategorySelector
          selectedCategory={category}
          onCategoryChange={setCategory}
          stats={stats}
        />

        {/* [수정] quoteCode 간편 필터 (가로 스크롤) */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex flex-nowrap gap-2 min-w-fit">
            <button
              className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${selectedQuoteCode === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              onClick={() => handleQuoteCodeChange('')}
            >
              All
            </button>
            {quoteCodes.map(qc => (
              <button
                key={qc}
                className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${selectedQuoteCode === qc ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => handleQuoteCodeChange(qc)}
              >
                {qc}
              </button>
            ))}
          </div>
        </div>

        {/* 헤더 */}
        <TickerHeader
          title={title}
          subtitle={subtitle}
          isLoading={isLoading}
          lastUpdate={lastUpdate}
          totalCount={tickers.length}
          error={error}
          onRefresh={refreshData}
        />

        {/* 정렬 및 검색 컨트롤 */}
        <TickerControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchResultCount={filteredTickers.length}
          totalCount={tickers.length}
        />

        {/* 티커 목록 */}
        {isLoading && tickers.length === 0 ? (
          <TickerEmptyState
            type="loading"
            title=""
            description="데이터를 불러오는 중..."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {filteredTickers.map((ticker) => {
              const uniqueKey = `${ticker.exchange}-${ticker.rawCategory || 'spot'}-${ticker.rawSymbol}`;
              return (
                <Ticker
                  key={uniqueKey}
                  data={ticker}
                  priceTracker={priceTracker}
                  className="hover:scale-105 transition-transform duration-200"
                  onPriceChange={handlePriceChange}
                  onClick={handleTickerClick}
                />
              );
            })}
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!isLoading && filteredTickers.length === 0 && tickers.length > 0 && (
          <TickerEmptyState
            type="search"
            title="검색 결과가 없습니다"
            description=""
            searchTerm={searchTerm}
            onAction={() => setSearchTerm('')}
            actionLabel="검색 초기화"
          />
        )}

        {/* 데이터 없음 */}
        {!isLoading && tickers.length === 0 && (
          <TickerEmptyState
            type="data"
            title="티커 데이터가 없습니다"
            description="API에서 데이터를 가져올 수 없습니다"
            onAction={refreshData}
            actionLabel="새로고침"
          />
        )}
      </div>
    </div>
  );
} 