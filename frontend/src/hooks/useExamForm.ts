'use client';

import { useMemo, useState } from 'react';

export interface ExamFormState {
  maMon: string;
  hocKy: number;
  namHoc: string;
  thoiLuong: number;
  chosenIds: number[];
}

export interface ExamFormValidation {
  thoiLuongValid: boolean;
  thoiLuongMessage?: string;
  countValid: boolean;
  countMessage?: string;
  maMonValid: boolean;
  namHocValid: boolean;
  ready: boolean;
}

const NAM_HOC_RE = /^\d{4}-\d{4}$/;

export function validateExam(
  state: ExamFormState,
  limits: { soCauToiDa: number; thoiLuongMin: number; thoiLuongMax: number },
): ExamFormValidation {
  const thoiLuongValid =
    Number.isFinite(state.thoiLuong) &&
    state.thoiLuong >= limits.thoiLuongMin &&
    state.thoiLuong <= limits.thoiLuongMax;
  const countValid = state.chosenIds.length > 0 && state.chosenIds.length <= limits.soCauToiDa;
  const maMonValid = state.maMon.trim().length > 0;
  const namHocValid = NAM_HOC_RE.test(state.namHoc);
  return {
    thoiLuongValid,
    thoiLuongMessage: thoiLuongValid
      ? undefined
      : `Thời lượng phải trong khoảng ${limits.thoiLuongMin}-${limits.thoiLuongMax} phút`,
    countValid,
    countMessage: countValid
      ? undefined
      : state.chosenIds.length === 0
        ? 'Phải chọn ít nhất 1 câu hỏi'
        : `Số câu vượt quá quy định (tối đa ${limits.soCauToiDa})`,
    maMonValid,
    namHocValid,
    ready: thoiLuongValid && countValid && maMonValid && namHocValid,
  };
}

interface UseExamFormOptions {
  initial?: Partial<ExamFormState>;
  limits: { soCauToiDa: number; thoiLuongMin: number; thoiLuongMax: number };
}

export function useExamForm(options: UseExamFormOptions) {
  const [state, setState] = useState<ExamFormState>(() => ({
    maMon: options.initial?.maMon ?? '',
    hocKy: options.initial?.hocKy ?? 1,
    namHoc: options.initial?.namHoc ?? '',
    thoiLuong: options.initial?.thoiLuong ?? 90,
    chosenIds: options.initial?.chosenIds ?? [],
  }));

  const validation = useMemo(() => validateExam(state, options.limits), [state, options.limits]);

  function setField<K extends keyof ExamFormState>(key: K, value: ExamFormState[K]): void {
    setState((s) => {
      // changing subject clears chosen questions
      if (key === 'maMon' && value !== s.maMon) {
        return { ...s, maMon: value as string, chosenIds: [] };
      }
      return { ...s, [key]: value };
    });
  }

  function setChosenIds(ids: number[]): void {
    setState((s) => ({ ...s, chosenIds: ids }));
  }

  function reset(next?: Partial<ExamFormState>): void {
    setState({
      maMon: next?.maMon ?? '',
      hocKy: next?.hocKy ?? 1,
      namHoc: next?.namHoc ?? '',
      thoiLuong: next?.thoiLuong ?? 90,
      chosenIds: next?.chosenIds ?? [],
    });
  }

  return { state, setField, setChosenIds, reset, validation };
}
