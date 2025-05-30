'use client';

import { useEffect, useState } from 'react';
import { useExchangeCoinsStore } from '@/packages/shared/stores/createExchangeCoinsStore';
import { BybitCategoryType, CoinInfo, ExchangeType } from '@/packages/shared/types/exchange';

export default function BybitCoinsPage() {
  const [selectedExchange] = useState<ExchangeType>('bybit');
  const [selectedCategory, setSelectedCategory] = useState<BybitCategoryType>('linear');
  const [filterBaseCoin, setFilterBaseCoin] = useState<string>('');
  const [filterQuoteCoin, setFilterQuoteCoin] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('데이터 로드 중...');
  
  const { 
    isLoading, 
    error, 
    fetchBybitCoins,
    getFilteredCoins,
    getUniqueBaseCoins,
    getUniqueQuoteCoins,
    getSymbolsForCategory
  } = useExchangeCoinsStore();

  // 컴포넌트 마운트 시 현재 시간으로 업데이트 시간 설정
  useEffect(() => {
    // 로컬 스토리지에 데이터가 있는지 확인
    const hasData = getSymbolsForCategory(selectedExchange, selectedCategory).length > 0;
    if (hasData) {
      setLastRefreshed(new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    } else {
      setLastRefreshed('저장된 데이터 없음');
    }
  }, [selectedExchange, selectedCategory, getSymbolsForCategory]);

  // 필터링된 코인 목록
  const filteredCoins = getFilteredCoins({
    exchange: selectedExchange,
    category: selectedCategory,
    ...(filterBaseCoin ? { baseCoin: filterBaseCoin } : {}),
    ...(filterQuoteCoin ? { quoteCoin: filterQuoteCoin } : {})
  });

  // 고유한 baseCoin과 quoteCoin 목록
  const baseCoins = getUniqueBaseCoins({ exchange: selectedExchange, category: selectedCategory });
  const quoteCoins = getUniqueQuoteCoins({ exchange: selectedExchange, category: selectedCategory });

  // 코인 정보 수동 새로고침
  const handleRefresh = async () => {
    try {
      await fetchBybitCoins(selectedCategory);
      setLastRefreshed(new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* 상태 정보 */}
      <div className="mb-6 p-4 bg-muted rounded">
        <h1 className="text-2xl font-bold mb-4">Bybit 코인 정보</h1>
        <p className="text-sm">마지막 업데이트: {lastRefreshed}</p>
        <p className="text-sm">총 코인 수: {filteredCoins.length}</p>
      </div>
      
      {/* 거래소 및 카테고리 선택 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">거래소</label>
          <select
            className="w-full p-2 border rounded bg-background text-foreground"
            value={selectedExchange}
            disabled={true} /* 고정된 값이므로 변경 불가능 */
          >
            <option value="bybit">Bybit</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select
            className="w-full p-2 border rounded bg-background text-foreground"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as BybitCategoryType)}
          >
            <option value="spot">현물 (Spot)</option>
            <option value="linear">선물 - USDT/USDC (Linear)</option>
            <option value="inverse">선물 - 코인 마진 (Inverse)</option>
            <option value="option">옵션 (Option)</option>
          </select>
        </div>
        
        <div className="flex-1 flex items-end">
          <button
            className="w-full p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? '로딩 중...' : '새로고침'}
          </button>
        </div>
      </div>
      
      {/* 추가 정보 */}
      <div className="mb-6 text-sm">
        <p>상태: {isLoading ? '로딩 중...' : '준비됨'}</p>
      </div>
      
      {/* 필터링 옵션 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">기본 코인 (Base)</label>
          <select
            className="w-full p-2 border rounded bg-background text-foreground"
            value={filterBaseCoin}
            onChange={(e) => setFilterBaseCoin(e.target.value)}
          >
            <option value="">전체</option>
            {baseCoins.map((coin: string) => (
              <option key={coin} value={coin}>
                {coin}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">견적 코인 (Quote)</label>
          <select
            className="w-full p-2 border rounded bg-background text-foreground"
            value={filterQuoteCoin}
            onChange={(e) => setFilterQuoteCoin(e.target.value)}
          >
            <option value="">전체</option>
            {quoteCoins.map((coin: string) => (
              <option key={coin} value={coin}>
                {coin}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded">
          <p>오류: {error}</p>
        </div>
      )}
      
      {/* 코인 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left border">심볼</th>
              <th className="p-2 text-left border">기본 코인 (Base)</th>
              <th className="p-2 text-left border">견적 코인 (Quote)</th>
              <th className="p-2 text-left border">거래소</th>
              <th className="p-2 text-left border">카테고리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : filteredCoins.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  표시할 코인 정보가 없습니다.
                </td>
              </tr>
            ) : (
              filteredCoins.map((coin: CoinInfo) => (
                <tr key={`${coin.exchange}-${coin.symbol}`} className="hover:bg-muted/50">
                  <td className="p-2 border">{coin.symbol}</td>
                  <td className="p-2 border">{coin.baseCoin}</td>
                  <td className="p-2 border">{coin.quoteCoin}</td>
                  <td className="p-2 border">{coin.exchange}</td>
                  <td className="p-2 border">{coin.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
