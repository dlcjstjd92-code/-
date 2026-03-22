import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM, generateImage } from "./_core/llm";
import { GAME_SYSTEM_PROMPT, DIARY_PROMPT } from "./game-prompt";
import type { GameResponse, DiaryEntry, GameState } from "../shared/game-types";
import type { Message } from "./_core/llm";

// Helper to roll 2D6
function rollDice(diceType: string = 'wood') {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;
  const isDoubles = die1 === die2;
  return { die1, die2, total, type: diceType, isDoubles };
}

// Helper to get dice type based on ability level
function getDiceType(abilityLevel: number): string {
  if (abilityLevel >= 4000) return 'darklight';
  if (abilityLevel >= 3000) return 'gold';
  if (abilityLevel >= 2000) return 'silver';
  if (abilityLevel >= 1000) return 'iron';
  return 'wood';
}

// Default initial game state
function getInitialState(playerName: string): GameState {
  return {
    playerName,
    gameStarted: true,
    gameOver: false,
    time: { year: 611, day: 1, hour: 6, timeOfDay: 'dawn', actionHoursUsed: 0 },
    location: { region: '탈라즘제국', city: '셀리자', district: '수도성 외곽', specific: '두 개의 머리 말 여관' },
    inventory: [
      { id: 'haenang', name: '행낭', description: '가죽배낭', weight: 1, type: 'unique' },
      { id: 'hopae', name: '호패', description: `그란시스 ${playerName}이라 새겨진 제국 신분증`, weight: 0.1, type: 'unique' },
      { id: 'money_gold', name: '금전', description: '제국 금화 1개', weight: 0.1, value: 30, type: 'currency' },
    ],
    abilities: {
      knowledge: 0, reasoning: 0, athletics: 0, movement: 0,
      observation: 0, speech: 0, insight: 0, fishing: 0,
      hunting: 0, cooking: 0, trading: 0, crafting: 0,
      creativity: 0, labor: 0, profession: 0, business: 0,
    },
    status: { health: 'healthy', fatigue: 0, hunger: 0, emotion: '설레임', currentThought: '오늘은 출세의 첫날이다' },
    npcRelations: [],
    diary: [],
    messageHistory: [],
    hasBojeol: false,
  };
}

