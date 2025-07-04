import React from 'react';
import { TickerData } from '../types/exchange';
import { formatPrice, formatNumber } from '../utils/priceFormatter';
import { Toggle } from '../../ui-kit/web/components/Toggle';

interface BithumbTickerDetailsProps {
  tickerData: TickerData;
  maxDecimals: number;
  lastUpdate: Date | null;
  showRawKey: boolean;
  onToggleRawKey: (value: boolean) => void;
}

export const BithumbTickerDetails: React.FC<BithumbTickerDetailsProps> = ({
  tickerData,
  maxDecimals,
  lastUpdate,
  showRawKey,
  onToggleRawKey,
}) => {
  // 공통 필드 매핑
  const commonFields = [
    { key: 'price', label: '현재가', value: formatPrice(tickerData.price, maxDecimals, true) + ' ' + tickerData.quoteCode },
    { key: 'prevPrice24h', label: '24시간 전 가격', value: formatPrice(tickerData.prevPrice24h, maxDecimals, true) + ' ' + tickerData.quoteCode },
    { key: 'prevPriceUtc9', label: '전일 종가(KST 0시)', value: tickerData.prevPriceUtc9 ? formatPrice(tickerData.prevPriceUtc9, maxDecimals, true) + ' ' + tickerData.quoteCode : '-' },
    { key: 'openingPriceUtc9', label: '시가(KST 0시)', value: tickerData.openingPriceUtc9 ? formatPrice(tickerData.openingPriceUtc9, maxDecimals, true) + ' ' + tickerData.quoteCode : '-' },
    { key: 'priceChange24h', label: '24시간 가격 변동', value: (tickerData.priceChange24h >= 0 ? '+' : '') + formatPrice(Math.abs(tickerData.priceChange24h), maxDecimals, true) + ' ' + tickerData.quoteCode },
    { key: 'priceChangePercent24h', label: '24시간 가격 변동률', value: (tickerData.priceChangePercent24h >= 0 ? '+' : '') + tickerData.priceChangePercent24h.toFixed(2) + '%' },
    { key: 'priceChangeUtc9', label: '전일 대비 변동(KST)', value: tickerData.priceChangeUtc9 !== undefined ? (tickerData.priceChangeUtc9 >= 0 ? '+' : '') + formatPrice(Math.abs(tickerData.priceChangeUtc9), maxDecimals, true) + ' ' + tickerData.quoteCode : '-' },
    { key: 'priceChangePercentUtc9', label: '전일 대비 변동률(KST)', value: tickerData.priceChangePercentUtc9 !== undefined ? (tickerData.priceChangePercentUtc9 >= 0 ? '+' : '') + tickerData.priceChangePercentUtc9.toFixed(2) + '%' : '-' },
    { key: 'highPrice24h', label: '24시간 최고가', value: tickerData.highPrice24h ? formatPrice(tickerData.highPrice24h, maxDecimals, true) + ' ' + tickerData.quoteCode : '-' },
    { key: 'lowPrice24h', label: '24시간 최저가', value: tickerData.lowPrice24h ? formatPrice(tickerData.lowPrice24h, maxDecimals, true) + ' ' + tickerData.quoteCode : '-' },
    { key: 'volume24h', label: '24시간 거래량', value: formatNumber(tickerData.volume24h) + ' ' + tickerData.baseCode },
    { key: 'turnover24h', label: '24시간 거래대금', value: formatNumber(tickerData.turnover24h) + ' ' + tickerData.quoteCode },
    { key: 'volumeUtc9', label: '누적 거래량(KST 0시)', value: tickerData.volumeUtc9 !== undefined ? formatNumber(tickerData.volumeUtc9) + ' ' + tickerData.baseCode : '-' },
    { key: 'turnoverUtc9', label: '누적 거래대금(KST 0시)', value: tickerData.turnoverUtc9 !== undefined ? formatNumber(tickerData.turnoverUtc9) + ' ' + tickerData.quoteCode : '-' },
  ];

  // 빗썸 전용 필드 매핑
  const bithumbFields = tickerData.exchangeSpecific?.bithumb ? [
    { key: 'marketType', label: '시장 분류', value: tickerData.exchangeSpecific.bithumb.marketType ?? '-' },
    { key: 'tradeDate', label: '체결 일자(UTC)', value: tickerData.exchangeSpecific.bithumb.tradeDate ?? '-' },
    { key: 'tradeTime', label: '체결 시각(UTC)', value: tickerData.exchangeSpecific.bithumb.tradeTime ?? '-' },
    { key: 'tradeTimestamp', label: '체결 타임스탬프', value: tickerData.exchangeSpecific.bithumb.tradeTimestamp ? new Date(tickerData.exchangeSpecific.bithumb.tradeTimestamp).toLocaleString() : '-' },
    { key: 'highest52WeekPrice', label: '52주 최고가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.highest52WeekPrice ?? 0), maxDecimals, true) + ' (' + (tickerData.exchangeSpecific.bithumb.highest52WeekDate ?? '-') + ')' },
    { key: 'lowest52WeekPrice', label: '52주 최저가', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.lowest52WeekPrice ?? 0), maxDecimals, true) + ' (' + (tickerData.exchangeSpecific.bithumb.lowest52WeekDate ?? '-') + ')' },
    { key: 'accTradePrice24h', label: '24시간 누적 거래대금', value: formatNumber(Number(tickerData.exchangeSpecific.bithumb.accTradePrice24h ?? 0)) + ' ' + tickerData.quoteCode },
    { key: 'accTradeVolume24h', label: '24시간 누적 거래량', value: formatNumber(Number(tickerData.exchangeSpecific.bithumb.accTradeVolume24h ?? 0)) + ' ' + tickerData.baseCode },
    { key: 'change', label: '변동 방향', value: tickerData.exchangeSpecific.bithumb.change ?? '-' },
    { key: 'changePrice', label: '변동액(절대)', value: formatPrice(Number(tickerData.exchangeSpecific.bithumb.changePrice ?? 0), maxDecimals, true) + ' ' + tickerData.quoteCode },
    { key: 'changeRate', label: '변동률(절대)', value: tickerData.exchangeSpecific.bithumb.changeRate !== undefined ? (Number(tickerData.exchangeSpecific.bithumb.changeRate) * 100).toFixed(2) + '%' : '-' },
    { key: 'signedChangePrice', label: '부호 포함 변동액', value: (() => {
      const signedValue = Number(tickerData.exchangeSpecific.bithumb.signedChangePrice ?? 0);
      const sign = signedValue >= 0 ? '+' : '-';
      return sign + formatPrice(Math.abs(signedValue), maxDecimals, true) + ' ' + tickerData.quoteCode;
    })() },
    { key: 'signedChangeRate', label: '부호 포함 변동률', value: tickerData.exchangeSpecific.bithumb.signedChangeRate !== undefined ? (Number(tickerData.exchangeSpecific.bithumb.signedChangeRate) >= 0 ? '+' : '') + (Number(tickerData.exchangeSpecific.bithumb.signedChangeRate) * 100).toFixed(2) + '%' : '-' },
    { key: 'date', label: 'API 응답 시각', value: tickerData.exchangeSpecific.bithumb.date ?? '-' },
  ] : [];

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">상세 정보</h2>
        <Toggle
          defaultActive={showRawKey}
          active={showRawKey}
          onChange={onToggleRawKey}
          label="변수명 보기"
          size="sm"
        />
      </div>
      
      <div className="space-y-4">
        {/* 공통 필드 */}
        {commonFields.map(field => (
          <div key={field.key} className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">{showRawKey ? field.key : field.label}</span>
            <span className="font-medium">{field.value}</span>
          </div>
        ))}

        {/* 빗썸 전용 필드 */}
        {bithumbFields.map(field => (
          <div key={field.key} className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">{showRawKey ? field.key : field.label}</span>
            <span className="font-medium">{field.value}</span>
          </div>
        ))}

        {/* 추가 필드 */}
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-muted-foreground">{showRawKey ? 'tradeStrength' : '체결강도'}</span>
          <span className="font-medium">-</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-muted-foreground">{showRawKey ? 'lastUpdate' : '업데이트 시각'}</span>
          <span className="font-medium">{lastUpdate?.toLocaleString('ko-KR') || '-'}</span>
        </div>
      </div>
    </div>
  );
}; 