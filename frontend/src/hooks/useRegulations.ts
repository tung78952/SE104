'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listRegulations } from '@/lib/api/regulations';
import { REGULATION_DEFAULTS, type RegulationKey } from '@/lib/constants/regulations';

export interface RegulationsState {
  values: Record<RegulationKey, number>;
  isLoading: boolean;
}

function toNumber(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function useRegulations(): RegulationsState {
  const query = useQuery({
    queryKey: ['regulations', 'all'],
    queryFn: listRegulations,
    staleTime: 60 * 1000,
  });

  const values = useMemo<Record<RegulationKey, number>>(() => {
    const byName = new Map((query.data ?? []).map((r) => [r.tenThamSo, r.giaTri] as const));
    return {
      SoCauToiDa: toNumber(byName.get('SoCauToiDa'), REGULATION_DEFAULTS.SoCauToiDa),
      ThoiLuongMin: toNumber(byName.get('ThoiLuongMin'), REGULATION_DEFAULTS.ThoiLuongMin),
      ThoiLuongMax: toNumber(byName.get('ThoiLuongMax'), REGULATION_DEFAULTS.ThoiLuongMax),
      DiemMin: toNumber(byName.get('DiemMin'), REGULATION_DEFAULTS.DiemMin),
      DiemMax: toNumber(byName.get('DiemMax'), REGULATION_DEFAULTS.DiemMax),
    };
  }, [query.data]);

  return { values, isLoading: query.isLoading };
}
