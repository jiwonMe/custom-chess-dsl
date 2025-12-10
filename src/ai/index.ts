/**
 * ChessLang AI Module
 * AI 플레이어 구현
 */

export * from './types.js';
export { RandomAI } from './random-ai.js';
export { MinimaxAI } from './minimax-ai.js';

import type { ChessAI, AIType, AILevel } from './types.js';
import { RandomAI } from './random-ai.js';
import { MinimaxAI } from './minimax-ai.js';

/**
 * AI 인스턴스 생성
 */
export function createAI(type: AIType, level?: AILevel): ChessAI {
  switch (type) {
    case 'random':
      return new RandomAI();
    case 'minimax': {
      const ai = new MinimaxAI();
      if (level) ai.setLevel(level);
      return ai;
    }
    default:
      return new RandomAI();
  }
}
