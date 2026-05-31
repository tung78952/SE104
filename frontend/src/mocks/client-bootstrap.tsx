'use client';

import { useEffect, useState } from 'react';

const ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled';

export function MockApiBootstrap({ children }: { children: React.ReactNode }): React.ReactNode {
  const [ready, setReady] = useState(!ENABLED);

  useEffect(() => {
    if (!ENABLED) return;
    let cancelled = false;
    import('./browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        console.warn('MSW failed to start', err);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }
  return children;
}
