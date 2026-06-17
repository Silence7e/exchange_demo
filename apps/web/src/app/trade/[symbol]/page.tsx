'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { TRADING_PAIRS, formatPrice, formatPercent } from '@exchange/shared';
import { useWebSocket } from '@/hooks/use-websocket';
import { useMarketStore } from '@/stores/market-store';
import { useMarkets } from '@/hooks/queries/use-market';
import { useOrders, useCancelOrder } from '@/hooks/queries/use-orders';
import { AuthGuard } from '@/components/auth-guard';
import { OrderBookPanel } from '@/components/order-book';
import { KlineChart } from '@/components/kline-chart';
import { TradeForm } from '@/components/trade-form';
import { toast } from 'sonner';

const TradePageContent = () => {
  const params = useParams();
  const symbol = (params.symbol as string) || 'BTC-USDT';
  const [interval, setInterval] = useState('1h');

  useWebSocket([`ticker.${symbol}`, `depth.${symbol}`, 'user.orders', 'user.balances']);

  const ticker = useMarketStore((s) => s.tickers[symbol]);
  const { data: markets } = useMarkets();
  const market = markets?.find((m) => m.symbol === symbol) || TRADING_PAIRS.find((p) => p.symbol === symbol);
  const { data: openOrders } = useOrders('OPEN', symbol);
  const cancelOrder = useCancelOrder();

  const change = ticker ? parseFloat(ticker.priceChangePercent) : 0;

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={symbol}
          onChange={(e) => { window.location.href = `/trade/${e.target.value}`; }}
          className="rounded border border-border bg-surface px-3 py-2 text-sm"
        >
          {TRADING_PAIRS.map((p) => (
            <option key={p.symbol} value={p.symbol}>{p.symbol}</option>
          ))}
        </select>
        {ticker && market && (
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold">
              {formatPrice(ticker.lastPrice, market.pricePrecision)}
            </span>
            <span className={change >= 0 ? 'text-price-up' : 'text-price-down'}>
              {formatPercent(ticker.priceChangePercent)}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-border bg-surface p-2">
            <div className="mb-2 flex gap-2">
              {['1h', '4h', '1d'].map((i) => (
                <button
                  key={i}
                  onClick={() => setInterval(i)}
                  className={`rounded px-2 py-1 text-xs ${interval === i ? 'bg-background' : 'text-price-neutral'}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <KlineChart symbol={symbol} interval={interval} />
          </div>
          <OrderBookPanel symbol={symbol} />
        </div>
        <div className="space-y-4">
          <TradeForm symbol={symbol} />
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-medium">Open Orders</h3>
            {openOrders?.data.length === 0 && (
              <p className="text-xs text-price-neutral">No open orders</p>
            )}
            {openOrders?.data.map((o) => (
              <div key={o.id} className="flex items-center justify-between border-t border-border py-2 text-xs">
                <span>{o.side} {o.quantity} @ {o.price || 'MKT'}</span>
                <button onClick={() => handleCancel(o.id)} className="text-price-down">Cancel</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TradePage() {
  return (
    <AuthGuard>
      <TradePageContent />
    </AuthGuard>
  );
}
