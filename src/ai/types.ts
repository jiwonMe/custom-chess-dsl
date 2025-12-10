/**
 * ChessLang AI Types
 * AI 플레이어를 위한 인터페이스 및 타입 정의
 */

import type { GameState, Move, CompiledGame, Piece, Color } from '../types/index.js';

/**
 * AI 난이도 레벨
 */
export type AILevel = 1 | 2 | 3 | 4 | 5;

/**
 * AI 타입
 */
export type AIType = 'random' | 'minimax';

/**
 * AI 설정
 */
export interface AIConfig {
  type: AIType;
  level?: AILevel;
  color: Color;
  thinkingTime?: number;  // ms (표시용)
}

/**
 * AI 인터페이스
 * 모든 AI 구현체가 따라야 하는 인터페이스
 */
export interface ChessAI {
  /** AI 이름 */
  readonly name: string;
  
  /** AI 타입 */
  readonly type: AIType;
  
  /**
   * 최선의 수 선택
   * @param state 현재 게임 상태
   * @param legalMoves 가능한 합법적 수들
   * @param game 컴파일된 게임 정의
   * @returns 선택된 수
   */
  selectMove(
    state: GameState,
    legalMoves: Move[],
    game: CompiledGame
  ): Promise<Move>;
  
  /**
   * 난이도 설정 (선택)
   */
  setLevel?(level: AILevel): void;
  
  /**
   * AI 중단 (긴 계산 중단용)
   */
  abort?(): void;
}

/**
 * 기물 가치 (기본값)
 */
export const DEFAULT_PIECE_VALUES: Record<string, number> = {
  Pawn: 100,
  Knight: 320,
  Bishop: 330,
  Rook: 500,
  Queen: 900,
  King: 20000,
};

/**
 * 기물 가치 가져오기
 */
export function getPieceValue(piece: Piece, game: CompiledGame): number {
  // 게임 정의에서 가치 확인
  const pieceDef = game.pieces.get(piece.type);
  if (pieceDef) {
    const defAsAny = pieceDef as unknown as Record<string, unknown>;
    if (typeof defAsAny['value'] === 'number') {
      return defAsAny['value'];
    }
  }
  
  // 기본값 사용
  return DEFAULT_PIECE_VALUES[piece.type] ?? 300;
}
