'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNavigationActions } from '@/packages/shared/stores/createNavigationStore';
import { TickerData } from '@/packages/shared/types/exchange';
import { formatPrice, formatPriceChange, PriceDecimalTracker } from '@/packages/shared/utils';
import { useTickerSettingStore } from '@/packages/shared/stores/createTickerSettingStore';
import { getTickerColor } from '@/packages/ui-kit/tokens/design-tokens';
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

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getPriceChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
    if (change < 0) return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
    return 'bg-muted text-muted-foreground';
  };

  const isKRW = tickerData.quoteCode === 'KRW';

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
                <div className={`text-2xl font-semibold ${getPriceChangeBgColor(tickerData.priceChangePercent24h)}`}>
                  {formattedPriceChange}
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
                <div className={`inline-block px-3 py-1 rounded-lg text-xl font-semibold ${getPriceChangeBgColor(tickerData.priceChangePercent24h)}`}>
                  {tickerData.priceChangePercent24h >= 0 ? '+' : ''}{tickerData.priceChangePercent24h.toFixed(2)}%
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
                        return filteredOrders.map((order, i) => (
                          <div key={order.price} className={allSmallVolume
                            ? "grid grid-cols-[0.7fr_auto_0.7fr] gap-2 text-sm py-1 hover:bg-muted/50"
                            : "grid grid-cols-3 gap-2 text-sm py-1 hover:bg-muted/50"
                          }>
                            <div
                              className="text-right"
                              style={{ color: `hsl(${getTickerColor(tickerColorMode, 'down')})` }}
                            >
                              {order.ask > 0
                                ? hasLargeVolume
                                  ? Math.round(order.ask).toLocaleString()
                                  : (order.ask >= 1000 ? formatPrice(order.ask, 4, true) : order.ask.toFixed(4))
                                : '-'}
                            </div>
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
                            <div
                              className="text-right"
                              style={{ color: `hsl(${getTickerColor(tickerColorMode, 'up')})` }}
                            >
                              {order.bid > 0
                                ? hasLargeVolume
                                  ? Math.round(order.bid).toLocaleString()
                                  : (order.bid >= 1000 ? formatPrice(order.bid, 4, true) : order.bid.toFixed(4))
                                : '-'}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className={gridClass.replace('border-b', 'border-t')}>
                      <div className="text-left">{formatNumber(orderbookData.total_ask_size)}</div>
                      <div className="text-center">총 잔량</div>
                      <div className="text-right">{formatNumber(orderbookData.total_bid_size)}</div>
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
                  { key: 'highPrice24h', label: '24시간 최고가', value: tickerData.highPrice24h ? formatPrice(tickerData.highPrice24h, maxDecimals, isKRW) + ' ' + tickerData.quoteCode : '-' },
                  { key: 'lowPrice24h', label: '24시간 최저가', value: tickerData.lowPrice24h ? formatPrice(tickerData.lowPrice24h, maxDecimals, isKRW) + ' ' + tickerData.quoteCode : '-' },
                  { key: 'prevPrice24h', label: '24시간 전 가격', value: formatPrice(tickerData.prevPrice24h, maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'volume24h', label: '24시간 거래량', value: formatNumber(tickerData.volume24h) + ' ' + tickerData.baseCode },
                  { key: 'turnover24h', label: '24시간 거래대금', value: formatNumber(tickerData.turnover24h) + ' ' + tickerData.quoteCode },
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
                  { key: 'openingPrice', label: '시가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.openingPrice ?? 0), maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'prevClosingPrice', label: '전일 종가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.prevClosingPrice ?? 0), maxDecimals, isKRW) + ' ' + tickerData.quoteCode },
                  { key: 'tradeDate', label: '체결 일자', value: tickerData.exchangeSpecific.bithumb.tradeDate ?? '-' },
                  { key: 'tradeTime', label: '체결 시각', value: tickerData.exchangeSpecific.bithumb.tradeTime ?? '-' },
                  { key: 'highest52WeekPrice', label: '52주 최고가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.highest52WeekPrice ?? 0), maxDecimals, isKRW) + ' (' + (tickerData.exchangeSpecific.bithumb.highest52WeekDate ?? '-') + ')' },
                  { key: 'lowest52WeekPrice', label: '52주 최저가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.lowest52WeekPrice ?? 0), maxDecimals, isKRW) + ' (' + (tickerData.exchangeSpecific.bithumb.lowest52WeekDate ?? '-') + ')' },
                  { key: 'accTradePrice', label: '누적 거래대금', value: formatNumber(Number(tickerData.exchangeSpecific.bithumb.accTradePrice ?? 0)) + ' ' + tickerData.quoteCode },
                  { key: 'accTradeVolume', label: '누적 거래량', value: formatNumber(Number(tickerData.exchangeSpecific.bithumb.accTradeVolume ?? 0)) + ' ' + tickerData.baseCode },
                  { key: 'changePrice', label: '변동(절대)', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.changePrice ?? 0), maxDecimals, isKRW) },
                  { key: 'changeRate', label: '변동(%)', value: tickerData.exchangeSpecific.bithumb.changeRate !== undefined ? (Number(tickerData.exchangeSpecific.bithumb.changeRate) >= 0 ? '+' : '') + (Number(tickerData.exchangeSpecific.bithumb.changeRate) * 100).toFixed(2) + '%' : '-' },
                  { key: 'change', label: '변동(부호)', value: tickerData.exchangeSpecific.bithumb.change ?? '-' },
                  { key: 'signedChangePrice', label: 'signedChangePrice', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.signedChangePrice ?? 0), maxDecimals, isKRW) },
                  { key: 'signedChangeRate', label: 'signedChangeRate', value: tickerData.exchangeSpecific.bithumb.signedChangeRate !== undefined ? (Number(tickerData.exchangeSpecific.bithumb.signedChangeRate) >= 0 ? '+' : '') + (Number(tickerData.exchangeSpecific.bithumb.signedChangeRate) * 100).toFixed(2) + '%' : '-' },
                  { key: 'tradeTimestamp', label: '데이터 타임스탬프', value: tickerData.exchangeSpecific.bithumb.tradeTimestamp ?? '-' },
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