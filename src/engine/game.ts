import type {
  Position,
  Color,
  Piece,
  Move,
  MoveResult,
  GameState,
  GameResult,
  GameEvent,
  CompiledGame,
  Pattern,
  Square,
  EventType,
} from '../types/index.js';
import { Board } from './board.js';
import { pos, posEquals } from './position.js';
import {
  generateMovesForPattern,
  filterLegalMoves,
  isInCheck,
  isCheckmate,
  isStalemate,
  wouldBeInCheck,
  MoveContext,
  evaluateCondition,
} from './moves.js';
import { ScriptRuntime } from './script-runtime.js';

type EventHandler = (event: GameEvent) => void;

/**
 * Chess game engine
 */
export class GameEngine {
  private game: CompiledGame;
  private board: Board;
  private state: GameState;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private scriptRuntime: ScriptRuntime;

  constructor(game: CompiledGame) {
    this.game = game;
    this.board = new Board(game.board);
    this.state = this.createInitialState();
    this.scriptRuntime = new ScriptRuntime(this.board);
    this.setupPieces();
    this.initializeScripts();
  }

  /**
   * Initialize and execute game scripts
   */
  private initializeScripts(): void {
    // Set callbacks for check/checkmate queries
    this.scriptRuntime.setCallbacks(
      (player: Color) => this.isPlayerInCheck(player),
      (player: Color) => this.isPlayerInCheckmate(player)
    );

    // Execute all scripts
    if (this.game.scripts && this.game.scripts.length > 0) {
      this.scriptRuntime.executeScripts(this.game.scripts);
    }
  }

  /**
   * Check if a player is in check
   */
  private isPlayerInCheck(player: Color): boolean {
    return isInCheck(this.board, player);
  }

  /**
   * Check if a player is in checkmate
   */
  private isPlayerInCheckmate(player: Color): boolean {
    const legalMoves = this.getLegalMovesForPlayer(player);
    return isCheckmate(this.board, player, legalMoves);
  }

  /**
   * Get legal moves for a specific player
   */
  private getLegalMovesForPlayer(player: Color): Move[] {
    const pieces = this.board.getPiecesByColor(player);
    const moves: Move[] = [];
    for (const piece of pieces) {
      moves.push(...this.getLegalMovesForPiece(piece));
    }
    return moves;
  }

