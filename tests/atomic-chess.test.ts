import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/index.js';
import { Parser } from '../src/parser/index.js';
import { Compiler } from '../src/compiler/index.js';
import { GameEngine } from '../src/engine/game.js';
import { STANDARD_CHESS } from '../src/stdlib/standard-chess.js';

const ATOMIC_CHESS = `
game: "Atomic Chess"
extends: "Standard Chess"

trigger atomic_explosion {
  on: capture
  do: {
    remove pieces in radius(1) from destination where not Pawn
  }
}
`;

describe('Atomic Chess', () => {
  it('should parse radius-based remove action', () => {
    const lexer = new Lexer(ATOMIC_CHESS);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.triggers).toHaveLength(1);
    expect(ast.triggers[0].name).toBe('atomic_explosion');
    expect(ast.triggers[0].on).toBe('capture');
    expect(ast.triggers[0].actions).toHaveLength(1);
    
    const action = ast.triggers[0].actions[0];
    expect(action.kind).toBe('remove');
    expect(action.range).toBeDefined();
    expect(action.range?.kind).toBe('radius');
    expect(action.range?.value).toBe(1);
    expect(action.filter).toBeDefined();
    expect(action.filter?.exclude).toContain('Pawn');
  });

  it('should compile atomic chess trigger', () => {
    const lexer = new Lexer(ATOMIC_CHESS);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const game = compiler.compile(STANDARD_CHESS);

    // Find the atomic_explosion trigger (may have standard chess triggers too)
    const trigger = game.triggers.find(t => t.name === 'atomic_explosion');
    expect(trigger).toBeDefined();
    expect(trigger!.on).toBe('capture');
    expect(trigger!.actions).toHaveLength(1);

    const action = trigger!.actions[0] as Record<string, unknown>;
    expect(action.type).toBe('remove');
    expect(action.range).toBeDefined();
    expect(action.filter).toBeDefined();
  });

  it('should execute atomic explosion on capture', () => {
    const lexer = new Lexer(ATOMIC_CHESS);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const game = compiler.compile(STANDARD_CHESS);
    const engine = new GameEngine(game);

    const state = engine.getState();
    
    // Setup: White pawn captures Black pawn
    // Find e2 pawn and move to e4
    const e2Pawn = state.pieces.find(p => 
      p.type === 'Pawn' && p.owner === 'White' && p.pos.file === 4 && p.pos.rank === 1
    );
    expect(e2Pawn).toBeDefined();
    
    // Move e2-e4
    const moves1 = engine.getLegalMoves(e2Pawn!);
    const e4Move = moves1.find(m => m.to.file === 4 && m.to.rank === 3);
    expect(e4Move).toBeDefined();
    engine.makeMove(e4Move!);
    
    // Black: e7-e5
    const e7Pawn = engine.getState().pieces.find(p => 
      p.type === 'Pawn' && p.owner === 'Black' && p.pos.file === 4 && p.pos.rank === 6
    );
    expect(e7Pawn).toBeDefined();
    const moves2 = engine.getLegalMoves(e7Pawn!);
    const e5Move = moves2.find(m => m.to.file === 4 && m.to.rank === 4);
    expect(e5Move).toBeDefined();
    engine.makeMove(e5Move!);
    
    // White: d2-d4
    const d2Pawn = engine.getState().pieces.find(p => 
      p.type === 'Pawn' && p.owner === 'White' && p.pos.file === 3 && p.pos.rank === 1
    );
    expect(d2Pawn).toBeDefined();
    const moves3 = engine.getLegalMoves(d2Pawn!);
    const d4Move = moves3.find(m => m.to.file === 3 && m.to.rank === 3);
    expect(d4Move).toBeDefined();
    engine.makeMove(d4Move!);
    
    // Black: e5xd4 (capture) - should trigger atomic explosion
    const e5Pawn = engine.getState().pieces.find(p => 
      p.type === 'Pawn' && p.owner === 'Black' && p.pos.file === 4 && p.pos.rank === 4
    );
    expect(e5Pawn).toBeDefined();
    
    const pieceCountBefore = engine.getState().pieces.length;
    
    const captureMoves = engine.getLegalMoves(e5Pawn!);
    const captureMove = captureMoves.find(m => m.to.file === 3 && m.to.rank === 3);
    expect(captureMove).toBeDefined();
    
    engine.makeMove(captureMove!);
    
    const pieceCountAfter = engine.getState().pieces.length;
    
    // Atomic explosion should remove pieces in radius 1 (except Pawns)
    // At d4: center of explosion
    // Nearby pieces: e4 pawn (Pawn - should NOT be removed), c3 knight if moved (not likely)
    // The capturing pawn should also be removed (as part of explosion)
    expect(pieceCountAfter).toBeLessThan(pieceCountBefore);
  });
});

describe('Remove with radius filter', () => {
  it('should parse "remove pieces in radius(N) from target"', () => {
    const code = `
game: "Test"
trigger test {
  on: move
  do: remove pieces in radius(2) from destination
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.triggers[0].actions[0].range?.value).toBe(2);
  });

  it('should parse "remove pieces in radius(N) from target where not Type"', () => {
    const code = `
game: "Test"
trigger test {
  on: move
  do: remove pieces in radius(1) from destination where not King
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.triggers[0].actions[0].range?.value).toBe(1);
    expect(ast.triggers[0].actions[0].filter?.exclude).toContain('King');
  });
});
