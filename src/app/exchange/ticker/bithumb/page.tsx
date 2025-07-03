'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { 
  Ticker, 
  TickerHeader, 
  TickerControls, 
  TickerEmptyState 
} from '@/packages/shared/components';
import { useBithumbTicker } from '@/packages/shared/hooks/useBithumbTicker';

export default function BithumbTickerPage() {
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();
  
  const {
    tickers,
    filteredTickers,
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
  } = useBithumbTicker();

  useEffect(() => {
    setCurrentRoute('/exchange/ticker/bithumb');
  }, [setCurrentRoute]);

  const handlePriceChange = useCallback((symbol: string, oldPrice: number, newPrice: number) => {
    console.log(`빗썸 티커 - ${symbol}: ${oldPrice} → ${newPrice}`);
  }, []);

  const handleTickerClick = useCallback((data: any) => {
    router.push(`/exchange/ticker/bithumb/spot/${data.rawSymbol}`);
  }, [router]);

  // 오류 상태 및 데이터 없음 처리
  if (error && tickers.length === 0) {
    return (
      <TickerEmptyState
        type="error"
        title="오류 발생"
        description=""
        errorMessage={error}
        onAction={refreshData}
        actionLabel="다시 시도"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <TickerHeader
          title="빗썸 실시간 티커"
          subtitle="KRW 마켓의 실시간 가격 정보"
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
            description="빗썸에서 데이터를 불러오는 중..."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {filteredTickers.map((ticker) => (
              <Ticker
                key={ticker.rawSymbol}
                data={ticker}
                priceTracker={priceTracker}
                className="hover:scale-105 transition-transform duration-200"
                onPriceChange={handlePriceChange}
                onClick={handleTickerClick}
              />
            ))}
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
            description="빗썸 API에서 데이터를 가져올 수 없습니다"
            onAction={refreshData}
            actionLabel="새로고침"
          />
        )}
      </div>
    </div>
  );
} 