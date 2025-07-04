import React from 'react';
import { TickerData } from '../types/exchange';
import { formatPrice, formatPriceChange } from '../utils/priceFormatter';
import { getTickerColor, TickerColorMode } from '../../ui-kit/tokens/design-tokens';

interface BithumbTickerHeaderProps {
  tickerData: TickerData;
  tickerColorMode: TickerColorMode;
  lastUpdate: Date | null;
  maxDecimals: number;
  onBackClick: () => void;
}

export const BithumbTickerHeader: React.FC<BithumbTickerHeaderProps> = ({
  tickerData,
  tickerColorMode,
  lastUpdate,
  maxDecimals,
  onBackClick,
}) => {
  const formattedPrice = formatPrice(tickerData.price, maxDecimals, tickerData.quoteCode === 'KRW');
  const formattedPriceChange = formatPriceChange(tickerData.priceChange24h, maxDecimals, tickerData.quoteCode === 'KRW');

  // 24시간 변동/변동률 색상 스타일 생성 함수
  const getPriceChangeStyle = (change: number) => {
    let type: 'up' | 'down' | 'unchanged' = 'unchanged';
    if (change > 0) type = 'up';
    else if (change < 0) type = 'down';
    
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

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackClick}
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
              {tickerData.integratedSymbol || `${tickerData.rawSymbol} (${tickerData.integratedCategory})`}
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
  );
}; 