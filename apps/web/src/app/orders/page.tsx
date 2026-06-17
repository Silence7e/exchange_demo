'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { useOrders } from '@/hooks/queries/use-orders';
import { formatPrice } from '@exchange/shared';
import { getTradingPair } from '@exchange/shared';

const OrdersPageContent = () => {
  const [status, setStatus] = useState<string>('');
  const { data, isLoading } = useOrders(status || undefined);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Order History</h1>
      <div className="mb-4 flex gap-2">
        {['', 'OPEN', 'FILLED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded px-3 py-1 text-sm ${status === s ? 'bg-surface border border-border' : 'text-price-neutral'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="text-price-neutral">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-price-neutral">
              <tr>
                <th className="px-4 py-3 text-left">Pair</th>
                <th className="px-4 py-3 text-left">Side</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((o) => {
                const pair = getTradingPair(o.symbol);
                return (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-4 py-3">{o.symbol}</td>
                    <td className={`px-4 py-3 ${o.side === 'BUY' ? 'text-price-up' : 'text-price-down'}`}>{o.side}</td>
                    <td className="px-4 py-3">{o.type}</td>
                    <td className="px-4 py-3 text-right">
                      {o.price ? formatPrice(o.price, pair?.pricePrecision ?? 2) : 'Market'}
                    </td>
                    <td className="px-4 py-3 text-right">{o.quantity}</td>
                    <td className="px-4 py-3">{o.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersPageContent />
    </AuthGuard>
  );
}
