'use client';

import { useState } from 'react';
import { OrderSide, OrderType, getTradingPair } from '@exchange/shared';
import { usePlaceOrder } from '@/hooks/queries/use-orders';
import { toast } from 'sonner';

export const TradeForm = ({ symbol }: { symbol: string }) => {
  const pair = getTradingPair(symbol);
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [type, setType] = useState<OrderType>(OrderType.LIMIT);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const placeOrder = usePlaceOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair) return;

    try {
      await placeOrder.mutateAsync({
        symbol,
        side,
        type,
        price: type === OrderType.LIMIT ? price : undefined,
        quantity,
      });
      toast.success('Order placed');
      setQuantity('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Order failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide(OrderSide.BUY)}
          className={`flex-1 rounded py-2 text-sm font-medium ${side === OrderSide.BUY ? 'bg-price-up text-white' : 'bg-background'}`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide(OrderSide.SELL)}
          className={`flex-1 rounded py-2 text-sm font-medium ${side === OrderSide.SELL ? 'bg-price-down text-white' : 'bg-background'}`}
        >
          Sell
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType(OrderType.LIMIT)}
          className={`flex-1 rounded py-1 text-xs ${type === OrderType.LIMIT ? 'bg-background border border-border' : ''}`}
        >
          Limit
        </button>
        <button
          type="button"
          onClick={() => setType(OrderType.MARKET)}
          className={`flex-1 rounded py-1 text-xs ${type === OrderType.MARKET ? 'bg-background border border-border' : ''}`}
        >
          Market
        </button>
      </div>
      {type === OrderType.LIMIT && (
        <input
          type="text"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          required
        />
      )}
      <input
        type="text"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        required
      />
      <button
        type="submit"
        disabled={placeOrder.isPending}
        className={`w-full rounded py-2 text-sm font-medium text-white disabled:opacity-50 ${side === OrderSide.BUY ? 'bg-price-up' : 'bg-price-down'}`}
      >
        {placeOrder.isPending ? 'Placing...' : `${side} ${symbol}`}
      </button>
    </form>
  );
};
