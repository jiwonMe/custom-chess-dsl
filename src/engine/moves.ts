import type {
  Position,
  Color,
  Piece,
  Move,
  MoveType,
  Pattern,
  Condition,
  Direction,
  GameState,
} from '../types/index.js';
import { Board } from './board.js';
import {
  isInBounds,
  getDirectionVector,
  getLeapVectors,
  addVector,
} from './position.js';

/**
 * Move generation context
 */
export interface MoveContext {
  board: Board;
  piece: Piece;
  state: GameState;
  checkLegality: boolean;
}

/**
 * Generate all moves for a pattern
 */
export function generateMovesForPattern(
  pattern: Pattern,
  ctx: MoveContext
): Move[] {
  switch (pattern.type) {
    case 'step':
      return generateStepMoves(pattern, ctx);
    case 'slide':
      return generateSlideMoves(pattern, ctx);
    case 'leap':
      return generateLeapMoves(pattern, ctx);
    case 'hop':
      return generateHopMoves(pattern, ctx);
    case 'composite':
      return generateCompositeMoves(pattern, ctx);
    case 'conditional':
      return generateConditionalMoves(pattern, ctx);
    case 'reference':
      return []; // Should be resolved at compile time
    default:
      return [];
  }
}

/**
 * Generate step moves (fixed distance in a direction)
 */
function generateStepMoves(
  pattern: { type: 'step'; direction: Direction; distance: number },
  ctx: MoveContext
): Move[] {
  const moves: Move[] = [];
  const vectors = getDirectionVector(pattern.direction, ctx.piece.owner);
  const distance = pattern.distance;

  for (const vector of vectors) {
    const targetPos = addVector(ctx.piece.pos, [
      vector[0] * distance,
      vector[1] * distance,
    ]);

    if (isInBounds(targetPos, ctx.board.dimensions.width, ctx.board.dimensions.height)) {
      const move = createMove(ctx, targetPos);
      if (move) {
        moves.push(move);
      }
    }
  }

  return moves;
}

/**
 * Generate slide moves (any distance until blocked)
 * Traits affecting this:
 * - 'phase': Can pass through other pieces (but cannot capture)
 */
function generateSlideMoves(
  pattern: { type: 'slide'; direction: Direction },
  ctx: MoveContext
): Move[] {
  const moves: Move[] = [];
  const vectors = getDirectionVector(pattern.direction, ctx.piece.owner);
  const hasPhase = ctx.piece.traits.has('phase');

  for (const vector of vectors) {
    let current = addVector(ctx.piece.pos, vector);

    while (isInBounds(current, ctx.board.dimensions.width, ctx.board.dimensions.height)) {
      const pieceAtTarget = ctx.board.at(current);

      if (!pieceAtTarget) {
        // Empty square - can move here
        moves.push(createMoveUnchecked(ctx, current, 'normal'));
      } else if (pieceAtTarget.owner !== ctx.piece.owner) {
        // Enemy piece
        if (hasPhase) {
          // Phase trait: can pass through but cannot capture
          moves.push(createMoveUnchecked(ctx, current, 'normal'));
        } else {
          // Can capture but must stop
          moves.push(createMoveUnchecked(ctx, current, 'capture', pieceAtTarget));
          break;
        }
      } else {
        // Friendly piece
        if (hasPhase) {
          // Phase trait: can pass through friendly pieces
          // (but don't add as valid move destination)
        } else {
          // Blocked
          break;
        }
      }

      current = addVector(current, vector);
    }
  }

  return moves;
}

/**
 * Generate leap moves (knight-like jumping)
 */
function generateLeapMoves(
  pattern: { type: 'leap'; dx: number; dy: number },
  ctx: MoveContext
): Move[] {
  const moves: Move[] = [];
  const vectors = getLeapVectors(pattern.dx, pattern.dy);

  for (const vector of vectors) {
    const targetPos = addVector(ctx.piece.pos, vector);

    if (isInBounds(targetPos, ctx.board.dimensions.width, ctx.board.dimensions.height)) {
      const move = createMove(ctx, targetPos);
      if (move) {
        moves.push(move);
      }
    }
  }

  return moves;
}

/**
 * Generate hop moves (jump over a piece)
 */
