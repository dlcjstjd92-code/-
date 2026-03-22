import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, GameResponse, DiaryEntry } from '../shared/game-types';
import { saveGameState, loadGameState, applyGameResponse, defaultAbilities } from './game-store';

interface GameContextType {
  gameState: GameState | null;
  isLoading: boolean;
  isSaved: boolean;
  startNewGame: (playerName: string, initialState: Partial<GameState>, firstResponse: GameResponse, messages: any[]) => void;
  updateGameState: (response: GameResponse, newMessages: any[]) => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  loadSavedGame: () => Promise<boolean>;
  clearGame: () => void;
  setLoading: (loading: boolean) => void;
}

const GameContext = createContext<GameContextType | null>(null);

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'START_GAME'; payload: { state: GameState } }
  | { type: 'UPDATE_STATE'; payload: { response: GameResponse; messages: any[] } }
  | { type: 'ADD_DIARY'; payload: DiaryEntry }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'CLEAR_GAME' };

interface GameContextState {
  gameState: GameState | null;
  isLoading: boolean;
  isSaved: boolean;
}

function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'START_GAME':
      return { ...state, gameState: action.payload.state, isLoading: false, isSaved: false };
    case 'UPDATE_STATE': {
      if (!state.gameState) return state;
      try {
        const newState = applyGameResponse(state.gameState, action.payload.response, action.payload.messages);
        if (action.payload.response.illustrationUrl) {
          newState.currentIllustrationUrl = action.payload.response.illustrationUrl;
        }
        return { ...state, gameState: newState, isSaved: false };
      } catch (e) {
        console.error('Update state error:', e);
        return { ...state, gameState: { ...state.gameState, messageHistory: action.payload.messages }, isSaved: false };
      }
    }
    case 'ADD_DIARY': {
      if (!state.gameState) return state;
      return {
        ...state,
        gameState: {
          ...state.gameState,
          diary: [...state.gameState.diary, action.payload],
        },
        isSaved: false,
      };
    }
    case 'LOAD_GAME':
      return { ...state, gameState: action.payload, isLoading: false, isSaved: true };
    case 'CLEAR_GAME':
      return { gameState: null, isLoading: false, isSaved: false };
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    gameState: null,
    isLoading: false,
    isSaved: false,
  });
  
  const lastSavedStateRef = useRef<string>('');

  const startNewGame = useCallback((
    playerName: string,
    initialState: Partial<GameState>,
    firstResponse: GameResponse,
    messages: any[]
  ) => {
    console.log('Context: startNewGame called for', playerName);
    const fullState: GameState = {
      playerName,
      gameStarted: true,
      gameOver: false,
      time: firstResponse.time || initialState.time!,
      location: firstResponse.location || initialState.location!,
      inventory: firstResponse.inventory || initialState.inventory || [],
      abilities: firstResponse.abilities || initialState.abilities || defaultAbilities,
      status: firstResponse.status || initialState.status!,
      npcRelations: firstResponse.npcRelations || initialState.npcRelations || [],
      diary: [],
      messageHistory: messages,
      hasBojeol: false,
      currentIllustrationUrl: firstResponse.illustrationUrl,
    };
    dispatch({ type: 'START_GAME', payload: { state: fullState } });
  }, []);

  const updateGameState = useCallback((response: GameResponse, newMessages: any[]) => {
    dispatch({ type: 'UPDATE_STATE', payload: { response, messages: newMessages } });
  }, []);

  const addDiaryEntry = useCallback((entry: DiaryEntry) => {
    dispatch({ type: 'ADD_DIARY', payload: entry });
  }, []);

  const loadSavedGame = useCallback(async (): Promise<boolean> => {
    const saved = await loadGameState();
    if (saved) {
      dispatch({ type: 'LOAD_GAME', payload: saved });
      lastSavedStateRef.current = JSON.stringify(saved);
      return true;
    }
    return false;
  }, []);

  const clearGame = useCallback(() => {
    dispatch({ type: 'CLEAR_GAME' });
    lastSavedStateRef.current = '';
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // Optimized Auto-save
  useEffect(() => {
    if (state.gameState && !state.isSaved) {
      const stateString = JSON.stringify(state.gameState);
      if (stateString !== lastSavedStateRef.current) {
        saveGameState(state.gameState).then(() => {
          lastSavedStateRef.current = stateString;
        });
      }
    }
  }, [state.gameState, state.isSaved]);

  return (
    <GameContext.Provider value={{
      gameState: state.gameState,
      isLoading: state.isLoading,
      isSaved: state.isSaved,
      startNewGame,
      updateGameState,
      addDiaryEntry,
      loadSavedGame,
      clearGame,
      setLoading,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
