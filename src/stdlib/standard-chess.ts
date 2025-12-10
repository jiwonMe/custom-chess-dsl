import type {
  CompiledGame,
  PieceDefinition,
  BoardConfig,
  PlacementConfig,
  SetupConfig,
  VictoryCondition,
  DrawCondition,
  RuleConfig,
  Position,
} from '../types/index.js';
import { pos } from '../engine/position.js';

/**
 * Standard chess piece definitions
 */
export const STANDARD_PIECES: Map<string, PieceDefinition> = new Map([
  [
    'King',
    {
      name: 'King',
      move: { type: 'step', direction: 'any', distance: 1 },
      capture: 'same',
      traits: ['royal'],
      initialState: { moved: false },
      triggers: [],
    },
  ],
  [
    'Queen',
    {
      name: 'Queen',
      move: {
        type: 'composite',
        op: 'or',
        patterns: [
          { type: 'slide', direction: 'orthogonal' },
          { type: 'slide', direction: 'diagonal' },
        ],
      },
      capture: 'same',
      traits: [],
      initialState: {},
      triggers: [],
    },
  ],
  [
    'Rook',
    {
      name: 'Rook',
      move: { type: 'slide', direction: 'orthogonal' },
      capture: 'same',
      traits: [],
      initialState: { moved: false },
      triggers: [],
    },
  ],
  [
    'Bishop',
    {
      name: 'Bishop',
      move: { type: 'slide', direction: 'diagonal' },
      capture: 'same',
      traits: [],
      initialState: {},
      triggers: [],
    },
  ],
  [
    'Knight',
    {
      name: 'Knight',
      move: { type: 'leap', dx: 2, dy: 1 },
      capture: 'same',
      traits: ['jump'],
      initialState: {},
      triggers: [],
    },
  ],
  [
    'Pawn',
    {
      name: 'Pawn',
      move: {
        type: 'composite',
        op: 'or',
        patterns: [
          {
            type: 'conditional',
            pattern: { type: 'step', direction: 'forward', distance: 1 },
            condition: { type: 'empty' },
          },
          {
            type: 'conditional',
            pattern: { type: 'step', direction: 'forward', distance: 2 },
            condition: {
              type: 'logical',
              op: 'and',
              left: { type: 'empty' },
              right: {
                type: 'logical',
                op: 'and',
                left: { type: 'clear' },
                right: { type: 'first_move' },
              },
            },
          },
        ],
      },
      capture: {
        type: 'conditional',
        pattern: {
          type: 'composite',
          op: 'or',
          patterns: [
            { type: 'step', direction: 'NE', distance: 1 },
            { type: 'step', direction: 'NW', distance: 1 },
          ],
        },
        condition: { type: 'enemy' },
      },
      traits: ['promote'],
      initialState: { justDoublePushed: false },
      triggers: [],
    },
  ],
]);

/**
 * Standard chess board configuration
 */
export const STANDARD_BOARD: BoardConfig = {
  width: 8,
  height: 8,
  zones: new Map([
    ['white_promotion', createRank(7)],
    ['black_promotion', createRank(0)],
    ['white_castle_kingside', [pos(4, 0), pos(5, 0), pos(6, 0), pos(7, 0)]],
    ['white_castle_queenside', [pos(0, 0), pos(1, 0), pos(2, 0), pos(3, 0), pos(4, 0)]],
    ['black_castle_kingside', [pos(4, 7), pos(5, 7), pos(6, 7), pos(7, 7)]],
    ['black_castle_queenside', [pos(0, 7), pos(1, 7), pos(2, 7), pos(3, 7), pos(4, 7)]],
  ]),
};

/**
 * Standard chess starting position
 */
export const STANDARD_SETUP: SetupConfig = {
  placements: [
    // White pieces
    { pieceType: 'Rook', position: pos(0, 0), owner: 'White' },
    { pieceType: 'Knight', position: pos(1, 0), owner: 'White' },
    { pieceType: 'Bishop', position: pos(2, 0), owner: 'White' },
    { pieceType: 'Queen', position: pos(3, 0), owner: 'White' },
    { pieceType: 'King', position: pos(4, 0), owner: 'White' },
    { pieceType: 'Bishop', position: pos(5, 0), owner: 'White' },
    { pieceType: 'Knight', position: pos(6, 0), owner: 'White' },
    { pieceType: 'Rook', position: pos(7, 0), owner: 'White' },
    // White pawns
    ...createPawnRank(1, 'White'),
    // Black pieces
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
  ],
};

/**
 * Standard chess victory conditions
 */
export const STANDARD_VICTORY: VictoryCondition[] = [
  {
    name: 'checkmate',
    condition: {
      type: 'logical',
      op: 'and',
      left: { type: 'check' },
      right: {
        type: 'custom',
        name: 'no_legal_moves',
        args: [],
      },
    },
    winner: 'opponent',
  },
];

/**
 * Standard chess draw conditions
 */
export const STANDARD_DRAW: DrawCondition[] = [
  {
    name: 'stalemate',
    condition: {
      type: 'logical',
      op: 'and',
      left: { type: 'not', condition: { type: 'check' } },
      right: {
        type: 'custom',
        name: 'no_legal_moves',
        args: [],
      },
    },
  },
  {
    name: 'insufficient_material',
    condition: {
      type: 'custom',
      name: 'insufficient_material',
      args: [],
    },
  },
];

/**
 * Standard chess rules
 */
export const STANDARD_RULES: RuleConfig = {
  checkDetection: true,
  castling: true,
  enPassant: true,
  promotion: true,
  fiftyMoveRule: true,
  threefoldRepetition: true,
};

/**
 * Complete standard chess game
 */
export const STANDARD_CHESS: CompiledGame = {
  name: 'Standard Chess',
  board: STANDARD_BOARD,
  pieces: STANDARD_PIECES,
  effects: new Map(),
  triggers: [],
  setup: STANDARD_SETUP,
  victory: STANDARD_VICTORY,
  draw: STANDARD_DRAW,
  rules: STANDARD_RULES,
  scripts: [],
};

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
 * Helper to create pawn placements for a rank
 */
function createPawnRank(rank: number, owner: 'White' | 'Black'): PlacementConfig[] {
  const placements: PlacementConfig[] = [];
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
 * Get standard chess game
 */
export function createStandardChess(): CompiledGame {
  return { ...STANDARD_CHESS };
}
