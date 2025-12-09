import { describe, it, expect } from 'vitest';
import { Lexer } from '../../src/lexer/index.js';
import { TokenType } from '../../src/types/index.js';

describe('Lexer', () => {
  describe('basic tokenization', () => {
    it('should tokenize game declaration', () => {
      const source = 'game: "Standard Chess"';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.GAME);
      expect(tokens[1]?.type).toBe(TokenType.COLON);
      expect(tokens[2]?.type).toBe(TokenType.STRING);
      expect(tokens[2]?.value).toBe('Standard Chess');
    });

    it('should tokenize extends declaration', () => {
      const source = 'extends: "Standard Chess"';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.EXTENDS);
      expect(tokens[1]?.type).toBe(TokenType.COLON);
      expect(tokens[2]?.type).toBe(TokenType.STRING);
    });

    it('should tokenize piece keyword', () => {
      const source = 'piece King {}';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.PIECE);
      expect(tokens[1]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1]?.value).toBe('King');
      expect(tokens[2]?.type).toBe(TokenType.LBRACE);
      expect(tokens[3]?.type).toBe(TokenType.RBRACE);
    });
  });

  describe('pattern keywords', () => {
    it('should tokenize step pattern', () => {
      const source = 'step(orthogonal)';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.STEP);
      expect(tokens[1]?.type).toBe(TokenType.LPAREN);
      expect(tokens[2]?.type).toBe(TokenType.ORTHOGONAL);
      expect(tokens[3]?.type).toBe(TokenType.RPAREN);
    });

    it('should tokenize slide pattern', () => {
      const source = 'slide(diagonal)';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.SLIDE);
      expect(tokens[2]?.type).toBe(TokenType.DIAGONAL);
    });

    it('should tokenize leap pattern', () => {
      const source = 'leap(2, 1)';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.LEAP);
      expect(tokens[2]?.type).toBe(TokenType.NUMBER);
      expect(tokens[2]?.value).toBe('2');
    });
  });

  describe('directions', () => {
    it('should tokenize cardinal directions', () => {
      const source = 'N S E W';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.NORTH);
      expect(tokens[1]?.type).toBe(TokenType.SOUTH);
      expect(tokens[2]?.type).toBe(TokenType.EAST);
      expect(tokens[3]?.type).toBe(TokenType.WEST);
    });

    it('should tokenize diagonal directions', () => {
      const source = 'NE NW SE SW';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.NORTHEAST);
      expect(tokens[1]?.type).toBe(TokenType.NORTHWEST);
      expect(tokens[2]?.type).toBe(TokenType.SOUTHEAST);
      expect(tokens[3]?.type).toBe(TokenType.SOUTHWEST);
    });
  });

  describe('square notation', () => {
    it('should tokenize square notation', () => {
      const source = 'e4 d5 a1 h8';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.SQUARE);
      expect(tokens[0]?.value).toBe('e4');
      expect(tokens[1]?.type).toBe(TokenType.SQUARE);
      expect(tokens[1]?.value).toBe('d5');
    });
  });

  describe('operators', () => {
    it('should tokenize comparison operators', () => {
      const source = '== != < > <= >=';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.EQ);
      expect(tokens[1]?.type).toBe(TokenType.NE);
      expect(tokens[2]?.type).toBe(TokenType.LT);
      expect(tokens[3]?.type).toBe(TokenType.GT);
      expect(tokens[4]?.type).toBe(TokenType.LE);
      expect(tokens[5]?.type).toBe(TokenType.GE);
    });

    it('should tokenize logical operators', () => {
      const source = 'and or not && ||';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.AND);
      expect(tokens[1]?.type).toBe(TokenType.OR);
      expect(tokens[2]?.type).toBe(TokenType.NOT);
      expect(tokens[3]?.type).toBe(TokenType.DOUBLE_AMPERSAND);
      expect(tokens[4]?.type).toBe(TokenType.DOUBLE_PIPE);
    });

    it('should tokenize assignment operators', () => {
      const source = '= += -=';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.EQUALS);
      expect(tokens[1]?.type).toBe(TokenType.PLUS_EQUALS);
      expect(tokens[2]?.type).toBe(TokenType.MINUS_EQUALS);
    });
  });

  describe('comments', () => {
    it('should skip line comments with #', () => {
      const source = `game: "Test" # This is a comment
extends: "Standard"`;
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.GAME);
      expect(tokens[3]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[4]?.type).toBe(TokenType.EXTENDS);
    });

    it('should skip line comments with //', () => {
      const source = `game: "Test" // This is a comment
extends: "Standard"`;
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.GAME);
      expect(tokens[4]?.type).toBe(TokenType.EXTENDS);
    });
  });

  describe('indentation', () => {
    it('should emit INDENT and DEDENT tokens', () => {
      const source = `board:
    size: 8x8`;
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.INDENT);
    });
  });

  describe('colors', () => {
    it('should tokenize colors', () => {
      const source = 'White Black';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.WHITE);
      expect(tokens[1]?.type).toBe(TokenType.BLACK);
    });
  });

  describe('literals', () => {
    it('should tokenize numbers', () => {
      const source = '123 45.67';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.NUMBER);
      expect(tokens[0]?.value).toBe('123');
      expect(tokens[1]?.type).toBe(TokenType.NUMBER);
      expect(tokens[1]?.value).toBe('45.67');
    });

    it('should tokenize booleans', () => {
      const source = 'true false';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.BOOLEAN);
      expect(tokens[0]?.value).toBe('true');
      expect(tokens[1]?.type).toBe(TokenType.BOOLEAN);
      expect(tokens[1]?.value).toBe('false');
    });

    it('should tokenize strings with escape sequences', () => {
      const source = '"Hello\\nWorld"';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.STRING);
      expect(tokens[0]?.value).toBe('Hello\nWorld');
    });
  });
});
