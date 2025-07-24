'use client';

import React, { useEffect, useState } from 'react';

interface InstrumentInfo {
  rawSymbol: string;
  displaySymbol: string;
  baseCode: string;
  quoteCode: string;
  integratedCategory: string;
  // Binance API에서 가져올 추가 정보
  status?: string;
  baseAssetPrecision?: number;
  quotePrecision?: number;
  quoteAssetPrecision?: number;
  isSpotTradingAllowed?: boolean;
  isMarginTradingAllowed?: boolean;
  icebergAllowed?: boolean;
  ocoAllowed?: boolean;
  orderTypes?: string[];
  permissions?: string[];
  // 24hr 티커 정보
  priceChange?: string;
  priceChangePercent?: string;
  weightedAvgPrice?: string;
  prevClosePrice?: string;
  lastPrice?: string;
  lastQty?: string;
  bidPrice?: string;
  askPrice?: string;
  openPrice?: string;
  highPrice?: string;
  lowPrice?: string;
  volume?: string;
  quoteVolume?: string;
  openTime?: number;
  closeTime?: number;
  count?: number;
}

// 공유 유틸리티에서 한국어 QWERTY 변환 함수 가져오기
import { normalizeSearchTerm } from '@/packages/shared/utils';

import {
  IntegratedCategory,
} from '@/packages/shared/constants/exchange';

import { CoinInfo } from '@/packages/shared/types/exchange';

// 스토어 import 추가
import { useExchangeInstrumentStore } from '@/packages/shared/stores/createExchangeInstrumentStore';

// Binance API 클라이언트 import
import { 
  fetchBinanceExchangeInfo, 
  fetchBinance24hrTicker 
} from '@/packages/shared/utils/binanceApiClient';

// 중앙 관리 갱신 설정 import
import { 
  getUpdateInterval,
  needsUpdate,
  getUpdateIntervalDescription
} from '@/packages/shared/constants/updateConfig';

// 업데이트 시간 관련 함수들
const getUpdateTimeKey = (category: string): string => {
  return `binance-${category}`;
};

const getUpdateTime = (category: string): Date | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = getUpdateTimeKey(category);
    const dataStr = localStorage.getItem(key);
    
    if (!dataStr) return null;
    
    // 데이터 형식: "2025-07-08T00:23:36.935Z:::BTC/USDT=BTCUSDT,ETH/USDT=ETHUSDT"
    const parts = dataStr.split(':::');
    if (parts.length < 2) return null;
    
    const timestamp = parts[0];
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error(`업데이트 시간 조회 실패 (${category}):`, error);
    return null;
  }
};

const checkNeedsUpdate = (category: string): boolean => {
  const updateTime = getUpdateTime(category);
  if (!updateTime) return true;
  
  // 중앙 관리 설정을 사용하여 갱신 필요 여부 확인
  return needsUpdate('binance', category, false);
};

// Binance는 현재 spot만 지원
const SUPPORTED_INTEGRATED_CATEGORIES: IntegratedCategory[] = ['spot'];

