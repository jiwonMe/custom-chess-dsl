/**
 * Script Runtime for ChessLang
 * Executes user-defined scripts within a sandboxed environment
 */

import type {
  ScriptEvent,
  ScriptEventType,
  ScriptEventHandler,
  Position,
  Piece,
  Color,
} from '../types/index.js';
import type { Board } from './board.js';
import { toSquare, parseSquare, distance as calcDistance } from './position.js';

/**
 * Game API exposed to scripts
 */
export interface GameScriptAPI {
  // State
  state: Record<string, unknown>;
  currentPlayer: Color;

  // Event handling
  on: (event: ScriptEventType, handler: ScriptEventHandler) => void;

  // Game control
  endTurn: () => void;
  declareWinner: (winner: Color, reason: string) => void;
  declareDraw: (reason: string) => void;
  allowExtraMove: (player: Color) => void;

  // Queries
  isCheck: (player: Color) => boolean;
  isCheckmate: (player: Color) => boolean;
  getStatus: () => string;
  canEndTurn: () => boolean;
}

/**
 * Board API exposed to scripts
 */
export interface BoardScriptAPI {
  // Queries
  at: (pos: Position | string) => Piece | null;
  pieces: Piece[];
  emptySquares: () => Position[];
  adjacent: (pos: Position) => Position[];
  isValidPos: (pos: Position) => boolean;

  // Piece queries
  getPieces: (owner?: Color, type?: string) => Piece[];

  // Mutations (controlled)
  movePiece: (from: Position, to: Position) => boolean;
  removePiece: (pos: Position) => Piece | null;
  createPiece: (type: string, owner: Color, pos: Position) => Piece | null;
}

/**
 * Script Runtime manages script execution and event handling
 */
export class ScriptRuntime {
  private eventHandlers: Map<ScriptEventType, ScriptEventHandler[]> = new Map();
  private gameState: Record<string, unknown> = {};
  private board: Board;
  private currentPlayer: Color = 'White';
  private statusMessage = '';
  private extraMoveAllowed: Color | null = null;
  private turnEnded = false;
  private winner: Color | null = null;
  private winReason: string | null = null;
  private isDraw = false;
  private drawReason: string | null = null;

  // Callbacks for engine integration
  private checkCallback: ((player: Color) => boolean) | null = null;
  private checkmateCallback: ((player: Color) => boolean) | null = null;

  constructor(board: Board) {
    this.board = board;
  }

  /**
   * Set callbacks for check/checkmate queries
   */
  setCallbacks(
    checkFn: (player: Color) => boolean,
    checkmateFn: (player: Color) => boolean
  ): void {
    this.checkCallback = checkFn;
    this.checkmateCallback = checkmateFn;
  }

  /**
   * Set current player
   */
  setCurrentPlayer(player: Color): void {
    this.currentPlayer = player;
  }

  /**
   * Execute scripts in a sandboxed environment
   */
  executeScripts(scripts: string[]): void {
    const gameAPI = this.createGameAPI();
    const boardAPI = this.createBoardAPI();

    for (const script of scripts) {
      try {
        this.executeScript(script, gameAPI, boardAPI);
      } catch (error) {
        console.error('Script execution error:', error);
      }
    }
  }

  /**
   * Execute a single script
   */
  private executeScript(
    code: string,
    game: GameScriptAPI,
    board: BoardScriptAPI
  ): void {
    // Create a sandboxed function with game and board APIs
    const fn = new Function(
      'game',
      'board',
      'toSquare',
      'parseSquare',
      'distance',
      'console',
      code
    );

    // Execute with safe console
    const safeConsole = {
      log: (...args: unknown[]) => console.log('[Script]', ...args),
      warn: (...args: unknown[]) => console.warn('[Script]', ...args),
      error: (...args: unknown[]) => console.error('[Script]', ...args),
    };

    fn(game, board, toSquare, parseSquare, calcDistance, safeConsole);
  }

  /**
   * Create the game API object for scripts
   */
  private createGameAPI(): GameScriptAPI {
    return {
      state: this.gameState,
      currentPlayer: this.currentPlayer,

      on: (event: ScriptEventType, handler: ScriptEventHandler) => {
        if (!this.eventHandlers.has(event)) {
          this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);
      },

      endTurn: () => {
        this.turnEnded = true;
      },

      declareWinner: (winner: Color, reason: string) => {
        this.winner = winner;
        this.winReason = reason;
      },

      declareDraw: (reason: string) => {
        this.isDraw = true;
        this.drawReason = reason;
      },

      allowExtraMove: (player: Color) => {
        this.extraMoveAllowed = player;
      },

      isCheck: (player: Color) => {
        return this.checkCallback?.(player) ?? false;
      },

      isCheckmate: (player: Color) => {
        return this.checkmateCallback?.(player) ?? false;
      },

      getStatus: () => this.statusMessage,

      canEndTurn: () => true,
    };
  }

