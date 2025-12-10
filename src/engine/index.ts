// Engine exports
export {
  Board,
  createStandardBoard,
  generatePieceId,
  resetPieceIdCounter,
} from './board.js';

export {
  pos,
  parseSquare,
  toSquare,
  posEquals,
  isInBounds,
  getDirectionVector,
  getLeapVectors,
  addVector,
  distance,
  manhattanDistance,
  adjacent,
  ray,
  between,
  sameFile,
  sameRank,
  sameDiagonal,
  sameLine,
  rank,
  file,
  mirrorHorizontal,
  mirrorVertical,
  rotate180,
} from './position.js';

export {
  generateMovesForPattern,
  evaluateCondition,
  isInCheck,
  isCheckmate,
  isStalemate,
  wouldBeInCheck,
  filterLegalMoves,
  type MoveContext,
} from './moves.js';

export { GameEngine } from './game.js';

export {
  ScriptRuntime,
  type GameScriptAPI,
  type BoardScriptAPI,
} from './script-runtime.js';
