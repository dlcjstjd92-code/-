// Game shared types for D&D text RPG

export type DiceType = 'wood' | 'iron' | 'silver' | 'gold' | 'darklight';

export interface DiceRoll {
  die1: number;
  die2: number;
  total: number;
  type: DiceType;
  isDoubles: boolean;
  isHighDoubles: boolean; // doubles >= 8 = lucky event
  isLowDoubles: boolean;  // doubles < 8 = unlucky event
}

export interface Ability {
  knowledge: number;    // 지식
  reasoning: number;    // 추리
  athletics: number;    // 운동
  movement: number;     // 이동
  observation: number;  // 관찰
  speech: number;       // 화술
  insight: number;      // 통찰
  fishing: number;      // 낚시
  hunting: number;      // 사냥
  cooking: number;      // 요리
  trading: number;      // 거래
  crafting: number;     // 제작
  creativity: number;   // 창작
  labor: number;        // 노동
  profession: number;   // 직업
  business: number;     // 사업
  [key: string]: number;
}

export type AbilityKey = keyof Ability;

export interface Item {
  id: string;
  name: string;
  description: string;
  weight: number; // in 동 units
  value?: number; // in 은전
  type: 'treasure' | 'book' | 'tool' | 'material' | 'map' | 'food' | 'clothing' | 'unique' | 'currency';
  isEquipped?: boolean;
}

export interface NPCRelation {
  npcId: string;
  npcName: string;
  relationship: number; // -100 to 100
  description: string;
  lastInteraction?: string;
}

export interface GameStatus {
  health: 'healthy' | 'injured' | 'critical';
  fatigue: number; // 0-100
  hunger: number;  // 0-5 (days without food)
  emotion: string;
  currentThought?: string;
}

export interface GameTime {
  year: number;     // 탈라즘력
  day: number;      // 일차
  hour: number;     // 0-23
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';
  actionHoursUsed: number; // out of 16
}

export interface GameLocation {
  region: string;
  city?: string;
  district?: string;
  specific?: string;
}

export interface SystemLog {
  diceRoll?: DiceRoll;
  rollType?: string;
  result?: string;
  changes: {
    relations?: { npcName: string; change: string }[];
    items?: { action: 'gained' | 'lost'; item: string }[];
    status?: string[];
    abilities?: { ability: string; change: number }[];
  };
}

export interface GameMessage {
  role: string;
  content: any;
}

export interface Choice {
  id: string;
  text: string;
  type: 'direct_input' | 'recommended' | 'knowledge_check' | 'observation_check';
  abilityCheck?: AbilityKey;
}

export interface GameResponse {
  narration: string;
  systemLog: SystemLog;
  choices: Choice[];
  inventory: Item[];
  status: GameStatus;
  time: GameTime;
  location: GameLocation;
  npcRelations: NPCRelation[];
  abilities: Ability;
  isGameOver: boolean;
  gameOverReason?: string;
  illustrationUrl?: string;
}

export interface DiaryEntry {
  day: number;
  year: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface GameState {
  playerName: string;
  gameStarted: boolean;
  gameOver: boolean;
  gameOverReason?: string;
  time: GameTime;
  location: GameLocation;
  inventory: Item[];
  abilities: Ability;
  status: GameStatus;
  npcRelations: NPCRelation[];
  diary: DiaryEntry[];
  messageHistory: GameMessage[];
  reputation?: string;
  nickname?: string;
  hasBojeol: boolean; // 보물 소유 여부 (최초죽음의 목격자)
  currentIllustrationUrl?: string;
}
