import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, GameResponse, DiaryEntry } from '../shared/game-types';

const GAME_SAVE_KEY = 'dnd_game_save';

export const defaultAbilities = {
  knowledge: 0, reasoning: 0, athletics: 0, movement: 0,
  observation: 0, speech: 0, insight: 0, fishing: 0,
  hunting: 0, cooking: 0, trading: 0, crafting: 0,
  creativity: 0, labor: 0, profession: 0, business: 0,
};

export async function saveGameState(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(GAME_SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const data = await AsyncStorage.getItem(GAME_SAVE_KEY);
    if (!data) return null;
    return JSON.parse(data) as GameState;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export async function clearGameState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GAME_SAVE_KEY);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

export function applyGameResponse(
  currentState: GameState,
  response: GameResponse,
  newMessages: any[],
): GameState {
  return {
    ...currentState,
    time: response.time || currentState.time,
    location: response.location || currentState.location,
    inventory: response.inventory || currentState.inventory,
    abilities: response.abilities || currentState.abilities,
    status: response.status || currentState.status,
    npcRelations: response.npcRelations || currentState.npcRelations,
    gameOver: response.isGameOver || false,
    gameOverReason: response.gameOverReason,
    messageHistory: newMessages,
  };
}

export function getDiceLabel(type: string): string {
  switch (type) {
    case 'wood': return '나무주사위';
    case 'iron': return '쇠주사위';
    case 'silver': return '은주사위';
    case 'gold': return '금주사위';
    case 'darklight': return '흑광주사위';
    default: return '나무주사위';
  }
}

export function getDiceColor(type: string): string {
  switch (type) {
    case 'wood': return '#8B6914';
    case 'iron': return '#9E9E9E';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'darklight': return '#9C27B0';
    default: return '#8B6914';
  }
}

export function getTimeOfDayLabel(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'dawn': return '새벽';
    case 'morning': return '아침';
    case 'afternoon': return '오후';
    case 'evening': return '저녁';
    case 'night': return '밤';
    case 'midnight': return '자정';
    default: return '아침';
  }
}

export function getAbilityLabel(key: string): string {
  const labels: Record<string, string> = {
    knowledge: '지식', reasoning: '추리', athletics: '운동', movement: '이동',
    observation: '관찰', speech: '화술', insight: '통찰', fishing: '낚시',
    hunting: '사냥', cooking: '요리', trading: '거래', crafting: '제작',
    creativity: '창작', labor: '노동', profession: '직업', business: '사업',
  };
  return labels[key] || key;
}
