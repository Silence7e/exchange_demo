'use client';

import { useMarketStore } from '@/stores/market-store';
import { formatPrice, formatQuantity } from '@exchange/shared';
import { getTradingPair } from '@exchange/shared';

export const OrderBookPanel = ({ symbol }: { symbol: string }) => {
  const book = useMarketStore((s) => s.orderBooks[symbol]);
  const pair = getTradingPair(symbol);

  if (!book) {
    return <div className="text-sm text-price-neutral">Loading order book...</div>;
  }

  const maxQty = Math.max(
    ...book.bids.map((b) => parseFloat(b.quantity)),
    ...book.asks.map((a) => parseFloat(a.quantity)),
    1,
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <h3 className="mb-2 text-sm font-medium">Order Book</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="mb-1 text-price-neutral">Bid</div>
          {book.bids.slice(0, 10).map((b, i) => (
            <div key={i} className="relative flex justify-between py-0.5">
              <div
                className="absolute inset-y-0 right-0 bg-bid"
                style={{ width: `${(parseFloat(b.quantity) / maxQty) * 100}%` }}
              />
              <span className="relative text-bid">{formatPrice(b.price, pair?.pricePrecision ?? 2)}</span>
              <span className="relative">{formatQuantity(b.quantity, pair?.quantityPrecision ?? 6)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-1 text-price-neutral">Ask</div>
          {book.asks.slice(0, 10).map((a, i) => (
            <div key={i} className="relative flex justify-between py-0.5">
              <div
                className="absolute inset-y-0 left-0 bg-ask"
                style={{ width: `${(parseFloat(a.quantity) / maxQty) * 100}%` }}
              />
              <span className="relative text-ask">{formatPrice(a.price, pair?.pricePrecision ?? 2)}</span>
              <span className="relative">{formatQuantity(a.quantity, pair?.quantityPrecision ?? 6)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
