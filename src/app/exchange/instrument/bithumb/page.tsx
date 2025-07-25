"use client";

import React, { useEffect, useState } from 'react';

interface InstrumentInfo {
  rawSymbol: string;
  integratedSymbol: string;
  baseCode: string;
  quoteCode: string;
  pair: string;
  rawCategory: string;
  integratedCategory: IntegratedCategory;
  settlementCode?: string;
  remark?: string;
  search?: string;
  // 추가: API에서 온 데이터인지 여부
  fromApi?: boolean;
  // 추가: instrument/warning 정보
  instrument?: {
    korean_name: string;
    english_name: string;
    market_warning: 'NONE' | 'CAUTION';
  };
  warning?: {
    warning_type: string;
    end_date: string;
  };
}

// 공유 유틸리티에서 한국어 QWERTY 변환 함수 가져오기
import { normalizeSearchTerm } from '@/packages/shared/utils';
// [추가] 빗썸 instrument/warning fetch 함수 import
import { fetchBithumbMarketAll, fetchBithumbVirtualAssetWarning } from '@/packages/shared/utils/bithumbApiClient';

import { 
  BithumbRawCategory,
  IntegratedCategory,
  CoinInfo
} from '@/packages/shared/types/exchange';

// 스토어 import 추가
import { useExchangeInstrumentStore } from '@/packages/shared/stores/createExchangeInstrumentStore';

// 중앙 관리 갱신 설정 import
import { 
  getUpdateInterval,
  needsUpdate,
  getUpdateIntervalDescription
} from '@/packages/shared/constants/updateConfig';

// Bithumb은 spot만 지원하므로 고정된 카테고리
const SUPPORTED_RAW_CATEGORIES: BithumbRawCategory[] = ['spot'];
const SUPPORTED_INTEGRATED_CATEGORIES: IntegratedCategory[] = ['spot'];

// 업데이트 시간 관련 함수들 (실제 데이터에서 타임스탬프 추출)
const getUpdateTimeKey = (category: string): string => {
  return `bithumb-${category}`;
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
  if (!updateTime) return true; // 업데이트 시간이 없으면 갱신 필요
  
  // 중앙 관리 설정을 사용하여 갱신 필요 여부 확인
  return needsUpdate('bithumb', category);
};

