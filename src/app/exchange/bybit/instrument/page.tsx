'use client';

import React, { useEffect, useState } from 'react';

interface InstrumentInfo {
  rawSymbol: string;  // 외부 API로부터 받은 원본 심볼
  symbol: string;     // 내부 프로젝트용 표시 심볼 (baseCoin/quoteCoin)
  name: string;
  baseCoin: string;
  quoteCoin: string;
  category: string;
  restOfData?: string;
}

const BYBIT_INSTRUMENT_KEYS = [
  'bybit-option',
  'bybit-spot',
  'bybit-cm',
  'bybit-um',
];

const parseInstrumentString = (instrumentStr: string, categoryKey: string): InstrumentInfo | null => {
  try {
    const parts = instrumentStr.split('=');
    if (parts.length !== 2) return null;
    const rawSymbol = parts[1];
    const details = parts[0];

    const slashIndex = details.indexOf('/');
    if (slashIndex === -1) return null;
    const baseCoin = details.substring(0, slashIndex);
    
    const rest = details.substring(slashIndex + 1);
    const hyphenIndex = rest.indexOf('-');
    
    let quoteCoin = '';
    let restOfData = undefined;

    if (hyphenIndex !== -1) {
      quoteCoin = rest.substring(0, hyphenIndex);
      restOfData = rest.substring(hyphenIndex + 1);
    } else {
      quoteCoin = rest;
    }
    
    const category = categoryKey.replace('bybit-', '');

    return {
      rawSymbol,
      symbol: `${baseCoin}/${quoteCoin}`,  // 내부 프로젝트용 심볼 형식
      name: `${baseCoin}/${quoteCoin}${restOfData ? `-${restOfData}` : ''}`,
      baseCoin,
      quoteCoin,
      category,
      restOfData,
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

  const tableHeaders: (keyof InstrumentInfo)[] = ['symbol', 'rawSymbol', 'baseCoin', 'quoteCoin', 'category', 'restOfData'];
  const headerKorean: Record<keyof InstrumentInfo, string> = {
    symbol: '심볼',
    rawSymbol: '원본 심볼',
    name: '이름',
    baseCoin: '베이스코인',
    quoteCoin: '쿼트코인',
    category: '카테고리',
    restOfData: '추가정보'
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
                <tr key={instrument.rawSymbol ? `${instrument.rawSymbol}-${instrument.category}-${index}` : index} className="hover:bg-muted/50">
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