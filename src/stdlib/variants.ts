import type {
  CompiledGame,
  Position,
} from '../types/index.js';
import { pos } from '../engine/position.js';
import {
  STANDARD_CHESS,
  STANDARD_BOARD,
  STANDARD_RULES,
  STANDARD_VICTORY,
} from './standard-chess.js';

/**
 * King of the Hill variant
 * Win by moving your king to the center (d4, d5, e4, e5)
 */
export const KING_OF_THE_HILL: CompiledGame = {
  ...STANDARD_CHESS,
  name: 'King of the Hill',
  board: {
    ...STANDARD_BOARD,
    zones: new Map([
      ...STANDARD_BOARD.zones,
      ['hill', [pos(3, 3), pos(3, 4), pos(4, 3), pos(4, 4)]],
    ]),
  },
  victory: [
    ...STANDARD_VICTORY,
    {
      name: 'hill',
      condition: {
        type: 'in_zone',
        zone: 'hill',
      },
      winner: 'current',
    },
  ],
  triggers: [
    {
      name: 'hill_victory',
      on: 'move',
      when: {
        type: 'logical',
        op: 'and',
        left: {
          type: 'comparison',
          left: { type: 'member', object: { type: 'identifier', name: 'piece' }, property: 'type' },
          op: '==',
          right: { type: 'literal', value: 'King' },
        },
        right: {
          type: 'in_zone',
          zone: 'hill',
        },
      },
      actions: [
        {
          type: 'win',
          player: { type: 'member', object: { type: 'identifier', name: 'piece' }, property: 'owner' },
        },
      ],
    },
  ],
};

/**
 * Three-Check variant
 * Win by giving check three times
 */
export const THREE_CHECK: CompiledGame = {
  ...STANDARD_CHESS,
  name: 'Three-Check',
  victory: [
    ...STANDARD_VICTORY,
    {
      name: 'three_checks',
      condition: {
        type: 'comparison',
        left: { type: 'member', object: { type: 'identifier', name: 'state' }, property: 'checkCount' },
        op: '>=',
        right: { type: 'literal', value: 3 },
      },
      winner: 'opponent',
    },
  ],
  triggers: [
    {
      name: 'count_check',
      on: 'check',
      actions: [
        {
          type: 'set',
          target: { type: 'member', object: { type: 'identifier', name: 'state' }, property: 'checkCount' },
          op: '+=',
          value: { type: 'literal', value: 1 },
        },
      ],
    },
  ],
};

/**
 * Atomic Chess variant
 * Captures cause explosions that destroy all pieces in adjacent squares
 */
export const ATOMIC_CHESS: CompiledGame = {
  ...STANDARD_CHESS,
  name: 'Atomic Chess',
  triggers: [
    {
      name: 'explosion',
      on: 'capture',
      actions: [
        // In a real implementation, this would destroy adjacent pieces
        // For now, this is a placeholder showing the structure
      ],
    },
  ],
};

/**
 * Horde variant
 * White has a horde of pawns vs Black's normal army
 */
export const HORDE: CompiledGame = {
  ...STANDARD_CHESS,
  name: 'Horde',
  setup: {
    placements: [
      // Black pieces (normal setup)
      { pieceType: 'Rook', position: pos(0, 7), owner: 'Black' },
      { pieceType: 'Knight', position: pos(1, 7), owner: 'Black' },
      { pieceType: 'Bishop', position: pos(2, 7), owner: 'Black' },
      { pieceType: 'Queen', position: pos(3, 7), owner: 'Black' },
      { pieceType: 'King', position: pos(4, 7), owner: 'Black' },
      { pieceType: 'Bishop', position: pos(5, 7), owner: 'Black' },
      { pieceType: 'Knight', position: pos(6, 7), owner: 'Black' },
      { pieceType: 'Rook', position: pos(7, 7), owner: 'Black' },
      // Black pawns
      ...createPawnRank(6, 'Black'),
      // White horde of pawns (ranks 1-4)
      ...createPawnRank(0, 'White'),
      ...createPawnRank(1, 'White'),
      ...createPawnRank(2, 'White'),
      ...createPawnRank(3, 'White'),
      // Extra pawns on rank 4
      { pieceType: 'Pawn', position: pos(1, 4), owner: 'White' },
      { pieceType: 'Pawn', position: pos(2, 4), owner: 'White' },
      { pieceType: 'Pawn', position: pos(5, 4), owner: 'White' },
      { pieceType: 'Pawn', position: pos(6, 4), owner: 'White' },
    ],
  },
  victory: [
    {
      name: 'black_checkmate',
      condition: {
        type: 'logical',
        op: 'and',
        left: { type: 'check' },
        right: { type: 'custom', name: 'no_legal_moves', args: [] },
      },
      winner: 'opponent',
    },
    {
      name: 'white_destroys_all',
      condition: {
        type: 'custom',
        name: 'all_pawns_captured',
        args: [],
      },
      winner: 'Black',
    },
  ],
};

