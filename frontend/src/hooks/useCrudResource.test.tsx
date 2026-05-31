import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCrudResource, type CrudAdapter } from './useCrudResource';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

interface Item {
  id: number;
  name: string;
}

function makeAdapter(): CrudAdapter<
  Item,
  { search?: string },
  { name: string },
  { name?: string },
  number
> {
  return {
    resource: 'items',
    list: vi.fn(async () => ({ data: [{ id: 1, name: 'one' }], total: 1, page: 1, limit: 10 })),
    create: vi.fn(async (payload) => ({ id: 2, name: payload.name })),
    update: vi.fn(async (id, data) => ({ id, name: data.name ?? 'updated' })),
    remove: vi.fn(async () => ({ message: 'ok' })),
  };
}

function wrapper(): { Wrapper: React.FC<{ children: React.ReactNode }>; qc: QueryClient } {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, qc };
}

describe('useCrudResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches list on mount', async () => {
    const adapter = makeAdapter();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(adapter, { params: {} }), {
      wrapper: Wrapper,
    });
    await waitFor(() => {
      expect(result.current.query.isSuccess).toBe(true);
    });
    expect(result.current.query.data?.data).toEqual([{ id: 1, name: 'one' }]);
    expect(adapter.list).toHaveBeenCalledTimes(1);
  });

  it('create mutation calls adapter.create then invalidates', async () => {
    const adapter = makeAdapter();
    const { Wrapper, qc } = wrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCrudResource(adapter, { params: {} }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await result.current.createMutation.mutateAsync({ name: 'new' });
    expect(adapter.create).toHaveBeenCalledWith({ name: 'new' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] });
  });

  it('update mutation calls adapter.update with id+data', async () => {
    const adapter = makeAdapter();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(adapter, { params: {} }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await result.current.updateMutation.mutateAsync({ id: 1, data: { name: 'x' } });
    expect(adapter.update).toHaveBeenCalledWith(1, { name: 'x' });
  });

  it('delete mutation calls adapter.remove with id', async () => {
    const adapter = makeAdapter();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(adapter, { params: {} }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await result.current.deleteMutation.mutateAsync(7);
    expect(adapter.remove).toHaveBeenCalledWith(7);
  });

  it('shows toast.error on 409 conflict during create', async () => {
    const adapter = makeAdapter();
    const err: { isAxiosError: true; response: { status: number; data: unknown } } = {
      isAxiosError: true,
      response: { status: 409, data: { statusCode: 409, message: 'Trùng key' } },
    };
    (adapter.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(adapter, { params: {} }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await expect(result.current.createMutation.mutateAsync({ name: 'dup' })).rejects.toBeTruthy();
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalled();
  });

  it('shows toast.warning on 403 forbidden during delete', async () => {
    const adapter = makeAdapter();
    const err: { isAxiosError: true; response: { status: number; data: unknown } } = {
      isAxiosError: true,
      response: { status: 403, data: { statusCode: 403, message: 'No' } },
    };
    (adapter.remove as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(adapter, { params: {} }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await expect(result.current.deleteMutation.mutateAsync(1)).rejects.toBeTruthy();
    const { toast } = await import('sonner');
    expect(toast.warning).toHaveBeenCalled();
  });
});
