import { BithumbApiOrderbookData, OrderbookData, OrderbookUnit } from '../types/bithumb';

/**
 * 빗썸 API 응답을 UI에서 사용하는 데이터 형식으로 변환
 */
export const transformBithumbOrderbook = (
  apiData: BithumbApiOrderbookData, 
  marketSymbol: string
): OrderbookData => {
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