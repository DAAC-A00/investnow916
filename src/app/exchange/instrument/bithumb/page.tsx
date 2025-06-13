"use client";

import React, { useEffect, useState } from 'react';

interface InstrumentInfo {
  rawSymbol: string;
  displaySymbol: string;
  baseCode: string;
  quoteCode: string;
  pair: string;
  rawCategory: string;
  displayCategory: BithumbDisplayCategory;
  settlementCode?: string;
  remark?: string;
  search?: string;
}

// 공유 유틸리티에서 한국어 QWERTY 변환 함수 가져오기
import { normalizeSearchTerm } from '@/packages/shared/utils';

import { 
  BithumbRawCategory,
  BithumbDisplayCategory
} from '@/packages/shared/types/exchange';

// Bithumb은 spot만 지원하므로 고정된 카테고리
const BITHUMB_CATEGORIES: BithumbDisplayCategory[] = ['spot'];

// 업데이트 시간 관련 함수들
const getUpdateTimeKey = (category: string): string => {
  return `bithumb-${category}-updated`;
};

const getUpdateTime = (category: string): Date | null => {
  try {
    const timeStr = localStorage.getItem(getUpdateTimeKey(category));
    return timeStr ? new Date(timeStr) : null;
  } catch (error) {
    console.error(`업데이트 시간 조회 실패 (${category}):`, error);
    return null;
  }
};

const needsUpdate = (category: string): boolean => {
  const updateTime = getUpdateTime(category);
  if (!updateTime) return true;
  
  const now = new Date();
  const diffHours = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
  return diffHours >= 2; // 2시간 이상 지났으면 갱신 필요
};

// localStorage 키 생성을 위한 헬퍼 함수
const getBithumbStorageKeys = (): string[] => {
  return BITHUMB_CATEGORIES.map(category => `bithumb-${category}`);
};

const parseInstrumentString = (instrumentStr: string, categoryKey: string): InstrumentInfo | null => {
  try {
    const parts = instrumentStr.split('=');
    if (parts.length !== 2) return null;
    const rawSymbol = parts[1];
    const leftPart = parts[0]; // baseCode/quoteCode

    // baseCode/quoteCode(settlementCode) 추출
    // Bithumb의 경우 일반적으로 baseCode/quoteCode 형식이지만, 
    // 경우에 따라 baseCode/quoteCode(settlementCode) 형식일 수 있음
    const symbolMatch = leftPart.match(/^([^/]+)\/([^/(]+)(?:\(([^)]+)\))?$/);
    if (!symbolMatch) return null;

    const [, baseCode, quoteCode, settlementCode] = symbolMatch;
    const finalSettlementCode = settlementCode || quoteCode; // settlementCode가 없으면 quoteCode 사용

    const displayCategory = categoryKey.replace('bithumb-', '') as BithumbDisplayCategory;

    return {
      rawSymbol,
      displaySymbol: `${baseCode}/${quoteCode}`,
      baseCode,
      quoteCode,
      rawCategory: 'spot' as BithumbRawCategory,
      displayCategory,
      pair: `${baseCode}/${quoteCode}`,
      settlementCode: finalSettlementCode,
      remark: '',
      search: ''
    };
  } catch (e) {
    console.error('Error parsing instrument string:', instrumentStr, e);
    return null;
  }
};

