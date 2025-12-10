import { TokenType } from '../types/index.js';

/**
 * Map of keywords to token types
 */
export const KEYWORDS: Record<string, TokenType> = {
  // Level 1 keywords
  game: TokenType.GAME,
  extends: TokenType.EXTENDS,
  board: TokenType.BOARD,
  size: TokenType.SIZE,
  zones: TokenType.ZONES,
  pieces: TokenType.PIECES,
  setup: TokenType.SETUP,
  victory: TokenType.VICTORY,
  draw: TokenType.DRAW,
  rules: TokenType.RULES,
  add: TokenType.ADD,
  remove: TokenType.REMOVE,
  replace: TokenType.REPLACE,

  // Level 2 keywords
  piece: TokenType.PIECE,
  effect: TokenType.EFFECT,
  trigger: TokenType.TRIGGER,
  pattern: TokenType.PATTERN,
  move: TokenType.MOVE,
  capture: TokenType.CAPTURE,
  traits: TokenType.TRAITS,
  state: TokenType.STATE,
  on: TokenType.ON,
  when: TokenType.WHEN,
  do: TokenType.DO,
  blocks: TokenType.BLOCKS,
  visual: TokenType.VISUAL,
  optional: TokenType.OPTIONAL,
  description: TokenType.DESCRIPTION,

  // Level 3 keywords
  script: TokenType.SCRIPT,
  function: TokenType.FUNCTION,
  let: TokenType.LET,
  const: TokenType.CONST,
  var: TokenType.VAR,
  if: TokenType.IF,
  else: TokenType.ELSE,
  for: TokenType.FOR,
  while: TokenType.WHILE,
  return: TokenType.RETURN,
  of: TokenType.OF,
  in: TokenType.IN,

  // Pattern keywords
  step: TokenType.STEP,
  slide: TokenType.SLIDE,
  leap: TokenType.LEAP,
  hop: TokenType.HOP,

  // Direction keywords (abbreviated and full)
  N: TokenType.NORTH,
  S: TokenType.SOUTH,
  E: TokenType.EAST,
  W: TokenType.WEST,
  NE: TokenType.NORTHEAST,
  NW: TokenType.NORTHWEST,
  SE: TokenType.SOUTHEAST,
  SW: TokenType.SOUTHWEST,
  orthogonal: TokenType.ORTHOGONAL,
  diagonal: TokenType.DIAGONAL,
  any: TokenType.ANY,
  forward: TokenType.FORWARD,
  backward: TokenType.BACKWARD,

  // Condition keywords
  empty: TokenType.EMPTY,
  enemy: TokenType.ENEMY,
  friend: TokenType.FRIEND,
  clear: TokenType.CLEAR,
  check: TokenType.CHECK,
  first_move: TokenType.FIRST_MOVE,

  // Victory condition keywords
  rank: TokenType.RANK,
  file: TokenType.FILE,
  captured: TokenType.CAPTURED,
  checks: TokenType.CHECKS,
  opponent: TokenType.OPPONENT,

  // Action keywords
  set: TokenType.SET,
  create: TokenType.CREATE,
  transform: TokenType.TRANSFORM,
  mark: TokenType.MARK,
  win: TokenType.WIN,
  lose: TokenType.LOSE,
  cancel: TokenType.CANCEL,
  apply: TokenType.APPLY,

  // Logical keywords
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
  where: TokenType.WHERE,

  // Boolean literals
  true: TokenType.BOOLEAN,
  false: TokenType.BOOLEAN,

  // Null literal
  null: TokenType.NULL,

  // Colors
  White: TokenType.WHITE,
  Black: TokenType.BLACK,
};

/**
 * Standard piece names (used for context-aware parsing)
 */
export const STANDARD_PIECES = [
  'King',
  'Queen',
  'Rook',
  'Bishop',
  'Knight',
  'Pawn',
];

/**
 * Single character operators
 */
