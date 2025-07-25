'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { 
  Ticker, 
  TickerHeader, 
  TickerControls, 
  TickerEmptyState,
  Button
} from '@/packages/shared/components';
import { useIntegratedTicker, IntegratedCategory } from '@/packages/shared/hooks';

// Instruments 정보를 위한 타입
interface InstrumentInfo {
  rawSymbol: string;
  integratedSymbol: string;
  baseCode: string;
  quoteCode: string;
  quantity?: number;
  settlementCode?: string;
  restOfSymbol?: string;
}

// localStorage에서 instruments 정보를 파싱하는 함수
const parseInstrumentsFromStorage = (exchange: string, category: string): InstrumentInfo[] => {
  if (typeof window === 'undefined') return [];
  
  const key = `${exchange}-${category}`;
  const storedValue = localStorage.getItem(key);
  
  if (!storedValue) return [];
  
  try {
    // 시간 정보가 포함된 형태인지 확인 (:::로 구분)
    const timeDataSeparator = ':::';
    let symbolData = '';
    
    if (storedValue.includes(timeDataSeparator)) {
      const [, data] = storedValue.split(timeDataSeparator);
      symbolData = data || '';
    } else {
      symbolData = storedValue;
    }
    
    if (!symbolData.trim()) return [];
    
    // 심볼 데이터 파싱: "integratedSymbol=rawSymbol" 형태로 콤마 구분
    const instruments = symbolData.split(',').map(entry => {
      const [integratedSymbolPart, rawSymbol] = entry.split('=');
      if (!integratedSymbolPart || !rawSymbol) return null;
      
      // quantity 추출 (예: "1000DOGE/USDT" 에서 1000 추출)
      let quantity = 1;
      let baseQuotePart = integratedSymbolPart;
      
      const quantityMatch = integratedSymbolPart.match(/^(\d+)\*(.+)$/);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
        baseQuotePart = quantityMatch[2];
      } else {
        // quantity가 없다면 기준/견적 화폐에서 추출
        const directQuantityMatch = integratedSymbolPart.match(/^(\d+)([A-Z]+)\/(.+)$/);
        if (directQuantityMatch) {
          const extractedNumber = parseInt(directQuantityMatch[1]);
          if (extractedNumber >= 1000 && extractedNumber % 10 === 0) {
            quantity = extractedNumber;
            baseQuotePart = `${directQuantityMatch[2]}/${directQuantityMatch[3]}`;
          }
        }
      }
      
      // baseCode/quoteCode 추출
      const parts = baseQuotePart.split('/');
      if (parts.length !== 2) return null;
      
      const [baseCode, quoteWithExtra] = parts;
      
      // settlementCode와 restOfSymbol 추출
      let quoteCode = quoteWithExtra;
      let settlementCode = '';
      let restOfSymbol = '';
      
      // settlementCode 추출 (예: "USDT(USDT)" 에서 괄호 안의 값)
      const settlementMatch = quoteWithExtra.match(/^(.+)\(([^)]+)\)(.*)$/);
      if (settlementMatch) {
        quoteCode = settlementMatch[1];
        settlementCode = settlementMatch[2];
        const remaining = settlementMatch[3];
        if (remaining.startsWith('-')) {
          restOfSymbol = remaining.substring(1);
        }
      } else {
        // restOfSymbol 추출 (예: "USDT-25DEC24" 에서 "-" 뒤의 값)
        const restMatch = quoteWithExtra.match(/^([^-]+)-(.+)$/);
        if (restMatch) {
          quoteCode = restMatch[1];
          restOfSymbol = restMatch[2];
        }
      }
      
      return {
        rawSymbol,
        integratedSymbol: integratedSymbolPart,
        baseCode,
        quoteCode,
        quantity,
        settlementCode: settlementCode || quoteCode,
        restOfSymbol: restOfSymbol || undefined,
      };
    }).filter(Boolean) as InstrumentInfo[];
    
    return instruments;
  } catch (error) {
    console.error(`Error parsing instruments from storage for ${key}:`, error);
    return [];
  }
};

// QuoteCode 선택 팝업 컴포넌트
interface QuoteCodePopupProps {
  isOpen: boolean;
  onClose: () => void;
  quoteCodes: string[];
  selectedQuoteCode: string;
  onSelect: (quoteCode: string) => void;
}

