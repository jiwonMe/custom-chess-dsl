import type { Token, SourceLocation } from '../types/index.js';
import { TokenType, LexerError } from '../types/index.js';
import { Scanner, isDigit, isAlpha, isAlphaNumeric, isWhitespace, isNewline, isSquareNotation } from './scanner.js';
import { KEYWORDS, SINGLE_CHAR_TOKENS, DOUBLE_CHAR_TOKENS, TRIPLE_CHAR_TOKENS } from './tokens.js';

export { Scanner } from './scanner.js';
export { KEYWORDS, STANDARD_PIECES, tokenTypeName } from './tokens.js';

/**
 * Lexer for ChessLang
 * Supports 3 levels of syntax with indentation-sensitivity
 */
export class Lexer {
  private scanner: Scanner;
  private tokens: Token[] = [];
  private indentStack: number[] = [0];
  private atLineStart: boolean = true;
  private inScriptBlock: boolean = false;
  private braceDepth: number = 0;

  constructor(source: string, filename?: string) {
    this.scanner = new Scanner(source, filename);
  }

  /**
   * Tokenize the entire source
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.indentStack = [0];
    this.atLineStart = true;
    this.inScriptBlock = false;
    this.braceDepth = 0;

    while (!this.scanner.isAtEnd()) {
      this.scanToken();
    }

    // Emit remaining DEDENTs
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.addToken(TokenType.DEDENT, '');
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  /**
   * Scan a single token
   */
  private scanToken(): void {
    // Handle indentation at line start (but not in script blocks)
    if (this.atLineStart && !this.inScriptBlock) {
      this.handleIndentation();
      this.atLineStart = false;
    }

    // Skip whitespace (not newlines)
    this.skipWhitespace();

    if (this.scanner.isAtEnd()) return;

    const char = this.scanner.peek();

    // Comments
    if (char === '#' || (char === '/' && this.scanner.peekNext() === '/')) {
      this.skipComment();
      return;
    }

    // Block comments
    if (char === '/' && this.scanner.peekNext() === '*') {
      this.skipBlockComment();
      return;
    }

    // Newlines
    if (isNewline(char)) {
      this.scanner.advance();
      if (!this.inScriptBlock || this.braceDepth === 0) {
        this.addToken(TokenType.NEWLINE, '\n');
      }
      this.atLineStart = true;
      return;
    }

    // String literals
    if (char === '"' || char === "'") {
      this.scanString();
      return;
    }

    // Numbers
    if (isDigit(char)) {
      this.scanNumber();
      return;
    }

    // Identifiers and keywords
    if (isAlpha(char)) {
      this.scanIdentifier();
      return;
    }

    // Operators and punctuation
    this.scanOperator();
  }

  /**
   * Handle Python-like indentation
   */
  private handleIndentation(): void {
    let indent = 0;

    while (!this.scanner.isAtEnd()) {
      const char = this.scanner.peek();
      if (char === ' ') {
        indent++;
        this.scanner.advance();
      } else if (char === '\t') {
        indent += 4; // Treat tab as 4 spaces
        this.scanner.advance();
      } else {
        break;
      }
    }

    // Skip blank lines and comment-only lines
    if (this.scanner.peek() === '\n' || this.scanner.peek() === '#') {
      return;
    }

    const currentIndent = this.indentStack[this.indentStack.length - 1]!;

    if (indent > currentIndent) {
      this.indentStack.push(indent);
      this.addToken(TokenType.INDENT, '');
    } else if (indent < currentIndent) {
      while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1]! > indent) {
        this.indentStack.pop();
        this.addToken(TokenType.DEDENT, '');
      }

