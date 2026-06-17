'use client';

import Link from 'next/link';
import { useMarkets } from '@/hooks/queries/use-market';
import { formatPrice, formatPercent } from '@exchange/shared';

export default function MarketsPage() {
  const { data: markets, isLoading } = useMarkets();

  if (isLoading) return <div className="text-price-neutral">Loading markets...</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Markets</h1>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-price-neutral">
            <tr>
              <th className="px-4 py-3 text-left">Pair</th>
              <th className="px-4 py-3 text-right">Last Price</th>
              <th className="px-4 py-3 text-right">24h Change</th>
              <th className="px-4 py-3 text-right">24h Volume</th>
            </tr>
          </thead>
          <tbody>
            {markets?.map((m) => {
              const change = parseFloat(m.ticker.priceChangePercent);
              return (
                <tr key={m.symbol} className="border-t border-border hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link href={`/trade/${m.symbol}`} className="font-medium text-price-up">
                      {m.symbol}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatPrice(m.ticker.lastPrice, m.pricePrecision)}
                  </td>
                  <td className={`px-4 py-3 text-right ${change >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                    {formatPercent(m.ticker.priceChangePercent)}
                  </td>
                  <td className="px-4 py-3 text-right">{m.ticker.volume24h}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
