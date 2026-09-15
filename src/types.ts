export type PlayerStatus = 'playing' | 'bench' | 'unavailable';

export interface Player {
  id: string;
  name: string;
  number?: string;
  status: PlayerStatus;
  benchCount: number;
}
