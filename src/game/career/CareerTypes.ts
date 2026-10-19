export type RaceDifficulty = 'easy' | 'normal' | 'medium' | 'hard' | 'pro';
export type RaceLapOption = 1 | 3 | 5 | 9 | 10 | 15 | 20 | 50;

export interface CustomLiverySettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  sponsor?: string;
  number?: number;
  finish?: string;
  driverName?: string;
  driverCode?: string;
  driverNumber?: string;
  teamName?: string;
}

export interface CareerStandingsEntry {
  driverName: string;
  team: string;
  points: number;
  isPlayer?: boolean;
}

export interface CareerSeasonState {
  currentRace: number;
  totalRaces: number;
  points: number;
  wins: number;
  podiums: number;
  rep: number;
  team: string;
  standings?: CareerStandingsEntry[];
}

export function saveLivery(livery: CustomLiverySettings): void {
  try {
    localStorage.setItem('apex_gt_custom_livery', JSON.stringify(livery));
  } catch {
    // ignore
  }
}

export function loadLivery(): CustomLiverySettings | null {
  try {
    const raw = localStorage.getItem('apex_gt_custom_livery');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