export const SINGLE_CHAR_TOKENS: Record<string, TokenType> = {
  ':': TokenType.COLON,
  ',': TokenType.COMMA,
  '.': TokenType.DOT,
  '|': TokenType.PIPE,
  '+': TokenType.PLUS,
  '-': TokenType.MINUS,
  '*': TokenType.STAR,
  '/': TokenType.SLASH,
  '%': TokenType.PERCENT,
  '=': TokenType.EQUALS,
  '<': TokenType.LT,
  '>': TokenType.GT,
  '&': TokenType.AMPERSAND,
  '!': TokenType.BANG,
  '?': TokenType.QUESTION,
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  '{': TokenType.LBRACE,
  '}': TokenType.RBRACE,
  '[': TokenType.LBRACKET,
  ']': TokenType.RBRACKET,
  ';': TokenType.SEMICOLON,
};

/**
 * Double character operators
 */
export const DOUBLE_CHAR_TOKENS: Record<string, TokenType> = {
  '==': TokenType.EQ,
  '!=': TokenType.NE,
  '<=': TokenType.LE,
  '>=': TokenType.GE,
  '&&': TokenType.DOUBLE_AMPERSAND,
  '||': TokenType.DOUBLE_PIPE,
  '+=': TokenType.PLUS_EQUALS,
  '-=': TokenType.MINUS_EQUALS,
  '*=': TokenType.STAR_EQUALS,
  '/=': TokenType.SLASH_EQUALS,
  '->': TokenType.ARROW,
  '=>': TokenType.FAT_ARROW,
};

/**
 * Triple character operators
 */
export const TRIPLE_CHAR_TOKENS: Record<string, TokenType> = {
  '===': TokenType.STRICT_EQ,
  '!==': TokenType.STRICT_NE,
};

/**
 * Get human-readable name for token type
 */
