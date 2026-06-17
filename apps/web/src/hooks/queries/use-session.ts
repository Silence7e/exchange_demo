'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AuthMeResponse } from '@exchange/shared';

export const useSession = () =>
  useQuery({
    queryKey: ['session'],
    queryFn: () => apiClient<AuthMeResponse>('/auth/me'),
    retry: false,
  });
