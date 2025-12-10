import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMovesForPattern,
  evaluateCondition,
  isInCheck,
  wouldBeInCheck,
  filterLegalMoves,
  isCheckmate,
  isStalemate,
  MoveContext,
} from '../../src/engine/moves.js';
import { Board, resetPieceIdCounter } from '../../src/engine/board.js';
import { pos } from '../../src/engine/position.js';
import type { Pattern, GameState, Move, Condition } from '../../src/types/index.js';

// Helper to create a minimal game state
function createGameState(): GameState {
  return {
    board: [],
    pieces: [],
    currentPlayer: 'White',
    moveHistory: [],
    halfMoveClock: 0,
    fullMoveNumber: 1,
    positionHistory: [],
    effects: [],
    customState: {},
  };
}

describe('Move generation', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  describe('generateMovesForPattern - step', () => {
    it('should generate step moves in a single direction', () => {
      const board = new Board();
      const piece = board.createPiece('King', 'White', pos(4, 4))!;

      const pattern: Pattern = { type: 'step', direction: 'N', distance: 1 };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(1);
      expect(moves[0].to).toEqual({ file: 4, rank: 5 });
    });

    it('should generate step moves in all directions', () => {
      const board = new Board();
      const piece = board.createPiece('King', 'White', pos(4, 4))!;

      const pattern: Pattern = { type: 'step', direction: 'any', distance: 1 };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(8);
    });

    it('should not generate moves outside board', () => {
      const board = new Board();
      const piece = board.createPiece('King', 'White', pos(0, 0))!;

      const pattern: Pattern = { type: 'step', direction: 'any', distance: 1 };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(3); // NE, E, N only
    });

    it('should generate step moves with distance > 1', () => {
      const board = new Board();
      const piece = board.createPiece('King', 'White', pos(4, 4))!;

      const pattern: Pattern = { type: 'step', direction: 'N', distance: 2 };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(1);
      expect(moves[0].to).toEqual({ file: 4, rank: 6 });
    });
  });

  describe('generateMovesForPattern - slide', () => {
    it('should generate slide moves until blocked', () => {
      const board = new Board();
      const piece = board.createPiece('Rook', 'White', pos(0, 0))!;

      const pattern: Pattern = { type: 'slide', direction: 'E' };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(7); // a1 to h1
    });

    it('should stop at friendly piece', () => {
      const board = new Board();
      const piece = board.createPiece('Rook', 'White', pos(0, 0))!;
      board.createPiece('Pawn', 'White', pos(4, 0)); // Block at e1

      const pattern: Pattern = { type: 'slide', direction: 'E' };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(3); // b1, c1, d1
    });

    it('should capture enemy piece and stop', () => {
      const board = new Board();
      const piece = board.createPiece('Rook', 'White', pos(0, 0))!;
      board.createPiece('Pawn', 'Black', pos(4, 0)); // Enemy at e1

      const pattern: Pattern = { type: 'slide', direction: 'E' };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(4); // b1, c1, d1, e1 (capture)
      expect(moves[3].type).toBe('capture');
    });

    it('should generate orthogonal slide moves', () => {
      const board = new Board();
      const piece = board.createPiece('Rook', 'White', pos(4, 4))!;

      const pattern: Pattern = { type: 'slide', direction: 'orthogonal' };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(14); // 7 horizontal + 7 vertical
    });

    it('should generate diagonal slide moves', () => {
      const board = new Board();
      const piece = board.createPiece('Bishop', 'White', pos(4, 4))!;

      const pattern: Pattern = { type: 'slide', direction: 'diagonal' };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(13);
    });
  });

  describe('generateMovesForPattern - leap', () => {
    it('should generate knight leap moves', () => {
      const board = new Board();
      const piece = board.createPiece('Knight', 'White', pos(4, 4))!;

      const pattern: Pattern = { type: 'leap', dx: 2, dy: 1 };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(8);
    });

    it('should not leap to friendly piece', () => {
      const board = new Board();
      const piece = board.createPiece('Knight', 'White', pos(4, 4))!;
      board.createPiece('Pawn', 'White', pos(6, 5)); // Block one square

      const pattern: Pattern = { type: 'leap', dx: 2, dy: 1 };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(7);
    });

    it('should capture with leap', () => {
      const board = new Board();
      const piece = board.createPiece('Knight', 'White', pos(4, 4))!;
      board.createPiece('Pawn', 'Black', pos(6, 5)); // Enemy piece

      const pattern: Pattern = { type: 'leap', dx: 2, dy: 1 };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      const captureMove = moves.find(m => m.to.file === 6 && m.to.rank === 5);
      expect(captureMove?.type).toBe('capture');
    });
  });

  describe('generateMovesForPattern - hop', () => {
    it('should hop over piece and land on next square', () => {
      const board = new Board();
      const piece = board.createPiece('Cannon', 'White', pos(0, 0))!;
      board.createPiece('Pawn', 'White', pos(3, 0)); // Piece to hop over

      const pattern: Pattern = { type: 'hop', direction: 'E' };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(1);
      expect(moves[0].to).toEqual({ file: 4, rank: 0 });
    });

    it('should not move without piece to hop over', () => {
      const board = new Board();
      const piece = board.createPiece('Cannon', 'White', pos(0, 0))!;

      const pattern: Pattern = { type: 'hop', direction: 'E' };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(0);
    });
  });

  describe('generateMovesForPattern - composite', () => {
    it('should combine patterns with OR', () => {
      const board = new Board();
      const piece = board.createPiece('Queen', 'White', pos(4, 4))!;

      const pattern: Pattern = {
        type: 'composite',
        op: 'or',
        patterns: [
          { type: 'slide', direction: 'orthogonal' },
          { type: 'slide', direction: 'diagonal' },
        ],
      };
      const ctx: MoveContext = {
        board,
        piece,
        state: createGameState(),
        checkLegality: false,
      };

      const moves = generateMovesForPattern(pattern, ctx);
      expect(moves).toHaveLength(27); // 14 orthogonal + 13 diagonal
    });
  });
});

