import { describe, it, expect, beforeEach } from 'vitest';
import { Board, createStandardBoard, resetPieceIdCounter } from '../../src/engine/board.js';
import { pos, parseSquare } from '../../src/engine/position.js';

describe('Board', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  describe('initialization', () => {
    it('should create an 8x8 board by default', () => {
      const board = new Board();
      expect(board.dimensions).toEqual({ width: 8, height: 8 });
    });

    it('should create a custom size board', () => {
      const board = new Board({ width: 10, height: 10, zones: new Map() });
      expect(board.dimensions).toEqual({ width: 10, height: 10 });
    });
  });

  describe('piece management', () => {
    it('should place a piece on the board', () => {
      const board = new Board();
      const piece = board.createPiece('King', 'White', pos(4, 0), ['royal']);

      expect(piece).not.toBeNull();
      expect(piece?.type).toBe('King');
      expect(piece?.owner).toBe('White');
      expect(piece?.pos).toEqual({ file: 4, rank: 0 });
    });

    it('should get piece at position', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));

      const piece = board.at(pos(4, 0));
      expect(piece?.type).toBe('King');
    });

    it('should remove piece from board', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));

      const removed = board.removePiece(pos(4, 0));
      expect(removed?.type).toBe('King');
      expect(board.at(pos(4, 0))).toBeNull();
    });

    it('should move piece', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));

      board.movePiece(pos(4, 0), pos(4, 1));

      expect(board.at(pos(4, 0))).toBeNull();
      expect(board.at(pos(4, 1))?.type).toBe('King');
    });

    it('should capture piece when moving', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));
      board.createPiece('Pawn', 'Black', pos(4, 1));

      const captured = board.movePiece(pos(4, 0), pos(4, 1));

      expect(captured?.type).toBe('Pawn');
      expect(board.at(pos(4, 1))?.type).toBe('King');
    });
  });

  describe('queries', () => {
    it('should check if position is empty', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));

      expect(board.isEmpty(pos(4, 0))).toBe(false);
      expect(board.isEmpty(pos(5, 0))).toBe(true);
    });

    it('should check for enemy piece', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));
      board.createPiece('King', 'Black', pos(4, 7));

      expect(board.hasEnemy(pos(4, 7), 'White')).toBe(true);
      expect(board.hasEnemy(pos(4, 0), 'White')).toBe(false);
    });

    it('should check for friendly piece', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));
      board.createPiece('Queen', 'White', pos(3, 0));

      expect(board.hasFriend(pos(3, 0), 'White')).toBe(true);
      expect(board.hasFriend(pos(4, 0), 'Black')).toBe(false);
    });

    it('should get all pieces', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));
      board.createPiece('Queen', 'White', pos(3, 0));
      board.createPiece('King', 'Black', pos(4, 7));

      expect(board.getAllPieces()).toHaveLength(3);
    });

    it('should get pieces by color', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));
      board.createPiece('Queen', 'White', pos(3, 0));
      board.createPiece('King', 'Black', pos(4, 7));

      expect(board.getPiecesByColor('White')).toHaveLength(2);
      expect(board.getPiecesByColor('Black')).toHaveLength(1);
    });

    it('should find king', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0), ['royal']);
      board.createPiece('Queen', 'White', pos(3, 0));

      const king = board.findKing('White');
      expect(king?.type).toBe('King');
    });
  });

  describe('path checking', () => {
    it('should check if path is clear horizontally', () => {
      const board = new Board();
      board.createPiece('Rook', 'White', pos(0, 0));

      expect(board.isPathClear(pos(0, 0), pos(7, 0))).toBe(true);

      board.createPiece('Pawn', 'White', pos(4, 0));
      expect(board.isPathClear(pos(0, 0), pos(7, 0))).toBe(false);
    });

    it('should check if path is clear vertically', () => {
      const board = new Board();
      board.createPiece('Rook', 'White', pos(0, 0));

      expect(board.isPathClear(pos(0, 0), pos(0, 7))).toBe(true);

      board.createPiece('Pawn', 'White', pos(0, 4));
      expect(board.isPathClear(pos(0, 0), pos(0, 7))).toBe(false);
    });

    it('should check if path is clear diagonally', () => {
      const board = new Board();
      board.createPiece('Bishop', 'White', pos(0, 0));

      expect(board.isPathClear(pos(0, 0), pos(7, 7))).toBe(true);

      board.createPiece('Pawn', 'White', pos(3, 3));
      expect(board.isPathClear(pos(0, 0), pos(7, 7))).toBe(false);
    });
  });

  describe('zones', () => {
    it('should define and check zones', () => {
      const board = new Board();
      board.defineZone('center', [pos(3, 3), pos(3, 4), pos(4, 3), pos(4, 4)]);

      expect(board.isInZone(pos(3, 3), 'center')).toBe(true);
      expect(board.isInZone(pos(0, 0), 'center')).toBe(false);
    });

    it('should get zone positions', () => {
      const board = new Board();
      board.defineZone('center', [pos(3, 3), pos(3, 4)]);

      expect(board.getZonePositions('center')).toHaveLength(2);
    });
  });

  describe('FEN', () => {
    it('should load from FEN', () => {
      const board = new Board();
      board.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

      expect(board.at(pos(0, 0))?.type).toBe('Rook');
      expect(board.at(pos(0, 0))?.owner).toBe('White');
      expect(board.at(pos(4, 0))?.type).toBe('King');
      expect(board.at(pos(4, 7))?.type).toBe('King');
      expect(board.at(pos(4, 7))?.owner).toBe('Black');
    });

    it('should export to FEN', () => {
      const board = new Board();
      board.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

      const fen = board.toFEN();
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      const board = new Board();
      board.createPiece('King', 'White', pos(4, 0));

      const clone = board.clone();
      clone.movePiece(pos(4, 0), pos(4, 1));

      expect(board.at(pos(4, 0))?.type).toBe('King');
      expect(clone.at(pos(4, 0))).toBeNull();
      expect(clone.at(pos(4, 1))?.type).toBe('King');
    });
  });

  describe('createStandardBoard', () => {
    it('should create a standard chess starting position', () => {
      const board = createStandardBoard();

      // Check white pieces
      expect(board.at(pos(0, 0))?.type).toBe('Rook');
      expect(board.at(pos(1, 0))?.type).toBe('Knight');
      expect(board.at(pos(2, 0))?.type).toBe('Bishop');
      expect(board.at(pos(3, 0))?.type).toBe('Queen');
      expect(board.at(pos(4, 0))?.type).toBe('King');

      // Check pawns
      for (let file = 0; file < 8; file++) {
        expect(board.at(pos(file, 1))?.type).toBe('Pawn');
        expect(board.at(pos(file, 6))?.type).toBe('Pawn');
      }

      // Check total pieces
      expect(board.getAllPieces()).toHaveLength(32);
    });
  });
});
