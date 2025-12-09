import type {
  Position,
  Color,
  Square,
  Piece,
  Effect,
  BoardConfig,
} from '../types/index.js';
import {
  pos,
  parseSquare,
  posEquals,
  isInBounds,
} from './position.js';

/**
 * Generate a unique ID for pieces
 */
let pieceIdCounter = 0;
export function generatePieceId(): string {
  return `piece_${++pieceIdCounter}`;
}

/**
 * Reset the piece ID counter (useful for testing)
 */
export function resetPieceIdCounter(): void {
  pieceIdCounter = 0;
}

/**
 * Board class representing the chess board state
 */
export class Board {
  private squares: Square[][];
  private pieceMap: Map<string, Piece>;
  private readonly width: number;
  private readonly height: number;
  private zones: Map<string, Position[]>;

  constructor(config: BoardConfig = { width: 8, height: 8, zones: new Map() }) {
    this.width = config.width;
    this.height = config.height;
    this.zones = new Map(config.zones);
    this.pieceMap = new Map();
    this.squares = this.initializeSquares();
  }

  /**
   * Initialize empty board squares
   */
  private initializeSquares(): Square[][] {
    const squares: Square[][] = [];

    for (let rank = 0; rank < this.height; rank++) {
      const row: Square[] = [];
      for (let file = 0; file < this.width; file++) {
        const position = pos(file, rank);
        const zone = this.getZoneForPosition(position);
        row.push({
          pos: position,
          piece: null,
          effects: [],
          zone,
        });
      }
      squares.push(row);
    }

    return squares;
  }

  /**
   * Get the zone name for a position, if any
   */
  private getZoneForPosition(position: Position): string | undefined {
    for (const [zoneName, positions] of this.zones) {
      if (positions.some((p) => posEquals(p, position))) {
        return zoneName;
      }
    }
    return undefined;
  }

  /**
   * Get board dimensions
   */
  get dimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get a square at a given position
   */
  getSquare(position: Position): Square | null {
    if (!isInBounds(position, this.width, this.height)) {
      return null;
    }
    return this.squares[position.rank]![position.file]!;
  }

  /**
   * Get a square using algebraic notation
   */
  getSquareByNotation(notation: string): Square | null {
    const position = parseSquare(notation);
    if (!position) return null;
    return this.getSquare(position);
  }

  /**
   * Get the piece at a given position
   */
  at(position: Position): Piece | null {
    const square = this.getSquare(position);
    return square?.piece ?? null;
  }

  /**
   * Get piece using algebraic notation
   */
  atNotation(notation: string): Piece | null {
    const position = parseSquare(notation);
    if (!position) return null;
    return this.at(position);
  }

  /**
   * Check if a position is empty
   */
  isEmpty(position: Position): boolean {
    return this.at(position) === null;
  }

  /**
   * Check if a position has an enemy piece
   */
  hasEnemy(position: Position, perspective: Color): boolean {
    const piece = this.at(position);
    return piece !== null && piece.owner !== perspective;
  }

  /**
   * Check if a position has a friendly piece
   */
  hasFriend(position: Position, perspective: Color): boolean {
    const piece = this.at(position);
    return piece !== null && piece.owner === perspective;
  }

  /**
   * Place a piece on the board
   */
  placePiece(piece: Piece): boolean {
    if (!isInBounds(piece.pos, this.width, this.height)) {
      return false;
    }

    const square = this.squares[piece.pos.rank]![piece.pos.file]!;
    if (square.piece !== null) {
      // Remove existing piece
      this.pieceMap.delete(square.piece.id);
    }

    square.piece = piece;
    this.pieceMap.set(piece.id, piece);
    return true;
  }

  /**
   * Create and place a new piece
   */
  createPiece(
    type: string,
    owner: Color,
    position: Position,
    traits: string[] = [],
    state: Record<string, unknown> = {}
  ): Piece | null {
    if (!isInBounds(position, this.width, this.height)) {
      return null;
    }

    const piece: Piece = {
      id: generatePieceId(),
      type,
      owner,
      pos: position,
      traits: new Set(traits),
      state: { ...state },
    };

    this.placePiece(piece);
    return piece;
  }

  /**
   * Remove a piece from the board
   */
  removePiece(position: Position): Piece | null {
    const square = this.getSquare(position);
    if (!square || !square.piece) {
      return null;
    }

    const piece = square.piece;
    square.piece = null;
    this.pieceMap.delete(piece.id);
    return piece;
  }

