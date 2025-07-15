'use client';

import { useState } from 'react';
import { saveBinanceInstrumentsToStorage, getBinanceInstrumentsFromStorage } from '@/packages/shared/utils/binanceApiClient';

export default function BinanceTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFetchAndSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Binance instruments 가져오기 및 저장 시작...');
      await saveBinanceInstrumentsToStorage();
      console.log('✅ 저장 완료!');
      
      // 저장 후 바로 로드해서 확인
      const loadedSymbols = getBinanceInstrumentsFromStorage();
      setSymbols(loadedSymbols);
      console.log('📋 로드된 심볼 수:', loadedSymbols.length);
    } catch (err) {
      console.error('❌ 오류 발생:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromStorage = () => {
    try {
      const loadedSymbols = getBinanceInstrumentsFromStorage();
      setSymbols(loadedSymbols);
      console.log('📋 localStorage에서 로드된 심볼 수:', loadedSymbols.length);
    } catch (err) {
      console.error('❌ 로드 오류:', err);
      setError(err instanceof Error ? err.message : '로드 실패');
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem('binance-spot');
    setSymbols([]);
    console.log('🗑️ localStorage 데이터 삭제 완료');
  };

  const getStoragePreview = () => {
    const storedData = localStorage.getItem('binance-spot');
    if (!storedData) return '저장된 데이터 없음';
    
    const preview = storedData.length > 200 ? storedData.substring(0, 200) + '...' : storedData;
    return preview;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Binance API 테스트</h1>
      
      {/* 컨트롤 버튼들 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleFetchAndSave}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '처리 중...' : '🔄 API에서 가져와서 저장'}
        </button>
        
        <button
          onClick={handleLoadFromStorage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          📋 localStorage에서 로드
        </button>
        
        <button
          onClick={handleClearStorage}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🗑️ 저장된 데이터 삭제
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>오류:</strong> {error}
        </div>
      )}

      {/* localStorage 미리보기 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">localStorage 미리보기</h2>
        <div className="bg-gray-100 p-4 rounded text-sm font-mono break-all">
          {getStoragePreview()}
        </div>
      </div>

      {/* 로드된 심볼 정보 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          로드된 심볼 정보 ({symbols.length}개)
        </h2>
        
        {symbols.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {symbols.slice(0, 20).map((symbol, index) => (
              <div key={index} className="bg-white border rounded p-3 shadow-sm">
                <div className="font-semibold text-blue-600">{symbol.integratedSymbol}</div>
                <div className="text-sm text-gray-600">
                  <div>Raw: {symbol.rawSymbol}</div>
                  <div>Base: {symbol.baseCode}</div>
                  <div>Quote: {symbol.quoteCode}</div>
                  <div>Quantity: {symbol.quantity}</div>
                  <div>Settlement: {symbol.settlementCode}</div>
                  <div>Status: {symbol.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {symbols.length > 20 && (
          <div className="mt-4 text-gray-600">
            ... 그리고 {symbols.length - 20}개 더 (처음 20개만 표시)
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      {symbols.length > 0 && (
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-2">통계 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">전체 심볼 수</div>
              <div className="text-lg">{symbols.length}</div>
            </div>
            <div>
              <div className="font-medium">Quantity &gt; 1인 심볼</div>
              <div className="text-lg">{symbols.filter(s => s.quantity > 1).length}</div>
            </div>
            <div>
              <div className="font-medium">고유 Base 코드</div>
              <div className="text-lg">{new Set(symbols.map(s => s.baseCode)).size}</div>
            </div>
            <div>
              <div className="font-medium">고유 Quote 코드</div>
              <div className="text-lg">{new Set(symbols.map(s => s.quoteCode)).size}</div>
            </div>
          </div>
        </div>
      )}

      {/* 개발자 도구 안내 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h3 className="font-semibold mb-2">🔧 개발자 도구 안내</h3>
        <p className="text-sm text-gray-700">
          브라우저의 개발자 도구(F12) → Console 탭에서 상세한 디버깅 로그를 확인할 수 있습니다.
          API 호출, 데이터 변환, localStorage 저장 과정의 모든 단계가 로그로 출력됩니다.
        </p>
      </div>
    </div>
  );
}
