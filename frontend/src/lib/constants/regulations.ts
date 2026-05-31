export const REGULATION_DEFAULTS = {
  SoCauToiDa: 5,
  ThoiLuongMin: 30,
  ThoiLuongMax: 180,
  DiemMin: 0,
  DiemMax: 10,
} as const;

export type RegulationKey = keyof typeof REGULATION_DEFAULTS;