  /**
   * Remove a piece by ID
   */
  removePieceById(pieceId: string): Piece | null {
    const piece = this.pieceMap.get(pieceId);
    if (!piece) return null;
    return this.removePiece(piece.pos);
  }

  /**
   * Move a piece from one position to another
   */
  movePiece(from: Position, to: Position): Piece | null {
    const piece = this.removePiece(from);
    if (!piece) return null;

    // Remove any piece at destination
    const captured = this.removePiece(to);

    // Update piece position
    piece.pos = to;
    this.placePiece(piece);

    return captured;
  }

  /**
   * Get all pieces on the board
   */
  getAllPieces(): Piece[] {
    return Array.from(this.pieceMap.values());
  }

  /**
   * Get all pieces of a specific color
   */
  getPiecesByColor(color: Color): Piece[] {
    return this.getAllPieces().filter((p) => p.owner === color);
  }

  /**
   * Get all pieces of a specific type
   */
  getPiecesByType(type: string): Piece[] {
    return this.getAllPieces().filter((p) => p.type === type);
  }

  /**
   * Get a piece by ID
   */
  getPieceById(id: string): Piece | null {
    return this.pieceMap.get(id) ?? null;
  }

  /**
   * Find pieces matching a predicate
   */
  findPieces(predicate: (piece: Piece) => boolean): Piece[] {
    return this.getAllPieces().filter(predicate);
  }

  /**
   * Find the king of a color
   */
  findKing(color: Color): Piece | null {
    return (
      this.findPieces(
        (p) => p.owner === color && p.traits.has('royal')
      )[0] ?? null
    );
  }

  /**
   * Add an effect to a square
   */
  addEffect(position: Position, effect: Effect): boolean {
    const square = this.getSquare(position);
    if (!square) return false;
    square.effects.push(effect);
    return true;
  }

  /**
   * Remove an effect from a square
   */
  removeEffect(position: Position, effectId: string): Effect | null {
    const square = this.getSquare(position);
    if (!square) return null;

    const index = square.effects.findIndex((e) => e.id === effectId);
    if (index === -1) return null;

    return square.effects.splice(index, 1)[0]!;
  }

  /**
   * Get effects at a position
   */
  getEffects(position: Position): Effect[] {
    const square = this.getSquare(position);
    return square?.effects ?? [];
  }

  /**
   * Check if a path is clear (no pieces between two positions)
   */
  isPathClear(from: Position, to: Position): boolean {
    const df = to.file - from.file;
    const dr = to.rank - from.rank;

    // Must be on a line
    if (df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) {
      return false;
    }

    const stepFile = df === 0 ? 0 : df > 0 ? 1 : -1;
    const stepRank = dr === 0 ? 0 : dr > 0 ? 1 : -1;

    let current = pos(from.file + stepFile, from.rank + stepRank);

    while (!posEquals(current, to)) {
      if (!this.isEmpty(current)) {
        return false;
      }
      current = pos(current.file + stepFile, current.rank + stepRank);
    }

    return true;
  }

  /**
   * Get all positions in a zone
   */
  getZonePositions(zoneName: string): Position[] {
    return this.zones.get(zoneName) ?? [];
  }

  /**
   * Check if a position is in a zone
   */
  isInZone(position: Position, zoneName: string): boolean {
    const zonePositions = this.zones.get(zoneName);
    if (!zonePositions) return false;
    return zonePositions.some((p) => posEquals(p, position));
  }

  /**
   * Define a zone
   */
  defineZone(name: string, positions: Position[]): void {
    this.zones.set(name, positions);

    // Update square zone references
    for (const position of positions) {
      const square = this.getSquare(position);
      if (square) {
        square.zone = name;
      }
    }
  }

  /**
   * Clone the board
   */
  clone(): Board {
    const config: BoardConfig = {
      width: this.width,
      height: this.height,
      zones: new Map(this.zones),
    };

    const newBoard = new Board(config);

    // Clone pieces
    for (const piece of this.getAllPieces()) {
      newBoard.createPiece(
        piece.type,
        piece.owner,
        { ...piece.pos },
        Array.from(piece.traits),
        { ...piece.state }
      );
    }

    // Clone effects
    for (let rank = 0; rank < this.height; rank++) {
      for (let file = 0; file < this.width; file++) {
        const effects = this.squares[rank]![file]!.effects;
        for (const effect of effects) {
          newBoard.addEffect(pos(file, rank), { ...effect });
        }
      }
    }

    return newBoard;
  }

