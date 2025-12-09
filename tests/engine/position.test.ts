import { describe, it, expect } from 'vitest';
import {
  pos,
  parseSquare,
  toSquare,
  posEquals,
  isInBounds,
  getDirectionVector,
  getLeapVectors,
  addVector,
  distance,
  adjacent,
  ray,
  between,
  sameFile,
  sameRank,
  sameDiagonal,
} from '../../src/engine/position.js';

describe('Position utilities', () => {
  describe('pos', () => {
    it('should create a position', () => {
      const p = pos(4, 3);
      expect(p).toEqual({ file: 4, rank: 3 });
    });
  });

  describe('parseSquare', () => {
    it('should parse valid square notation', () => {
      expect(parseSquare('e4')).toEqual({ file: 4, rank: 3 });
      expect(parseSquare('a1')).toEqual({ file: 0, rank: 0 });
      expect(parseSquare('h8')).toEqual({ file: 7, rank: 7 });
    });

    it('should return null for invalid notation', () => {
      expect(parseSquare('i1')).toBeNull();
      expect(parseSquare('a9')).toBeNull();
      expect(parseSquare('abc')).toBeNull();
    });
  });

  describe('toSquare', () => {
    it('should convert position to notation', () => {
      expect(toSquare(pos(4, 3))).toBe('e4');
      expect(toSquare(pos(0, 0))).toBe('a1');
      expect(toSquare(pos(7, 7))).toBe('h8');
    });
  });

  describe('posEquals', () => {
    it('should compare positions', () => {
      expect(posEquals(pos(4, 3), pos(4, 3))).toBe(true);
      expect(posEquals(pos(4, 3), pos(4, 4))).toBe(false);
    });
  });

  describe('isInBounds', () => {
    it('should check standard board bounds', () => {
      expect(isInBounds(pos(0, 0))).toBe(true);
      expect(isInBounds(pos(7, 7))).toBe(true);
      expect(isInBounds(pos(-1, 0))).toBe(false);
      expect(isInBounds(pos(8, 0))).toBe(false);
    });

    it('should check custom board bounds', () => {
      expect(isInBounds(pos(9, 9), 10, 10)).toBe(true);
      expect(isInBounds(pos(9, 9), 8, 8)).toBe(false);
    });
  });

  describe('getDirectionVector', () => {
    it('should return correct vectors for cardinal directions', () => {
      expect(getDirectionVector('N')).toEqual([[0, 1]]);
      expect(getDirectionVector('S')).toEqual([[0, -1]]);
      expect(getDirectionVector('E')).toEqual([[1, 0]]);
      expect(getDirectionVector('W')).toEqual([[-1, 0]]);
    });

    it('should return correct vectors for diagonal directions', () => {
      expect(getDirectionVector('NE')).toEqual([[1, 1]]);
      expect(getDirectionVector('NW')).toEqual([[-1, 1]]);
      expect(getDirectionVector('SE')).toEqual([[1, -1]]);
      expect(getDirectionVector('SW')).toEqual([[-1, -1]]);
    });

    it('should return all orthogonal vectors', () => {
      const vectors = getDirectionVector('orthogonal');
      expect(vectors).toHaveLength(4);
    });

    it('should return all diagonal vectors', () => {
      const vectors = getDirectionVector('diagonal');
      expect(vectors).toHaveLength(4);
    });

    it('should return all 8 vectors for any', () => {
      const vectors = getDirectionVector('any');
      expect(vectors).toHaveLength(8);
    });

    it('should handle forward direction based on color', () => {
      expect(getDirectionVector('forward', 'White')).toEqual([[0, 1]]);
      expect(getDirectionVector('forward', 'Black')).toEqual([[0, -1]]);
    });
  });

  describe('getLeapVectors', () => {
    it('should return all knight move vectors', () => {
      const vectors = getLeapVectors(2, 1);
      expect(vectors).toHaveLength(8);

      // Should include all knight moves
      expect(vectors).toContainEqual([2, 1]);
      expect(vectors).toContainEqual([2, -1]);
      expect(vectors).toContainEqual([-2, 1]);
      expect(vectors).toContainEqual([-2, -1]);
      expect(vectors).toContainEqual([1, 2]);
      expect(vectors).toContainEqual([1, -2]);
      expect(vectors).toContainEqual([-1, 2]);
      expect(vectors).toContainEqual([-1, -2]);
    });

    it('should return 4 vectors for square leap', () => {
      const vectors = getLeapVectors(2, 2);
      expect(vectors).toHaveLength(4);
    });
  });

  describe('addVector', () => {
    it('should add vector to position', () => {
      expect(addVector(pos(4, 4), [1, 1])).toEqual({ file: 5, rank: 5 });
      expect(addVector(pos(4, 4), [-1, -1])).toEqual({ file: 3, rank: 3 });
    });
  });

  describe('distance', () => {
    it('should calculate Chebyshev distance', () => {
      expect(distance(pos(0, 0), pos(0, 0))).toBe(0);
      expect(distance(pos(0, 0), pos(1, 1))).toBe(1);
      expect(distance(pos(0, 0), pos(3, 4))).toBe(4);
    });
  });

  describe('adjacent', () => {
    it('should return all adjacent positions', () => {
      const adj = adjacent(pos(4, 4));
      expect(adj).toHaveLength(8);
    });

    it('should return fewer positions near edge', () => {
      const adj = adjacent(pos(0, 0));
      expect(adj).toHaveLength(3);
    });
  });

  describe('ray', () => {
    it('should return all positions in a direction', () => {
      const positions = ray(pos(0, 0), [1, 0]);
      expect(positions).toHaveLength(7); // a1 to h1 (excluding start)
      expect(positions[0]).toEqual({ file: 1, rank: 0 });
    });
  });

  describe('between', () => {
    it('should return positions between two positions', () => {
      const positions = between(pos(0, 0), pos(4, 0));
      expect(positions).toHaveLength(3);
      expect(positions).toContainEqual({ file: 1, rank: 0 });
      expect(positions).toContainEqual({ file: 2, rank: 0 });
      expect(positions).toContainEqual({ file: 3, rank: 0 });
    });

    it('should return empty for adjacent positions', () => {
      const positions = between(pos(0, 0), pos(1, 0));
      expect(positions).toHaveLength(0);
    });

    it('should return empty for non-line positions', () => {
      const positions = between(pos(0, 0), pos(2, 1));
      expect(positions).toHaveLength(0);
    });
  });

  describe('line checks', () => {
    it('should check same file', () => {
      expect(sameFile(pos(4, 0), pos(4, 7))).toBe(true);
      expect(sameFile(pos(4, 0), pos(5, 0))).toBe(false);
    });

    it('should check same rank', () => {
      expect(sameRank(pos(0, 4), pos(7, 4))).toBe(true);
      expect(sameRank(pos(0, 4), pos(0, 5))).toBe(false);
    });

    it('should check same diagonal', () => {
      expect(sameDiagonal(pos(0, 0), pos(7, 7))).toBe(true);
      expect(sameDiagonal(pos(0, 0), pos(7, 6))).toBe(false);
    });
  });
});