      // Check for inconsistent indentation
      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        this.error('Inconsistent indentation');
      }
    }
  }

  /**
   * Skip whitespace (not newlines)
   */
  private skipWhitespace(): void {
    while (!this.scanner.isAtEnd() && isWhitespace(this.scanner.peek())) {
      this.scanner.advance();
    }
  }

  /**
   * Skip line comment
   */
  private skipComment(): void {
    const char = this.scanner.peek();
    if (char === '#') {
      this.scanner.advance();
    } else {
      this.scanner.advance(); // /
      this.scanner.advance(); // /
    }

    while (!this.scanner.isAtEnd() && !isNewline(this.scanner.peek())) {
      this.scanner.advance();
    }
  }

  /**
   * Skip block comment
   */
  private skipBlockComment(): void {
    this.scanner.advance(); // /
    this.scanner.advance(); // *

    while (!this.scanner.isAtEnd()) {
      if (this.scanner.peek() === '*' && this.scanner.peekNext() === '/') {
        this.scanner.advance();
        this.scanner.advance();
        return;
      }
      this.scanner.advance();
    }

    this.error('Unterminated block comment');
  }

  /**
   * Scan string literal
   */
  private scanString(): void {
    const quote = this.scanner.advance();
    const start = this.scanner.getPosition();
    let value = '';

    while (!this.scanner.isAtEnd() && this.scanner.peek() !== quote) {
      if (isNewline(this.scanner.peek())) {
        this.error('Unterminated string');
        return;
      }

      // Handle escape sequences
      if (this.scanner.peek() === '\\') {
        this.scanner.advance();
        if (!this.scanner.isAtEnd()) {
          const escaped = this.scanner.advance();
          switch (escaped) {
            case 'n': value += '\n'; break;
            case 't': value += '\t'; break;
            case 'r': value += '\r'; break;
            case '\\': value += '\\'; break;
            case '"': value += '"'; break;
            case "'": value += "'"; break;
            default: value += escaped;
          }
        }
      } else {
        value += this.scanner.advance();
      }
    }

    if (this.scanner.isAtEnd()) {
      this.error('Unterminated string');
      return;
    }

    this.scanner.advance(); // closing quote
    this.addTokenWithValue(TokenType.STRING, value, start - 1);
  }

  /**
   * Scan number literal
   */
  private scanNumber(): void {
    const start = this.scanner.getPosition();
    let value = this.scanner.readWhile(isDigit);

    // Handle decimal
    if (this.scanner.peek() === '.' && isDigit(this.scanner.peekNext())) {
      value += this.scanner.advance(); // .
      value += this.scanner.readWhile(isDigit);
    }

    this.addTokenWithValue(TokenType.NUMBER, value, start);
  }

  /**
   * Scan identifier or keyword
   */
  private scanIdentifier(): void {
    const start = this.scanner.getPosition();
    const value = this.scanner.readWhile(isAlphaNumeric);

    // Check for keywords
    const keywordType = KEYWORDS[value];
    if (keywordType !== undefined) {
      // Special handling for 'script' keyword
      if (keywordType === TokenType.SCRIPT) {
        this.inScriptBlock = true;
      }

      this.addTokenWithValue(keywordType, value, start);
      return;
    }

    // Check for square notation (e.g., e4, a1)
    if (isSquareNotation(value)) {
      this.addTokenWithValue(TokenType.SQUARE, value, start);
      return;
    }

    // Regular identifier
    this.addTokenWithValue(TokenType.IDENTIFIER, value, start);
  }

  /**
   * Scan operator or punctuation
   */
  private scanOperator(): void {
    const start = this.scanner.getPosition();
    const char = this.scanner.peek();
    const nextChar = this.scanner.peekNext();
    const thirdChar = this.scanner.peekAhead(2);

    // Try triple character operators first
    const tripleOp = char + nextChar + thirdChar;
    if (TRIPLE_CHAR_TOKENS[tripleOp]) {
      this.scanner.advance();
      this.scanner.advance();
      this.scanner.advance();
      this.addTokenWithValue(TRIPLE_CHAR_TOKENS[tripleOp]!, tripleOp, start);
      return;
    }

    // Try double character operators
    const doubleOp = char + nextChar;
    if (DOUBLE_CHAR_TOKENS[doubleOp]) {
      this.scanner.advance();
      this.scanner.advance();
      this.addTokenWithValue(DOUBLE_CHAR_TOKENS[doubleOp]!, doubleOp, start);
      return;
    }

    // Single character operators
    if (SINGLE_CHAR_TOKENS[char]) {
      this.scanner.advance();

      // Track brace depth for script blocks
      if (char === '{') {
        this.braceDepth++;
      } else if (char === '}') {
        this.braceDepth--;
        if (this.braceDepth === 0 && this.inScriptBlock) {
          this.inScriptBlock = false;
        }
      }

      this.addTokenWithValue(SINGLE_CHAR_TOKENS[char]!, char, start);
      return;
    }

    // Unknown character
    this.scanner.advance();
    this.error(`Unexpected character: ${char}`);
  }

  /**
   * Add a token
   */
  private addToken(type: TokenType, value: string): void {
    const location = this.scanner.getLocation();
    location.length = value.length;
    this.tokens.push({ type, value, location });
  }

  /**
   * Add a token with explicit start position
   */
  private addTokenWithValue(type: TokenType, value: string, start: number): void {
    const location = this.scanner.locationFrom(start);
    this.tokens.push({ type, value, location });
  }

  /**
   * Report an error
   */
  private error(message: string): void {
    const location = this.scanner.getLocation();
    this.addToken(TokenType.ERROR, message);
    throw new LexerError(message, location);
  }
}

/**
 * Helper class for consuming tokens during parsing
 */
export class TokenStream {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Check if at end of tokens
   */
  isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Get current token without advancing
   */
  peek(): Token {
    return this.tokens[this.position] ?? this.tokens[this.tokens.length - 1]!;
  }

  /**
   * Get next token without advancing
   */
  peekNext(): Token {
    return this.tokens[this.position + 1] ?? this.tokens[this.tokens.length - 1]!;
  }

  /**
   * Look ahead n tokens
   */
  peekAhead(n: number): Token {
    return this.tokens[this.position + n] ?? this.tokens[this.tokens.length - 1]!;
  }

  /**
   * Advance and return current token
   */
  advance(): Token {
    if (!this.isAtEnd()) {
      this.position++;
    }
    return this.previous();
  }

  /**
   * Get previous token
   */
  previous(): Token {
    return this.tokens[this.position - 1] ?? this.tokens[0]!;
  }

  /**
   * Check if current token matches type
   */
  check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  /**
   * Check if current token matches any of the types
   */
  checkAny(...types: TokenType[]): boolean {
    return types.some(type => this.check(type));
  }

  /**
   * Match and advance if current token matches
   */
  match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * Expect a specific token type
   */
  expect(type: TokenType, message?: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    const token = this.peek();
    const errorMessage = message ?? `Expected ${type}, got ${token.type}`;
    throw new LexerError(errorMessage, token.location);
  }

  /**
   * Skip newlines
   */
  skipNewlines(): void {
    while (this.match(TokenType.NEWLINE)) {
      // Skip
    }
  }

  /**
   * Get current position
   */
  getPosition(): number {
    return this.position;
  }

  /**
   * Restore position
   */
  setPosition(position: number): void {
    this.position = position;
  }

  /**
   * Save current state for backtracking
   */
  saveState(): number {
    return this.position;
  }

  /**
   * Restore saved state
   */
  restoreState(state: number): void {
    this.position = state;
  }
}