function generateHopMoves(
  pattern: { type: 'hop'; direction: Direction },
  ctx: MoveContext
): Move[] {
  const moves: Move[] = [];
  const vectors = getDirectionVector(pattern.direction, ctx.piece.owner);

  for (const vector of vectors) {
    let current = addVector(ctx.piece.pos, vector);
    let foundPiece = false;

    while (isInBounds(current, ctx.board.dimensions.width, ctx.board.dimensions.height)) {
      const pieceAtCurrent = ctx.board.at(current);

      if (!foundPiece) {
        if (pieceAtCurrent) {
          foundPiece = true;
        }
      } else {
        // After hopping over a piece
        if (!pieceAtCurrent) {
          moves.push(createMoveUnchecked(ctx, current, 'normal'));
        } else if (pieceAtCurrent.owner !== ctx.piece.owner) {
          moves.push(createMoveUnchecked(ctx, current, 'capture', pieceAtCurrent));
        }
        break;
      }

      current = addVector(current, vector);
    }
  }

  return moves;
}

/**
 * Generate composite moves (or/then combinations)
 */
function generateCompositeMoves(
  pattern: { type: 'composite'; op: 'or' | 'then'; patterns: Pattern[] },
  ctx: MoveContext
): Move[] {
  if (pattern.op === 'or') {
    // Union of all pattern moves
    const moves: Move[] = [];
    for (const subPattern of pattern.patterns) {
      moves.push(...generateMovesForPattern(subPattern, ctx));
    }
    return moves;
  } else {
    // Sequential patterns (for multi-step moves like gryphon)
    // This is complex and needs state tracking
    // For now, just return moves from first pattern
    if (pattern.patterns.length > 0) {
      return generateMovesForPattern(pattern.patterns[0]!, ctx);
    }
    return [];
  }
}

/**
 * Generate conditional moves
 */
function generateConditionalMoves(
  pattern: { type: 'conditional'; pattern: Pattern; condition: Condition },
  ctx: MoveContext
): Move[] {
  const baseMoves = generateMovesForPattern(pattern.pattern, ctx);

  // Filter moves based on condition
  return baseMoves.filter((move) =>
    evaluateCondition(pattern.condition, ctx, move)
  );
}

/**
 * Evaluate a condition for a move
 */
export function evaluateCondition(
  condition: Condition,
  ctx: MoveContext,
  move: Move
): boolean {
  switch (condition.type) {
    case 'empty':
      return ctx.board.isEmpty(move.to);

    case 'enemy':
      return ctx.board.hasEnemy(move.to, ctx.piece.owner);

    case 'friend':
      return ctx.board.hasFriend(move.to, ctx.piece.owner);

    case 'clear':
      return ctx.board.isPathClear(move.from, move.to);

    case 'check':
      // Need to evaluate if current player is in check
      return isInCheck(ctx.board, ctx.piece.owner);

    case 'first_move':
      return ctx.piece.state['moved'] !== true;

    case 'in_zone':
      return ctx.board.isInZone(move.to, condition.zone);

    case 'logical':
      if (condition.op === 'and') {
        return (
          evaluateCondition(condition.left, ctx, move) &&
          evaluateCondition(condition.right, ctx, move)
        );
      } else {
        return (
          evaluateCondition(condition.left, ctx, move) ||
          evaluateCondition(condition.right, ctx, move)
        );
      }

    case 'not':
      return !evaluateCondition(condition.condition, ctx, move);

    case 'comparison':
      return evaluateComparison(condition, ctx, move);

    default:
      return true;
  }
}

/**
 * Evaluate a comparison condition
 */
