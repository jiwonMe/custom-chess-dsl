// Re-export types from chesslang core
export type {
  Position,
  Color,
  Piece,
  Move,
  MoveType,
  MoveResult,
  GameState,
  GameResult,
  GameEvent,
  CompiledGame,
  Pattern,
  Condition,
  Direction,
} from '../../../src/types/index.js';

// Web-specific types
export interface BoardTheme {
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  legalMoveSquare: string;
  lastMoveSquare: string;
  checkSquare: string;
}

export interface EditorTheme {
  background: string;
  foreground: string;
  keyword: string;
  string: string;
  comment: string;
  number: string;
  operator: string;
}

export interface EngineMessage {
  type: 'compiled' | 'state' | 'moves' | 'error' | 'event';
  payload: unknown;
}

export interface CompileRequest {
  type: 'compile';
  payload: string;
}

export interface MoveRequest {
  type: 'move';
  payload: Move;
}

export interface ResetRequest {
  type: 'reset';
}

export interface UndoRequest {
  type: 'undo';
}

export type WorkerRequest = CompileRequest | MoveRequest | ResetRequest | UndoRequest;

// Import Position and Move for local use
import type { Position, Move } from '../../../src/types/index.js';
