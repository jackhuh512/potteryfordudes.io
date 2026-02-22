export type Difficulty = 'easy' | 'medium' | 'hard';
export type TileType = 'wall' | 'path' | 'grass' | 'water';

export interface Position {
  x: number;
  y: number;
}

export interface WaterRect {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface DudeSpawn extends Position {
  name: string;
}

export interface DudeState extends DudeSpawn {
  bought: boolean;
}

export interface IrsAgentState extends Position {
  progress: number;
}

export interface PlayerState extends Position {
  moveCooldownMs: number;
  facing: Position;
  isDying: boolean;
  deathFrame: number;
}

export interface LevelConfig {
  goal: number;
  waterRects: WaterRect[];
  dudes: DudeSpawn[];
  irsSpawns?: Position[];
}

export type LevelConfigMap = Record<number, LevelConfig>;

export interface GameState {
  mapWidth: number;
  mapHeight: number;
  pottery: number;
  sales: number;
  hasBoat: boolean;
  boatEquipped: boolean;
  goal: number;
  currentLevel: number;
  gameRunning: boolean;
  animationFrameId: number | null;
  awaitingReplay: boolean;
  musicEnabled: boolean;
  gameOverTimer: number;
  difficulty: Difficulty;
  hasStartedGame: boolean;
  lastFrameTimeMs: number | null;
  map: TileType[][];
  dudes: DudeState[];
  irsAgents: IrsAgentState[];
  keys: Set<string>;
  player: PlayerState;
}

export interface MusicTrack {
  bpm: number;
  steps: number[];
  leadType: OscillatorType;
  bassType: OscillatorType;
  leadVolume: number;
}

export interface MusicSet {
  vibe: string;
  normal: MusicTrack;
  boat: MusicTrack;
}

export interface MusicProfile {
  sets: MusicSet[];
  sfx: {
    sale: [number, number, number];
  };
}