  /**
   * Create the board API object for scripts
   */
  private createBoardAPI(): BoardScriptAPI {
    return {
      at: (posOrNotation: Position | string): Piece | null => {
        const pos =
          typeof posOrNotation === 'string'
            ? parseSquare(posOrNotation)
            : posOrNotation;
        if (!pos) return null;
        return this.board.at(pos);
      },

      pieces: this.board.getAllPieces(),

      emptySquares: () => {
        const result: Position[] = [];
        const dims = this.board.dimensions;
        for (let file = 0; file < dims.width; file++) {
          for (let rank = 0; rank < dims.height; rank++) {
            const pos = { file, rank };
            if (!this.board.at(pos)) {
              result.push(pos);
            }
          }
        }
        return result;
      },

      adjacent: (pos: Position) => {
        const result: Position[] = [];
        const dims = this.board.dimensions;
        for (let df = -1; df <= 1; df++) {
          for (let dr = -1; dr <= 1; dr++) {
            if (df === 0 && dr === 0) continue;
            const newPos = { file: pos.file + df, rank: pos.rank + dr };
            if (
              newPos.file >= 0 &&
              newPos.file < dims.width &&
              newPos.rank >= 0 &&
              newPos.rank < dims.height
            ) {
              result.push(newPos);
            }
          }
        }
        return result;
      },

      isValidPos: (pos: Position) => {
        const dims = this.board.dimensions;
        return (
          pos.file >= 0 &&
          pos.file < dims.width &&
          pos.rank >= 0 &&
          pos.rank < dims.height
        );
      },

      getPieces: (owner?: Color, type?: string) => {
        let pieces = this.board.getAllPieces();
        if (owner) {
          pieces = pieces.filter((p) => p.owner === owner);
        }
        if (type) {
          pieces = pieces.filter((p) => p.type === type);
        }
        return pieces;
      },

      movePiece: (from: Position, to: Position) => {
        const piece = this.board.at(from);
        if (!piece) return false;
        this.board.movePiece(from, to);
        return true;
      },

      removePiece: (pos: Position) => {
        return this.board.removePiece(pos);
      },

      createPiece: (type: string, owner: Color, pos: Position) => {
        return this.board.createPiece(type, owner, pos, [], {});
      },
    };
  }

  /**
   * Emit an event to all registered handlers
   */
  emitEvent(event: ScriptEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      }
    }
  }

  /**
   * Get game state for scripts
   */
  getGameState(): Record<string, unknown> {
    return this.gameState;
  }

  /**
   * Check if turn was ended by script
   */
  isTurnEnded(): boolean {
    return this.turnEnded;
  }

  /**
   * Reset turn ended flag
   */
  resetTurnEnded(): void {
    this.turnEnded = false;
  }

  /**
   * Get winner declared by script
   */
  getWinner(): { winner: Color; reason: string } | null {
    if (this.winner) {
      return { winner: this.winner, reason: this.winReason ?? '' };
    }
    return null;
  }

  /**
   * Get draw declared by script
   */
  getDraw(): { reason: string } | null {
    if (this.isDraw) {
      return { reason: this.drawReason ?? '' };
    }
    return null;
  }

  /**
   * Check if extra move is allowed
   */
  getExtraMoveAllowed(): Color | null {
    const result = this.extraMoveAllowed;
    this.extraMoveAllowed = null;
    return result;
  }

  /**
   * Check if any move event handlers are registered
   * If so, scripts control turn switching
   */
  hasMoveHandlers(): boolean {
    return (this.eventHandlers.get('move')?.length ?? 0) > 0;
  }

  /**
   * Check if scripts should control turn flow
   */
  controlsTurnFlow(): boolean {
    return this.hasMoveHandlers();
  }

  /**
   * Reset all handlers and state
   */
  reset(): void {
    this.eventHandlers.clear();
    this.gameState = {};
    this.turnEnded = false;
    this.winner = null;
    this.winReason = null;
    this.isDraw = false;
    this.drawReason = null;
    this.extraMoveAllowed = null;
  }
}

