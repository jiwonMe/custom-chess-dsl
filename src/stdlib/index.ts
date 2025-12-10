// Standard Library exports

export {
  STANDARD_PIECES,
  STANDARD_BOARD,
  STANDARD_SETUP,
  STANDARD_RULES,
  STANDARD_VICTORY,
  STANDARD_DRAW,
  STANDARD_CHESS,
  createStandardChess,
} from './standard-chess.js';

export {
  KING_OF_THE_HILL,
  THREE_CHECK,
  ATOMIC_CHESS,
  HORDE,
  RACING_KINGS,
  getVariants,
} from './variants.js';

export {
  mergeVictoryConditions,
  mergeDrawConditions,
} from './condition-merger.js';
