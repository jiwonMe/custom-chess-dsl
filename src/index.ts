// ChessLang DSL - Main Entry Point

// Core types
export * from './types/index.js';

// Lexer
export { Lexer, TokenStream, KEYWORDS, STANDARD_PIECES, tokenTypeName } from './lexer/index.js';
export { Scanner, isDigit, isAlpha, isAlphaNumeric, isWhitespace, isNewline, isSquareNotation } from './lexer/scanner.js';

// Parser
export { Parser } from './parser/index.js';

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

import { Lexer } from './lexer/index.js';
import { Parser } from './parser/index.js';
import type { GameNode } from './types/index.js';

/**
 * Parse ChessLang source code into an AST
 */
export function parse(source: string, filename?: string): GameNode {
  const lexer = new Lexer(source, filename);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}