const QuoteCodePopup: React.FC<QuoteCodePopupProps> = ({
  isOpen,
  onClose,
  quoteCodes,
  selectedQuoteCode,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 팝업 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Quote Code 선택</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* 내용 */}
          <div className="p-4 overflow-y-auto max-h-80">
            <div className="grid grid-cols-2 gap-2">
              {quoteCodes.map((qc) => (
                <Button
                  key={qc}
                  variant={selectedQuoteCode === qc ? 'primary' : 'outline'}
                  size="sm"
                  selected={selectedQuoteCode === qc}
                  onClick={() => onSelect(qc)}
                  className="justify-center"
                >
                  {qc}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 카테고리 선택 컴포넌트
const CategorySelector = ({ 
  selectedCategory, 
  onCategoryChange,
  stats 
}: {
  selectedCategory: IntegratedCategory;
  onCategoryChange: (category: IntegratedCategory) => void;
  stats: {
    bithumbCount: number;
    bybitCount: number;
    binanceCount: number;
    totalCount: number;
  };
}) => {
  const getCategoryDisplay = (cat: IntegratedCategory) => {
    switch (cat) {
      case 'spot':
        return 'SPOT';
      case 'um':
        return 'USDⓈ-M';
      case 'cm':
        return 'COIN-M';
      default:
        return String(cat).toUpperCase();
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* 카테고리 선택 */}
      <div className="flex gap-2">
        {(['spot', 'um', 'cm'] as IntegratedCategory[]).map((cat) => (
          <Button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            variant={selectedCategory === cat ? 'primary' : 'outline'}
            size="md"
            selected={selectedCategory === cat}
          >
            {getCategoryDisplay(cat)}
          </Button>
        ))}
      </div>

      {/* 거래소별 통계 */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span>총 {stats.totalCount.toLocaleString('ko-KR')}개</span>
        <span>Bithumb: {stats.bithumbCount.toLocaleString('ko-KR')}개</span>
        <span>Bybit: {stats.bybitCount.toLocaleString('ko-KR')}개</span>
        <span>Binance: {stats.binanceCount.toLocaleString('ko-KR')}개</span>
      </div>
    </div>
  );
};

// quoteCode filter의 localStorage key 생성 함수
const getQuoteCodeStorageKey = (category: string) => `integrated-ticker-quoteCode-${category}`;

export default function IntegratedTickerPage() {
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();
  
  // [수정] 카테고리별 quoteCode 필터 상태 (localStorage 연동)
  const [selectedQuoteCodes, setSelectedQuoteCodes] = useState<{ [cat: string]: string }>({ spot: '', um: '', cm: '' });
  const [selectedQuoteCode, setSelectedQuoteCode] = useState<string>('');
  const [isQuoteCodePopupOpen, setIsQuoteCodePopupOpen] = useState<boolean>(false);

  // 통합 티커 훅 사용
  const {
    tickers,
    filteredTickers: baseFilteredTickers,
    isLoading,
    error,
    lastUpdate,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    handleSortChange,
    priceTracker,
    refreshData,
    category,
    setCategory,
    stats,
  } = useIntegratedTicker('spot');

  // localStorage에서 instruments 정보 가져오기
  const instrumentsData = useMemo(() => {
    const allInstruments: { [key: string]: InstrumentInfo } = {};
    
    // Bithumb spot 데이터
    if (category === 'spot') {
      const bithumbInstruments = parseInstrumentsFromStorage('bithumb', 'spot');
      bithumbInstruments.forEach(instrument => {
        allInstruments[`bithumb-${instrument.rawSymbol}`] = instrument;
      });
    }
    
    // Bybit 데이터
    const bybitCategory = category === 'spot' ? 'spot' : category === 'um' ? 'um' : 'cm';
    const bybitInstruments = parseInstrumentsFromStorage('bybit', bybitCategory);
    bybitInstruments.forEach(instrument => {
      allInstruments[`bybit-${instrument.rawSymbol}`] = instrument;
    });
    
    return allInstruments;
  }, [category]);

  // ticker 데이터와 instruments 정보를 결합하여 확장된 티커 데이터 생성
  const enrichedTickers = useMemo(() => {
    return baseFilteredTickers.map(ticker => {
      const instrumentKey = `${ticker.exchange}-${ticker.rawSymbol}`;
      const instrumentInfo = instrumentsData[instrumentKey];
      
      return {
        ...ticker,
        // localStorage의 instruments 정보 추가
        instrumentBaseCode: instrumentInfo?.baseCode || ticker.baseCode,
        instrumentQuoteCode: instrumentInfo?.quoteCode || ticker.quoteCode,
        instrumentQuantity: instrumentInfo?.quantity || 1,
        instrumentIntegratedSymbol: instrumentInfo?.integratedSymbol || ticker.integratedSymbol,
        instrumentSettlementCode: instrumentInfo?.settlementCode,
        instrumentRestOfSymbol: instrumentInfo?.restOfSymbol,
      };
    });
  }, [baseFilteredTickers, instrumentsData]);

  // 카테고리 변경 시 해당 카테고리의 quoteCode 필터값을 localStorage에서 불러옴
  useEffect(() => {
    const key = getQuoteCodeStorageKey(category);
    const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    setSelectedQuoteCode(saved || '');
  }, [category]);

  // quoteCode 선택 시 상태/로컬스토리지 동기화
  const handleQuoteCodeChange = (qc: string) => {
    setSelectedQuoteCode(qc);
    setSelectedQuoteCodes(prev => ({ ...prev, [category]: qc }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(getQuoteCodeStorageKey(category), qc);
    }
  };

  // [수정] quoteCode별 개수 집계 및 인기순 정렬 - enriched 데이터 기준으로 변경
  const quoteCodes = useMemo(() => {
    const countMap = new Map<string, number>();
    enrichedTickers.forEach(t => {
      // instruments의 quoteCode를 우선 사용
      const quoteCode = t.instrumentQuoteCode || t.quoteCode;
      if (quoteCode) {
        countMap.set(quoteCode, (countMap.get(quoteCode) || 0) + 1);
      }
    });
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1]) // 개수 내림차순
      .map(([qc]) => qc);
  }, [enrichedTickers]);

  // 표시할 quoteCode (최대 10개)와 나머지 분리
  const visibleQuoteCodes = useMemo(() => quoteCodes.slice(0, 10), [quoteCodes]);
  const hiddenQuoteCodes = useMemo(() => quoteCodes.slice(10), [quoteCodes]);

  // [수정] quoteCode로 2차 필터링 - enriched 데이터 기준으로 변경
  const filteredTickers = useMemo(() => {
    if (!selectedQuoteCode) return enrichedTickers;
    return enrichedTickers.filter(t => {
      const quoteCode = t.instrumentQuoteCode || t.quoteCode;
      return quoteCode === selectedQuoteCode;
    });
  }, [enrichedTickers, selectedQuoteCode]);

  useEffect(() => {
    setCurrentRoute('/exchange/ticker');
  }, [setCurrentRoute]);

  // 가격 변경 핸들러 - 고유 키 기반으로 가격 변화 추적
  const handlePriceChange = useCallback((symbol: string, oldPrice: number, newPrice: number) => {
    // 현재 활성화된 ticker를 찾아서 고유 키 생성
    const currentTicker = filteredTickers.find(t => t.rawSymbol === symbol);
    if (currentTicker) {
      const uniqueKey = `${currentTicker.exchange}-${currentTicker.rawCategory || 'spot'}-${currentTicker.rawSymbol}`;
      console.log(`티커 - ${uniqueKey}: ${oldPrice} → ${newPrice}`);
    } else {
      console.log(`티커 - ${symbol}: ${oldPrice} → ${newPrice}`);
    }
  }, [filteredTickers]);

  // 티커 클릭 핸들러
  const handleTickerClick = useCallback((data: any) => {
    if (data.exchange === 'bithumb') {
      router.push(`/exchange/ticker/bithumb/spot/${data.rawSymbol}`);
    } else {
      // Bybit의 경우 카테고리 정보 포함
      router.push(`/exchange/ticker/bybit/${data.rawCategory}/${data.rawSymbol}`);
    }
  }, [router]);

  // 카테고리별 제목 및 부제목
  const getCategoryInfo = () => {
    switch (category) {
      case 'spot':
        return {
          title: 'SPOT 실시간 티커',
          subtitle: '현물 마켓의 실시간 가격 정보',
        };
      case 'um':
        return {
          title: 'USDⓈ-M 실시간 티커',
          subtitle: 'USDⓈ 마진 선물 마켓의 실시간 가격 정보',
        };
      case 'cm':
        return {
          title: 'COIN-M 실시간 티커',
          subtitle: '코인 마진 선물 마켓의 실시간 가격 정보',
        };
      default:
        return {
          title: '실시간 티커',
          subtitle: '실시간 가격 정보',
        };
    }
  };

  const { title, subtitle } = getCategoryInfo();

  // 오류 상태 및 데이터 없음 처리
  if (error && tickers.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <CategorySelector
            selectedCategory={category}
            onCategoryChange={setCategory}
            stats={stats}
          />
          <TickerEmptyState
            type="error"
            title="오류 발생"
            description=""
            errorMessage={error}
            onAction={refreshData}
            actionLabel="다시 시도"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 카테고리 선택 */}
        <CategorySelector
          selectedCategory={category}
          onCategoryChange={setCategory}
          stats={stats}
        />

        {/* [수정] quoteCode 간편 필터 (최대 10개 + 더보기 버튼) */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex flex-nowrap gap-2 min-w-fit">
            <Button
              variant={selectedQuoteCode === '' ? 'primary' : 'outline'}
              size="sm"
              selected={selectedQuoteCode === ''}
              onClick={() => handleQuoteCodeChange('')}
            >
              All
            </Button>
            {visibleQuoteCodes.map(qc => (
              <Button
                key={qc}
                variant={selectedQuoteCode === qc ? 'primary' : 'outline'}
                size="sm"
                selected={selectedQuoteCode === qc}
                onClick={() => handleQuoteCodeChange(qc)}
              >
                {qc}
              </Button>
            ))}
            {hiddenQuoteCodes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuoteCodePopupOpen(true)}
                className="text-gray-500 border-dashed"
              >
                +{hiddenQuoteCodes.length}
              </Button>
            )}
          </div>
        </div>

        {/* QuoteCode 선택 팝업 */}
        <QuoteCodePopup
          isOpen={isQuoteCodePopupOpen}
          onClose={() => setIsQuoteCodePopupOpen(false)}
          quoteCodes={hiddenQuoteCodes}
          selectedQuoteCode={selectedQuoteCode}
          onSelect={(qc) => {
            handleQuoteCodeChange(qc);
            setIsQuoteCodePopupOpen(false);
          }}
        />

        {/* 헤더 */}
        <TickerHeader
          title={title}
          subtitle={subtitle}
          isLoading={isLoading}
          lastUpdate={lastUpdate}
          totalCount={tickers.length}
          error={error}
          onRefresh={refreshData}
        />

        {/* 정렬 및 검색 컨트롤 */}
        <TickerControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchResultCount={filteredTickers.length}
          totalCount={tickers.length}
        />

        {/* 티커 목록 */}
        {isLoading && tickers.length === 0 ? (
          <TickerEmptyState
            type="loading"
            title=""
            description="데이터를 불러오는 중..."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {filteredTickers.map((ticker) => {
              const uniqueKey = `${ticker.exchange}-${ticker.rawCategory || 'spot'}-${ticker.rawSymbol}`;
              return (
                <Ticker
                  key={uniqueKey}
                  data={ticker}
                  priceTracker={priceTracker}
                  className="hover:scale-105 transition-transform duration-200"
                  onPriceChange={handlePriceChange}
                  onClick={handleTickerClick}
                />
              );
            })}
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!isLoading && filteredTickers.length === 0 && tickers.length > 0 && (
          <TickerEmptyState
            type="search"
            title="검색 결과가 없습니다"
            description=""
            searchTerm={searchTerm}
            onAction={() => setSearchTerm('')}
            actionLabel="검색 초기화"
          />
        )}

        {/* 데이터 없음 */}
        {!isLoading && tickers.length === 0 && (
          <TickerEmptyState
            type="data"
            title="티커 데이터가 없습니다"
            description="API에서 데이터를 가져올 수 없습니다"
            onAction={refreshData}
            actionLabel="새로고침"
          />
        )}
      </div>
    </div>
  );
} 