  /**
   * Create initial game state
   */
  private createInitialState(): GameState {
    const squares: Square[][] = [];
    for (let rank = 0; rank < this.game.board.height; rank++) {
      const row: Square[] = [];
      for (let file = 0; file < this.game.board.width; file++) {
        row.push({
          pos: pos(file, rank),
          piece: null,
          effects: [],
        });
      }
      squares.push(row);
    }

    return {
      board: squares,
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

  /**
   * Setup initial pieces
   */
  private setupPieces(): void {
    // Use setup from game definition
    for (const placement of this.game.setup.placements) {
      const pieceDef = this.game.pieces.get(placement.pieceType);
      const traits = pieceDef?.traits ?? [];
      const state = pieceDef?.initialState ?? {};

      this.board.createPiece(
        placement.pieceType,
        placement.owner,
        placement.position,
        traits,
        { ...state }
      );
    }

    // If no setup defined and extends standard chess, use standard setup
    if (this.game.setup.placements.length === 0) {
      this.setupStandardChess();
    }

    // Apply piece replacements (e.g., Queen -> Amazon)
    if (this.game.setup.replace && this.game.setup.replace.size > 0) {
      this.applyPieceReplacements();
    }

    this.syncState();
  }

  /**
   * Apply piece replacements from setup config
   */
  private applyPieceReplacements(): void {
    const replace = this.game.setup.replace;
    if (!replace) return;

    const allPieces = this.board.getAllPieces();

    for (const piece of allPieces) {
      const newType = replace.get(piece.type);
      if (newType) {
        // Get the new piece definition
        const newPieceDef = this.game.pieces.get(newType);
        // Convert Set to Array if needed
        const traitsArray = newPieceDef?.traits ?? Array.from(piece.traits);
        const newState = newPieceDef?.initialState ?? {};

        // Remove old piece and create new one
        const position = piece.pos;
        const owner = piece.owner;
        this.board.removePiece(position);
        this.board.createPiece(
          newType,
          owner,
          position,
          traitsArray,
          { ...newState }
        );
      }
    }
  }

  /**
   * Setup standard chess position
   */
  private setupStandardChess(): void {
    this.board.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  }

  /**
   * Sync board state to game state
   */
  private syncState(): void {
    this.state.pieces = this.board.getAllPieces();

    // Update board squares
    for (let rank = 0; rank < this.game.board.height; rank++) {
      for (let file = 0; file < this.game.board.width; file++) {
        const square = this.board.getSquare(pos(file, rank));
        if (square && this.state.board[rank]) {
          this.state.board[rank]![file] = square;
        }
      }
    }
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Set game state (for loading saved games)
   */
  setState(state: GameState): void {
    this.state = state;
    this.board.clear();

    for (const piece of state.pieces) {
      this.board.placePiece(piece);
    }
  }

  /**
   * Get the board
   */
  getBoard(): Board {
    return this.board;
  }

  /**
   * Get all legal moves for current player
   */
  getLegalMoves(): Move[] {
    const pieces = this.board.getPiecesByColor(this.state.currentPlayer);
    const allMoves: Move[] = [];

    for (const piece of pieces) {
      const moves = this.getLegalMovesForPiece(piece);
      allMoves.push(...moves);
    }

    // Add special moves
    allMoves.push(...this.getCastlingMoves());
    allMoves.push(...this.getEnPassantMoves());

    return allMoves;
  }

  /**
   * Get legal moves for a specific piece
   */
  getLegalMovesForPiece(piece: Piece): Move[] {
    const pieceDef = this.game.pieces.get(piece.type);
    if (!pieceDef) {
      // Use default patterns for standard pieces
      return this.getStandardMoves(piece);
    }

    const ctx: MoveContext = {
      board: this.board,
      piece,
      state: this.state,
      checkLegality: true,
    };

    // Generate moves from movement pattern
    let moves = generateMovesForPattern(pieceDef.move, ctx);

    // Generate capture moves if different pattern
    if (pieceDef.capture !== 'same' && pieceDef.capture !== 'none') {
      const captureMoves = generateMovesForPattern(pieceDef.capture as Pattern, ctx);
      // Filter to only actual captures
      const filteredCaptures = captureMoves.filter((m) =>
        this.board.hasEnemy(m.to, piece.owner)
      );
      moves = moves.concat(filteredCaptures);
    }

    // Remove moves to squares with friendly pieces
    moves = moves.filter((m) => !this.board.hasFriend(m.to, piece.owner));

    // Remove moves that leave king in check
    if (this.game.rules.checkDetection) {
      moves = filterLegalMoves(this.board, moves);
    }

    return moves;
  }

  /**
   * Get standard chess moves for piece types without custom definitions
   */
  private getStandardMoves(piece: Piece): Move[] {
    const ctx: MoveContext = {
      board: this.board,
      piece,
      state: this.state,
      checkLegality: true,
    };

    let pattern: Pattern;

    switch (piece.type) {
      case 'King':
        pattern = { type: 'step', direction: 'any', distance: 1 };
        break;
      case 'Queen':
        pattern = {
          type: 'composite',
          op: 'or',
          patterns: [
            { type: 'slide', direction: 'orthogonal' },
            { type: 'slide', direction: 'diagonal' },
          ],
        };
        break;
      case 'Rook':
        pattern = { type: 'slide', direction: 'orthogonal' };
        break;
      case 'Bishop':
        pattern = { type: 'slide', direction: 'diagonal' };
        break;
      case 'Knight':
        pattern = { type: 'leap', dx: 2, dy: 1 };
        break;
      case 'Pawn':
        return this.getPawnMoves(piece);
      default:
        return [];
    }

    let moves = generateMovesForPattern(pattern, ctx);
    moves = moves.filter((m) => !this.board.hasFriend(m.to, piece.owner));

    if (this.game.rules.checkDetection) {
      moves = filterLegalMoves(this.board, moves);
    }

    return moves;
  }

  /**
   * Get pawn moves
   */
  private getPawnMoves(piece: Piece): Move[] {
    const moves: Move[] = [];
    const forward = piece.owner === 'White' ? 1 : -1;
    const startRank = piece.owner === 'White' ? 1 : 6;
    const promotionRank = piece.owner === 'White' ? 7 : 0;

    // Single push
    const singlePush = pos(piece.pos.file, piece.pos.rank + forward);
    if (
      isInBounds(singlePush) &&
      this.board.isEmpty(singlePush)
    ) {
      const move = this.createPawnMove(piece, singlePush, promotionRank);
      moves.push(move);

      // Double push from starting position
      if (piece.pos.rank === startRank) {
        const doublePush = pos(piece.pos.file, piece.pos.rank + forward * 2);
        if (this.board.isEmpty(doublePush)) {
          moves.push({
            type: 'normal',
            piece,
            from: piece.pos,
            to: doublePush,
            metadata: { doublePush: true },
          });
        }
      }
    }

    // Captures
    for (const df of [-1, 1]) {
      const capturePos = pos(piece.pos.file + df, piece.pos.rank + forward);
      if (
        isInBounds(capturePos) &&
        this.board.hasEnemy(capturePos, piece.owner)
      ) {
        const captured = this.board.at(capturePos);
        const move = this.createPawnMove(piece, capturePos, promotionRank, captured ?? undefined);
        moves.push(move);
      }
    }

    // Filter legal moves
    if (this.game.rules.checkDetection) {
      return filterLegalMoves(this.board, moves);
    }

    return moves;
  }

  private createPawnMove(
    piece: Piece,
    to: Position,
    promotionRank: number,
    captured?: Piece
  ): Move {
    const isPromotion = to.rank === promotionRank;
    return {
      type: isPromotion ? 'promotion' : captured ? 'capture' : 'normal',
      piece,
      from: piece.pos,
      to,
      captured,
      promotion: isPromotion ? 'Queen' : undefined,
    };
  }

  /**
   * Get castling moves
   */
  private getCastlingMoves(): Move[] {
    if (!this.game.rules.castling) return [];

    const moves: Move[] = [];
    const king = this.board.findKing(this.state.currentPlayer);
    if (!king || king.state['moved']) return [];

    // Check if in check
    if (isInCheck(this.board, this.state.currentPlayer)) return [];

    const rank = this.state.currentPlayer === 'White' ? 0 : 7;

    // Kingside castling
    const kingsideRook = this.board.at(pos(7, rank));
    if (
      kingsideRook?.type === 'Rook' &&
      !kingsideRook.state['moved'] &&
      this.board.isEmpty(pos(5, rank)) &&
      this.board.isEmpty(pos(6, rank)) &&
      !this.isSquareAttacked(pos(5, rank), this.state.currentPlayer) &&
      !this.isSquareAttacked(pos(6, rank), this.state.currentPlayer)
    ) {
      moves.push({
        type: 'castle_kingside',
        piece: king,
        from: king.pos,
        to: pos(6, rank),
        metadata: { rook: kingsideRook, rookFrom: pos(7, rank), rookTo: pos(5, rank) },
      });
    }

    // Queenside castling
    const queensideRook = this.board.at(pos(0, rank));
    if (
      queensideRook?.type === 'Rook' &&
      !queensideRook.state['moved'] &&
      this.board.isEmpty(pos(1, rank)) &&
      this.board.isEmpty(pos(2, rank)) &&
      this.board.isEmpty(pos(3, rank)) &&
      !this.isSquareAttacked(pos(2, rank), this.state.currentPlayer) &&
      !this.isSquareAttacked(pos(3, rank), this.state.currentPlayer)
    ) {
      moves.push({
        type: 'castle_queenside',
        piece: king,
        from: king.pos,
        to: pos(2, rank),
        metadata: { rook: queensideRook, rookFrom: pos(0, rank), rookTo: pos(3, rank) },
      });
    }

    return moves;
  }

  /**
   * Get en passant moves
   */
  private getEnPassantMoves(): Move[] {
    if (!this.game.rules.enPassant) return [];

    const moves: Move[] = [];
    const lastMove = this.state.moveHistory[this.state.moveHistory.length - 1];

    if (
      lastMove?.piece.type === 'Pawn' &&
      lastMove.metadata?.['doublePush']
    ) {
      const targetFile = lastMove.to.file;
      const targetRank = lastMove.to.rank;
      const captureRank = this.state.currentPlayer === 'White' ? 5 : 2;

      if (targetRank === (this.state.currentPlayer === 'White' ? 4 : 3)) {
        // Check for adjacent pawns
        for (const df of [-1, 1]) {
          const adjacentPos = pos(targetFile + df, targetRank);
          const piece = this.board.at(adjacentPos);

          if (
            piece?.type === 'Pawn' &&
            piece.owner === this.state.currentPlayer
          ) {
            const move: Move = {
              type: 'en_passant',
              piece,
              from: adjacentPos,
              to: pos(targetFile, captureRank),
              captured: lastMove.piece,
            };

            if (!wouldBeInCheck(this.board, move)) {
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  /**
   * Check if a square is attacked by enemy pieces
   */
  private isSquareAttacked(position: Position, defender: Color): boolean {
    const attacker: Color = defender === 'White' ? 'Black' : 'White';
    const enemyPieces = this.board.getPiecesByColor(attacker);

    for (const enemy of enemyPieces) {
      // Get attack squares for this piece
      const attackMoves = this.getStandardMoves(enemy);
      if (attackMoves.some((m) => posEquals(m.to, position))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Make a move
   */
  makeMove(move: Move): MoveResult {
    const events: GameEvent[] = [];

    // Validate move
    const legalMoves = this.getLegalMoves();
    const isLegal = legalMoves.some(
      (m) =>
        posEquals(m.from, move.from) &&
        posEquals(m.to, move.to) &&
        m.type === move.type
    );

    if (!isLegal) {
      return { success: false, error: 'Illegal move', events };
    }

    // Execute pre-move triggers
    this.executeTriggers('move', move, events);

    // Execute the move
    const captured = this.board.movePiece(move.from, move.to);

    // Handle special moves
    if (move.type === 'castle_kingside' || move.type === 'castle_queenside') {
      const rookFrom = move.metadata?.['rookFrom'] as Position;
      const rookTo = move.metadata?.['rookTo'] as Position;
      if (rookFrom && rookTo) {
        this.board.movePiece(rookFrom, rookTo);
      }
    }

    if (move.type === 'en_passant' && move.captured) {
      this.board.removePiece(move.captured.pos);
    }

    if (move.type === 'promotion' && move.promotion) {
      const piece = this.board.at(move.to);
      if (piece) {
        this.board.removePiece(move.to);
        this.board.createPiece(
          move.promotion,
          piece.owner,
          move.to,
          [],
          {}
        );
      }
    }

    // Update piece state
    const movedPiece = this.board.at(move.to);
    if (movedPiece) {
      movedPiece.state['moved'] = true;
      if (movedPiece.type === 'Pawn' && move.metadata?.['doublePush']) {
        movedPiece.state['justDoublePushed'] = true;
      }
    }

    // Clear en passant flag from all pawns
    for (const piece of this.board.getAllPieces()) {
      if (piece.type === 'Pawn' && piece !== movedPiece) {
        piece.state['justDoublePushed'] = false;
      }
    }

    // Record move
    this.state.moveHistory.push(move);

    // Update clocks
    if (move.piece.type === 'Pawn' || captured) {
      this.state.halfMoveClock = 0;
    } else {
      this.state.halfMoveClock++;
    }

    if (this.state.currentPlayer === 'Black') {
      this.state.fullMoveNumber++;
    }

    // Record position for repetition detection
    this.state.positionHistory.push(this.board.toFEN());

    // Execute capture triggers
    if (captured) {
      this.executeTriggers('capture', move, events);
      events.push({
        type: 'capture',
        data: { piece: captured },
        timestamp: Date.now(),
      });

      // Emit capture event to scripts
      this.scriptRuntime.emitEvent({
        type: 'capture',
        piece: movedPiece ?? undefined,
        from: move.from,
        to: move.to,
        captured,
        player: move.piece.owner,
      });
    }

    // Reset turn ended flag before emitting move event
    this.scriptRuntime.resetTurnEnded();

    // Emit move event to scripts
    this.scriptRuntime.setCurrentPlayer(this.state.currentPlayer);
    this.scriptRuntime.emitEvent({
      type: 'move',
      piece: movedPiece ?? undefined,
      from: move.from,
      to: move.to,
      player: move.piece.owner,
    });

    // Check if script declared a winner
    const scriptWinner = this.scriptRuntime.getWinner();
    if (scriptWinner) {
      this.state.result = {
        winner: scriptWinner.winner,
        reason: scriptWinner.reason,
        isDraw: false,
      };
      events.push({
        type: 'game_end',
        data: { ...this.state.result } as Record<string, unknown>,
        timestamp: Date.now(),
      });
      return { success: true, move, captured: captured ?? undefined, events };
    }

    // Determine if turn should switch
    // If scripts control turn flow, only switch when endTurn() is called
    // Otherwise, switch every move (standard chess behavior)
    const scriptControlsTurn = this.scriptRuntime.controlsTurnFlow();
    const shouldSwitchTurn = scriptControlsTurn
      ? this.scriptRuntime.isTurnEnded()
      : true;

    if (shouldSwitchTurn) {
      // Switch player
      this.state.currentPlayer =
        this.state.currentPlayer === 'White' ? 'Black' : 'White';

      // Sync state
      this.syncState();

      // Emit turn end event to scripts
      this.scriptRuntime.setCurrentPlayer(this.state.currentPlayer);
      this.scriptRuntime.emitEvent({
        type: 'turnEnd',
        player: this.state.currentPlayer === 'White' ? 'Black' : 'White',
      });

      // Execute turn end triggers
      this.executeTriggers('turn_end', move, events);
    } else {
      // Same player continues - just sync state
      this.syncState();
    }

    // Check for game end
    const result = this.checkGameEnd();
    if (result) {
      this.state.result = result;
      events.push({
        type: 'game_end',
        data: { ...result } as Record<string, unknown>,
        timestamp: Date.now(),
      });
    }

    // Check for check
    if (isInCheck(this.board, this.state.currentPlayer)) {
      this.executeTriggers('check', move, events);
      events.push({
        type: 'check',
        data: { player: this.state.currentPlayer },
        timestamp: Date.now(),
      });
    }

    return {
      success: true,
      move,
      captured: captured ?? undefined,
      events,
    };
  }

  /**
   * Undo the last move
   */
  undoMove(): boolean {
    const lastMove = this.state.moveHistory.pop();
    if (!lastMove) return false;

    // Restore piece position
    this.board.movePiece(lastMove.to, lastMove.from);

    // Restore captured piece
    if (lastMove.captured) {
      this.board.placePiece(lastMove.captured);
    }

    // Handle special moves
    if (lastMove.type === 'castle_kingside' || lastMove.type === 'castle_queenside') {
      const rookFrom = lastMove.metadata?.['rookFrom'] as Position;
      const rookTo = lastMove.metadata?.['rookTo'] as Position;
      if (rookFrom && rookTo) {
        this.board.movePiece(rookTo, rookFrom);
      }
    }

    // Switch player back
    this.state.currentPlayer = this.state.currentPlayer === 'White' ? 'Black' : 'White';

    // Remove position from history
    this.state.positionHistory.pop();

    // Update clocks (simplified - doesn't perfectly restore)
    if (this.state.currentPlayer === 'Black') {
      this.state.fullMoveNumber--;
    }

    // Clear result
    this.state.result = undefined;

    this.syncState();
    return true;
  }

  /**
   * Check for game end conditions
   */
  private checkGameEnd(): GameResult | undefined {
    const legalMoves = this.getLegalMoves();

    // Checkmate
    if (isCheckmate(this.board, this.state.currentPlayer, legalMoves)) {
      const winner = this.state.currentPlayer === 'White' ? 'Black' : 'White';
      return { winner, reason: 'checkmate', isDraw: false };
    }

    // Stalemate
    if (isStalemate(this.board, this.state.currentPlayer, legalMoves)) {
      return { reason: 'stalemate', isDraw: true };
    }

    // Check custom victory conditions
    for (const condition of this.game.victory) {
      if (this.evaluateVictoryCondition(condition)) {
        const winner = this.determineWinner(condition);
        return { winner, reason: condition.name, isDraw: false };
      }
    }

    // Check custom draw conditions
    for (const condition of this.game.draw) {
      if (this.evaluateDrawCondition(condition)) {
        return { reason: condition.name, isDraw: true };
      }
    }

    // Fifty move rule
    if (this.game.rules.fiftyMoveRule && this.state.halfMoveClock >= 100) {
      return { reason: 'fifty-move rule', isDraw: true };
    }

    // Threefold repetition
    if (this.game.rules.threefoldRepetition) {
      const currentFEN = this.board.toFEN();
      const count = this.state.positionHistory.filter((f) => f === currentFEN).length;
      if (count >= 3) {
        return { reason: 'threefold repetition', isDraw: true };
      }
    }

    return undefined;
  }

  /**
   * Evaluate a victory condition
   */
  private evaluateVictoryCondition(condition: { name: string; condition: unknown }): boolean {
    // For now, just check built-in conditions
    if (condition.name === 'checkmate') {
      const legalMoves = this.getLegalMoves();
      return isCheckmate(this.board, this.state.currentPlayer, legalMoves);
    }

    // Evaluate the condition object
    const cond = condition.condition as {
      type: string;
      pieceType?: string;
      zone?: string;
      rank?: number;
      file?: string;
      left?: unknown;
      op?: string;
      right?: unknown;
    };

    if (!cond || !cond.type) return false;

    switch (cond.type) {
      case 'in_zone':
        return this.evaluateInZoneCondition(cond.pieceType ?? 'King', cond.zone ?? '');

      case 'on_rank':
        return this.evaluateOnRankCondition(cond.pieceType ?? 'King', cond.rank ?? 0);

      case 'on_file':
        return this.evaluateOnFileCondition(cond.pieceType ?? 'King', cond.file ?? '');

      case 'piece_captured':
        return this.evaluatePieceCapturedCondition(cond.pieceType ?? 'King');

      case 'comparison':
        return this.evaluateComparisonCondition(cond);

      default:
        return false;
    }
  }

  /**
   * Check if a piece is in a specific zone
   */
  private evaluateInZoneCondition(pieceType: string, zoneName: string): boolean {
    const zone = this.game.board.zones.get(zoneName);
    if (!zone) return false;

    // Check current player's piece
    const pieces = this.board.getAllPieces().filter(
      (p) => p.type === pieceType && p.owner === this.state.currentPlayer
    );

    for (const piece of pieces) {
      for (const pos of zone) {
        if (piece.pos.file === pos.file && piece.pos.rank === pos.rank) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if a piece is on a specific rank
   */
  private evaluateOnRankCondition(pieceType: string, rank: number): boolean {
    const pieces = this.board.getAllPieces().filter(
      (p) => p.type === pieceType && p.owner === this.state.currentPlayer
    );

    // rank is 1-based in the condition, but 0-based internally
    const targetRank = rank - 1;

    for (const piece of pieces) {
      if (piece.pos.rank === targetRank) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a piece is on a specific file
   */
  private evaluateOnFileCondition(pieceType: string, file: string): boolean {
    const pieces = this.board.getAllPieces().filter(
      (p) => p.type === pieceType && p.owner === this.state.currentPlayer
    );

    // Convert file letter to number (a=0, b=1, etc.)
    const targetFile = file.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);

    for (const piece of pieces) {
      if (piece.pos.file === targetFile) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if opponent's piece of a type has been captured
   */
  private evaluatePieceCapturedCondition(pieceType: string): boolean {
    const opponent = this.state.currentPlayer === 'White' ? 'Black' : 'White';
    const pieces = this.board.getAllPieces().filter(
      (p) => p.type === pieceType && p.owner === opponent
    );

    // If no pieces of this type exist, it's been captured
    return pieces.length === 0;
  }

  /**
   * Evaluate a comparison condition
   */
  private evaluateComparisonCondition(cond: {
    left?: unknown;
    op?: string;
    right?: unknown;
  }): boolean {
    const left = this.evaluateExpression(cond.left);
    const right = this.evaluateExpression(cond.right);
    const op = cond.op ?? '==';

    switch (op) {
      case '==':
      case '===':
        return left === right;
      case '!=':
      case '!==':
        return left !== right;
      case '<':
        return (left as number) < (right as number);
      case '>':
        return (left as number) > (right as number);
      case '<=':
        return (left as number) <= (right as number);
      case '>=':
        return (left as number) >= (right as number);
      default:
        return false;
    }
  }

  /**
   * Evaluate an expression for condition checking
   */
  private evaluateExpression(expr: unknown): unknown {
    if (!expr || typeof expr !== 'object') return expr;

    const e = expr as {
      type: string;
      value?: unknown;
      name?: string;
      object?: unknown;
      property?: string;
    };

    switch (e.type) {
      case 'literal':
        return e.value;

      case 'identifier':
        // Handle special identifiers
        if (e.name === 'checks') {
          return this.state.checkCount?.[this.state.currentPlayer] ?? 0;
        }
        if (e.name === 'pieces') {
          return this.board.getAllPieces().filter(
            (p) => p.owner === this.state.currentPlayer
          ).length;
        }
        return 0;

      case 'member':
        // Handle "opponent.pieces", "opponent.King" etc.
        if (e.object && typeof e.object === 'object') {
          const obj = e.object as { type: string; name?: string };
          if (obj.type === 'identifier' && obj.name === 'opponent') {
            const opponent = this.state.currentPlayer === 'White' ? 'Black' : 'White';
            if (e.property === 'pieces') {
              return this.board.getAllPieces().filter((p) => p.owner === opponent).length;
            }
            if (e.property === 'King' || e.property === 'Queen' || e.property === 'Rook' ||
                e.property === 'Bishop' || e.property === 'Knight' || e.property === 'Pawn') {
              return this.board.getAllPieces().filter(
                (p) => p.owner === opponent && p.type === e.property
              ).length;
            }
          }
        }
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Evaluate a draw condition
   */
  private evaluateDrawCondition(condition: { name: string; condition: unknown }): boolean {
    if (condition.name === 'stalemate') {
      const legalMoves = this.getLegalMoves();
      return isStalemate(this.board, this.state.currentPlayer, legalMoves);
    }
    return false;
  }

  /**
   * Determine winner from victory condition
   */
  private determineWinner(condition: { winner: Color | 'current' | 'opponent' }): Color {
    if (condition.winner === 'current') {
      return this.state.currentPlayer;
    } else if (condition.winner === 'opponent') {
      return this.state.currentPlayer === 'White' ? 'Black' : 'White';
    }
    return condition.winner;
  }

  /**
   * Execute triggers for an event
   */
  private executeTriggers(eventType: EventType, move: Move, events: GameEvent[]): void {
    for (const trigger of this.game.triggers) {
      if (trigger.on === eventType) {
        const ctx: MoveContext = {
          board: this.board,
          piece: move.piece,
          state: this.state,
          checkLegality: false,
        };

        // Check when condition
        if (trigger.when) {
          if (!evaluateCondition(trigger.when, ctx, move)) {
            continue;
          }
        }

        // Execute actions
        for (const action of trigger.actions) {
          this.executeAction(action, ctx, move, events);
        }
      }
    }
  }

  /**
   * Execute a single action
   */
  private executeAction(
    action: unknown,
    _ctx: MoveContext,
    _move: Move,
    _events: GameEvent[]
  ): void {
    const a = action as Record<string, unknown>;

    switch (a['type']) {
      case 'set':
        // Handle state modifications
        break;

      case 'win':
        const winner = a['player'] as Color;
        this.state.result = { winner, reason: 'trigger', isDraw: false };
        break;

      case 'lose':
        const loser = a['player'] as Color;
        const winnerFromLose = loser === 'White' ? 'Black' : 'White';
        this.state.result = { winner: winnerFromLose, reason: 'trigger', isDraw: false };
        break;

      case 'draw':
        this.state.result = { reason: 'trigger', isDraw: true };
        break;
    }
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.state.result !== undefined;
  }

  /**
   * Get game result
   */
  getResult(): GameResult | undefined {
    return this.state.result;
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.board = new Board(this.game.board);
    this.state = this.createInitialState();
    this.scriptRuntime.reset();
    this.scriptRuntime = new ScriptRuntime(this.board);
    this.setupPieces();
    this.initializeScripts();
  }

  /**
   * Register event handler
   */
  on(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event to registered handlers
   */
  emit(event: GameEvent): void {
    const handlers = this.eventHandlers.get(event.type) ?? [];
    for (const handler of handlers) {
      handler(event);
    }
  }
}

/**
 * Helper to check if position is in bounds
 */
function isInBounds(position: Position, width: number = 8, height: number = 8): boolean {
  return (
    position.file >= 0 &&
    position.file < width &&
    position.rank >= 0 &&
    position.rank < height
  );
}
