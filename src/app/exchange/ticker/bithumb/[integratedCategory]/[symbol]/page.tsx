'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { TickerData } from '@/packages/shared/types/exchange';
import { OrderbookData } from '@/packages/shared/types/bithumb';
import { PriceDecimalTracker } from '@/packages/shared/utils';
import { useTickerSettingStore } from '@/packages/shared/stores/createTickerSettingStore';
import { DATA_UPDATE_INTERVALS } from '@/packages/shared/constants/exchangeConfig';
import { toBithumbTickerData } from '@/packages/shared/utils/tickerDataBuilder';
import { transformBithumbOrderbook } from '@/packages/shared/utils/bithumbDataTransformer';
import { fetchBithumbOrderbook, fetchBithumbTicker } from '@/packages/shared/utils/bithumbDetailApi';
import { usePersistentToggle } from '@/packages/shared/hooks/usePersistentToggle';
import { 
  BithumbTickerHeader, 
  BithumbOrderbook, 
  BithumbTickerDetails 
} from '@/packages/shared/components';

export default function BithumbTickerDetailPage() {
  // 티커 색상 설정값 가져오기
  const tickerColorMode = useTickerSettingStore(state => state.tickerColorMode);
  const params = useParams();
  const router = useRouter();
  const { setCurrentRoute } = useNavigationActions();

  const integratedCategory = params?.integratedCategory as string;
  const symbol = params?.symbol as string;
  
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 가격 추적기 생성
  const priceTracker = useRef(new PriceDecimalTracker());

  // 상세 정보 토글 상태 (localStorage)
  const [showRawKey, setShowRawKey] = usePersistentToggle('bithumb-detail-show-raw-key', false);

  useEffect(() => {
    setCurrentRoute(`/exchange/ticker/bithumb/${integratedCategory}/${symbol}`);
  }, [setCurrentRoute, integratedCategory, symbol]);

  // 호가 정보 가져오기
  const fetchOrderbook = useCallback(async () => {
    const result = await fetchBithumbOrderbook(symbol);
    
    if (result.error) {
      setError(result.error);
      return;
    }
    
    if (result.data) {
      const transformedData = transformBithumbOrderbook(result.data, result.marketSymbol);
      setOrderbookData(transformedData);
      setLastUpdate(new Date());
    }
  }, [symbol]);

  // 티커 정보 가져오기
  const fetchTickerInfo = useCallback(async () => {
    const result = await fetchBithumbTicker(symbol);
    
    if (result.error) {
      setError(result.error);
      return;
    }
    
    if (result.data) {
      const newTickerData = toBithumbTickerData(result.data, symbol, integratedCategory);
      setTickerData(newTickerData);
      priceTracker.current.trackPrice(symbol, newTickerData.price);
    }
  }, [integratedCategory, symbol]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // API에서 최신 데이터 가져오기 (병렬 처리)
        await Promise.all([
          fetchTickerInfo(),
          fetchOrderbook()
        ]);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setError('데이터를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol && integratedCategory) {
      loadInitialData();
    }
  }, [symbol, integratedCategory, fetchTickerInfo, fetchOrderbook]);

  // 0.8초마다 데이터 갱신
  useEffect(() => {
    if (!symbol || !integratedCategory) return;

    const interval = setInterval(async () => {
      try {
        await Promise.all([
          fetchTickerInfo(),
          fetchOrderbook()
        ]);
      } catch (error) {
        console.error('데이터 갱신 실패:', error);
        // 실시간 갱신 에러는 조용히 처리
      }
    }, DATA_UPDATE_INTERVALS.ticker.bithumbDetail);

    return () => clearInterval(interval);
  }, [symbol, integratedCategory, fetchTickerInfo, fetchOrderbook]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">오류 발생</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 티커 데이터 없음 상태
  if (!tickerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">티커를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-6">요청한 티커 정보가 존재하지 않습니다.</p>
          <button
            onClick={() => router.push('/exchange/ticker/bithumb')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium"
          >
            빗썸 티커 목록으로
          </button>
        </div>
      </div>
    );
  }

  // 공통 포맷터 사용
  const maxDecimals = priceTracker.current.getMaxDecimals(tickerData.rawSymbol);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <BithumbTickerHeader
          tickerData={tickerData}
          tickerColorMode={tickerColorMode}
          lastUpdate={lastUpdate}
          maxDecimals={maxDecimals}
          onBackClick={() => router.push('/exchange/ticker/bithumb')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 호가 정보 */}
          {orderbookData && (
            <BithumbOrderbook
              orderbookData={orderbookData}
              tickerData={tickerData}
              tickerColorMode={tickerColorMode}
              maxDecimals={maxDecimals}
            />
          )}

          {/* 상세 정보 */}
          <BithumbTickerDetails
            tickerData={tickerData}
            maxDecimals={maxDecimals}
            lastUpdate={lastUpdate}
            showRawKey={showRawKey}
            onToggleRawKey={setShowRawKey}
          />
        </div>

        {/* 액션 버튼 */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => router.push('/exchange/ticker/bithumb')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium"
          >
            빗썸 티커 목록으로
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-muted hover:bg-muted/80 text-muted-foreground px-6 py-3 rounded-lg font-medium border border-border"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
} 