/**
 * Racing Kings variant
 * First king to rank 8 wins, no checks allowed
 */
export const RACING_KINGS: CompiledGame = {
  ...STANDARD_CHESS,
  name: 'Racing Kings',
  board: {
    ...STANDARD_BOARD,
    zones: new Map([
      ...STANDARD_BOARD.zones,
      ['finish_line', createRank(7)],
    ]),
  },
  setup: {
    placements: [
      // Custom starting position for Racing Kings
      { pieceType: 'King', position: pos(0, 1), owner: 'White' },
      { pieceType: 'King', position: pos(0, 0), owner: 'Black' },
      { pieceType: 'Queen', position: pos(1, 1), owner: 'White' },
      { pieceType: 'Queen', position: pos(1, 0), owner: 'Black' },
      { pieceType: 'Rook', position: pos(2, 1), owner: 'White' },
      { pieceType: 'Rook', position: pos(2, 0), owner: 'Black' },
      { pieceType: 'Rook', position: pos(3, 1), owner: 'White' },
      { pieceType: 'Rook', position: pos(3, 0), owner: 'Black' },
      { pieceType: 'Bishop', position: pos(4, 1), owner: 'White' },
      { pieceType: 'Bishop', position: pos(4, 0), owner: 'Black' },
      { pieceType: 'Bishop', position: pos(5, 1), owner: 'White' },
      { pieceType: 'Bishop', position: pos(5, 0), owner: 'Black' },
      { pieceType: 'Knight', position: pos(6, 1), owner: 'White' },
      { pieceType: 'Knight', position: pos(6, 0), owner: 'Black' },
      { pieceType: 'Knight', position: pos(7, 1), owner: 'White' },
      { pieceType: 'Knight', position: pos(7, 0), owner: 'Black' },
    ],
  },
  rules: {
    ...STANDARD_RULES,
    checkDetection: true, // Moves that give check are illegal
    castling: false,
    enPassant: false,
    promotion: false,
  },
  victory: [
    {
      name: 'reach_finish',
      condition: {
        type: 'in_zone',
        zone: 'finish_line',
      },
      winner: 'current',
    },
  ],
  draw: [],
};

/**
 * Helper to create pawn placements for a rank
 */
function createPawnRank(rank: number, owner: 'White' | 'Black') {
  const placements = [];
  for (let file = 0; file < 8; file++) {
    placements.push({
      pieceType: 'Pawn',
      position: pos(file, rank),
      owner,
    });
  }
  return placements;
}

/**
 * Helper to create a rank of positions
 */
function createRank(rank: number): Position[] {
  const positions: Position[] = [];
  for (let file = 0; file < 8; file++) {
    positions.push(pos(file, rank));
  }
  return positions;
}

/**
 * Get all available variants
 */
export function getVariants(): Map<string, CompiledGame> {
  return new Map([
    ['Standard Chess', STANDARD_CHESS],
    ['King of the Hill', KING_OF_THE_HILL],
    ['Three-Check', THREE_CHECK],
    ['Atomic', ATOMIC_CHESS],
    ['Horde', HORDE],
    ['Racing Kings', RACING_KINGS],
  ]);
}
