'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { TickerData } from '@/packages/shared/types/exchange';
import { formatPrice, formatPriceChange, PriceDecimalTracker } from '@/packages/shared/utils';
import { useTickerSettingStore } from '@/packages/shared/stores/createTickerSettingStore';
import { getTickerColor, getTickerBackgroundColor } from '@/packages/ui-kit/tokens/design-tokens';
import { getTickerOrderbookBackgroundStyle } from '@/packages/shared/stores/createTickerSettingStore';
import { get, ApiError } from '@/packages/shared/utils/apiClient';
import { API_ENDPOINTS, DATA_UPDATE_INTERVALS } from '@/packages/shared/constants/exchangeConfig';
import { toBithumbTickerData } from '@/packages/shared/utils/tickerDataBuilder';
import { Toggle } from '@/packages/ui-kit/web/components/Toggle';

interface OrderbookUnit {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
}

interface OrderbookData {
  market: string;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
  orderbook_units: OrderbookUnit[];
}

interface BithumbTickerApiData {
  opening_price: string;
  closing_price: string;
  min_price: string;
  max_price: string;
  units_traded: string;
  acc_trade_value: string;
  prev_closing_price: string;
  units_traded_24H: string;
  acc_trade_value_24H: string;
  fluctate_24H: string;
  fluctate_rate_24H: string;
  date: string;
}

interface BithumbTickerResponse {
  status: string;
  data: BithumbTickerApiData;
}

// Bithumb Public API 응답 타입
interface BithumbOrderbookEntry {
  price: string;
  quantity: string;
}

interface BithumbApiOrderbookData {
  timestamp: string;
  payment_currency: string;
  order_currency: string;
  bids: BithumbOrderbookEntry[];
  asks: BithumbOrderbookEntry[];
}

interface BithumbOrderbookResponse {
  status: string;
  data: BithumbApiOrderbookData;
}

// API 응답을 UI에서 사용하는 데이터 형식으로 변환
const transformBithumbOrderbook = (apiData: BithumbApiOrderbookData, marketSymbol: string): OrderbookData => {
  const bids = apiData.bids.slice(0, 30); // UI 성능을 위해 30개로 제한
  const asks = apiData.asks.slice(0, 30).reverse(); // 일반적인 호가창 표시를 위해 asks 배열을 뒤집음

  const orderbook_units: OrderbookUnit[] = [];
  const total_ask_size = asks.reduce((acc, curr) => acc + parseFloat(curr.quantity), 0);
  const total_bid_size = bids.reduce((acc, curr) => acc + parseFloat(curr.quantity), 0);

  const maxLength = Math.max(bids.length, asks.length);

  for (let i = 0; i < maxLength; i++) {
    const bid = bids[i];
    const ask = asks[i];
    orderbook_units.push({
      bid_price: bid ? parseFloat(bid.price) : 0,
      bid_size: bid ? parseFloat(bid.quantity) : 0,
      ask_price: ask ? parseFloat(ask.price) : 0,
      ask_size: ask ? parseFloat(ask.quantity) : 0,
    });
  }

  return {
    market: marketSymbol,
    timestamp: parseInt(apiData.timestamp, 10),
    total_ask_size,
    total_bid_size,
    orderbook_units,
  };
};

