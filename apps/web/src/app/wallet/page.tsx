'use client';

import { AuthGuard } from '@/components/auth-guard';
import { useBalances } from '@/hooks/queries/use-market';
import { formatPrice, formatQuantity } from '@exchange/shared';

const WalletPageContent = () => {
  const { data: balances, isLoading } = useBalances();

  const totalUsdt = balances?.reduce((sum, b) => {
    if (b.asset === 'USDT') return sum + parseFloat(b.total);
    return sum;
  }, 0) ?? 0;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Wallet</h1>
      <p className="mb-6 text-price-neutral">
        Portfolio (USDT): {formatPrice(totalUsdt.toString(), 2)}
      </p>
      {isLoading ? (
        <div className="text-price-neutral">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-price-neutral">
              <tr>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Frozen</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {balances?.map((b) => (
                <tr key={b.asset} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{b.asset}</td>
                  <td className="px-4 py-3 text-right">{formatQuantity(b.available, 8)}</td>
                  <td className="px-4 py-3 text-right">{formatQuantity(b.frozen, 8)}</td>
                  <td className="px-4 py-3 text-right">{formatQuantity(b.total, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function WalletPage() {
  return (
    <AuthGuard>
      <WalletPageContent />
    </AuthGuard>
  );
}