const BithumbInstrumentPage = () => {
  const [instrumentData, setInstrumentData] = useState<InstrumentInfo[]>([]);
  const [filteredData, setFilteredData] = useState<InstrumentInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTimes, setUpdateTimes] = useState<{[category: string]: Date | null}>({});
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // 스토어에서 함수들 가져오기
  const { fetchBithumbCoins, getFilteredCoins } = useExchangeInstrumentStore();

  // 업데이트 시간 정보 수집 함수
  const collectUpdateTimes = () => {
    const categoryUpdateTimes: {[category: string]: Date | null} = {};
    SUPPORTED_INTEGRATED_CATEGORIES.forEach(category => {
      categoryUpdateTimes[category] = getUpdateTime(category);
    });
    setUpdateTimes(categoryUpdateTimes);
  };

  // 데이터 로드 및 갱신 함수
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      collectUpdateTimes();
      // 기존 localStorage 기반 데이터
      const success = await fetchBithumbCoins('spot');
      let instrumentInfos: InstrumentInfo[] = [];
      if (success) {
        const filteredCoins = getFilteredCoins({ exchange: 'bithumb', category: 'spot' });
        instrumentInfos = filteredCoins.map((coin: CoinInfo) => ({
          rawSymbol: coin.rawSymbol,
          integratedSymbol: coin.integratedSymbol,
          baseCode: coin.baseCode,
          quoteCode: coin.quoteCode,
          pair: coin.integratedSymbol,
          rawCategory: coin.rawCategory,
          integratedCategory: coin.integratedCategory as IntegratedCategory,
          settlementCode: coin.settlementCode,
          remark: '',
          search: '',
          fromApi: false,
        }));
      }
      // [추가] API에서 직접 instrument/warning 데이터 확보
      const [apiInstruments, apiWarnings] = await Promise.all([
        fetchBithumbMarketAll(),
        fetchBithumbVirtualAssetWarning(),
      ]);
      // API 데이터 → InstrumentInfo로 변환 (localStorage에 없는 경우만 추가)
      const localSymbols = new Set(instrumentInfos.map(i => `KRW-${i.baseCode}`));
      const apiInstrumentInfos: InstrumentInfo[] = apiInstruments.map(inst => {
        const warning = apiWarnings.find(w => w.market === inst.market);
        const [quote, base] = inst.market.split('-');
        return {
          rawSymbol: `${base}${quote}`,
          integratedSymbol: `${base}/${quote}`,
          baseCode: base,
          quoteCode: quote,
          pair: `${base}/${quote}`,
          rawCategory: 'spot',
          integratedCategory: 'spot',
          fromApi: !localSymbols.has(inst.market),
          instrument: inst,
          warning: warning ? { warning_type: warning.warning_type, end_date: warning.end_date } : undefined,
        };
      });
      // localStorage 기반 + API 기반(중복 제외) 병합
      const merged = [
        ...instrumentInfos.map(i => {
          // instrument/warning 정보도 병합
          const inst = apiInstruments.find(a => a.market === `KRW-${i.baseCode}`);
          const warning = apiWarnings.find(w => w.market === `KRW-${i.baseCode}`);
          return {
            ...i,
            instrument: inst,
            warning: warning ? { warning_type: warning.warning_type, end_date: warning.end_date } : undefined,
          };
        }),
        ...apiInstrumentInfos.filter(i => i.fromApi),
      ];
      setInstrumentData(merged);
      setFilteredData(merged);
      collectUpdateTimes();
      setLastRefreshTime(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
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

    const normalizedTerm = normalizeSearchTerm(term);
    const filtered = instrumentData.filter(instrument => {
      const searchableText = [
        instrument.integratedSymbol,
        instrument.baseCode,
        instrument.quoteCode,
        instrument.rawSymbol
      ].join(' ').toLowerCase();
      
      return searchableText.includes(normalizedTerm.toLowerCase());
    });
    
    setFilteredData(filtered);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 검색어 변경 시 필터링
  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, instrumentData]);

  // 테이블 헤더 정의
  const tableHeaders = ['integratedSymbol', 'baseCode', 'quoteCode', 'rawSymbol', 'integratedCategory', 'instrument', 'warning'] as const;
  const headerKorean = {
    integratedSymbol: '심볼',
    baseCode: '기초자산',
    quoteCode: '견적자산',
    rawSymbol: '원시심볼',
    integratedCategory: '카테고리',
    settlementCode: '결제통화',
    instrument: '시장정보',
    warning: '경보',
  };

  // 로딩 상태
  if (loading && instrumentData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Bithumb 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && instrumentData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-foreground mb-2">데이터 로드 실패</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (instrumentData.length === 0) {
    return <div className="p-5 text-muted-foreground">표시할 Bithumb instrument 정보가 없습니다.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bithumb Instrument 정보 ({filteredData.length}/{instrumentData.length}개)
            </h1>
            {lastRefreshTime && (
              <p className="text-sm text-muted-foreground">
                마지막 새로고침: {lastRefreshTime.toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        </div>

        {/* 검색 및 갱신 버튼 */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="심볼, 기초자산, 견적자산으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? '갱신 중...' : '수동 갱신'}
          </button>
        </div>
      </div>

      {/* 에러 메시지 (데이터가 있는 상태에서의 에러) */}
      {error && instrumentData.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm text-red-700 dark:text-red-300">
              최신 데이터 갱신 실패: {error} (기존 데이터를 표시합니다)
            </span>
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
          💡 데이터는 {getUpdateIntervalDescription('bithumb')} 갱신이 필요한 경우 다음 API 호출 시 자동으로 업데이트됩니다.
        </div>
      </div>

      {/* 테이블 */}
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
              <tr key={instrument.rawSymbol ? `${instrument.rawSymbol}-${instrument.rawCategory}-${index}` : index} className="hover:bg-muted/50">
                {tableHeaders.map((header) => (
                  <td key={header} className="px-4 py-3 whitespace-nowrap text-foreground">
                    {/* [수정] instrument/warning/⚡ 표기 */}
                    {header === 'instrument' && instrument.instrument ? (
                      <span>
                        {instrument.instrument.korean_name} ({instrument.instrument.english_name})
                        {instrument.instrument.market_warning === 'CAUTION' && <span className="ml-1 text-yellow-500">⚠️</span>}
                        {instrument.fromApi && <span className="ml-1 text-blue-500">⚡</span>}
                      </span>
                    ) : header === 'warning' && instrument.warning ? (
                      <span>
                        {instrument.warning.warning_type}
                        {instrument.warning.end_date && (
                          <span className="ml-1 text-xs text-muted-foreground">({instrument.warning.end_date})</span>
                        )}
                        {instrument.fromApi && <span className="ml-1 text-blue-500">⚡</span>}
                      </span>
                    ) : (
                      <>
                        {instrument[header] === undefined || instrument[header] === null || instrument[header] === ''
                          ? ''
                          : String(instrument[header])}
                        {/* [추가] localStorage 아닌 경우 ⚡ */}
                        {instrument.fromApi && header !== 'instrument' && header !== 'warning' && <span className="ml-1 text-blue-500">⚡</span>}
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BithumbInstrumentPage;
