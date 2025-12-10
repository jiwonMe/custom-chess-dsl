import { describe, it, expect } from 'vitest';
import {
  mergeVictoryConditions,
  mergeDrawConditions,
} from '../src/stdlib/condition-merger.js';
import type { VictoryCondition, DrawCondition } from '../src/types/index.js';

/**
 * Tests for victory and draw condition merging.
 * 
 * **Key Concept:** Multiple conditions are combined with OR logic.
 * If ANY condition is satisfied, the game ends.
 */
describe('Condition Merger', () => {
  describe('mergeVictoryConditions', () => {
    const baseConditions: VictoryCondition[] = [
      { name: 'checkmate', condition: { type: 'check' }, winner: 'current' },
      { name: 'stalemate_wins', condition: { type: 'empty' }, winner: 'current' },
    ];

    it('should add new conditions (OR combination)', () => {
      const newConditions: VictoryCondition[] = [
        { name: 'hill', condition: { type: 'in_zone', zone: 'hill' }, winner: 'current', action: 'add' },
      ];

      const result = mergeVictoryConditions(baseConditions, newConditions);

      // Result: checkmate OR stalemate_wins OR hill
      expect(result).toHaveLength(3);
      expect(result.map(c => c.name)).toContain('checkmate');
      expect(result.map(c => c.name)).toContain('stalemate_wins');
      expect(result.map(c => c.name)).toContain('hill');
    });

    it('should replace existing conditions by name', () => {
      const newConditions: VictoryCondition[] = [
        {
          name: 'checkmate',
          condition: { type: 'piece_captured', pieceType: 'King' },
          winner: 'current',
          action: 'replace',
        },
      ];

      const result = mergeVictoryConditions(baseConditions, newConditions);

      // Result: new_checkmate OR stalemate_wins (checkmate replaced)
      expect(result).toHaveLength(2);
      const replaced = result.find(c => c.name === 'checkmate');
      expect(replaced?.condition.type).toBe('piece_captured');
    });

    it('should remove conditions by name', () => {
      const newConditions: VictoryCondition[] = [
        { name: 'checkmate', condition: { type: 'empty' }, winner: 'current', action: 'remove' },
      ];

      const result = mergeVictoryConditions(baseConditions, newConditions);

      // Result: stalemate_wins only (checkmate removed)
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('stalemate_wins');
    });

    it('should process actions in order: remove -> replace -> add', () => {
      const newConditions: VictoryCondition[] = [
        { name: 'stalemate_wins', condition: { type: 'empty' }, winner: 'current', action: 'remove' },
        { name: 'checkmate', condition: { type: 'piece_captured', pieceType: 'King' }, winner: 'current', action: 'replace' },
        { name: 'hill', condition: { type: 'in_zone', zone: 'hill' }, winner: 'current', action: 'add' },
        { name: 'three_check', condition: { type: 'comparison' } as any, winner: 'current', action: 'add' },
      ];

      const result = mergeVictoryConditions(baseConditions, newConditions);

      // Result: new_checkmate OR hill OR three_check
      // (stalemate_wins removed, checkmate replaced, hill & three_check added)
      expect(result).toHaveLength(3);
      expect(result.map(c => c.name)).not.toContain('stalemate_wins');
      expect(result.map(c => c.name)).toContain('checkmate');
      expect(result.map(c => c.name)).toContain('hill');
      expect(result.map(c => c.name)).toContain('three_check');
    });

    it('should not add duplicate names (use replace instead)', () => {
      const newConditions: VictoryCondition[] = [
        { name: 'checkmate', condition: { type: 'empty' }, winner: 'current', action: 'add' },
      ];

      const result = mergeVictoryConditions(baseConditions, newConditions);

      // Duplicate 'checkmate' with add: is skipped
      expect(result).toHaveLength(2);
      expect(result.filter(c => c.name === 'checkmate')).toHaveLength(1);
    });

    it('should treat replace as add if condition not found', () => {
      const newConditions: VictoryCondition[] = [
        { name: 'new_condition', condition: { type: 'empty' }, winner: 'current', action: 'replace' },
      ];

      const result = mergeVictoryConditions(baseConditions, newConditions);

      // 'new_condition' doesn't exist, so replace acts as add
      expect(result).toHaveLength(3);
      expect(result.map(c => c.name)).toContain('new_condition');
    });

    it('should clear action field in result', () => {
      const newConditions: VictoryCondition[] = [
        { name: 'hill', condition: { type: 'in_zone', zone: 'hill' }, winner: 'current', action: 'add' },
      ];

      const result = mergeVictoryConditions(baseConditions, newConditions);
      const added = result.find(c => c.name === 'hill');

      expect(added?.action).toBeUndefined();
    });
  });

  describe('mergeDrawConditions', () => {
    const baseConditions: DrawCondition[] = [
      { name: 'stalemate', condition: { type: 'empty' } },
      { name: 'fifty_moves', condition: { type: 'comparison' } as any },
    ];

    it('should add new draw conditions (OR combination)', () => {
      const newConditions: DrawCondition[] = [
        { name: 'bare_king', condition: { type: 'comparison' } as any, action: 'add' },
      ];

      const result = mergeDrawConditions(baseConditions, newConditions);

      // Result: stalemate OR fifty_moves OR bare_king
      expect(result).toHaveLength(3);
      expect(result.map(c => c.name)).toContain('bare_king');
    });

    it('should remove draw conditions', () => {
      const newConditions: DrawCondition[] = [
        { name: 'stalemate', condition: { type: 'empty' }, action: 'remove' },
      ];

      const result = mergeDrawConditions(baseConditions, newConditions);

      // Result: fifty_moves only
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('fifty_moves');
    });

    it('should replace draw conditions', () => {
      const newConditions: DrawCondition[] = [
        {
          name: 'fifty_moves',
          condition: { type: 'comparison', left: {} as any, op: '>=', right: { type: 'literal', value: 100 } } as any,
          action: 'replace',
        },
      ];

      const result = mergeDrawConditions(baseConditions, newConditions);

      expect(result).toHaveLength(2);
      const replaced = result.find(c => c.name === 'fifty_moves');
      expect(replaced?.condition.type).toBe('comparison');
    });
  });

  describe('OR combination semantics', () => {
    it('demonstrates OR logic: any condition triggers victory', () => {
      /**
       * This test documents the intended behavior:
       * 
       * ```chesslang
       * victory:
       *   add:
       *     hill: King in zone.hill
       *     three_check: checks >= 3
       * ```
       * 
       * Result: checkmate OR hill OR three_check
       * Game ends if ANY of these conditions is satisfied.
       */
      const base: VictoryCondition[] = [
        { name: 'checkmate', condition: { type: 'check' }, winner: 'current' },
      ];

      const additions: VictoryCondition[] = [
        { name: 'hill', condition: { type: 'in_zone', zone: 'hill' }, winner: 'current', action: 'add' },
        { name: 'three_check', condition: { type: 'comparison' } as any, winner: 'current', action: 'add' },
      ];

      const result = mergeVictoryConditions(base, additions);

      // All conditions should be present (OR combination)
      expect(result).toHaveLength(3);
      
      // Documentation: These are independent conditions
      // Satisfying ANY ONE of them ends the game
      expect(result.every(c => c.action === undefined)).toBe(true);
    });

    it('demonstrates AND logic within single condition', () => {
      /**
       * For AND logic, use a single condition with logical AND:
       * 
       * ```chesslang
       * victory:
       *   add:
       *     domination: King in zone.hill and opponent.pieces <= 5
       * ```
       */
      const complexCondition: VictoryCondition = {
        name: 'domination',
        condition: {
          type: 'logical',
          op: 'and',
          left: { type: 'in_zone', zone: 'hill' },
          right: { type: 'comparison' } as any,
        } as any,
        winner: 'current',
        action: 'add',
      };

      const result = mergeVictoryConditions([], [complexCondition]);

      expect(result).toHaveLength(1);
      expect((result[0].condition as any).op).toBe('and');
    });
  });
});
