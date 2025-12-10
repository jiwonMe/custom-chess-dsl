import type { Position, Direction, Color } from '../types/index.js';

// Direction vectors
const DIRECTION_VECTORS: Record<string, [number, number]> = {
  N: [0, 1],
  S: [0, -1],
  E: [1, 0],
  W: [-1, 0],
  NE: [1, 1],
  NW: [-1, 1],
  SE: [1, -1],
  SW: [-1, -1],
};

const ORTHOGONAL_DIRECTIONS: Direction[] = ['N', 'S', 'E', 'W'];
const DIAGONAL_DIRECTIONS: Direction[] = ['NE', 'NW', 'SE', 'SW'];
const ALL_DIRECTIONS: Direction[] = [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];

// File letters for notation (a-z, 최대 26열 지원)
const FILE_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Create a position from file and rank numbers
 */
export function pos(file: number, rank: number): Position {
  return { file, rank };
}

/**
 * Parse algebraic notation (e.g., "e4") to Position
 * By default validates for standard 8x8 board.
 * Pass width/height for custom board sizes.
 */
export function parseSquare(
  notation: string,
  width: number = 8,
  height: number = 8
): Position | null {
  if (notation.length < 2 || notation.length > 3) return null;

  const fileChar = notation[0]!.toLowerCase();
  const file = FILE_LETTERS.indexOf(fileChar);

  if (file < 0 || file >= width) return null;

  const rankPart = notation.slice(1);
  const rank = parseInt(rankPart, 10) - 1;

  if (isNaN(rank) || rank < 0 || rank >= height) {
    return null;
  }

  return { file, rank };
}

/**
 * Convert Position to algebraic notation (e.g., "e4")
 */
export function toSquare(position: Position): string {
  const file = FILE_LETTERS[position.file] ?? '?';
  const rank = position.rank + 1;
  return `${file}${rank}`;
}

/**
 * Check if two positions are equal
 */
export function posEquals(a: Position, b: Position): boolean {
  return a.file === b.file && a.rank === b.rank;
}

/**
 * Check if a position is within the board bounds
 */
export function isInBounds(
  position: Position,
  width: number = 8,
  height: number = 8
): boolean {
  return (
    position.file >= 0 &&
    position.file < width &&
    position.rank >= 0 &&
    position.rank < height
  );
}

/**
 * Get the direction vector for a direction keyword
 */
export function getDirectionVector(
  direction: Direction,
  perspective: Color = 'White'
): [number, number][] {
  // Handle relative directions
  if (direction === 'forward') {
    return perspective === 'White' ? [[0, 1]] : [[0, -1]];
  }
  if (direction === 'backward') {
    return perspective === 'White' ? [[0, -1]] : [[0, 1]];
  }

  // Handle compound directions
  if (direction === 'orthogonal') {
    return ORTHOGONAL_DIRECTIONS.map((d) => DIRECTION_VECTORS[d]!);
  }
  if (direction === 'diagonal') {
    return DIAGONAL_DIRECTIONS.map((d) => DIRECTION_VECTORS[d]!);
  }
  if (direction === 'any') {
    return ALL_DIRECTIONS.map((d) => DIRECTION_VECTORS[d]!);
  }

  // Handle single direction
  const vector = DIRECTION_VECTORS[direction];
  return vector ? [vector] : [];
}

/**
 * Get all 8 rotations/reflections of a leap vector
 */
export function getLeapVectors(dx: number, dy: number): [number, number][] {
  const vectors = new Set<string>();
  const result: [number, number][] = [];

  // All 8 combinations of signs and swaps
  const signs = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  for (const [sx, sy] of signs) {
    // Original orientation
    const v1: [number, number] = [dx * sx!, dy * sy!];
    const k1 = `${v1[0]},${v1[1]}`;
    if (!vectors.has(k1)) {
      vectors.add(k1);
      result.push(v1);
    }

    // Swapped orientation (for non-square leaps)
    if (dx !== dy) {
      const v2: [number, number] = [dy * sx!, dx * sy!];
      const k2 = `${v2[0]},${v2[1]}`;
      if (!vectors.has(k2)) {
        vectors.add(k2);
        result.push(v2);
      }
    }
  }

  return result;
}

