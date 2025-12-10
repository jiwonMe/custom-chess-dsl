/**
 * Minimax AI with Alpha-Beta Pruning
 * 평가 함수 기반의 기본 체스 AI
 */

import type { GameState, Move, CompiledGame, Piece, Color } from '../types/index.js';
import type { ChessAI, AIType, AILevel } from './types.js';
import { getPieceValue } from './types.js';

// Piece-Square Tables (위치별 보너스)
// 값이 클수록 해당 위치가 좋음 (White 기준, Black은 반전)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDDLE_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

const PIECE_TABLES: Record<string, number[]> = {
  Pawn: PAWN_TABLE,
  Knight: KNIGHT_TABLE,
  Bishop: BISHOP_TABLE,
  Rook: ROOK_TABLE,
  Queen: QUEEN_TABLE,
  King: KING_MIDDLE_TABLE,
};

export class MinimaxAI implements ChessAI {
  readonly name = 'Minimax AI';
  readonly type: AIType = 'minimax';
  
  private level: AILevel = 3;
  private aborted = false;
  private nodesEvaluated = 0;
  
  // 난이도별 탐색 깊이
  private readonly depthByLevel: Record<AILevel, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  };
  
  setLevel(level: AILevel): void {
    this.level = level;
  }
  
  abort(): void {
    this.aborted = true;
  }
  
  async selectMove(
    state: GameState,
    legalMoves: Move[],
    game: CompiledGame
  ): Promise<Move> {
    if (legalMoves.length === 0) {
      throw new Error('No legal moves available');
    }
    
    // 수가 하나뿐이면 바로 반환
    if (legalMoves.length === 1) {
      await this.delay(100);
      return legalMoves[0]!;
    }
    
    this.aborted = false;
    this.nodesEvaluated = 0;
    
    const depth = this.depthByLevel[this.level];
    const isMaximizing = state.currentPlayer === 'White';
    
    let bestMove = legalMoves[0]!;
    let bestScore = isMaximizing ? -Infinity : Infinity;
    
    // 수 정렬 (잡기 우선 - 더 나은 가지치기를 위해)
    const sortedMoves = this.orderMoves(legalMoves);
    
    for (const move of sortedMoves) {
      if (this.aborted) break;
      
      // 수를 시뮬레이션
      const newState = this.simulateMove(state, move);
      
      // Minimax 평가
      const score = this.minimax(
        newState,
        depth - 1,
        -Infinity,
        Infinity,
        !isMaximizing,
        game
      );
      
      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
    
    // 약간의 지연 추가
    await this.delay(100);
    
    return bestMove;
  }
  
  /**
   * Minimax with Alpha-Beta Pruning
   */
  private minimax(
    state: GameState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    game: CompiledGame
  ): number {
    this.nodesEvaluated++;
    
    // 게임 종료 또는 깊이 0에서 평가
    if (depth === 0 || state.result || this.aborted) {
      return this.evaluate(state, game);
    }
    
    // 가능한 수 생성 (간단히 현재 플레이어 기물들의 모든 이동 고려)
    const currentPlayer = isMaximizing ? 'White' : 'Black';
    const moves = this.generateMoves(state, currentPlayer);
    
    if (moves.length === 0) {
      // 이동 불가 - 체크메이트 또는 스테일메이트
      return this.evaluate(state, game);
    }
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        if (this.aborted) break;
        const newState = this.simulateMove(state, move);
        const evaluation = this.minimax(newState, depth - 1, alpha, beta, false, game);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Beta cutoff
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        if (this.aborted) break;
        const newState = this.simulateMove(state, move);
        const evaluation = this.minimax(newState, depth - 1, alpha, beta, true, game);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha cutoff
      }
      return minEval;
    }
  }
  
  /**
   * 포지션 평가
   * 양수: White 유리, 음수: Black 유리
   */
  private evaluate(state: GameState, game: CompiledGame): number {
    // 게임 종료 체크
    if (state.result) {
      if (state.result.isDraw) return 0;
      return state.result.winner === 'White' ? 100000 : -100000;
    }
    
    let score = 0;
    
    for (const piece of state.pieces) {
      const value = getPieceValue(piece, game);
      const positionBonus = this.getPositionBonus(piece);
      const totalValue = value + positionBonus;
      
      if (piece.owner === 'White') {
        score += totalValue;
      } else {
        score -= totalValue;
      }
    }
    
    return score;
  }
  
  /**
   * 위치 보너스 계산
   */
  private getPositionBonus(piece: Piece): number {
    const table = PIECE_TABLES[piece.type];
    if (!table) return 0;
    
    const { file, rank } = piece.pos;
    
    // 테이블은 White 기준이므로 Black은 반전
    let index: number;
    if (piece.owner === 'White') {
      index = (7 - rank) * 8 + file;
    } else {
      index = rank * 8 + file;
    }
    
    return table[index] ?? 0;
  }
  
  /**
   * 수 정렬 (잡기 우선)
   */
  private orderMoves(moves: Move[]): Move[] {
    return moves.sort((a, b) => {
      const aCapture = a.captured ? 1 : 0;
      const bCapture = b.captured ? 1 : 0;
      return bCapture - aCapture;
    });
  }
  
  /**
   * 간단한 수 생성 (시뮬레이션용)
   */
  private generateMoves(state: GameState, player: Color): Move[] {
    const moves: Move[] = [];
    
    for (const piece of state.pieces) {
      if (piece.owner !== player) continue;
      
      // 간단한 이동 생성 (실제로는 게임 엔진 사용해야 함)
      // 여기서는 기본적인 수만 생성
      const possibleMoves = this.generatePieceMoves(piece, state);
      moves.push(...possibleMoves);
    }
    
    return moves;
  }
  
  /**
   * 기물별 이동 생성 (간단 버전)
   */
  private generatePieceMoves(piece: Piece, state: GameState): Move[] {
    const moves: Move[] = [];
    const { file, rank } = piece.pos;
    
    // 간단한 이동 패턴 (실제 게임에서는 엔진의 getLegalMoves 사용)
    const directions = this.getDirections(piece.type);
    
    for (const [df, dr] of directions) {
      const sliding = this.isSliding(piece.type);
      let distance = sliding ? 7 : 1;
      
      for (let d = 1; d <= distance; d++) {
        const newFile = file + df * d;
        const newRank = rank + dr * d;
        
        if (newFile < 0 || newFile > 7 || newRank < 0 || newRank > 7) break;
        
        const targetPos = { file: newFile, rank: newRank };
        const targetPiece = state.pieces.find(p => 
          p.pos.file === newFile && p.pos.rank === newRank
        );
        
        if (targetPiece) {
          if (targetPiece.owner !== piece.owner) {
            // 잡기
            moves.push({
              type: 'capture',
              piece,
              from: piece.pos,
              to: targetPos,
              captured: targetPiece,
            });
          }
          break; // 기물 있으면 더 이상 진행 불가
        } else {
          moves.push({
            type: 'normal',
            piece,
            from: piece.pos,
            to: targetPos,
          });
        }
      }
    }
    
    return moves;
  }
  
  private getDirections(pieceType: string): [number, number][] {
    switch (pieceType) {
      case 'Pawn':
        return [[0, 1]]; // 간단히 앞으로만
      case 'Knight':
        return [
          [1, 2], [2, 1], [2, -1], [1, -2],
          [-1, -2], [-2, -1], [-2, 1], [-1, 2]
        ];
      case 'Bishop':
        return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      case 'Rook':
        return [[0, 1], [0, -1], [1, 0], [-1, 0]];
      case 'Queen':
      case 'King':
        return [
          [0, 1], [0, -1], [1, 0], [-1, 0],
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
      default:
        return [
          [0, 1], [0, -1], [1, 0], [-1, 0],
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
    }
  }
  
  private isSliding(pieceType: string): boolean {
    return ['Bishop', 'Rook', 'Queen'].includes(pieceType);
  }
  
  /**
   * 수 시뮬레이션 (상태 복사 후 적용)
   */
  private simulateMove(state: GameState, move: Move): GameState {
    const newPieces = state.pieces
      .filter(p => {
        // 출발 위치 기물 제거
        if (p.pos.file === move.from.file && p.pos.rank === move.from.rank) {
          return false;
        }
        // 잡힌 기물 제거
        if (move.captured && 
            p.pos.file === move.to.file && 
            p.pos.rank === move.to.rank) {
          return false;
        }
        return true;
      })
      .map(p => ({ ...p, pos: { ...p.pos }, traits: new Set(p.traits) }));
    
    // 이동한 기물 추가
    newPieces.push({
      ...move.piece,
      pos: { ...move.to },
      traits: new Set(move.piece.traits),
    });
    
    return {
      ...state,
      pieces: newPieces,
      currentPlayer: state.currentPlayer === 'White' ? 'Black' : 'White',
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
