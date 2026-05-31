'use client';

import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';

interface CrudListResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CrudAdapter<TItem, TListParams, TCreate, TUpdate, TId> {
  resource: string;
  list: (params: TListParams) => Promise<CrudListResult<TItem>>;
  create: (payload: TCreate) => Promise<TItem>;
  update: (id: TId, payload: TUpdate) => Promise<TItem>;
  remove: (id: TId) => Promise<unknown>;
}

interface UseCrudResourceOptions<TListParams> {
  params?: TListParams;
  enabled?: boolean;
}

interface UpdateArgs<TUpdate, TId> {
  id: TId;
  data: TUpdate;
}

export interface CrudResource<TItem, TCreate, TUpdate, TId> {
  query: UseQueryResult<CrudListResult<TItem>>;
  createMutation: UseMutationResult<TItem, unknown, TCreate>;
  updateMutation: UseMutationResult<TItem, unknown, UpdateArgs<TUpdate, TId>>;
  deleteMutation: UseMutationResult<unknown, unknown, TId>;
  invalidate: () => Promise<void>;
}

function handleMutationError(err: unknown, fallback: string): void {
  const status = getApiStatus(err);
  if (status === 403) {
    toast.warning(MSG.FORBIDDEN);
    return;
  }
  if (status === 409) {
    toast.error(getApiMessage(err, MSG.CONFLICT));
    return;
  }
  if (status === 404) {
    toast.error(getApiMessage(err, MSG.NOT_FOUND));
    return;
  }
  toast.error(getApiMessage(err, fallback));
}

export function useCrudResource<TItem, TListParams, TCreate, TUpdate, TId>(
  adapter: CrudAdapter<TItem, TListParams, TCreate, TUpdate, TId>,
  options: UseCrudResourceOptions<TListParams> = {},
): CrudResource<TItem, TCreate, TUpdate, TId> {
  const queryClient = useQueryClient();
  const params = options.params;
  const queryKey = useMemo(() => [adapter.resource, params] as const, [adapter.resource, params]);

  const query = useQuery<CrudListResult<TItem>>({
    queryKey,
    queryFn: () => adapter.list(params as TListParams),
    enabled: options.enabled !== false,
  });

  async function invalidate(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: [adapter.resource] });
  }

  const createMutation = useMutation<TItem, unknown, TCreate>({
    mutationFn: (payload) => adapter.create(payload),
    onSuccess: async () => {
      toast.success(MSG.CREATED);
      await invalidate();
    },
    onError: (err) => handleMutationError(err, MSG.CREATE_FAILED),
  });

  const updateMutation = useMutation<TItem, unknown, UpdateArgs<TUpdate, TId>>({
    mutationFn: ({ id, data }) => adapter.update(id, data),
    onSuccess: async () => {
      toast.success(MSG.UPDATED);
      await invalidate();
    },
    onError: (err) => handleMutationError(err, MSG.UPDATE_FAILED),
  });

  const deleteMutation = useMutation<unknown, unknown, TId>({
    mutationFn: (id) => adapter.remove(id),
    onSuccess: async () => {
      toast.success(MSG.DELETED);
      await invalidate();
    },
    onError: (err) => handleMutationError(err, MSG.DELETE_FAILED),
  });

  return { query, createMutation, updateMutation, deleteMutation, invalidate };
}
