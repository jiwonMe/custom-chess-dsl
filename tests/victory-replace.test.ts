import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/index.js';
import { Parser } from '../src/parser/index.js';

describe('Victory/Draw replace and remove syntax', () => {
  it('should parse victory section with add:', () => {
    const code = `
game: "Test"

victory:
  add:
    hill: King in zone.hill
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.victory).toHaveLength(1);
    expect(ast.victory[0].name).toBe('hill');
    expect(ast.victory[0].action).toBe('add');
  });

  it('should parse victory section with replace:', () => {
    const code = `
game: "Test"

victory:
  replace:
    checkmate: King captured
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.victory).toHaveLength(1);
    expect(ast.victory[0].name).toBe('checkmate');
    expect(ast.victory[0].action).toBe('replace');
  });

  it('should parse victory section with remove:', () => {
    const code = `
game: "Test"

victory:
  remove:
    stalemate
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.victory).toHaveLength(1);
    expect(ast.victory[0].name).toBe('stalemate');
    expect(ast.victory[0].action).toBe('remove');
  });

  it('should parse victory section with multiple actions', () => {
    const code = `
game: "Test"

victory:
  add:
    hill: King in zone.hill
  replace:
    checkmate: King captured
  remove:
    stalemate
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.victory).toHaveLength(3);
    
    const addCond = ast.victory.find(v => v.name === 'hill');
    expect(addCond?.action).toBe('add');
    
    const replaceCond = ast.victory.find(v => v.name === 'checkmate');
    expect(replaceCond?.action).toBe('replace');
    
    const removeCond = ast.victory.find(v => v.name === 'stalemate');
    expect(removeCond?.action).toBe('remove');
  });

  it('should parse draw section with replace:', () => {
    const code = `
game: "Test"

draw:
  replace:
    fifty_move: move_count > 100
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.draw).toHaveLength(1);
    expect(ast.draw[0].name).toBe('fifty_move');
    expect(ast.draw[0].action).toBe('replace');
  });
});
