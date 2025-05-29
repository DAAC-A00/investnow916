'use client';

import { useEffect, useState } from 'react';
import { 
  useExchangeRateStore, 
  useBaseCode, 
  useRates, 
  useLastUpdated, 
  useIsLoading, 
  useError,
  useExchangeRateActions 
} from '@/packages/shared/stores/createExchangeRateStore';

// 주요 통화 목록
const POPULAR_CURRENCIES = ['USD', 'EUR', 'JPY', 'KRW', 'GBP', 'CNY', 'HKD', 'CAD', 'AUD', 'SGD'];

export default function ExchangeRatePage() {
  const baseCode = useBaseCode();
  const rates = useRates();
  const lastUpdated = useLastUpdated();
  const isLoading = useIsLoading();
  const error = useError();
  const { fetchRates, changeBaseCurrency } = useExchangeRateActions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  
  // 페이지 로드 시 환율 정보 가져오기
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);
  
  // 통화 검색 필터링
  const filteredCurrencies = Object.keys(rates).filter(
    (currency) => currency.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 인기 통화 먼저 표시하고 나머지는 알파벳 순으로 정렬
  const sortedCurrencies = [...filteredCurrencies].sort((a, b) => {
    const aPopularIndex = POPULAR_CURRENCIES.indexOf(a);
    const bPopularIndex = POPULAR_CURRENCIES.indexOf(b);
    
    // 둘 다 인기 통화인 경우 인기 통화 목록 순서대로 정렬
    if (aPopularIndex !== -1 && bPopularIndex !== -1) {
      return aPopularIndex - bPopularIndex;
    }
    
    // a만 인기 통화인 경우 a를 먼저
    if (aPopularIndex !== -1) return -1;
    
    // b만 인기 통화인 경우 b를 먼저
    if (bPopularIndex !== -1) return 1;
    
    // 둘 다 인기 통화가 아닌 경우 알파벳 순으로 정렬
    return a.localeCompare(b);
  });
  
  // 기준 통화 변경 핸들러
  const handleChangeCurrency = (currency: string) => {
    changeBaseCurrency(currency);
  };
  
  // 통화 선택 핸들러
  const handleSelectCurrency = (currency: string) => {
    setSelectedCurrency(currency === selectedCurrency ? null : currency);
  };
  
  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 4,
      minimumFractionDigits: 2
    }).format(num);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">환율 정보</h1>
      
      {/* 로딩 및 에러 상태 */}
      {isLoading && <div className="mb-4 text-blue-500">데이터를 불러오는 중...</div>}
      {error && <div className="mb-4 text-red-500">오류: {error}</div>}
      
      {/* 기준 통화 정보 */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">기준 통화: {baseCode}</h2>
        {lastUpdated && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            마지막 업데이트: {lastUpdated}
          </p>
        )}
        <button 
          onClick={() => fetchRates()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          disabled={isLoading}
        >
          새로고침
        </button>
      </div>
      
      {/* 통화 검색 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="통화 검색 (예: KRW, USD, EUR...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
        />
      </div>
      
      {/* 인기 통화 빠른 선택 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">기준 통화 변경</h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CURRENCIES.map((currency) => (
            <button
              key={currency}
              onClick={() => handleChangeCurrency(currency)}
              className={`px-3 py-1 rounded-full text-sm ${
                baseCode === currency
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>
      
      {/* 환율 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCurrencies.map((currency) => (
          <div
            key={currency}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              currency === baseCode
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            } ${
              selectedCurrency === currency
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
            onClick={() => handleSelectCurrency(currency)}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{currency}</h3>
              <span className="text-xl font-semibold">
                {formatNumber(rates[currency] || 0)}
              </span>
            </div>
            
            {/* 선택된 통화에 대한 추가 정보 */}
            {selectedCurrency === currency && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="mb-2">
                  1 {baseCode} = {formatNumber(rates[currency] || 0)} {currency}
                </p>
                <p className="mb-2">
                  1 {currency} = {formatNumber(1 / (rates[currency] || 1))} {baseCode}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeCurrency(currency);
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                >
                  {currency}로 기준 변경
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
