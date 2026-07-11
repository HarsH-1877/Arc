'use client';

import { useQuery } from '@tanstack/react-query';
import type { NotificationSummary } from '@/types';

export function useNotifications() {
  return useQuery<NotificationSummary[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });
}
