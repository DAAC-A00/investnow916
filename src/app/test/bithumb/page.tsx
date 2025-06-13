'use client';

import { useState } from 'react';
import { useExchangeInstrumentStore } from '@/packages/shared/stores/createExchangeInstrumentStore';

export default function BithumbTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const {
    fetchBithumbCoins,
    fetchAllBithumbCoins,
    clearSymbols,
    getFilteredCoins
  } = useExchangeInstrumentStore();

  const handleFetchSpot = async () => {
    setLoading(true);
    try {
      const success = await fetchBithumbCoins('spot');
      console.log('Bithumb spot fetch result:', success);
      setResults([{ action: 'fetchBithumbCoins(spot)', success, timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error fetching Bithumb spot:', error);
      setResults([{ action: 'fetchBithumbCoins(spot)', error: (error as Error).message, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAll = async () => {
    setLoading(true);
    try {
      const success = await fetchAllBithumbCoins();
      console.log('Bithumb fetch all result:', success);
      setResults([{ action: 'fetchAllBithumbCoins()', success, timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error fetching all Bithumb:', error);
      setResults([{ action: 'fetchAllBithumbCoins()', error: (error as Error).message, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    clearSymbols('bithumb', 'spot');
    setResults([{ action: 'clearSymbols(bithumb, spot)', success: true, timestamp: new Date().toISOString() }]);
  };

  const handleFilterTest = () => {
    const filtered = getFilteredCoins({ exchange: 'bithumb', category: 'spot', baseCode: 'BTC' });
    console.log('Filtered BTC coins:', filtered);
    setResults([{ 
      action: 'getFilteredCoins(bithumb, spot, BTC)', 
      count: filtered.length, 
      data: filtered.slice(0, 5), // 처음 5개만 표시
      timestamp: new Date().toISOString() 
    }]);
  };

  const handleFilterByQuote = () => {
    const filtered = getFilteredCoins({ exchange: 'bithumb', category: 'spot', quoteCode: 'KRW' });
    console.log('Filtered KRW pairs:', filtered);
    setResults([{ 
      action: 'getFilteredCoins(bithumb, spot, "", KRW)', 
      count: filtered.length, 
      data: filtered.slice(0, 10), // 처음 10개만 표시
      timestamp: new Date().toISOString() 
    }]);
  };

  const handleCheckLocalStorage = () => {
    if (typeof window === 'undefined') return;
    
    const key = 'bithumb-spot';
    const storedData = localStorage.getItem(key);
    
    if (!storedData) {
      setResults([{ 
        action: 'localStorage 확인', 
        message: '저장된 데이터가 없습니다.',
        timestamp: new Date().toISOString() 
      }]);
      return;
    }
    
    // 저장된 데이터의 첫 3개 항목만 표시
    const entries = storedData.split(',').slice(0, 3);
    
    setResults([{ 
      action: 'localStorage 확인', 
      message: `총 ${storedData.split(',').length}개 항목이 저장되어 있습니다.`,
      rawData: entries,
      timestamp: new Date().toISOString() 
    }]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bithumb API 테스트</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleFetchSpot}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? '로딩...' : 'Spot 데이터 가져오기'}
        </button>
        
        <button
          onClick={handleFetchAll}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? '로딩...' : '모든 데이터 가져오기'}
        </button>
        
        <button
          onClick={handleClear}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          데이터 지우기
        </button>
        
        <button
          onClick={handleFilterTest}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          BTC 필터링 테스트
        </button>
        
        <button
          onClick={handleFilterByQuote}
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          KRW 쌍 필터링 테스트
        </button>
        
        <button
          onClick={handleCheckLocalStorage}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
        >
          localStorage 확인
        </button>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">테스트 결과</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">아직 테스트를 실행하지 않았습니다.</p>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    {result.action}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {result.success !== undefined && (
                  <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    상태: {result.success ? '성공' : '실패'}
                  </div>
                )}
                
                {result.error && (
                  <div className="text-sm text-red-600">
                    오류: {result.error}
                  </div>
                )}
                
                {result.count !== undefined && (
                  <div className="text-sm text-blue-600">
                    결과 개수: {result.count}개
                  </div>
                )}
                
                {result.data && (
                  <div className="mt-2">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        데이터 미리보기 (클릭하여 펼치기)
                      </summary>
                      <div className="mt-2 bg-gray-50 dark:bg-gray-600 p-2 rounded text-xs">
                        {result.data.map((item: any, idx: number) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                            <div><strong>displaySymbol:</strong> {item.displaySymbol}</div>
                            <div><strong>rawSymbol:</strong> {item.rawSymbol}</div>
                            {item.korean_name && <div><strong>한국명:</strong> {item.korean_name}</div>}
                            {item.english_name && <div><strong>영문명:</strong> {item.english_name}</div>}
                            {item.market_warning && <div><strong>시장 경고:</strong> {item.market_warning}</div>}
                            {item.remark && <div><strong>비고:</strong> {item.remark}</div>}
                            {item.search && <div><strong>검색어:</strong> {item.search}</div>}
                            <div><strong>거래소:</strong> {item.exchange}</div>
                            <div><strong>카테고리:</strong> {item.rawCategory} / {item.displayCategory}</div>
                            <div><strong>baseCode/quoteCode:</strong> {item.baseCode}/{item.quoteCode}</div>
                            <div><strong>settlementCode:</strong> {item.settlementCode}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
                
                {result.rawData && (
                  <div className="mt-2">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        localStorage 데이터 미리보기 (클릭하여 펼치기)
                      </summary>
                      <div className="mt-2 bg-gray-50 dark:bg-gray-600 p-2 rounded text-xs">
                        {result.rawData.map((item: any, idx: number) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                            <div>{item}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
                
                {result.message && (
                  <div className="text-sm text-gray-600">
                    {result.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
