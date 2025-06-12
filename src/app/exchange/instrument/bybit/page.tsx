'use client';

import React, { useEffect, useState } from 'react';

interface InstrumentInfo {
  rawSymbol: string;
  displaySymbol: string;
  quantity: number;
  baseCode: string;
  quoteCode: string;
  pair: string;
  rawCategory: string;
  displayCategory: keyof typeof BYBIT_CATEGORY_DISPLAYTORAW_MAP;
  settlementCode: string;
  restOfSymbol?: string;
}

const BYBIT_INSTRUMENT_KEYS = [
  'bybit-option',
  'bybit-spot',
  'bybit-cm',
  'bybit-um',
];

// Bybit 카테고리 매핑
export const BYBIT_CATEGORY_DISPLAYTORAW_MAP = {
  // 표시용 카테고리(displayCategory): API 요청용 카테고리(rawCategory)
  'um': 'linear',
  'cm': 'inverse',
  // spot, option은 그대로 유지
  'spot': 'spot',
  'option': 'option'
} as const;
const parseInstrumentString = (instrumentStr: string, categoryKey: string): InstrumentInfo | null => {
  try {
    const parts = instrumentStr.split('=');
    if (parts.length !== 2) return null;
    const rawSymbol = parts[1];
    const displaySymbol = parts[0];

    // 정규식을 사용하여 수량, 베이스코드, 쿼트코드, 정산코드, 추가정보 추출
    // 수정된 정규식 패턴 (예시)
    const pattern = /^(\d+)?\*?([^/]+)\/([^-]+)(?:\(([^)]+)\))?(?:-([\w-]+))?/;
    const match = displaySymbol.match(pattern);
    
    if (!match) return null;

    const [, quantityStr = '1', baseCode, quoteCode, settlementCode, restOfSymbol] = match;
    const quantity = quantityStr ? parseInt(quantityStr, 10) : 1;

    const displayCategory = categoryKey.replace('bybit-', '');

    return {
      rawSymbol,
      displaySymbol: `${quantity == 1 ? '' : quantity}${baseCode}/${quoteCode}${settlementCode ? `(${settlementCode})` : ''}${restOfSymbol ? `-${restOfSymbol}` : ''}`,
      quantity,
      baseCode,
      quoteCode,
      rawCategory: BYBIT_CATEGORY_DISPLAYTORAW_MAP[displayCategory as keyof typeof BYBIT_CATEGORY_DISPLAYTORAW_MAP] || displayCategory,
      displayCategory: displayCategory as keyof typeof BYBIT_CATEGORY_DISPLAYTORAW_MAP,
      pair: `${baseCode}/${quoteCode}`,
      settlementCode: settlementCode || quoteCode, // 정산코드가 없으면 quoteCode 사용
      restOfSymbol: restOfSymbol || undefined
    };
  } catch (e) {
    console.error('Error parsing instrument string:', instrumentStr, e);
    return null;
  }
};

const BybitInstrumentPage = () => {
  const [instrumentData, setInstrumentData] = useState<InstrumentInfo[]>([]);
  const [filteredData, setFilteredData] = useState<InstrumentInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const allInstruments: InstrumentInfo[] = [];
      let foundAnyData = false;

      BYBIT_INSTRUMENT_KEYS.forEach(key => {
        const storedData = localStorage.getItem(key);
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

      if (!foundAnyData) {
        setError('로컬 스토리지에서 Bybit instrument 정보를 찾을 수 없습니다.');
      } else if (allInstruments.length === 0 && foundAnyData) {
        setError('유효한 Bybit instrument 정보를 파싱할 수 없습니다. 데이터 형식을 확인하세요.');
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

  // 검색어에 따라 데이터 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(instrumentData);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = instrumentData.filter(instrument => 
        `${instrument.rawSymbol}${instrument.displaySymbol}${instrument.quantity}${instrument.baseCode}${instrument.quoteCode}${instrument.pair}${instrument.quantity}${instrument.baseCode}${instrument.settlementCode}${instrument.restOfSymbol}${instrument.rawCategory}${instrument.displayCategory}`.toLowerCase().includes(term)
      );
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
    return <div className="p-5 text-muted-foreground">표시할 Bybit instrument 정보가 없습니다.</div>;
  }

  const tableHeaders: (keyof InstrumentInfo)[] = ['rawSymbol', 'displaySymbol', 'quantity', 'baseCode', 'quoteCode', 'pair', 'rawCategory', 'displayCategory', 'settlementCode', 'restOfSymbol'];
  const headerKorean: Record<keyof InstrumentInfo, string> = {
    rawSymbol: '원본 심볼',
    displaySymbol: '표시용 심볼',
    baseCode: '베이스코드',
    quoteCode: '쿼트코드',
    pair: '페어',
    rawCategory: '원본 카테고리',
    displayCategory: '표시용 카테고리',
    quantity: '수량',
    settlementCode: '정산 화폐',
    restOfSymbol: '추가정보'
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Bybit Instrument 정보 ({filteredData.length}/{instrumentData.length}개)
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

export default BybitInstrumentPage; 