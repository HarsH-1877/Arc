'use client';

import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Could not update notification');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
