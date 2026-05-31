'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MockApiBootstrap } from '@/mocks/client-bootstrap';

export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <MockApiBootstrap>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={250} closeDelay={100}>
          {children}
        </TooltipProvider>
        <Toaster richColors closeButton position="top-right" duration={3000} />
      </QueryClientProvider>
    </MockApiBootstrap>
  );
}