  /**
   * Clear the board
   */
  clear(): void {
    this.pieceMap.clear();
    this.squares = this.initializeSquares();
  }

  /**
   * Export board to FEN-like notation (piece placement only)
   */
  toFEN(): string {
    const rows: string[] = [];

    for (let rank = this.height - 1; rank >= 0; rank--) {
      let row = '';
      let emptyCount = 0;

      for (let file = 0; file < this.width; file++) {
        const piece = this.at(pos(file, rank));

        if (piece) {
          if (emptyCount > 0) {
            row += emptyCount;
            emptyCount = 0;
          }
          row += pieceToFENChar(piece);
        } else {
          emptyCount++;
        }
      }

      if (emptyCount > 0) {
        row += emptyCount;
      }

      rows.push(row);
    }

    return rows.join('/');
  }

  /**
   * Load board from FEN-like notation (piece placement only)
   */
  loadFEN(fen: string): void {
    this.clear();

    const rows = fen.split('/');
    const rankCount = Math.min(rows.length, this.height);

    for (let i = 0; i < rankCount; i++) {
      const rank = this.height - 1 - i;
      const row = rows[i]!;
      let file = 0;

      for (const char of row) {
        if (file >= this.width) break;

        if (/[0-9]/.test(char)) {
          file += parseInt(char, 10);
        } else {
          const { type, owner } = fenCharToPiece(char);
          const traits = getDefaultTraits(type);
          const state = getDefaultState(type);
          this.createPiece(type, owner, pos(file, rank), traits, state);
          file++;
        }
      }
    }
  }

  /**
   * Get a visual representation of the board (for debugging)
   */
  toString(): string {
    const lines: string[] = [];

    for (let rank = this.height - 1; rank >= 0; rank--) {
      let line = `${rank + 1} `;

      for (let file = 0; file < this.width; file++) {
        const piece = this.at(pos(file, rank));
        if (piece) {
          line += pieceToFENChar(piece) + ' ';
        } else {
          line += '. ';
        }
      }

      lines.push(line);
    }

    lines.push('  ' + 'abcdefgh'.slice(0, this.width).split('').join(' '));

    return lines.join('\n');
  }
}

/**
 * Convert a piece to FEN character
 */
function pieceToFENChar(piece: Piece): string {
  const typeMap: Record<string, string> = {
    King: 'k',
    Queen: 'q',
    Rook: 'r',
    Bishop: 'b',
    Knight: 'n',
    Pawn: 'p',
  };

  const char = typeMap[piece.type] ?? piece.type[0]?.toLowerCase() ?? '?';
  return piece.owner === 'White' ? char.toUpperCase() : char;
}

/**
 * Convert FEN character to piece info
 */
function fenCharToPiece(char: string): { type: string; owner: Color } {
  const charMap: Record<string, string> = {
    k: 'King',
    q: 'Queen',
    r: 'Rook',
    b: 'Bishop',
    n: 'Knight',
    p: 'Pawn',
  };

  const lowerChar = char.toLowerCase();
  const type = charMap[lowerChar] ?? 'Unknown';
  const owner: Color = char === char.toUpperCase() ? 'White' : 'Black';

  return { type, owner };
}

/**
 * Get default traits for standard piece types
 */
function getDefaultTraits(type: string): string[] {
  const traitMap: Record<string, string[]> = {
    King: ['royal'],
    Queen: [],
    Rook: [],
    Bishop: [],
    Knight: ['jump'],
    Pawn: ['promote'],
  };

  return traitMap[type] ?? [];
}

/**
 * Get default state for standard piece types
 */
function getDefaultState(type: string): Record<string, unknown> {
  const stateMap: Record<string, Record<string, unknown>> = {
    King: { moved: false },
    Rook: { moved: false },
    Pawn: { justDouble: false },
  };

  return stateMap[type] ?? {};
}

/**
 * Create a standard 8x8 chess board
 */
export function createStandardBoard(): Board {
  const board = new Board({
    width: 8,
    height: 8,
    zones: new Map([
      ['white_promotion', parseSquares(['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'])],
      ['black_promotion', parseSquares(['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'])],
    ]),
  });

  // Set up standard starting position
  board.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

  return board;
}

/**
 * Helper to parse multiple square notations
 */
function parseSquares(notations: string[]): Position[] {
  return notations
    .map(parseSquare)
    .filter((p): p is Position => p !== null);
}