/**
 * Add a vector to a position
 */
export function addVector(
  position: Position,
  vector: [number, number]
): Position {
  return {
    file: position.file + vector[0],
    rank: position.rank + vector[1],
  };
}

/**
 * Calculate the distance between two positions
 */
export function distance(from: Position, to: Position): number {
  const df = Math.abs(to.file - from.file);
  const dr = Math.abs(to.rank - from.rank);
  return Math.max(df, dr); // Chebyshev distance
}

/**
 * Calculate Manhattan distance between two positions
 */
export function manhattanDistance(from: Position, to: Position): number {
  return Math.abs(to.file - from.file) + Math.abs(to.rank - from.rank);
}

/**
 * Get all positions adjacent to a given position
 */
export function adjacent(
  position: Position,
  width: number = 8,
  height: number = 8
): Position[] {
  const result: Position[] = [];

  for (const [dx, dy] of Object.values(DIRECTION_VECTORS)) {
    const newPos = { file: position.file + dx, rank: position.rank + dy };
    if (isInBounds(newPos, width, height)) {
      result.push(newPos);
    }
  }

  return result;
}

/**
 * Get all positions on a ray from a starting position
 */
export function ray(
  from: Position,
  direction: [number, number],
  width: number = 8,
  height: number = 8
): Position[] {
  const result: Position[] = [];
  let current = addVector(from, direction);

  while (isInBounds(current, width, height)) {
    result.push(current);
    current = addVector(current, direction);
  }

  return result;
}

/**
 * Get all positions between two positions (exclusive)
 */
export function between(from: Position, to: Position): Position[] {
  const df = to.file - from.file;
  const dr = to.rank - from.rank;

  // Determine if positions are on a line
  if (df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) {
    return []; // Not on a line
  }

  const stepFile = df === 0 ? 0 : df > 0 ? 1 : -1;
  const stepRank = dr === 0 ? 0 : dr > 0 ? 1 : -1;

  const result: Position[] = [];
  let current = { file: from.file + stepFile, rank: from.rank + stepRank };

  while (!posEquals(current, to)) {
    result.push(current);
    current = { file: current.file + stepFile, rank: current.rank + stepRank };
  }

  return result;
}

/**
 * Check if two positions are on the same file
 */
export function sameFile(a: Position, b: Position): boolean {
  return a.file === b.file;
}

/**
 * Check if two positions are on the same rank
 */
export function sameRank(a: Position, b: Position): boolean {
  return a.rank === b.rank;
}

/**
 * Check if two positions are on the same diagonal
 */
export function sameDiagonal(a: Position, b: Position): boolean {
  return Math.abs(a.file - b.file) === Math.abs(a.rank - b.rank);
}

/**
 * Check if two positions are on the same line (file, rank, or diagonal)
 */
export function sameLine(a: Position, b: Position): boolean {
  return sameFile(a, b) || sameRank(a, b) || sameDiagonal(a, b);
}

/**
 * Get all positions in a rank
 */
export function rank(rankNum: number, width: number = 8): Position[] {
  const result: Position[] = [];
  for (let file = 0; file < width; file++) {
    result.push({ file, rank: rankNum });
  }
  return result;
}

/**
 * Get all positions in a file
 */
export function file(fileNum: number, height: number = 8): Position[] {
  const result: Position[] = [];
  for (let r = 0; r < height; r++) {
    result.push({ file: fileNum, rank: r });
  }
  return result;
}

/**
 * Mirror a position horizontally
 */
export function mirrorHorizontal(
  position: Position,
  width: number = 8
): Position {
  return { file: width - 1 - position.file, rank: position.rank };
}

/**
 * Mirror a position vertically
 */
export function mirrorVertical(
  position: Position,
  height: number = 8
): Position {
  return { file: position.file, rank: height - 1 - position.rank };
}

/**
 * Rotate a position 180 degrees
 */
export function rotate180(
  position: Position,
  width: number = 8,
  height: number = 8
): Position {
  return {
    file: width - 1 - position.file,
    rank: height - 1 - position.rank,
  };
}