describe('Condition evaluation', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  it('should evaluate empty condition', () => {
    const board = new Board();
    const piece = board.createPiece('King', 'White', pos(4, 4))!;

    const condition: Condition = { type: 'empty' };
    const ctx: MoveContext = {
      board,
      piece,
      state: createGameState(),
      checkLegality: false,
    };
    const move: Move = {
      type: 'normal',
      piece,
      from: pos(4, 4),
      to: pos(4, 5),
    };

    expect(evaluateCondition(condition, ctx, move)).toBe(true);
  });

  it('should evaluate enemy condition', () => {
    const board = new Board();
    const piece = board.createPiece('King', 'White', pos(4, 4))!;
    board.createPiece('Pawn', 'Black', pos(4, 5));

    const condition: Condition = { type: 'enemy' };
    const ctx: MoveContext = {
      board,
      piece,
      state: createGameState(),
      checkLegality: false,
    };
    const move: Move = {
      type: 'capture',
      piece,
      from: pos(4, 4),
      to: pos(4, 5),
    };

    expect(evaluateCondition(condition, ctx, move)).toBe(true);
  });

  it('should evaluate friend condition', () => {
    const board = new Board();
    const piece = board.createPiece('King', 'White', pos(4, 4))!;
    board.createPiece('Pawn', 'White', pos(4, 5));

    const condition: Condition = { type: 'friend' };
    const ctx: MoveContext = {
      board,
      piece,
      state: createGameState(),
      checkLegality: false,
    };
    const move: Move = {
      type: 'normal',
      piece,
      from: pos(4, 4),
      to: pos(4, 5),
    };

    expect(evaluateCondition(condition, ctx, move)).toBe(true);
  });

  it('should evaluate first_move condition', () => {
    const board = new Board();
    const piece = board.createPiece('King', 'White', pos(4, 4))!;

    const condition: Condition = { type: 'first_move' };
    const ctx: MoveContext = {
      board,
      piece,
      state: createGameState(),
      checkLegality: false,
    };
    const move: Move = {
      type: 'normal',
      piece,
      from: pos(4, 4),
      to: pos(4, 5),
    };

    expect(evaluateCondition(condition, ctx, move)).toBe(true);

    // After marking as moved
    piece.state['moved'] = true;
    expect(evaluateCondition(condition, ctx, move)).toBe(false);
  });

  it('should evaluate logical AND condition', () => {
    const board = new Board();
    const piece = board.createPiece('King', 'White', pos(4, 4))!;

    const condition: Condition = {
      type: 'logical',
      op: 'and',
      left: { type: 'empty' },
      right: { type: 'first_move' },
    };
    const ctx: MoveContext = {
      board,
      piece,
      state: createGameState(),
      checkLegality: false,
    };
    const move: Move = {
      type: 'normal',
      piece,
      from: pos(4, 4),
      to: pos(4, 5),
    };

    expect(evaluateCondition(condition, ctx, move)).toBe(true);
  });

  it('should evaluate NOT condition', () => {
    const board = new Board();
    const piece = board.createPiece('King', 'White', pos(4, 4))!;
    board.createPiece('Pawn', 'White', pos(4, 5));

    const condition: Condition = {
      type: 'not',
      condition: { type: 'empty' },
    };
    const ctx: MoveContext = {
      board,
      piece,
      state: createGameState(),
      checkLegality: false,
    };
    const move: Move = {
      type: 'normal',
      piece,
      from: pos(4, 4),
      to: pos(4, 5),
    };

    expect(evaluateCondition(condition, ctx, move)).toBe(true);
  });
});