const BinanceInstrumentPage = () => {
  const [instrumentData, setInstrumentData] = useState<InstrumentInfo[]>([]);
  const [filteredData, setFilteredData] = useState<InstrumentInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTimes, setUpdateTimes] = useState<{[category: string]: Date | null}>({});
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [loadingAdditionalInfo, setLoadingAdditionalInfo] = useState(false);

  // 스토어에서 함수들 가져오기
  const { fetchBinanceCoins, getFilteredCoins } = useExchangeInstrumentStore();

  // 업데이트 시간 정보 수집 함수
  const collectUpdateTimes = () => {
    const categoryUpdateTimes: {[category: string]: Date | null} = {};
    SUPPORTED_INTEGRATED_CATEGORIES.forEach(category => {
      categoryUpdateTimes[category] = getUpdateTime(category);
    });
    setUpdateTimes(categoryUpdateTimes);
  };

  // localStorage에서 Binance 심볼 데이터 로드
  const loadStoredSymbols = (): InstrumentInfo[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const key = 'binance-spot';
      const dataStr = localStorage.getItem(key);
      
      if (!dataStr) return [];
      
      // 데이터 형식: "2025-07-08T00:23:36.935Z:::BTC/USDT=BTCUSDT,ETH/USDT=ETHUSDT"
      const parts = dataStr.split(':::');
      if (parts.length < 2) return [];
      
      const symbolData = parts[1];
      const symbols = symbolData.split(',');
      
      return symbols.map(symbolStr => {
        const [displaySymbol, rawSymbol] = symbolStr.split('=');
        const [baseCode, quoteCode] = displaySymbol.split('/');
        
        return {
          rawSymbol,
          displaySymbol,
          baseCode,
          quoteCode,
          integratedCategory: 'spot'
        };
      });
    } catch (error) {
      console.error('저장된 심볼 로드 실패:', error);
      return [];
    }
  };

  // Binance API에서 추가 정보 가져오기
  const fetchAdditionalInfo = async (instruments: InstrumentInfo[]): Promise<InstrumentInfo[]> => {
    if (instruments.length === 0) return instruments;
    
    try {
      setLoadingAdditionalInfo(true);
      
      // exchangeInfo와 24hr 티커 데이터를 병렬로 가져오기
      const [exchangeInfo, tickerData] = await Promise.all([
        fetchBinanceExchangeInfo(),
        fetchBinance24hrTicker()
      ]);
      
      // 심볼별로 매핑을 위한 Map 생성
      const exchangeInfoMap = new Map(exchangeInfo.map(info => [info.symbol, info]));
      const tickerMap = new Map(tickerData.map(ticker => [ticker.symbol, ticker]));
      
      // 기존 instruments에 추가 정보 병합
      const enrichedInstruments = instruments.map(instrument => {
        const exchangeData = exchangeInfoMap.get(instrument.rawSymbol);
        const tickerInfo = tickerMap.get(instrument.rawSymbol);
        
        return {
          ...instrument,
          // exchangeInfo에서 가져온 정보
          status: exchangeData?.status,
          baseAssetPrecision: exchangeData?.baseAssetPrecision,
          quotePrecision: exchangeData?.quotePrecision,
          quoteAssetPrecision: exchangeData?.quoteAssetPrecision,
          isSpotTradingAllowed: exchangeData?.isSpotTradingAllowed,
          isMarginTradingAllowed: exchangeData?.isMarginTradingAllowed,
          icebergAllowed: exchangeData?.icebergAllowed,
          ocoAllowed: exchangeData?.ocoAllowed,
          orderTypes: exchangeData?.orderTypes,
          permissions: exchangeData?.permissions,
          // 24hr 티커에서 가져온 정보
          priceChange: tickerInfo?.priceChange,
          priceChangePercent: tickerInfo?.priceChangePercent,
          weightedAvgPrice: tickerInfo?.weightedAvgPrice,
          prevClosePrice: tickerInfo?.prevClosePrice,
          lastPrice: tickerInfo?.lastPrice,
          lastQty: tickerInfo?.lastQty,
          bidPrice: tickerInfo?.bidPrice,
          askPrice: tickerInfo?.askPrice,
          openPrice: tickerInfo?.openPrice,
          highPrice: tickerInfo?.highPrice,
          lowPrice: tickerInfo?.lowPrice,
          volume: tickerInfo?.volume,
          quoteVolume: tickerInfo?.quoteVolume,
          openTime: tickerInfo?.openTime,
          closeTime: tickerInfo?.closeTime,
          count: tickerInfo?.count,
        };
      });
      
      return enrichedInstruments;
    } catch (error) {
      console.error('추가 정보 가져오기 실패:', error);
      // 에러가 발생해도 기본 정보는 반환
      return instruments;
    } finally {
      setLoadingAdditionalInfo(false);
    }
  };

  // 데이터 로드 및 갱신 함수
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Binance 데이터 로드 시작...');

      // 업데이트 시간 정보 먼저 수집
      collectUpdateTimes();

      // localStorage에서 기본 심볼 정보 로드
      let storedInstruments = loadStoredSymbols();
      
      // 데이터가 없거나 갱신이 필요한 경우 API에서 가져오기
      if (storedInstruments.length === 0 || checkNeedsUpdate('spot')) {
        console.log('📡 Binance API에서 최신 데이터 가져오는 중...');
        await fetchBinanceCoins();
        storedInstruments = loadStoredSymbols();
      }

      if (storedInstruments.length === 0) {
        setError('Binance 인스트루먼트 데이터를 가져올 수 없습니다.');
        return;
      }

      // API에서 추가 정보 가져오기
      const enrichedInstruments = await fetchAdditionalInfo(storedInstruments);
      
      setInstrumentData(enrichedInstruments);
      setFilteredData(enrichedInstruments);
      setLastRefreshTime(new Date());
      
      console.log(`✅ Binance 데이터 로드 완료: ${enrichedInstruments.length}개 인스트루먼트`);
      
    } catch (error) {
      console.error('❌ 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링 함수
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredData(instrumentData);
      return;
    }

    const normalizedTerm = normalizeSearchTerm(term.toLowerCase());
    
    const filtered = instrumentData.filter(instrument => {
      const searchableFields = [
        instrument.rawSymbol,
        instrument.displaySymbol,
        instrument.baseCode,
        instrument.quoteCode,
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        normalizeSearchTerm(field.toLowerCase()).includes(normalizedTerm)
      );
    });
    
    setFilteredData(filtered);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 테이블 헤더 정의
  const tableHeaders = [
    'rawSymbol', 'displaySymbol', 'baseCode', 'quoteCode', 'integratedCategory',
    'status', 'baseAssetPrecision', 'quotePrecision', 'quoteAssetPrecision',
    'isSpotTradingAllowed', 'isMarginTradingAllowed', 'icebergAllowed', 'ocoAllowed',
    'lastPrice', 'priceChangePercent', 'volume', 'quoteVolume', 'bidPrice', 'askPrice'
  ] as const;

  const headerKorean: Record<string, string> = {
    rawSymbol: '원본 심볼',
    displaySymbol: '표시 심볼',
    baseCode: '기초 자산',
    quoteCode: '견적 자산',
    integratedCategory: '카테고리',
    status: '상태',
    baseAssetPrecision: '기초자산 정밀도',
    quotePrecision: '견적 정밀도',
    quoteAssetPrecision: '견적자산 정밀도',
    isSpotTradingAllowed: '현물 거래 허용',
    isMarginTradingAllowed: '마진 거래 허용',
    icebergAllowed: '빙산 주문 허용',
    ocoAllowed: 'OCO 주문 허용',
    lastPrice: '최종 가격',
    priceChangePercent: '가격 변동률(%)',
    volume: '거래량',
    quoteVolume: '견적 거래량',
    bidPrice: '매수 가격',
    askPrice: '매도 가격',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Binance 인스트루먼트</h1>
        <p className="text-muted-foreground">
          Binance 거래소의 현물(Spot) 인스트루먼트 정보를 확인할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 새로고침 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="심볼, 기초자산, 견적자산으로 검색..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
              새로고침 중...
            </>
          ) : (
            '새로고침'
          )}
        </button>
      </div>

      {/* 통계 정보 */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-foreground">{instrumentData.length.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">전체 인스트루먼트</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-foreground">{filteredData.length.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">검색 결과</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-foreground">
            {lastRefreshTime ? lastRefreshTime.toLocaleTimeString('ko-KR') : '-'}
          </div>
          <div className="text-sm text-muted-foreground">마지막 갱신</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-foreground">
            {loadingAdditionalInfo ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                로딩 중
              </div>
            ) : (
              'API 연동'
            )}
          </div>
          <div className="text-sm text-muted-foreground">추가 정보 상태</div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400 font-medium">⚠️ 오류</span>
          </div>
          <div className="mt-2 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* 업데이트 시간 정보 표시 */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-foreground">데이터 상태</h3>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              갱신 중...
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUPPORTED_INTEGRATED_CATEGORIES.map(category => {
            const updateTime = updateTimes[category];
            const needsUpdateFlag = checkNeedsUpdate(category);
            const hoursAgo = updateTime ? (new Date().getTime() - updateTime.getTime()) / (1000 * 60 * 60) : null;
            
            return (
              <div key={category} className="flex flex-col p-3 bg-background rounded border">
                <div className="font-medium text-sm text-foreground mb-1">
                  {category.toUpperCase()}
                </div>
                <div className={`text-xs ${needsUpdateFlag ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                  {updateTime ? (
                    <>
                      <div>{updateTime.toLocaleDateString('ko-KR')}</div>
                      <div>{updateTime.toLocaleTimeString('ko-KR')}</div>
                      <div className="mt-1">
                        {hoursAgo !== null && (
                          <span className="text-xs">
                            {hoursAgo < 1 ? '1시간 미만 전' : `${hoursAgo.toFixed(1)}시간 전`}
                          </span>
                        )}
                      </div>
                      {needsUpdateFlag && <div className="mt-1 font-medium text-yellow-600 dark:text-yellow-400">⚠️ 갱신 필요</div>}
                    </>
                  ) : (
                    <div className="text-red-600 dark:text-red-400">데이터 없음</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          💡 데이터는 {getUpdateIntervalDescription('binance')} 갱신이 필요한 경우 다음 API 호출 시 자동으로 업데이트됩니다.
        </div>
      </div>

      {instrumentData.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted">
              <tr>
                {tableHeaders.map((header) => (
                  <th 
                    key={header} 
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {headerKorean[header] || header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredData.map((instrument, index) => (
                <tr key={instrument.rawSymbol ? `${instrument.rawSymbol}-${index}` : index} className="hover:bg-muted/50">
                  {tableHeaders.map((header) => {
                    const value = instrument[header];
                    let displayValue: string;
                    
                    if (value === undefined || value === null || value === '') {
                      displayValue = '-';
                    } else if (typeof value === 'boolean') {
                      displayValue = value ? '✅' : '❌';
                    } else if (Array.isArray(value)) {
                      displayValue = value.length > 0 ? value.join(', ') : '-';
                    } else if (header === 'priceChangePercent' && typeof value === 'string') {
                      const percent = parseFloat(value);
                      displayValue = `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
                    } else if ((header === 'lastPrice' || header === 'bidPrice' || header === 'askPrice') && typeof value === 'string') {
                      const price = parseFloat(value);
                      displayValue = price.toFixed(8);
                    } else if ((header === 'volume' || header === 'quoteVolume') && typeof value === 'string') {
                      const vol = parseFloat(value);
                      displayValue = vol.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    return (
                      <td 
                        key={header} 
                        className={`px-4 py-3 whitespace-nowrap text-foreground ${
                          header === 'priceChangePercent' && typeof value === 'string' 
                            ? parseFloat(value) >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                            : ''
                        }`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BinanceInstrumentPage;
