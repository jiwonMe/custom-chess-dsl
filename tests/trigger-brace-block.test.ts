import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/index.js';
import { Parser } from '../src/parser/index.js';

describe('Trigger do: block with braces', () => {
  it('should parse trigger with brace block in do clause', () => {
    const code = `
game: "Bomber Chess"

trigger bomber_explosion {
  on: capture
  when: captured.type == Bomber
  do: {
    remove pieces in radius(1) from target
  }
}
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.triggers).toHaveLength(1);
    expect(ast.triggers[0].name).toBe('bomber_explosion');
    expect(ast.triggers[0].on).toBe('capture');
    expect(ast.triggers[0].actions).toHaveLength(1);
    
    const action = ast.triggers[0].actions[0];
    expect(action.kind).toBe('remove');
    expect(action.range).toBeDefined();
    expect(action.range?.kind).toBe('radius');
    expect(action.range?.value).toBe(1);
  });

  it('should parse trigger with simple brace block', () => {
    const code = `
trigger test_trigger {
  on: move
  do: {
    set piece.state.moved = true
  }
}
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.triggers).toHaveLength(1);
    expect(ast.triggers[0].actions).toHaveLength(1);
    expect(ast.triggers[0].actions[0].kind).toBe('set');
  });

  it('should parse trigger with multiple actions in brace block', () => {
    const code = `
trigger multi_action {
  on: capture
  do: {
    set piece.state.captures += 1
    remove target
  }
}
`;

    const lexer = new Lexer(code, 'test.cl');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.triggers).toHaveLength(1);
    expect(ast.triggers[0].actions).toHaveLength(2);
    expect(ast.triggers[0].actions[0].kind).toBe('set');
    expect(ast.triggers[0].actions[1].kind).toBe('remove');
  });
});
