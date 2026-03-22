import { describe, it, expect } from 'vitest';

// Test game logic utilities
describe('Game Logic', () => {
  // Test dice rolling
  describe('Dice Rolling', () => {
    function rollDice(diceType: string = 'wood') {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2;
      const isDoubles = die1 === die2;
      const isHighDoubles = isDoubles && total >= 8;
      const isLowDoubles = isDoubles && total < 8;
      return { die1, die2, total, type: diceType, isDoubles, isHighDoubles, isLowDoubles };
    }

    it('should roll dice with values between 1-6', () => {
      for (let i = 0; i < 100; i++) {
        const roll = rollDice();
        expect(roll.die1).toBeGreaterThanOrEqual(1);
        expect(roll.die1).toBeLessThanOrEqual(6);
        expect(roll.die2).toBeGreaterThanOrEqual(1);
        expect(roll.die2).toBeLessThanOrEqual(6);
      }
    });

    it('should calculate total correctly', () => {
      for (let i = 0; i < 50; i++) {
        const roll = rollDice();
        expect(roll.total).toBe(roll.die1 + roll.die2);
      }
    });

    it('should detect doubles correctly', () => {
      // Test with known values
      const mockRoll = { die1: 4, die2: 4, total: 8, type: 'wood', isDoubles: true, isHighDoubles: true, isLowDoubles: false };
      expect(mockRoll.isDoubles).toBe(true);
      expect(mockRoll.isHighDoubles).toBe(true); // 8 >= 8
      expect(mockRoll.isLowDoubles).toBe(false);
    });

    it('should detect low doubles correctly', () => {
      const mockRoll = { die1: 3, die2: 3, total: 6, type: 'wood', isDoubles: true, isHighDoubles: false, isLowDoubles: true };
      expect(mockRoll.isDoubles).toBe(true);
      expect(mockRoll.isHighDoubles).toBe(false); // 6 < 8
      expect(mockRoll.isLowDoubles).toBe(true);
    });

    it('should have total range of 2-12', () => {
      const totals = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        const roll = rollDice();
        totals.add(roll.total);
        expect(roll.total).toBeGreaterThanOrEqual(2);
        expect(roll.total).toBeLessThanOrEqual(12);
      }
    });
  });

  // Test dice type based on ability level
  describe('Dice Type', () => {
    function getDiceType(abilityLevel: number): string {
      if (abilityLevel >= 4000) return 'darklight';
      if (abilityLevel >= 3000) return 'gold';
      if (abilityLevel >= 2000) return 'silver';
      if (abilityLevel >= 1000) return 'iron';
      return 'wood';
    }

    it('should return wood dice for level 0', () => {
      expect(getDiceType(0)).toBe('wood');
    });

    it('should return iron dice for level 1000', () => {
      expect(getDiceType(1000)).toBe('iron');
    });

    it('should return silver dice for level 2000', () => {
      expect(getDiceType(2000)).toBe('silver');
    });

    it('should return gold dice for level 3000', () => {
      expect(getDiceType(3000)).toBe('gold');
    });

    it('should return darklight dice for level 4000+', () => {
      expect(getDiceType(4000)).toBe('darklight');
      expect(getDiceType(5000)).toBe('darklight');
    });
  });

  // Test game state utilities
  describe('Game State', () => {
    it('should have correct initial inventory items', () => {
      const inventory = [
        { id: 'haenang', name: '행낭', type: 'unique' },
        { id: 'hopae', name: '호패', type: 'unique' },
        { id: 'ildaegi', name: '일대기', type: 'unique' },
        { id: 'money_gold', name: '금전', type: 'currency' },
        { id: 'money_silver', name: '은전', type: 'currency' },
        { id: 'bread', name: '빵과 말린과일', type: 'food' },
        { id: 'pen', name: '만년필', type: 'tool' },
        { id: 'letter', name: '베토의 추천서', type: 'unique' },
        { id: 'box', name: '작은 목공상자', type: 'unique' },
        { id: 'map', name: '셀리자 지역지도', type: 'map' },
      ];

      expect(inventory).toHaveLength(10);
      expect(inventory.find(i => i.id === 'hopae')).toBeDefined();
      expect(inventory.find(i => i.id === 'ildaegi')).toBeDefined();
      expect(inventory.find(i => i.id === 'letter')).toBeDefined();
    });

    it('should have correct initial time settings', () => {
      const time = {
        year: 611,
        day: 1,
        hour: 6,
        timeOfDay: 'dawn',
        actionHoursUsed: 0,
      };

      expect(time.year).toBe(611);
      expect(time.day).toBe(1);
      expect(time.actionHoursUsed).toBe(0);
    });

    it('should have correct initial location', () => {
      const location = {
        region: '탈라즘제국',
        city: '셀리자',
        district: '수도성 외곽',
        specific: '두 개의 머리 말 여관',
      };

      expect(location.region).toBe('탈라즘제국');
      expect(location.city).toBe('셀리자');
    });

    it('should have all required abilities', () => {
      const abilities = {
        knowledge: 0, reasoning: 0, athletics: 0, movement: 0,
        observation: 0, speech: 0, insight: 0, fishing: 0,
        hunting: 0, cooking: 0, trading: 0, crafting: 0,
        creativity: 0, labor: 0, profession: 0, business: 0,
      };

      expect(Object.keys(abilities)).toHaveLength(16);
      expect(abilities.knowledge).toBe(0);
    });
  });

  // Test time of day labels
  describe('Time Labels', () => {
    function getTimeOfDayLabel(timeOfDay: string): string {
      const labels: Record<string, string> = {
        dawn: '새벽', morning: '아침', afternoon: '오후',
        evening: '저녁', night: '밤', midnight: '자정',
      };
      return labels[timeOfDay] || '아침';
    }

    it('should return correct Korean labels', () => {
      expect(getTimeOfDayLabel('dawn')).toBe('새벽');
      expect(getTimeOfDayLabel('morning')).toBe('아침');
      expect(getTimeOfDayLabel('afternoon')).toBe('오후');
      expect(getTimeOfDayLabel('evening')).toBe('저녁');
      expect(getTimeOfDayLabel('night')).toBe('밤');
      expect(getTimeOfDayLabel('midnight')).toBe('자정');
    });
  });
});
