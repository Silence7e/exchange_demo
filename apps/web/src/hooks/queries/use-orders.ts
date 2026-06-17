'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Order, PaginatedResponse } from '@exchange/shared';
import { OrderSide, OrderType } from '@exchange/shared';

export const useOrders = (status?: string, symbol?: string) =>
  useQuery({
    queryKey: ['orders', status, symbol],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (symbol) params.set('symbol', symbol);
      return apiClient<PaginatedResponse<Order>>(`/orders?${params}`);
    },
  });

export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      symbol: string;
      side: OrderSide;
      type: OrderType;
      price?: string;
      quantity: string;
    }) => apiClient<Order>('/orders', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient<Order>(`/orders/${orderId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};
