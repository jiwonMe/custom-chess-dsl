// ChessLang DSL - Main Entry Point

// Core types
export * from './types/index.js';

// Lexer
export { Lexer, TokenStream, KEYWORDS, STANDARD_PIECES as STANDARD_PIECE_NAMES, tokenTypeName } from './lexer/index.js';
export { Scanner, isDigit, isAlpha, isAlphaNumeric, isWhitespace, isNewline, isSquareNotation } from './lexer/scanner.js';

// Parser
export { Parser } from './parser/index.js';

// Compiler
export { Compiler, compile } from './compiler/index.js';

// Engine
export {
  Board,
  createStandardBoard,
  generatePieceId,
  resetPieceIdCounter,
} from './engine/board.js';

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
} from './engine/position.js';

export {
  generateMovesForPattern,
  evaluateCondition,
  isInCheck,
  isCheckmate,
  isStalemate,
  wouldBeInCheck,
  filterLegalMoves,
} from './engine/moves.js';

export { GameEngine } from './engine/game.js';

// Standard Library
export {
  STANDARD_PIECES,
  STANDARD_BOARD,
  STANDARD_SETUP,
  STANDARD_RULES,
  STANDARD_CHESS,
  createStandardChess,
  KING_OF_THE_HILL,
  THREE_CHECK,
  ATOMIC_CHESS,
  HORDE,
  RACING_KINGS,
  getVariants,
} from './stdlib/index.js';

import { Lexer } from './lexer/index.js';
import { Parser } from './parser/index.js';
import { Compiler } from './compiler/index.js';
import type { GameNode, CompiledGame } from './types/index.js';

/**
 * Parse ChessLang source code into an AST
 */
export function parse(source: string, filename?: string): GameNode {
  const lexer = new Lexer(source, filename);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Parse and compile ChessLang source code
 */
export function compileSource(source: string, filename?: string): CompiledGame {
  const ast = parse(source, filename);
  const compiler = new Compiler(ast);
  return compiler.compile();
}
