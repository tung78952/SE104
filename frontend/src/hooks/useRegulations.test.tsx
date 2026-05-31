import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRegulations } from './useRegulations';
import { useAuthStore } from '@/lib/auth/store';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return Wrapper;
}

describe('useRegulations', () => {
  it('returns merged values with defaults when no data yet', async () => {
    useAuthStore.getState().setAccessToken('test-token');
    const Wrapper = makeWrapper();
    const { result } = renderHook(() => useRegulations(), { wrapper: Wrapper });
    expect(result.current.values.SoCauToiDa).toBe(5);
    expect(result.current.values.ThoiLuongMin).toBe(30);
    expect(result.current.values.ThoiLuongMax).toBe(180);
    expect(result.current.values.DiemMin).toBe(0);
    expect(result.current.values.DiemMax).toBe(10);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
