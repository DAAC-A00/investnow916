import React, { useMemo } from 'react';
import { OrderbookData } from '../types/bithumb';
import { TickerData } from '../types/exchange';
import { formatPrice, formatNumber } from '../utils/priceFormatter';
import { getTickerColor, TickerColorMode } from '../../ui-kit/tokens/design-tokens';
import { getTickerOrderbookBackgroundStyle } from '../stores/createTickerSettingStore';

interface BithumbOrderbookProps {
  orderbookData: OrderbookData;
  tickerData: TickerData;
  tickerColorMode: TickerColorMode;
  maxDecimals: number;
}

export const BithumbOrderbook: React.FC<BithumbOrderbookProps> = ({
  orderbookData,
  tickerData,
  tickerColorMode,
  maxDecimals,
}) => {
  const isKRW = tickerData.quoteCode === 'KRW';

  // 매도/매수 잔량 배경색을 미리 계산
  const askBackgroundStyle = useMemo(() => 
    getTickerOrderbookBackgroundStyle(tickerColorMode, true, true), 
    [tickerColorMode]
  );
  const bidBackgroundStyle = useMemo(() => 
    getTickerOrderbookBackgroundStyle(tickerColorMode, false, true), 
    [tickerColorMode]
  );

  // 총잔량 비율 계산
  const totalSum = orderbookData.total_ask_size + orderbookData.total_bid_size;
  const askPercent = totalSum === 0 ? 50 : (orderbookData.total_ask_size / totalSum) * 100;
  const bidPercent = totalSum === 0 ? 50 : (orderbookData.total_bid_size / totalSum) * 100;

  // 잔량이 모두 1000 미만인지 체크
  const allSmallVolume = orderbookData.orderbook_units.every(
    unit => unit.ask_size < 1000 && unit.bid_size < 1000
  );

  const gridClass = allSmallVolume
    ? "grid grid-cols-[0.7fr_auto_0.7fr] gap-2 text-xs font-medium text-muted-foreground py-2 border-b"
    : "grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground py-2 border-b";

  // 모든 ask/bid를 price 기준으로 합침
  const mergedOrders = useMemo(() => {
    const merged: { price: number, ask: number, bid: number }[] = [];
    
    orderbookData.orderbook_units.forEach(unit => {
      if (unit.ask_price > 0) {
        const idx = merged.findIndex(o => o.price === unit.ask_price);
        if (idx >= 0) merged[idx].ask += unit.ask_size;
        else merged.push({ price: unit.ask_price, ask: unit.ask_size, bid: 0 });
      }
      if (unit.bid_price > 0) {
        const idx = merged.findIndex(o => o.price === unit.bid_price);
        if (idx >= 0) merged[idx].bid += unit.bid_size;
        else merged.push({ price: unit.bid_price, ask: 0, bid: unit.bid_size });
      }
    });
    
    return merged
      .sort((a, b) => b.price - a.price)
      .filter(order => order.ask > 0 || order.bid > 0);
  }, [orderbookData.orderbook_units]);

  // 1억 이상 잔량이 있는지 체크
  const hasLargeVolume = mergedOrders.some(o => o.ask >= 100_000_000 || o.bid >= 100_000_000);

  // 최대 잔량 계산
  const maxAsk = Math.max(1, ...mergedOrders.map(o => o.ask));
  const maxBid = Math.max(1, ...mergedOrders.map(o => o.bid));

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
          {mergedOrders.map((order, i) => {
            // 각 행의 배경색 결정
            let rowBackground = undefined;
            if (order.ask > 0 && order.bid > 0) {
              rowBackground = `linear-gradient(90deg, ${askBackgroundStyle.backgroundColor} 0%, ${askBackgroundStyle.backgroundColor} 50%, ${bidBackgroundStyle.backgroundColor} 50%, ${bidBackgroundStyle.backgroundColor} 100%)`;
            } else if (order.ask > 0) {
              rowBackground = askBackgroundStyle.backgroundColor;
            } else if (order.bid > 0) {
              rowBackground = bidBackgroundStyle.backgroundColor;
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
                  style={{ 
                    color: `hsl(${getTickerColor(tickerColorMode, order.price > tickerData.prevPrice24h ? 'up' : order.price < tickerData.prevPrice24h ? 'down' : 'unchanged')})` 
                  }}
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
          })}
        </div>

        {/* 총 잔량 */}
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
            <div
              style={{
                width: `${askPercent}%`,
                background: askBackgroundStyle.backgroundColor,
                height: '100%',
                transition: 'width 0.4s',
              }}
            />
            <div
              style={{
                width: `${bidPercent}%`,
                background: bidBackgroundStyle.backgroundColor,
                height: '100%',
                transition: 'width 0.4s',
              }}
            />
          </div>
          
          {/* 텍스트 레이어 */}
          <div className="relative z-10 text-left">
            <span>
              {formatNumber(orderbookData.total_ask_size)}{' '}
              <span className="text-xs text-muted-foreground">({askPercent.toFixed(1)}%)</span>
            </span>
          </div>
          <div className="relative z-10 text-center">총 잔량</div>
          <div className="relative z-10 text-right">
            <span>
              {formatNumber(orderbookData.total_bid_size)}{' '}
              <span className="text-xs text-muted-foreground">({bidPercent.toFixed(1)}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 