const BithumbInstrumentPage = () => {
  const [instrumentData, setInstrumentData] = useState<InstrumentInfo[]>([]);
  const [filteredData, setFilteredData] = useState<InstrumentInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTimes, setUpdateTimes] = useState<{[category: string]: Date | null}>({});

  useEffect(() => {
    try {
      const allInstruments: InstrumentInfo[] = [];
      let foundAnyData = false;
      const categoryUpdateTimes: {[category: string]: Date | null} = {};

      getBithumbStorageKeys().forEach(key => {
        const storedData = localStorage.getItem(key);
        const category = key.replace('bithumb-', '');
        categoryUpdateTimes[category] = getUpdateTime(category);
        
        if (storedData) {
          foundAnyData = true;
          const instrumentStrings = storedData.split(',');
          instrumentStrings.forEach(str => {
            if (str.trim()) {
              const parsed = parseInstrumentString(str.trim(), key);
              if (parsed) {
                allInstruments.push(parsed);
              }
            }
          });
        }
      });

      setUpdateTimes(categoryUpdateTimes);

      if (!foundAnyData) {
        setError('로컬 스토리지에서 Bithumb instrument 정보를 찾을 수 없습니다.');
      } else if (allInstruments.length === 0 && foundAnyData) {
        setError('유효한 Bithumb instrument 정보를 파싱할 수 없습니다. 데이터 형식을 확인하세요.');
      }
      setInstrumentData(allInstruments);
      setFilteredData(allInstruments); // 초기에는 모든 데이터 표시

    } catch (e) {
      console.error('로컬 스토리지 데이터 처리 중 오류 발생:', e);
      setError('데이터를 불러오는 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 검색어에 따라 데이터 필터링 (한국어 입력 지원)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(instrumentData);
    } else {
      // 검색어 정규화 (한국어 자모 → 영어 QWERTY 변환 및 소문자 변환)
      const normalizedTerm = normalizeSearchTerm(searchTerm);
      
      // 검색어로 필터링
      const filtered = instrumentData.filter(instrument => {
        const searchText = `${instrument.rawSymbol}${instrument.displaySymbol}${instrument.baseCode}${instrument.quoteCode}${instrument.pair}${instrument.rawCategory}${instrument.displayCategory}${instrument.remark}${instrument.search}`.toLowerCase();
        return searchText.includes(normalizedTerm);
      });
      
      setFilteredData(filtered);
    }
  }, [searchTerm, instrumentData]);

  if (loading) {
    return <div className="p-5 text-muted-foreground">데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="p-5 text-red-600 dark:text-red-400">오류: {error}</div>;
  }

  if (instrumentData.length === 0) {
    return <div className="p-5 text-muted-foreground">표시할 Bithumb instrument 정보가 없습니다.</div>;
  }

  const tableHeaders: (keyof InstrumentInfo)[] = ['displaySymbol', 'baseCode', 'quoteCode', 'pair', 'rawCategory', 'displayCategory', 'settlementCode', 'rawSymbol', 'remark', 'search'];
  const headerKorean: Record<keyof InstrumentInfo, string> = {
    rawSymbol: '원본 심볼',
    displaySymbol: '표시용 심볼',
    baseCode: '베이스코드',
    quoteCode: '쿼트코드',
    pair: '페어',
    rawCategory: '원본 카테고리',
    displayCategory: '표시용 카테고리',
    settlementCode: '결제코드',
    remark: '비고',
    search: '검색어'
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Bithumb Instrument 정보 ({filteredData.length}/{instrumentData.length}개)
        </h1>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="심볼, 코드, 페어로 검색..."
            className="w-full px-4 py-2 pl-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background border-border text-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* 업데이트 시간 정보 표시 */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-lg font-medium text-foreground mb-3">카테고리별 업데이트 시간</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {BITHUMB_CATEGORIES.map(category => {
            const updateTime = updateTimes[category];
            const needsUpdateFlag = needsUpdate(category);
            
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
                      {needsUpdateFlag && <div className="mt-1 font-medium">⚠️ 갱신 필요</div>}
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
          💡 데이터는 2시간마다 자동으로 갱신됩니다. 갱신이 필요한 카테고리는 다음 API 호출 시 자동으로 업데이트됩니다.
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
                <tr key={instrument.rawSymbol ? `${instrument.rawSymbol}-${instrument.rawCategory}-${index}` : index} className="hover:bg-muted/50">
                  {tableHeaders.map((header) => (
                    <td 
                      key={header} 
                      className="px-4 py-3 whitespace-nowrap text-foreground"
                    >
                      {instrument[header] === undefined || instrument[header] === null || instrument[header] === '' ? '-' : String(instrument[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BithumbInstrumentPage;
