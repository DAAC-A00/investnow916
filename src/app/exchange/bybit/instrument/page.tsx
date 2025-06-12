'use client';

import React, { useEffect, useState } from 'react';

interface InstrumentInfo {
  rawSymbol: string;
  displaySymbol: string;
  baseCode: string;
  quoteCode: string;
  rawCategory: string;
  displayCategory: keyof typeof BYBIT_CATEGORY_DISPLAYTORAW_MAP;
  quantity: number;
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
    const pattern = /^(\d+)?\*?([^/]+)\/([^(]+)(?:\(([^)]+)\))?(?:-(.*))?$/;
    const match = displaySymbol.match(pattern);
    
    if (!match) return null;

    const [, quantityStr = '1', baseCode, quoteCode, settlementCode, restOfSymbol] = match;
    const quantity = quantityStr ? parseInt(quantityStr, 10) : 1;

    const displayCategory = categoryKey.replace('bybit-', '');

    return {
      rawSymbol,
      displaySymbol: `${quantity == 1 ? '' : quantity}${baseCode}/${quoteCode}${settlementCode ? `(${settlementCode})` : ''}${restOfSymbol ? `-${restOfSymbol}` : ''}`,
      baseCode,
      quoteCode,
      rawCategory: BYBIT_CATEGORY_DISPLAYTORAW_MAP[displayCategory as keyof typeof BYBIT_CATEGORY_DISPLAYTORAW_MAP] || displayCategory,
      displayCategory: displayCategory as keyof typeof BYBIT_CATEGORY_DISPLAYTORAW_MAP,
      quantity,
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

    } catch (e) {
      console.error('로컬 스토리지 데이터 처리 중 오류 발생:', e);
      setError('데이터를 불러오는 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="p-5 text-muted-foreground">데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="p-5 text-red-600 dark:text-red-400">오류: {error}</div>;
  }

  if (instrumentData.length === 0 && !loading) {
    return <div className="p-5 text-muted-foreground">표시할 Bybit instrument 정보가 없습니다.</div>;
  }

  const tableHeaders: (keyof InstrumentInfo)[] = ['rawSymbol', 'displaySymbol', 'baseCode', 'quoteCode', 'rawCategory', 'displayCategory', 'quantity', 'settlementCode', 'restOfSymbol'];
  const headerKorean: Record<keyof InstrumentInfo, string> = {
    rawSymbol: '원본 심볼',
    displaySymbol: '표시용 심볼',
    baseCode: '베이스코드',
    quoteCode: '쿼트코드',
    rawCategory: '원본 카테고리',
    displayCategory: '표시용 카테고리',
    quantity: '수량',
    settlementCode: '정산 화폐',
    restOfSymbol: '추가정보'
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4 text-foreground">
        Bybit Instrument 정보 ({instrumentData.length}개)
      </h1>
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
              {instrumentData.map((instrument, index) => (
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