// Robust JSON extraction and normalization
function normalizeGameResponse(rawContent: string, fallbackState: any): GameResponse {
  let content = rawContent.trim();
  
  // Try to find JSON block
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  let jsonStr = jsonMatch ? jsonMatch[0] : content;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error('JSON parse error in normalization:', e);
    return {
      narration: content.replace(/\{[\s\S]*\}/, '').trim() || "서사가 이어집니다...",
      systemLog: { changes: {} },
      choices: [{ id: 'direct', text: '계속하기', type: 'direct_input' }],
      inventory: fallbackState.inventory,
      status: fallbackState.status,
      time: fallbackState.time,
      location: fallbackState.location,
      npcRelations: fallbackState.npcRelations,
      abilities: fallbackState.abilities,
      isGameOver: false,
    };
  }

  // Ensure all required fields exist and are valid
  return {
    narration: parsed.narration || "서사가 이어집니다...",
    systemLog: parsed.systemLog || { changes: {} },
    choices: Array.isArray(parsed.choices) ? parsed.choices : [{ id: 'direct', text: '계속하기', type: 'direct_input' }],
    inventory: parsed.inventory || fallbackState.inventory,
    status: parsed.status || fallbackState.status,
    time: parsed.time || fallbackState.time,
    location: parsed.location || fallbackState.location,
    npcRelations: parsed.npcRelations || fallbackState.npcRelations,
    abilities: parsed.abilities || fallbackState.abilities,
    isGameOver: !!parsed.isGameOver,
    gameOverReason: parsed.gameOverReason,
    illustrationUrl: parsed.illustrationUrl,
    illustrationPrompt: parsed.illustrationPrompt,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  game: router({
    start: publicProcedure
      .input(z.object({ playerName: z.string().min(1).max(20) }))
      .mutation(async ({ input }) => {
        const { playerName } = input;
        const initialState = getInitialState(playerName);
        
        const messages: Message[] = [
          { role: 'system', content: GAME_SYSTEM_PROMPT },
          { role: 'user', content: `게임을 시작합니다. 플레이어 이름은 그란시스 ${playerName}입니다.` },
        ];

        try {
          const response = await invokeLLM({
            messages,
            response_format: { type: 'json_object' },
          });

          const rawContent = response.choices[0].message.content;
          const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
          
          const gameResponse = normalizeGameResponse(content, initialState);
          
          // Image generation - non-blocking
          if (gameResponse.illustrationPrompt) {
            try {
              gameResponse.illustrationUrl = await Promise.race([
                generateImage(gameResponse.illustrationPrompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
              ]) as string;
            } catch (e) { console.error('Image gen error:', e); }
          }

          const assistantMessage = { role: 'assistant' as const, content: JSON.stringify(gameResponse) };
          const finalMessages = [...messages, assistantMessage];

          // CRITICAL: Return a clean, verified object
          return {
            success: true,
            gameResponse,
            initialState: {
              ...initialState,
              messageHistory: finalMessages,
            },
          };
        } catch (error: any) {
          console.error('Game start critical error:', error);
          return {
            success: false,
            error: error.message || "Unknown error during start",
            initialState: initialState
          };
        }
      }),

    action: publicProcedure
      .input(z.object({
        playerInput: z.string().min(1).max(500),
        messageHistory: z.array(z.any()),
        currentState: z.any(),
      }))
      .mutation(async ({ input }) => {
        const { playerInput, messageHistory, currentState } = input;
        
        const abilityLevel = currentState.abilities?.knowledge || 0;
        const diceRoll = rollDice(getDiceType(abilityLevel));

        const stateContext = `현재 상태: ${currentState.time.year}년 ${currentState.time.day}일차, ${currentState.time.timeOfDay}. 위치: ${currentState.location.city || ''}.
주사위: ${diceRoll.total}. 행동: ${playerInput}`;

        const messages: Message[] = [
          { role: 'system', content: GAME_SYSTEM_PROMPT },
          ...messageHistory.slice(-10).map(m => ({ 
            role: m.role as any, 
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) 
          })),
          { role: 'user', content: stateContext },
        ];

        try {
          const response = await invokeLLM({
            messages,
            response_format: { type: 'json_object' },
          });

          const rawContent = response.choices[0].message.content;
          const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
          
          const gameResponse = normalizeGameResponse(content, currentState);
          if (gameResponse.systemLog) gameResponse.systemLog.diceRoll = diceRoll as any;
          
          if (gameResponse.illustrationPrompt) {
            try {
              gameResponse.illustrationUrl = await Promise.race([
                generateImage(gameResponse.illustrationPrompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
              ]) as string;
            } catch (e) { console.error('Action image gen error:', e); }
          }

          const newMessages = [...messageHistory, { role: 'user', content: playerInput }, { role: 'assistant', content: JSON.stringify(gameResponse) }];

          return { success: true, gameResponse, newMessageHistory: newMessages };
        } catch (error: any) {
          console.error('Game action error:', error);
          return { success: false, error: "게임 진행 중 오류가 발생했습니다." };
        }
      }),

    generateDiary: publicProcedure
      .input(z.object({ playerName: z.string(), day: z.number(), year: z.number(), todayEvents: z.string() }))
      .mutation(async ({ input }) => {
        const { playerName, day, year, todayEvents } = input;
        const messages: Message[] = [
          { role: 'system', content: DIARY_PROMPT },
          { role: 'user', content: `탈라즘력 ${year}년 ${day}일, 그란시스 ${playerName}의 사건:\n${todayEvents}` },
        ];

        try {
          const response = await invokeLLM({ messages, response_format: { type: 'json_object' } });
          const content = response.choices[0].message.content as string;
          
          let diaryData: any;
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            diaryData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          } catch {
            diaryData = { title: `${year}년 ${day}일의 기록`, content: content };
          }
          
          const entry: DiaryEntry = { day, year, title: diaryData.title, content: diaryData.content, createdAt: new Date().toISOString() };
          return { success: true, entry };
        } catch (error) {
          console.error('Diary generation error:', error);
          throw new Error('일대기 생성 중 오류가 발생했습니다.');
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
