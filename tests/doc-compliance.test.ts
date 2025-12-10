import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/index.js';
import { Parser } from '../src/parser/index.js';

describe('Document compliance - New features', () => {
  describe('pieces: section (Level 1)', () => {
    it('should parse pieces section with promote_to', () => {
      const code = `
game: "Custom Chess"

pieces:
  Pawn:
    promote_to: [Queen, Rook, Bishop, Knight]
`;

      const lexer = new Lexer(code, 'test.cl');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.piecesConfig).toBeDefined();
      expect(ast.piecesConfig).toHaveLength(1);
      expect(ast.piecesConfig![0].pieceName).toBe('Pawn');
      expect(ast.piecesConfig![0].promoteTo).toEqual(['Queen', 'Rook', 'Bishop', 'Knight']);
    });

    it('should parse pieces section with multiple pieces', () => {
      const code = `
game: "Test"

pieces:
  Pawn:
    promote_to: [Queen, Amazon]
  Knight:
    can_jump: true
`;

      const lexer = new Lexer(code, 'test.cl');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.piecesConfig).toHaveLength(2);
      expect(ast.piecesConfig![0].pieceName).toBe('Pawn');
      expect(ast.piecesConfig![1].pieceName).toBe('Knight');
    });
  });

  describe('add_action (alias for create)', () => {
    it('should parse add action in trigger', () => {
      const code = `
trigger spawn_piece {
  on: capture
  do: add Pawn at e4 for White
}
`;

      const lexer = new Lexer(code, 'test.cl');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.triggers).toHaveLength(1);
      expect(ast.triggers[0].actions).toHaveLength(1);
      expect(ast.triggers[0].actions[0].kind).toBe('create');
      expect(ast.triggers[0].actions[0].pieceType).toBe('Pawn');
    });
  });

  describe('draw_action', () => {
    it('should parse draw action without reason', () => {
      const code = `
trigger force_draw {
  on: move
  when: move_count > 100
  do: draw
}
`;

      const lexer = new Lexer(code, 'test.cl');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.triggers).toHaveLength(1);
      expect(ast.triggers[0].actions).toHaveLength(1);
      expect(ast.triggers[0].actions[0].kind).toBe('draw');
    });

    it('should parse draw action with reason', () => {
      const code = `
trigger stalemate_draw {
  on: turn_start
  when: no_legal_moves
  do: draw stalemate
}
`;

      const lexer = new Lexer(code, 'test.cl');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.triggers).toHaveLength(1);
      expect(ast.triggers[0].actions[0].kind).toBe('draw');
      expect(ast.triggers[0].actions[0].reason).toBe('stalemate');
    });
  });
});
