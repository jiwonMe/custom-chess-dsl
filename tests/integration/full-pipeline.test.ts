import { describe, it, expect, beforeEach } from 'vitest';
import { parse, compileSource, GameEngine } from '../../src/index.js';
import { STANDARD_CHESS, createStandardChess } from '../../src/stdlib/index.js';
import { pos, toSquare } from '../../src/engine/position.js';

describe('Full Pipeline Integration Tests', () => {
  describe('Standard Chess from stdlib', () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(STANDARD_CHESS);
    });

    it('should initialize with correct starting position', () => {
      const state = engine.getState();
      expect(state.currentPlayer).toBe('White');
      expect(state.pieces.length).toBe(32);
    });

    it('should have pieces in correct starting positions', () => {
      const board = engine.getBoard();

      // Check white pieces
      expect(board.at(pos(0, 0))?.type).toBe('Rook');
      expect(board.at(pos(1, 0))?.type).toBe('Knight');
      expect(board.at(pos(4, 0))?.type).toBe('King');
      expect(board.at(pos(3, 0))?.type).toBe('Queen');

      // Check black pieces
      expect(board.at(pos(4, 7))?.type).toBe('King');
      expect(board.at(pos(3, 7))?.type).toBe('Queen');

      // Check pawns
      for (let file = 0; file < 8; file++) {
        expect(board.at(pos(file, 1))?.type).toBe('Pawn');
        expect(board.at(pos(file, 1))?.owner).toBe('White');
        expect(board.at(pos(file, 6))?.type).toBe('Pawn');
        expect(board.at(pos(file, 6))?.owner).toBe('Black');
      }
    });

    it('should generate legal moves for starting position', () => {
      const moves = engine.getLegalMoves();

      // At start: 16 pawn moves (8 single + 8 double) + 4 knight moves = 20
      expect(moves.length).toBe(20);
    });

    it('should execute e4 opening', () => {
      const moves = engine.getLegalMoves();
      const e4 = moves.find(m =>
        toSquare(m.from) === 'e2' && toSquare(m.to) === 'e4'
      );

      expect(e4).toBeDefined();

      const result = engine.makeMove(e4!);
      expect(result.success).toBe(true);
      expect(engine.getState().currentPlayer).toBe('Black');
    });

    it('should execute e4 e5 opening', () => {
      // 1. e4
      const whiteMoves = engine.getLegalMoves();
      const e4 = whiteMoves.find(m =>
        toSquare(m.from) === 'e2' && toSquare(m.to) === 'e4'
      );
      engine.makeMove(e4!);

      // 1... e5
      const blackMoves = engine.getLegalMoves();
      const e5 = blackMoves.find(m =>
        toSquare(m.from) === 'e7' && toSquare(m.to) === 'e5'
      );
      engine.makeMove(e5!);

      expect(engine.getState().currentPlayer).toBe('White');
      expect(engine.getBoard().at(pos(4, 3))).not.toBeNull();
      expect(engine.getBoard().at(pos(4, 4))).not.toBeNull();
    });
  });

  describe('Parse and Compile', () => {
    it('should parse simple piece definition', () => {
      // Use no leading whitespace to avoid indentation issues
      const source = `piece CustomPiece {
  move: step(N)
  capture: =move
}`;

      const ast = parse(source);
      expect(ast.pieces.length).toBe(1);
      expect(ast.pieces[0]!.name).toBe('CustomPiece');
    });

    it('should parse and compile game definition', () => {
      const source = `game: "Test Game"
board:
  size: 8x8

piece Mover {
  move: step(any)
}`;

      const compiled = compileSource(source);
      expect(compiled.name).toBe('Test Game');
      expect(compiled.board.width).toBe(8);
      expect(compiled.board.height).toBe(8);
      expect(compiled.pieces.has('Mover')).toBe(true);
    });

    it('should compile complex piece patterns', () => {
      const source = `piece Slider {
  move: slide(orthogonal)
}

piece Leaper {
  move: leap(2, 1)
}

piece Combo {
  move: slide(diagonal) | leap(1, 2)
}`;

      const compiled = compileSource(source);

      const slider = compiled.pieces.get('Slider');
      expect(slider?.move.type).toBe('slide');

      const leaper = compiled.pieces.get('Leaper');
      expect(leaper?.move.type).toBe('leap');

      const combo = compiled.pieces.get('Combo');
      expect(combo?.move.type).toBe('composite');
    });
  });

  describe('Game Engine with Custom Pieces', () => {
    it('should handle custom piece movement', () => {
      const source = `game: "Custom Game"
board:
  size: 8x8

piece SuperKnight {
  move: leap(3, 1)
}

setup:
  SuperKnight: e4 (White)`;

      const compiled = compileSource(source);
      const engine = new GameEngine(compiled);

      const moves = engine.getLegalMoves();
      // SuperKnight at e4 should have moves based on (3,1) leap pattern
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('Move Legality', () => {
    it('should generate only legal moves in starting position', () => {
      const engine = new GameEngine(createStandardChess());
      const moves = engine.getLegalMoves();

      // Verify we have legal moves (20 in starting position)
      expect(moves.length).toBe(20);

      // All moves should be valid targets
      for (const move of moves) {
        expect(move.from).toBeDefined();
        expect(move.to).toBeDefined();
      }
    });
  });

  describe('Special Moves', () => {
    it('should allow double pawn push from starting position', () => {
      const engine = new GameEngine(STANDARD_CHESS);
      const moves = engine.getLegalMoves();

      // Find e2-e4 (double push)
      const doublePush = moves.find(m =>
        toSquare(m.from) === 'e2' && toSquare(m.to) === 'e4'
      );

      expect(doublePush).toBeDefined();
      // Verify it's a 2-square move
      expect(Math.abs(doublePush!.to.rank - doublePush!.from.rank)).toBe(2);
    });

    it('should not allow double pawn push after pawn has moved', () => {
      const engine = new GameEngine(STANDARD_CHESS);

      // Move e2-e3
      const moves = engine.getLegalMoves();
      const e3 = moves.find(m =>
        toSquare(m.from) === 'e2' && toSquare(m.to) === 'e3'
      );
      engine.makeMove(e3!);

      // Black moves
      const blackMoves = engine.getLegalMoves();
      const a6 = blackMoves.find(m => toSquare(m.to) === 'a6');
      engine.makeMove(a6!);

      // White e-pawn cannot double push anymore
      const whiteMoves = engine.getLegalMoves();
      const doubleFromE3 = whiteMoves.find(m =>
        toSquare(m.from) === 'e3' && toSquare(m.to) === 'e5'
      );

      expect(doubleFromE3).toBeUndefined();
    });
  });

  describe('Undo Move', () => {
    it('should correctly undo a move', () => {
      const engine = new GameEngine(STANDARD_CHESS);

      const originalState = engine.getState();
      const pieceCount = originalState.pieces.length;

      // Make a move
      const moves = engine.getLegalMoves();
      engine.makeMove(moves[0]!);

      // Undo
      const undone = engine.undoMove();
      expect(undone).toBe(true);

      const restoredState = engine.getState();
      expect(restoredState.currentPlayer).toBe('White');
      expect(restoredState.pieces.length).toBe(pieceCount);
    });

    it('should correctly undo a capture', () => {
      const engine = new GameEngine(STANDARD_CHESS);

      // Play Italian Game opening to get to a capture position
      // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. Bxf7+
      const openingMoves = ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6', 'f1-c4', 'f8-c5'];

      for (const notation of openingMoves) {
        const [from, to] = notation.split('-');
        const moves = engine.getLegalMoves();
        const move = moves.find(m =>
          toSquare(m.from) === from && toSquare(m.to) === to
        );
        if (move) {
          engine.makeMove(move);
        }
      }

      // Now capture on f7
      const captureMoves = engine.getLegalMoves();
      const bxf7 = captureMoves.find(m =>
        toSquare(m.from) === 'c4' && toSquare(m.to) === 'f7'
      );

      if (bxf7) {
        const beforeCapture = engine.getState().pieces.length;
        engine.makeMove(bxf7);

        // One less piece after capture
        expect(engine.getState().pieces.length).toBe(beforeCapture - 1);

        // Undo
        engine.undoMove();
        expect(engine.getState().pieces.length).toBe(beforeCapture);
      }
    });
  });

  describe('Chess Variants', () => {
    it('should load King of the Hill variant', async () => {
      const { KING_OF_THE_HILL } = await import('../../src/stdlib/variants.js');
      const engine = new GameEngine(KING_OF_THE_HILL);

      expect(engine.getState().pieces.length).toBe(32);

      // Check that hill zone exists
      const board = engine.getBoard();
      expect(board.isInZone(pos(3, 3), 'hill')).toBe(true);
      expect(board.isInZone(pos(4, 4), 'hill')).toBe(true);
      expect(board.isInZone(pos(0, 0), 'hill')).toBe(false);
    });
  });
});
