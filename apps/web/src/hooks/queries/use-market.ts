'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Balance, MarketSummary } from '@exchange/shared';

export const useBalances = () =>
  useQuery({
    queryKey: ['balances'],
    queryFn: () => apiClient<Balance[]>('/wallet/balances'),
  });

export const useMarkets = () =>
  useQuery({
    queryKey: ['markets'],
    queryFn: () => apiClient<MarketSummary[]>('/markets'),
  });