describe('Check detection', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  it('should detect check by rook', () => {
    const board = new Board();
    board.createPiece('King', 'White', pos(4, 0), ['royal']);
    board.createPiece('Rook', 'Black', pos(4, 7));

    expect(isInCheck(board, 'White')).toBe(true);
  });

  it('should detect check by bishop', () => {
    const board = new Board();
    board.createPiece('King', 'White', pos(4, 0), ['royal']);
    board.createPiece('Bishop', 'Black', pos(7, 3));

    expect(isInCheck(board, 'White')).toBe(true);
  });

  it('should detect check by knight', () => {
    const board = new Board();
    board.createPiece('King', 'White', pos(4, 0), ['royal']);
    board.createPiece('Knight', 'Black', pos(6, 1));

    expect(isInCheck(board, 'White')).toBe(true);
  });

  it('should detect check by pawn', () => {
    const board = new Board();
    board.createPiece('King', 'White', pos(4, 4), ['royal']);
    board.createPiece('Pawn', 'Black', pos(5, 5));

    expect(isInCheck(board, 'White')).toBe(true);
  });

  it('should not detect check when blocked', () => {
    const board = new Board();
    board.createPiece('King', 'White', pos(4, 0), ['royal']);
    board.createPiece('Pawn', 'White', pos(4, 3)); // Blocking piece
    board.createPiece('Rook', 'Black', pos(4, 7));

    expect(isInCheck(board, 'White')).toBe(false);
  });

  it('should return false when no king', () => {
    const board = new Board();
    board.createPiece('Rook', 'Black', pos(4, 7));

    expect(isInCheck(board, 'White')).toBe(false);
  });
});

describe('wouldBeInCheck', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  it('should detect if move would put king in check', () => {
    const board = new Board();
    const king = board.createPiece('King', 'White', pos(4, 0), ['royal'])!;
    board.createPiece('Rook', 'Black', pos(5, 7));

    const move: Move = {
      type: 'normal',
      piece: king,
      from: pos(4, 0),
      to: pos(5, 0), // Moving into rook's attack
    };

    expect(wouldBeInCheck(board, move)).toBe(true);
  });

  it('should allow safe king move', () => {
    const board = new Board();
    const king = board.createPiece('King', 'White', pos(4, 0), ['royal'])!;
    board.createPiece('Rook', 'Black', pos(5, 7));

    const move: Move = {
      type: 'normal',
      piece: king,
      from: pos(4, 0),
      to: pos(3, 0), // Safe square
    };

    expect(wouldBeInCheck(board, move)).toBe(false);
  });
});

describe('filterLegalMoves', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  it('should filter out moves that put king in check', () => {
    const board = new Board();
    const king = board.createPiece('King', 'White', pos(4, 0), ['royal'])!;
    board.createPiece('Rook', 'Black', pos(5, 7));

    const moves: Move[] = [
      { type: 'normal', piece: king, from: pos(4, 0), to: pos(5, 0) }, // Into check
      { type: 'normal', piece: king, from: pos(4, 0), to: pos(3, 0) }, // Safe
      { type: 'normal', piece: king, from: pos(4, 0), to: pos(4, 1) }, // Safe
    ];

    const legalMoves = filterLegalMoves(board, moves);
    expect(legalMoves).toHaveLength(2);
  });
});

describe('Checkmate and Stalemate', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  it('should detect checkmate when in check with no legal moves', () => {
    const board = new Board();
    // Back rank mate
    board.createPiece('King', 'White', pos(0, 0), ['royal']);
    board.createPiece('Rook', 'Black', pos(0, 7)); // Giving check
    board.createPiece('Rook', 'Black', pos(1, 7)); // Covering escape

    const legalMoves: Move[] = [];
    // White king is in check (rook on a8 attacks a1)
    expect(isInCheck(board, 'White')).toBe(true);
    expect(isCheckmate(board, 'White', legalMoves)).toBe(true);
  });

  it('should not detect checkmate when in check but has escape', () => {
    const board = new Board();
    board.createPiece('King', 'White', pos(4, 0), ['royal']);
    board.createPiece('Rook', 'Black', pos(4, 7));

    // King has escape squares
    const king = board.at(pos(4, 0))!;
    const legalMoves: Move[] = [
      { type: 'normal', piece: king, from: pos(4, 0), to: pos(3, 0) },
    ];
    expect(isCheckmate(board, 'White', legalMoves)).toBe(false);
  });

  it('should detect stalemate when not in check but no legal moves', () => {
    const board = new Board();
    // Classic stalemate pattern
    board.createPiece('King', 'White', pos(0, 0), ['royal']);
    board.createPiece('Queen', 'Black', pos(1, 2));
    board.createPiece('King', 'Black', pos(2, 1), ['royal']);

    const legalMoves: Move[] = [];
    // White king is NOT in check
    expect(isInCheck(board, 'White')).toBe(false);
    expect(isStalemate(board, 'White', legalMoves)).toBe(true);
  });

  it('should not detect stalemate when in check', () => {
    const board = new Board();
    board.createPiece('King', 'White', pos(0, 0), ['royal']);
    board.createPiece('Rook', 'Black', pos(0, 7)); // Giving check

    const legalMoves: Move[] = [];
    expect(isInCheck(board, 'White')).toBe(true);
    expect(isStalemate(board, 'White', legalMoves)).toBe(false);
  });
});
