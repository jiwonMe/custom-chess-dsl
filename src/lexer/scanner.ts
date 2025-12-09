import type { SourceLocation } from '../types/index.js';

/**
 * Character scanner for the lexer
 * Handles reading characters from source and tracking position
 */
export class Scanner {
  private readonly source: string;
  private readonly filename: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private lineStart: number = 0;

  constructor(source: string, filename: string = '<input>') {
    this.source = source;
    this.filename = filename;
  }

  /**
   * Check if we've reached the end of input
   */
  isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  /**
   * Get the current character without advancing
   */
  peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.position]!;
  }

  /**
   * Get the next character without advancing
   */
  peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source[this.position + 1]!;
  }

  /**
   * Look ahead n characters
   */
  peekAhead(n: number): string {
    if (this.position + n >= this.source.length) return '\0';
    return this.source[this.position + n]!;
  }

  /**
   * Advance and return the current character
   */
  advance(): string {
    if (this.isAtEnd()) return '\0';

    const char = this.source[this.position]!;
    this.position++;
    this.column++;

    if (char === '\n') {
      this.line++;
      this.column = 1;
      this.lineStart = this.position;
    }

    return char;
  }

  /**
   * Match a specific character and advance if matched
   */
  match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.position] !== expected) return false;

    this.advance();
    return true;
  }

  /**
   * Match a string and advance if matched
   */
  matchString(expected: string): boolean {
    if (this.position + expected.length > this.source.length) return false;

    for (let i = 0; i < expected.length; i++) {
      if (this.source[this.position + i] !== expected[i]) return false;
    }

    for (let i = 0; i < expected.length; i++) {
      this.advance();
    }

    return true;
  }

  /**
   * Skip characters while predicate is true
   */
  skipWhile(predicate: (char: string) => boolean): void {
    while (!this.isAtEnd() && predicate(this.peek())) {
      this.advance();
    }
  }

  /**
   * Read characters while predicate is true
   */
  readWhile(predicate: (char: string) => boolean): string {
    const start = this.position;
    this.skipWhile(predicate);
    return this.source.slice(start, this.position);
  }

  /**
   * Get the current source location
   */
  getLocation(): SourceLocation {
    return {
      line: this.line,
      column: this.column,
      offset: this.position,
      length: 0,
    };
  }

  /**
   * Create a location from start position to current position
   */
  locationFrom(startOffset: number): SourceLocation {
    // Calculate start line and column from offset
    let startLine = 1;
    let startColumn = 1;
    for (let i = 0; i < startOffset; i++) {
      if (this.source[i] === '\n') {
        startLine++;
        startColumn = 1;
      } else {
        startColumn++;
      }
    }

    return {
      line: startLine,
      column: startColumn,
      offset: startOffset,
      length: this.position - startOffset,
    };
  }

  /**
   * Get current position
   */
  getPosition(): number {
    return this.position;
  }

  /**
   * Get current line number
   */
  getLine(): number {
    return this.line;
  }

  /**
   * Get current column number
   */
  getColumn(): number {
    return this.column;
  }

  /**
   * Get filename
   */
  getFilename(): string {
    return this.filename;
  }

  /**
   * Get a slice of source
   */
  slice(start: number, end: number): string {
    return this.source.slice(start, end);
  }

  /**
   * Get the rest of the current line
   */
  restOfLine(): string {
    const start = this.position;
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }
    return this.source.slice(start, this.position);
  }

  /**
   * Get current indentation level (spaces at start of current line)
   */
  getCurrentIndent(): number {
    let indent = 0;
    let pos = this.lineStart;

    while (pos < this.source.length) {
      const char = this.source[pos];
      if (char === ' ') {
        indent++;
        pos++;
      } else if (char === '\t') {
        indent += 4; // Treat tab as 4 spaces
        pos++;
      } else {
        break;
      }
    }

    return indent;
  }
}

/**
 * Character classification utilities
 */
export function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

export function isAlpha(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
}

export function isAlphaNumeric(char: string): boolean {
  return isAlpha(char) || isDigit(char);
}

export function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\r';
}

export function isNewline(char: string): boolean {
  return char === '\n';
}

export function isFileChar(char: string): boolean {
  // a-z 지원 (최대 26열)
  return char >= 'a' && char <= 'z';
}

export function isRankChar(char: string): boolean {
  // 1-9 단일 자리 숫자
  return char >= '1' && char <= '9';
}

export function isSquareNotation(str: string): boolean {
  // 스퀘어 표기법: a1, h8, i10, l12 등
  // 파일(a-z) + 랭크(1-99)
  if (str.length < 2) return false;

  const fileChar = str[0]!;
  if (!isFileChar(fileChar)) return false;

  const rankPart = str.slice(1);
  // 랭크가 숫자인지 확인 (1-99)
  const rank = parseInt(rankPart, 10);
  return !isNaN(rank) && rank >= 1 && rank <= 99 && rankPart === String(rank);
}
