/**
 * Utility functions for merging victory and draw conditions
 * when extending a base game.
 * 
 * **Combination Rules:**
 * - Multiple conditions are combined with OR logic
 * - If ANY condition is satisfied, the game ends
 * - Use `and`/`or` within a single condition for complex logic
 */

import type { VictoryCondition, DrawCondition } from '../types/index.js';

/**
 * Merge victory conditions from base game with new conditions.
 * 
 * **Processing order:**
 * 1. Start with base conditions
 * 2. Process 'remove' actions - remove conditions by name
 * 3. Process 'replace' actions - replace conditions by name
 * 4. Process 'add' actions - append new conditions (OR combination)
 * 
 * @param baseConditions - Victory conditions from the base game
 * @param newConditions - Victory conditions from the extending game
 * @returns Merged victory conditions (combined with OR logic)
 * 
 * @example
 * ```typescript
 * // Base: [checkmate, stalemate_wins]
 * // New: [{ name: 'hill', action: 'add' }, { name: 'checkmate', action: 'remove' }]
 * // Result: [stalemate_wins, hill] - checkmate removed, hill added (OR)
 * ```
 */
export function mergeVictoryConditions(
  baseConditions: VictoryCondition[],
  newConditions: VictoryCondition[]
): VictoryCondition[] {
  // Start with a copy of base conditions
  let result = [...baseConditions];

  // Group conditions by action type
  const removeActions = newConditions.filter((c) => c.action === 'remove');
  const replaceActions = newConditions.filter((c) => c.action === 'replace');
  const addActions = newConditions.filter((c) => c.action === 'add' || !c.action);

  // 1. Process 'remove' actions
  for (const toRemove of removeActions) {
    result = result.filter((c) => c.name !== toRemove.name);
  }

  // 2. Process 'replace' actions
  for (const toReplace of replaceActions) {
    const idx = result.findIndex((c) => c.name === toReplace.name);
    if (idx >= 0) {
      // Replace existing condition
      result[idx] = { ...toReplace, action: undefined };
    } else {
      // If no existing condition to replace, treat as add
      result.push({ ...toReplace, action: undefined });
    }
  }

  // 3. Process 'add' actions (OR combination - just append)
  for (const toAdd of addActions) {
    // Check if condition with same name exists
    const existingIdx = result.findIndex((c) => c.name === toAdd.name);
    if (existingIdx < 0) {
      // Add new condition (OR with existing conditions)
      result.push({ ...toAdd, action: undefined });
    }
    // If same name exists, skip (use replace: for overwriting)
  }

  return result;
}

/**
 * Merge draw conditions from base game with new conditions.
 * 
 * **Processing order:**
 * 1. Start with base conditions
 * 2. Process 'remove' actions - remove conditions by name
 * 3. Process 'replace' actions - replace conditions by name
 * 4. Process 'add' actions - append new conditions (OR combination)
 * 
 * @param baseConditions - Draw conditions from the base game
 * @param newConditions - Draw conditions from the extending game
 * @returns Merged draw conditions (combined with OR logic)
 * 
 * @example
 * ```typescript
 * // Base: [stalemate, fifty_moves]
 * // New: [{ name: 'bare_king', action: 'add' }]
 * // Result: [stalemate, fifty_moves, bare_king] - all OR combined
 * ```
 */
export function mergeDrawConditions(
  baseConditions: DrawCondition[],
  newConditions: DrawCondition[]
): DrawCondition[] {
  // Start with a copy of base conditions
  let result = [...baseConditions];

  // Group conditions by action type
  const removeActions = newConditions.filter((c) => c.action === 'remove');
  const replaceActions = newConditions.filter((c) => c.action === 'replace');
  const addActions = newConditions.filter((c) => c.action === 'add' || !c.action);

  // 1. Process 'remove' actions
  for (const toRemove of removeActions) {
    result = result.filter((c) => c.name !== toRemove.name);
  }

  // 2. Process 'replace' actions
  for (const toReplace of replaceActions) {
    const idx = result.findIndex((c) => c.name === toReplace.name);
    if (idx >= 0) {
      // Replace existing condition
      result[idx] = { ...toReplace, action: undefined };
    } else {
      // If no existing condition to replace, treat as add
      result.push({ ...toReplace, action: undefined });
    }
  }

  // 3. Process 'add' actions (OR combination - just append)
  for (const toAdd of addActions) {
    // Check if condition with same name exists
    const existingIdx = result.findIndex((c) => c.name === toAdd.name);
    if (existingIdx < 0) {
      // Add new condition (OR with existing conditions)
      result.push({ ...toAdd, action: undefined });
    }
    // If same name exists, skip (use replace: for overwriting)
  }

  return result;
}
