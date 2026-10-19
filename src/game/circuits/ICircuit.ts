export type CircuitId = 'square' | 'square_apex' | 'monza' | 'silverstone' | 'suzuka' | 'spa';

export interface CircuitInfo {
  id: CircuitId;
  name: string;
  location: string;
  country: string;
  totalLength: number;
  cornersCount: number;
  flagEmoji?: string;
  expectedLapTimeSec?: number;
  topSpeedKmh?: number;
  description?: string;
  image?: string;
}
