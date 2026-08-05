'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 17, 26, 0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.72), 0 1px 0 rgba(255,255,255,0.06) inset',
            backdropFilter: 'blur(16px)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