// 상세 정보 토글 상태 (localStorage 연동)
function usePersistentToggle(key: string, defaultValue = false) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = window.localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  });
  useEffect(() => {
    window.localStorage.setItem(key, value ? 'true' : 'false');
  }, [key, value]);
  return [value, setValue] as const;
}

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

  // 매도/매수 잔량 배경색을 페이지 진입 시 useMemo로 미리 계산 (스타일 객체)
  const askBackgroundStyle = useMemo(() => getTickerOrderbookBackgroundStyle(tickerColorMode, true, true), [tickerColorMode]);
  const bidBackgroundStyle = useMemo(() => getTickerOrderbookBackgroundStyle(tickerColorMode, false, true), [tickerColorMode]);

  useEffect(() => {
    setCurrentRoute(`/exchange/ticker/bithumb/${integratedCategory}/${symbol}`);
  }, [setCurrentRoute, integratedCategory, symbol]);

  // 호가 정보 가져오기
  const fetchOrderbook = useCallback(async () => {
    try {
      const baseCode = symbol.replace(/KRW$|BTC$/, '');
      const quoteCode = symbol.includes('KRW') ? 'KRW' : 'BTC';
      const response = await get<BithumbOrderbookResponse>(API_ENDPOINTS.bithumb.orderbook(baseCode, quoteCode));

      if (response.data.status === '0000' && response.data.data) {
        const marketSymbol = `${baseCode}/${quoteCode}`;
        const transformedData = transformBithumbOrderbook(response.data.data, marketSymbol);
        setOrderbookData(transformedData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('호가 정보 가져오기 실패:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('호가 정보를 가져올 수 없습니다');
      }
    }
  }, [symbol]);

  // 티커 정보 가져오기
  const fetchTickerInfo = useCallback(async () => {
    try {
      const baseCode = symbol.replace(/KRW$|BTC$/, '');
      const quoteCode = symbol.includes('KRW') ? 'KRW' : 'BTC';
      const response = await get<any>(API_ENDPOINTS.bithumb.ticker(baseCode, quoteCode));
      if (response.data.status === '0000' && response.data.data) {
        const d = response.data.data;
        const newTickerData = toBithumbTickerData(d, symbol, integratedCategory);
        setTickerData(newTickerData);
        priceTracker.current.trackPrice(symbol, newTickerData.price);
      }
    } catch (error) {
      console.error('티커 정보 가져오기 실패:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('티커 정보를 가져올 수 없습니다');
      }
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
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('데이터를 불러올 수 없습니다');
        }
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

  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  // 공통 포맷터 사용
  const maxDecimals = priceTracker.current.getMaxDecimals(tickerData.rawSymbol);
  const formattedPrice = formatPrice(tickerData.price, maxDecimals, tickerData.quoteCode === 'KRW');
  const formattedPriceChange = formatPriceChange(tickerData.priceChange24h, maxDecimals, tickerData.quoteCode === 'KRW');

  // 24시간 변동/변동률 색상 스타일 생성 함수
  const getPriceChangeStyle = (change: number) => {
    let type: 'up' | 'down' | 'unchanged' = 'unchanged';
    if (change > 0) type = 'up';
    else if (change < 0) type = 'down';
    // 배경색: 투명도 있는 hsl, 글자색: getTickerColor
    const color = `hsl(${getTickerColor(tickerColorMode, type)})`;
    const bg = type === 'up'
      ? `hsla(${getTickerColor(tickerColorMode, 'up')}, 0.12)`
      : type === 'down'
        ? `hsla(${getTickerColor(tickerColorMode, 'down')}, 0.12)`
        : 'var(--muted)';
    return {
      background: bg,
      color,
      borderRadius: '0.5rem',
      padding: '0.25rem 0.75rem',
      display: 'inline-block',
      fontWeight: 600,
    };
  };

  const isKRW = tickerData.quoteCode === 'KRW';

  // 총잔량 비율 계산
  const totalSum = orderbookData ? orderbookData.total_ask_size + orderbookData.total_bid_size : 0;
  const askPercent = totalSum === 0 ? 50 : (orderbookData?.total_ask_size ?? 0) / totalSum * 100;
  const bidPercent = totalSum === 0 ? 50 : (orderbookData?.total_bid_size ?? 0) / totalSum * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/exchange/ticker/bithumb')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              빗썸 티커 목록으로
            </button>
            <div className="text-sm text-muted-foreground">
              마지막 업데이트: {lastUpdate?.toLocaleTimeString('ko-KR') || '-'}
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {tickerData.integratedSymbol || `${symbol} (${integratedCategory})`}
                </h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                    BITHUMB
                  </span>
                  <span className="bg-muted text-muted-foreground px-2 py-1 rounded">
                    {tickerData.integratedCategory.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* 현재 가격/변동 정보 - 위치 교체 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">24시간 변동</div>
                <div className="text-2xl font-semibold">
                  <span style={getPriceChangeStyle(tickerData.priceChange24h)}>
                    {formattedPriceChange}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">현재가</div>
                <div
                  className="text-3xl font-bold"
                  style={{
                    color: `hsl(${getTickerColor(tickerColorMode, tickerData.priceChange24h > 0 ? 'up' : tickerData.priceChange24h < 0 ? 'down' : 'unchanged')})`,
                  }}
                >
                  {formattedPrice} {tickerData.quoteCode}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">24시간 변동률</div>
                <div className="text-xl font-semibold">
                  <span style={getPriceChangeStyle(tickerData.priceChangePercent24h)}>
                    {tickerData.priceChangePercent24h >= 0 ? '+' : ''}{tickerData.priceChangePercent24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 호가 정보 - 주문가격 기준 한 줄 정렬, 전체 depth 표시 */}
          {orderbookData && (
            // 잔량이 모두 1000 미만인지 체크
            (() => {
              const allSmallVolume = orderbookData.orderbook_units.every(
                unit => unit.ask_size < 1000 && unit.bid_size < 1000
              );
              const gridClass = allSmallVolume
                ? "grid grid-cols-[0.7fr_auto_0.7fr] gap-2 text-xs font-medium text-muted-foreground py-2 border-b"
                : "grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground py-2 border-b";
              return (
                <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">호가 정보</h2>
                  <div className="space-y-1">
                    <div className={gridClass}>
                      <div className="text-left">매도잔량</div>
                      <div className="text-center">주문가격</div>
                      <div className="text-right">매수잔량</div>
                    </div>
                    <div>
                      {/* ask/bid price를 모두 합쳐 가격순 내림차순 정렬 */}
                      {(() => {
                        // 모든 ask/bid를 price 기준으로 합침
                        const mergedOrders: { price: number, ask: number, bid: number }[] = [];
                        orderbookData.orderbook_units.forEach(unit => {
                          if (unit.ask_price > 0) {
                            const idx = mergedOrders.findIndex(o => o.price === unit.ask_price);
                            if (idx >= 0) mergedOrders[idx].ask += unit.ask_size;
                            else mergedOrders.push({ price: unit.ask_price, ask: unit.ask_size, bid: 0 });
                          }
                          if (unit.bid_price > 0) {
                            const idx = mergedOrders.findIndex(o => o.price === unit.bid_price);
                            if (idx >= 0) mergedOrders[idx].bid += unit.bid_size;
                            else mergedOrders.push({ price: unit.bid_price, ask: 0, bid: unit.bid_size });
                          }
                        });
                        mergedOrders.sort((a, b) => b.price - a.price);
                        // 1억 이상 잔량이 있는지 체크
                        const hasLargeVolume = mergedOrders.some(o => o.ask >= 100_000_000 || o.bid >= 100_000_000);
                        const filteredOrders = mergedOrders
                          // 잔량 정보가 모두 0인 경우 표기하지 않음
                          .filter(order => order.ask > 0 || order.bid > 0);
                        // 최대 잔량 계산 (0이면 1로 방어)
                        const maxAsk = Math.max(1, ...filteredOrders.map(o => o.ask));
                        const maxBid = Math.max(1, ...filteredOrders.map(o => o.bid));
                        return filteredOrders.map((order, i) => {
                          // 각 행의 배경색 결정: 매도만 있으면 매도색, 매수만 있으면 매수색, 둘 다 있으면 혼합
                          let rowBackground = undefined;
                          if (order.ask > 0 && order.bid > 0) {
                            // 매도/매수 모두 있으면 그라데이션(좌:매도, 우:매수)
                            rowBackground = `linear-gradient(90deg, ${getTickerOrderbookBackgroundStyle(tickerColorMode, true, true).backgroundColor} 0%, ${getTickerOrderbookBackgroundStyle(tickerColorMode, true, true).backgroundColor} 50%, ${getTickerOrderbookBackgroundStyle(tickerColorMode, false, true).backgroundColor} 50%, ${getTickerOrderbookBackgroundStyle(tickerColorMode, false, true).backgroundColor} 100%)`;
                          } else if (order.ask > 0) {
                            rowBackground = getTickerOrderbookBackgroundStyle(tickerColorMode, true, true).backgroundColor;
                          } else if (order.bid > 0) {
                            rowBackground = getTickerOrderbookBackgroundStyle(tickerColorMode, false, true).backgroundColor;
                          }
                          return (
                            <div
                              key={order.price}
                              className={allSmallVolume
                                ? "grid grid-cols-[0.7fr_auto_0.7fr] gap-2 text-sm py-1 hover:bg-muted/50"
                                : "grid grid-cols-3 gap-2 text-sm py-1 hover:bg-muted/50"
                              }
                              style={rowBackground ? { background: rowBackground } : {}}
                            >
                              {/* 매도 잔량 */}
                              <div className="relative text-right" style={{ minHeight: 24 }}>
                                {order.ask > 0 && (
                                  <div
                                    className="absolute top-0 right-0 h-full rounded"
                                    style={{
                                      width: `${(order.ask / maxAsk) * 100}%`,
                                      ...askBackgroundStyle,
                                      zIndex: 0,
                                    }}
                                  />
                                )}
                                <span className="relative z-10 text-foreground">
                                  {order.ask > 0
                                    ? hasLargeVolume
                                      ? Math.round(order.ask).toLocaleString()
                                      : (order.ask >= 1000 ? formatPrice(order.ask, 4, true) : order.ask.toFixed(4))
                                    : ''}
                                </span>
                              </div>
                              {/* 주문가격 */}
                              <div
                                className="flex justify-center items-center font-medium gap-2"
                                style={{ color: `hsl(${getTickerColor(tickerColorMode, order.price > tickerData.prevPrice24h ? 'up' : order.price < tickerData.prevPrice24h ? 'down' : 'unchanged')})` }}
                              >
                                <span>{formatPrice(order.price, maxDecimals, isKRW)}</span>
                                <span className="text-xs ml-1 opacity-80">
                                  {tickerData.prevPrice24h > 0
                                    ? `${((order.price - tickerData.prevPrice24h) / tickerData.prevPrice24h * 100 >= 0 ? '+' : '') + (((order.price - tickerData.prevPrice24h) / tickerData.prevPrice24h) * 100).toFixed(2)}%`
                                    : '-'}
                                </span>
                              </div>
                              {/* 매수 잔량 */}
                              <div className="relative text-right" style={{ minHeight: 24 }}>
                                {order.bid > 0 && (
                                  <div
                                    className="absolute top-0 left-0 h-full rounded"
                                    style={{
                                      width: `${(order.bid / maxBid) * 100}%`,
                                      ...bidBackgroundStyle,
                                      zIndex: 0,
                                    }}
                                  />
                                )}
                                <span className="relative z-10 text-foreground">
                                  {order.bid > 0
                                    ? hasLargeVolume
                                      ? Math.round(order.bid).toLocaleString()
                                      : (order.bid >= 1000 ? formatPrice(order.bid, 4, true) : order.bid.toFixed(4))
                                    : ''}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div
                      className={gridClass.replace('border-b', 'border-t')}
                      style={{ position: 'relative', overflow: 'hidden' }}
                    >
                      {/* 비율 배경 바 */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          zIndex: 0,
                          pointerEvents: 'none',
                        }}
                      >
                        {/* 매도 비율 */}
                        <div
                          style={{
                            width: `${orderbookData.total_ask_size + orderbookData.total_bid_size === 0 ? 50 : (orderbookData.total_ask_size / (orderbookData.total_ask_size + orderbookData.total_bid_size)) * 100}%`,
                            background: getTickerOrderbookBackgroundStyle(tickerColorMode, true, true).backgroundColor,
                            height: '100%',
                            transition: 'width 0.4s',
                          }}
                        />
                        {/* 매수 비율 */}
                        <div
                          style={{
                            width: `${orderbookData.total_ask_size + orderbookData.total_bid_size === 0 ? 50 : (orderbookData.total_bid_size / (orderbookData.total_ask_size + orderbookData.total_bid_size)) * 100}%`,
                            background: getTickerOrderbookBackgroundStyle(tickerColorMode, false, true).backgroundColor,
                            height: '100%',
                            transition: 'width 0.4s',
                          }}
                        />
                      </div>
                      {/* 텍스트 레이어 */}
                      <div className="relative z-10 text-left">
                        <span>{formatNumber(orderbookData?.total_ask_size ?? 0)} <span className="text-xs text-muted-foreground">({askPercent.toFixed(1)}%)</span></span>
                      </div>
                      <div className="relative z-10 text-center">총 잔량</div>
                      <div className="relative z-10 text-right">
                        <span>{formatNumber(orderbookData?.total_bid_size ?? 0)} <span className="text-xs text-muted-foreground">({bidPercent.toFixed(1)}%)</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* 상세 정보 - 더 다양한 정보 표기 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">상세 정보</h2>
              <Toggle
                defaultActive={showRawKey}
                active={showRawKey}
                onChange={setShowRawKey}
                label="변수명 보기"
                size="sm"
              />
            </div>
            <div className="space-y-4">
              {/* 공통 필드 매핑 */}
              {(() => {
                const commonFields = [
                  { key: 'price', label: '현재가', value: formatPrice(tickerData.price, maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'prevPrice24h', label: '24시간 전 가격', value: formatPrice(tickerData.prevPrice24h, maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'prevPriceUtc9', label: '전일 종가(KST 0시)', value: tickerData.prevPriceUtc9 ? formatPrice(tickerData.prevPriceUtc9, maxDecimals, isKRW) + ' ' + tickerData.quoteCode : '-' },
                  { key: 'openingPriceUtc9', label: '시가(KST 0시)', value: tickerData.openingPriceUtc9 ? formatPrice(tickerData.openingPriceUtc9, maxDecimals, isKRW) + ' ' + tickerData.quoteCode : '-' },
                  { key: 'priceChange24h', label: '24시간 가격 변동', value: (tickerData.priceChange24h >= 0 ? '+' : '') + formatPrice(Math.abs(tickerData.priceChange24h), maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'priceChangePercent24h', label: '24시간 가격 변동률', value: (tickerData.priceChangePercent24h >= 0 ? '+' : '') + tickerData.priceChangePercent24h.toFixed(2) + '%' },
                  { key: 'priceChangeUtc9', label: '전일 대비 변동(KST)', value: tickerData.priceChangeUtc9 !== undefined ? (tickerData.priceChangeUtc9 >= 0 ? '+' : '') + formatPrice(Math.abs(tickerData.priceChangeUtc9), maxDecimals, isKRW) + ' ' + tickerData.quoteCode : '-' },
                  { key: 'priceChangePercentUtc9', label: '전일 대비 변동률(KST)', value: tickerData.priceChangePercentUtc9 !== undefined ? (tickerData.priceChangePercentUtc9 >= 0 ? '+' : '') + tickerData.priceChangePercentUtc9.toFixed(2) + '%' : '-' },
                  { key: 'highPrice24h', label: '24시간 최고가', value: tickerData.highPrice24h ? formatPrice(tickerData.highPrice24h, maxDecimals, isKRW) + ' ' + tickerData.quoteCode : '-' },
                  { key: 'lowPrice24h', label: '24시간 최저가', value: tickerData.lowPrice24h ? formatPrice(tickerData.lowPrice24h, maxDecimals, isKRW) + ' ' + tickerData.quoteCode : '-' },
                  { key: 'volume24h', label: '24시간 거래량', value: formatNumber(tickerData.volume24h) + ' ' + tickerData.baseCode },
                  { key: 'turnover24h', label: '24시간 거래대금', value: formatNumber(tickerData.turnover24h) + ' ' + tickerData.quoteCode },
                  { key: 'volumeUtc9', label: '누적 거래량(KST 0시)', value: tickerData.volumeUtc9 !== undefined ? formatNumber(tickerData.volumeUtc9) + ' ' + tickerData.baseCode : '-' },
                  { key: 'turnoverUtc9', label: '누적 거래대금(KST 0시)', value: tickerData.turnoverUtc9 !== undefined ? formatNumber(tickerData.turnoverUtc9) + ' ' + tickerData.quoteCode : '-' },
                ];
                return commonFields.map(f => (
                  <div key={f.key} className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{showRawKey ? f.key : f.label}</span>
                    <span className="font-medium">{f.value}</span>
                  </div>
                ));
              })()}
              {/* 빗썸 전용 필드 매핑 */}
              {tickerData.exchangeSpecific?.bithumb && (() => {
                const bithumbFields = [
                  { key: 'marketType', label: '시장 분류', value: tickerData.exchangeSpecific.bithumb.marketType ?? '-' },
                  { key: 'tradeDate', label: '체결 일자(UTC)', value: tickerData.exchangeSpecific.bithumb.tradeDate ?? '-' },
                  { key: 'tradeTime', label: '체결 시각(UTC)', value: tickerData.exchangeSpecific.bithumb.tradeTime ?? '-' },
                  { key: 'tradeTimestamp', label: '체결 타임스탬프', value: tickerData.exchangeSpecific.bithumb.tradeTimestamp ? new Date(tickerData.exchangeSpecific.bithumb.tradeTimestamp).toLocaleString() : '-' },
                  { key: 'highest52WeekPrice', label: '52주 최고가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.highest52WeekPrice ?? 0), maxDecimals, isKRW) + ' (' + (tickerData.exchangeSpecific.bithumb.highest52WeekDate ?? '-') + ')' },
                  { key: 'lowest52WeekPrice', label: '52주 최저가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.lowest52WeekPrice ?? 0), maxDecimals, isKRW) + ' (' + (tickerData.exchangeSpecific.bithumb.lowest52WeekDate ?? '-') + ')' },
                  { key: 'accTradePrice24h', label: '24시간 누적 거래대금', value: formatNumber(Number(tickerData.exchangeSpecific.bithumb.accTradePrice24h ?? 0)) + ' ' + tickerData.quoteCode },
                  { key: 'accTradeVolume24h', label: '24시간 누적 거래량', value: formatNumber(Number(tickerData.exchangeSpecific.bithumb.accTradeVolume24h ?? 0)) + ' ' + tickerData.baseCode },
                  { key: 'change', label: '변동 방향', value: tickerData.exchangeSpecific.bithumb.change ?? '-' },
                  { key: 'changePrice', label: '변동액(절대)', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.changePrice ?? 0), maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'changeRate', label: '변동률(절대)', value: tickerData.exchangeSpecific.bithumb.changeRate !== undefined ? (Number(tickerData.exchangeSpecific.bithumb.changeRate) * 100).toFixed(2) + '%' : '-' },
                  { key: 'signedChangePrice', label: '부호 포함 변동액', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.signedChangePrice ?? 0), maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'signedChangeRate', label: '부호 포함 변동률', value: tickerData.exchangeSpecific.bithumb.signedChangeRate !== undefined ? (Number(tickerData.exchangeSpecific.bithumb.signedChangeRate) >= 0 ? '+' : '') + (Number(tickerData.exchangeSpecific.bithumb.signedChangeRate) * 100).toFixed(2) + '%' : '-' },
                  { key: 'date', label: 'API 응답 시각', value: tickerData.exchangeSpecific.bithumb.date ?? '-' },
                ];
                return bithumbFields.map(f => (
                  <div key={f.key} className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{showRawKey ? f.key : f.label}</span>
                    <span className="font-medium">{f.value}</span>
                  </div>
                ));
              })()}
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">{showRawKey ? 'tradeStrength' : '체결강도'}</span>
                <span className="font-medium">{'-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">{showRawKey ? 'lastUpdate' : '업데이트 시각'}</span>
                <span className="font-medium">{lastUpdate?.toLocaleString('ko-KR') || '-'}</span>
              </div>
            </div>
          </div>
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