export function tokenTypeName(type: TokenType): string {
  const names: Record<TokenType, string> = {
    [TokenType.GAME]: 'game',
    [TokenType.EXTENDS]: 'extends',
    [TokenType.BOARD]: 'board',
    [TokenType.SIZE]: 'size',
    [TokenType.ZONES]: 'zones',
    [TokenType.PIECES]: 'pieces',
    [TokenType.SETUP]: 'setup',
    [TokenType.VICTORY]: 'victory',
    [TokenType.DRAW]: 'draw',
    [TokenType.RULES]: 'rules',
    [TokenType.ADD]: 'add',
    [TokenType.REMOVE]: 'remove',
    [TokenType.REPLACE]: 'replace',
    [TokenType.PIECE]: 'piece',
    [TokenType.EFFECT]: 'effect',
    [TokenType.TRIGGER]: 'trigger',
    [TokenType.PATTERN]: 'pattern',
    [TokenType.MOVE]: 'move',
    [TokenType.CAPTURE]: 'capture',
    [TokenType.TRAITS]: 'traits',
    [TokenType.STATE]: 'state',
    [TokenType.ON]: 'on',
    [TokenType.WHEN]: 'when',
    [TokenType.DO]: 'do',
    [TokenType.BLOCKS]: 'blocks',
    [TokenType.VISUAL]: 'visual',
    [TokenType.OPTIONAL]: 'optional',
    [TokenType.DESCRIPTION]: 'description',
    [TokenType.SCRIPT]: 'script',
    [TokenType.FUNCTION]: 'function',
    [TokenType.LET]: 'let',
    [TokenType.CONST]: 'const',
    [TokenType.VAR]: 'var',
    [TokenType.IF]: 'if',
    [TokenType.ELSE]: 'else',
    [TokenType.FOR]: 'for',
    [TokenType.WHILE]: 'while',
    [TokenType.RETURN]: 'return',
    [TokenType.OF]: 'of',
    [TokenType.IN]: 'in',
    [TokenType.STEP]: 'step',
    [TokenType.SLIDE]: 'slide',
    [TokenType.LEAP]: 'leap',
    [TokenType.HOP]: 'hop',
    [TokenType.NORTH]: 'N',
    [TokenType.SOUTH]: 'S',
    [TokenType.EAST]: 'E',
    [TokenType.WEST]: 'W',
    [TokenType.NORTHEAST]: 'NE',
    [TokenType.NORTHWEST]: 'NW',
    [TokenType.SOUTHEAST]: 'SE',
    [TokenType.SOUTHWEST]: 'SW',
    [TokenType.ORTHOGONAL]: 'orthogonal',
    [TokenType.DIAGONAL]: 'diagonal',
    [TokenType.ANY]: 'any',
    [TokenType.FORWARD]: 'forward',
    [TokenType.BACKWARD]: 'backward',
    [TokenType.EMPTY]: 'empty',
    [TokenType.ENEMY]: 'enemy',
    [TokenType.FRIEND]: 'friend',
    [TokenType.CLEAR]: 'clear',
    [TokenType.CHECK]: 'check',
    [TokenType.FIRST_MOVE]: 'first_move',
    [TokenType.RANK]: 'rank',
    [TokenType.FILE]: 'file',
    [TokenType.CAPTURED]: 'captured',
    [TokenType.CHECKS]: 'checks',
    [TokenType.OPPONENT]: 'opponent',
    [TokenType.SET]: 'set',
    [TokenType.CREATE]: 'create',
    [TokenType.TRANSFORM]: 'transform',
    [TokenType.MARK]: 'mark',
    [TokenType.WIN]: 'win',
    [TokenType.LOSE]: 'lose',
    [TokenType.CANCEL]: 'cancel',
    [TokenType.APPLY]: 'apply',
    [TokenType.AND]: 'and',
    [TokenType.OR]: 'or',
    [TokenType.NOT]: 'not',
    [TokenType.WHERE]: 'where',
    [TokenType.NUMBER]: 'number',
    [TokenType.STRING]: 'string',
    [TokenType.BOOLEAN]: 'boolean',
    [TokenType.NULL]: 'null',
    [TokenType.IDENTIFIER]: 'identifier',
    [TokenType.SQUARE]: 'square',
    [TokenType.WHITE]: 'White',
    [TokenType.BLACK]: 'Black',
    [TokenType.COLON]: ':',
    [TokenType.COMMA]: ',',
    [TokenType.DOT]: '.',
    [TokenType.PIPE]: '|',
    [TokenType.PLUS]: '+',
    [TokenType.MINUS]: '-',
    [TokenType.STAR]: '*',
    [TokenType.SLASH]: '/',
    [TokenType.PERCENT]: '%',
    [TokenType.EQUALS]: '=',
    [TokenType.PLUS_EQUALS]: '+=',
    [TokenType.MINUS_EQUALS]: '-=',
    [TokenType.STAR_EQUALS]: '*=',
    [TokenType.SLASH_EQUALS]: '/=',
    [TokenType.EQ]: '==',
    [TokenType.STRICT_EQ]: '===',
    [TokenType.NE]: '!=',
    [TokenType.STRICT_NE]: '!==',
    [TokenType.LT]: '<',
    [TokenType.GT]: '>',
    [TokenType.LE]: '<=',
    [TokenType.GE]: '>=',
    [TokenType.AMPERSAND]: '&',
    [TokenType.DOUBLE_AMPERSAND]: '&&',
    [TokenType.DOUBLE_PIPE]: '||',
    [TokenType.BANG]: '!',
    [TokenType.QUESTION]: '?',
    [TokenType.ARROW]: '->',
    [TokenType.FAT_ARROW]: '=>',
    [TokenType.LPAREN]: '(',
    [TokenType.RPAREN]: ')',
    [TokenType.LBRACE]: '{',
    [TokenType.RBRACE]: '}',
    [TokenType.LBRACKET]: '[',
    [TokenType.RBRACKET]: ']',
    [TokenType.INDENT]: 'INDENT',
    [TokenType.DEDENT]: 'DEDENT',
    [TokenType.NEWLINE]: 'NEWLINE',
    [TokenType.SEMICOLON]: ';',
    [TokenType.EOF]: 'EOF',
    [TokenType.ERROR]: 'ERROR',
  };

  return names[type] ?? type;
}