function evaluateComparison(
  condition: {
    type: 'comparison';
    left: unknown;
    op: string;
    right: unknown;
  },
  ctx: MoveContext,
  move: Move
): boolean {
  const left = evaluateExpression(condition.left, ctx, move);
  const right = evaluateExpression(condition.right, ctx, move);

  switch (condition.op) {
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
 * Evaluate an expression
 */
export function evaluateExpression(
  expr: unknown,
  ctx: MoveContext,
  move: Move
): unknown {
  if (!expr || typeof expr !== 'object') return expr;

  const e = expr as Record<string, unknown>;

  switch (e['type']) {
    case 'literal':
      return e['value'];

    case 'identifier': {
      const name = e['name'] as string;
      // Built-in identifiers
      if (name === 'piece') return ctx.piece;
      if (name === 'from') return move.from;
      if (name === 'to') return move.to;
      if (name === 'origin') return move.from;
      if (name === 'destination') return move.to;
      if (name === 'board') return ctx.board;
      if (name === 'White') return 'White';
      if (name === 'Black') return 'Black';
      return ctx.state.customState[name];
    }

    case 'member': {
      const obj = evaluateExpression(e['object'], ctx, move);
      const prop = e['property'] as string;
      if (obj && typeof obj === 'object') {
        const o = obj as Record<string, unknown>;
        if (prop === 'state' && o['state']) return o['state'];
        if (prop === 'type') return o['type'];
        if (prop === 'owner') return o['owner'];
        if (prop === 'pos') return o['pos'];
        if (prop === 'file') return (o as unknown as Position).file;
        if (prop === 'rank') return (o as unknown as Position).rank;
        return o[prop];
      }
      return undefined;
    }

    case 'binary': {
      const left = evaluateExpression(e['left'], ctx, move);
      const right = evaluateExpression(e['right'], ctx, move);
      switch (e['op']) {
        case '+':
          return (left as number) + (right as number);
        case '-':
          return (left as number) - (right as number);
        case '*':
          return (left as number) * (right as number);
        case '/':
          return (left as number) / (right as number);
        default:
          return undefined;
      }
    }

    default:
      return undefined;
  }
}

/**
 * Create a move if valid
 * Traits affecting this:
 * - 'phase': Can pass through pieces (no capture)
 */
function createMove(ctx: MoveContext, to: Position): Move | null {
  const pieceAtTarget = ctx.board.at(to);
  const hasPhase = ctx.piece.traits.has('phase');

  if (!pieceAtTarget) {
    return createMoveUnchecked(ctx, to, 'normal');
  } else if (pieceAtTarget.owner !== ctx.piece.owner) {
    // Enemy piece
    if (hasPhase) {
      // Phase pieces pass through but don't capture
      return createMoveUnchecked(ctx, to, 'normal');
    }
    return createMoveUnchecked(ctx, to, 'capture', pieceAtTarget);
  } else {
    // Friendly piece
    if (hasPhase) {
      // Phase pieces can pass through friendly pieces
      return createMoveUnchecked(ctx, to, 'normal');
    }
  }

  return null; // Blocked by friendly piece
}

/**
 * Create a move without checking destination
 */
function createMoveUnchecked(
  ctx: MoveContext,
  to: Position,
  type: MoveType,
  captured?: Piece
): Move {
  return {
    type,
    piece: ctx.piece,
    from: ctx.piece.pos,
    to,
    captured,
  };
}

/**
 * Check if a player is in check
 */
export function isInCheck(board: Board, color: Color): boolean {
  const king = board.findKing(color);
  if (!king) return false;

  const opponent: Color = color === 'White' ? 'Black' : 'White';
  const enemyPieces = board.getPiecesByColor(opponent);

  // Check if any enemy piece can attack the king
  for (const enemy of enemyPieces) {
    if (canAttack(board, enemy, king.pos)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a piece can attack a position
 * (Simplified - uses standard chess rules)
 */
function canAttack(board: Board, piece: Piece, target: Position): boolean {
  const dx = target.file - piece.pos.file;
  const dy = target.rank - piece.pos.rank;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  switch (piece.type) {
    case 'King':
      return adx <= 1 && ady <= 1;

    case 'Queen':
      if (dx === 0 || dy === 0 || adx === ady) {
        return board.isPathClear(piece.pos, target);
      }
      return false;

    case 'Rook':
      if (dx === 0 || dy === 0) {
        return board.isPathClear(piece.pos, target);
      }
      return false;

    case 'Bishop':
      if (adx === ady && adx > 0) {
        return board.isPathClear(piece.pos, target);
      }
      return false;

    case 'Knight':
      return (adx === 2 && ady === 1) || (adx === 1 && ady === 2);

    case 'Pawn': {
      const forward = piece.owner === 'White' ? 1 : -1;
      return adx === 1 && dy === forward;
    }

    default:
      return false;
  }
}

/**
 * Check if a move would leave the player in check
 */
export function wouldBeInCheck(board: Board, move: Move): boolean {
  const testBoard = board.clone();
  testBoard.movePiece(move.from, move.to);
  return isInCheck(testBoard, move.piece.owner);
}

/**
 * Filter moves to only legal ones (not leaving king in check)
 */
export function filterLegalMoves(board: Board, moves: Move[]): Move[] {
  return moves.filter((move) => !wouldBeInCheck(board, move));
}

/**
 * Check for checkmate
 */
export function isCheckmate(board: Board, color: Color, legalMoves: Move[]): boolean {
  return isInCheck(board, color) && legalMoves.length === 0;
}

/**
 * Check for stalemate
 */
export function isStalemate(board: Board, color: Color, legalMoves: Move[]): boolean {
  return !isInCheck(board, color) && legalMoves.length === 0;
}
