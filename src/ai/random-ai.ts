/**
 * Random AI
 * 가능한 수 중에서 랜덤하게 선택하는 가장 간단한 AI
 */

import type { GameState, Move, CompiledGame } from '../types/index.js';
import type { ChessAI, AIType } from './types.js';

export class RandomAI implements ChessAI {
  readonly name = 'Random AI';
  readonly type: AIType = 'random';
  
  async selectMove(
    _state: GameState,
    legalMoves: Move[],
    _game: CompiledGame
  ): Promise<Move> {
    if (legalMoves.length === 0) {
      throw new Error('No legal moves available');
    }
    
    // 약간의 지연을 추가하여 "생각하는 것처럼" 보이게
    await this.delay(200 + Math.random() * 300);
    
    // 랜덤하게 수 선택
    const index = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[index]!;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
