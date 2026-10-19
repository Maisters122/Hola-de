export type TireCompoundType = 'soft' | 'medium' | 'hard' | 'wet';

export interface TireCompoundInfo {
  type: TireCompoundType;
  name: string;
  color: string;
  grip: number;
  wearRate: number;
  optimalTemp: number;
}
