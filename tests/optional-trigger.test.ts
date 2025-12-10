import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/index.js';
import { Parser } from '../src/parser/index.js';
import { Compiler } from '../src/compiler/index.js';
import { GameEngine } from '../src/engine/game.js';

describe('Optional Triggers', () => {
  it('should parse trigger with optional: true', () => {
    const code = `
game: "Optional Test"

trigger test_trigger {
  on: move
  when: piece.type == Pawn
  optional: true
  description: "Execute this trigger?"
  do: set piece.state.tested = true
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const trigger = ast.triggers[0];
    expect(trigger).toBeDefined();
    expect(trigger?.optional).toBe(true);
    expect(trigger?.description).toBe('Execute this trigger?');
  });

  it('should parse trigger with optional: false', () => {
    const code = `
game: "Optional False Test"

trigger test_trigger {
  on: move
  optional: false
  do: set piece.state.tested = true
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const trigger = ast.triggers[0];
    expect(trigger).toBeDefined();
    expect(trigger?.optional).toBe(false);
  });

  it('should compile optional trigger', () => {
    const code = `
game: "Optional Compile Test"

trigger optional_action {
  on: move
  when: piece.type == King
  optional: true
  description: "Do something special?"
  do: set piece.state.special = true
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const compiled = compiler.compile();

    const trigger = compiled.triggers[0];
    expect(trigger).toBeDefined();
    expect(trigger?.optional).toBe(true);
    expect(trigger?.description).toBe('Do something special?');
  });

  it('should add optional trigger to pending list during game', () => {
    const code = `
game: "Trapper Test"
extends: "Standard Chess"

piece Trapper {
  move: step(any)
  capture: =move
  state: { traps: 0 }
}

setup:
  add:
    White Trapper: [e3]

trigger place_trap {
  on: move
  when: piece.type == Trapper and piece.state.traps < 3
  optional: true
  description: "Place a trap?"
  do: set piece.state.traps = piece.state.traps + 1
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const compiled = compiler.compile();

    const engine = new GameEngine(compiled);

    // Find Trapper and move it
    const trapper = engine.getBoard().getAllPieces().find(p => p.type === 'Trapper');
    expect(trapper).toBeDefined();

    // Get legal moves for Trapper
    const moves = engine.getLegalMoves().filter(m => 
      m.from.file === trapper!.pos.file && m.from.rank === trapper!.pos.rank
    );
    expect(moves.length).toBeGreaterThan(0);

    // Make a move with the Trapper
    const result = engine.makeMove(moves[0]!);
    expect(result.success).toBe(true);

    // Check pending optional triggers
    const pending = engine.getPendingOptionalTriggers();
    expect(pending.length).toBe(1);
    expect(pending[0]?.triggerName).toBe('place_trap');
  });

  it('should execute optional trigger when confirmed', () => {
    const code = `
game: "Execute Optional Test"
extends: "Standard Chess"

piece Trapper {
  move: step(any)
  capture: =move
  state: { traps: 0 }
}

setup:
  add:
    White Trapper: [e3]

trigger place_trap {
  on: move
  when: piece.type == Trapper
  optional: true
  description: "Place a trap?"
  do: set piece.state.traps = piece.state.traps + 1
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const compiled = compiler.compile();

    const engine = new GameEngine(compiled);

    // Find Trapper
    let trapper = engine.getBoard().getAllPieces().find(p => p.type === 'Trapper');
    expect(trapper).toBeDefined();

    // Move Trapper
    const moves = engine.getLegalMoves().filter(m => 
      m.from.file === trapper!.pos.file && m.from.rank === trapper!.pos.rank
    );
    engine.makeMove(moves[0]!);

    // Verify pending trigger
    expect(engine.hasPendingOptionalTriggers()).toBe(true);

    // Execute the trigger
    engine.executeOptionalTrigger('place_trap');

    // Verify trigger executed (traps incremented)
    trapper = engine.getBoard().getAllPieces().find(p => p.type === 'Trapper');
    expect(trapper?.state?.['traps']).toBe(1);

    // No more pending triggers
    expect(engine.hasPendingOptionalTriggers()).toBe(false);
  });

  it('should skip optional trigger when declined', () => {
    const code = `
game: "Skip Optional Test"
extends: "Standard Chess"

piece Trapper {
  move: step(any)
  capture: =move
  state: { traps: 0 }
}

setup:
  add:
    White Trapper: [e3]

trigger place_trap {
  on: move
  when: piece.type == Trapper
  optional: true
  description: "Place a trap?"
  do: set piece.state.traps = piece.state.traps + 1
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const compiled = compiler.compile();

    const engine = new GameEngine(compiled);

    // Find Trapper
    let trapper = engine.getBoard().getAllPieces().find(p => p.type === 'Trapper');
    expect(trapper).toBeDefined();

    // Move Trapper
    const moves = engine.getLegalMoves().filter(m => 
      m.from.file === trapper!.pos.file && m.from.rank === trapper!.pos.rank
    );
    engine.makeMove(moves[0]!);

    // Verify pending trigger
    expect(engine.hasPendingOptionalTriggers()).toBe(true);

    // Skip the trigger
    engine.skipOptionalTrigger('place_trap');

    // Verify trigger was NOT executed (traps still 0)
    trapper = engine.getBoard().getAllPieces().find(p => p.type === 'Trapper');
    expect(trapper?.state?.['traps']).toBe(0);

    // No more pending triggers
    expect(engine.hasPendingOptionalTriggers()).toBe(false);
  });

  it('should block enemy pieces from entering trap squares', () => {
    const code = `
game: "Block Test"
extends: "Standard Chess"

effect trap {
  blocks: enemy
  visual: "red"
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const compiled = compiler.compile();

    const engine = new GameEngine(compiled);

    // Place a trap at e4 owned by White
    engine.getBoard().addEffect({ file: 4, rank: 3 }, {
      id: 'trap_1',
      type: 'trap',
      blocks: 'enemy',
      owner: 'White',
      visual: 'red',
    });

    // Get Black's pawn moves - e7 pawn should not be able to move to e4 (blocked)
    // First, move White pawn
    const whiteMoves = engine.getLegalMoves().filter(m => 
      m.piece.type === 'Pawn' && m.piece.owner === 'White' &&
      m.from.file === 4 && m.from.rank === 1
    );
    expect(whiteMoves.length).toBeGreaterThan(0);
    
    // White pawn can still move to e3 and e4
    const whiteMoveToE3 = whiteMoves.find(m => m.to.file === 4 && m.to.rank === 2);
    const whiteMoveToE4 = whiteMoves.find(m => m.to.file === 4 && m.to.rank === 3);
    expect(whiteMoveToE3).toBeDefined();
    expect(whiteMoveToE4).toBeDefined(); // White can enter own trap

    // Move White pawn to e3 and switch turn
    engine.makeMove(whiteMoveToE3!);

    // Now it's Black's turn
    const blackMoves = engine.getLegalMoves().filter(m => 
      m.piece.type === 'Pawn' && m.piece.owner === 'Black' &&
      m.from.file === 4 && m.from.rank === 6
    );

    // Black pawn should NOT be able to move to e4 (blocked by trap)
    const blackMoveToE4 = blackMoves.find(m => m.to.file === 4 && m.to.rank === 3);
    expect(blackMoveToE4).toBeUndefined();

    // Black pawn can still move to e5 and e6
    const blackMoveToE5 = blackMoves.find(m => m.to.file === 4 && m.to.rank === 4);
    const blackMoveToE6 = blackMoves.find(m => m.to.file === 4 && m.to.rank === 5);
    expect(blackMoveToE5).toBeDefined();
    expect(blackMoveToE6).toBeDefined();
  });

  it('should correctly evaluate piece.type == TypeName condition', () => {
    const code = `
game: "Type Condition Test"
extends: "Standard Chess"

trigger pawn_move_test {
  on: move
  when: piece.type == Pawn
  do: set piece.state.tested = true
}
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const compiled = compiler.compile();

    const engine = new GameEngine(compiled);

    // Get a pawn move (e2-e4)
    const pawnMoves = engine.getLegalMoves().filter(m => 
      m.piece.type === 'Pawn' && m.from.file === 4 && m.from.rank === 1
    );
    expect(pawnMoves.length).toBeGreaterThan(0);

    // Make pawn move
    engine.makeMove(pawnMoves[0]!);

    // Verify trigger executed (state.tested = true)
    const movedPawn = engine.getBoard().at(pawnMoves[0]!.to);
    expect(movedPawn?.state?.['tested']).toBe(true);
  });

  it('should NOT trigger optional for non-matching piece types', () => {
    const code = `
game: "Trapper Full Test"
extends: "Standard Chess"

piece Trapper {
  move: step(any)
  capture: =move
  state: { traps: 0 }
}

effect trap {
  blocks: enemy
  visual: "red"
}

trigger place_trap {
  on: move
  when: piece.type == Trapper and piece.state.traps < 3
  optional: true
  description: "Place trap?"
  do: set piece.state.traps = piece.state.traps + 1
}

setup:
  add:
    White Trapper: [d1]
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(ast);
    const compiled = compiler.compile();

    const engine = new GameEngine(compiled);

    // Move Pawn (should NOT trigger)
    const pawnMoves = engine.getLegalMoves().filter(m => 
      m.piece.type === 'Pawn' && m.from.file === 4 && m.from.rank === 1
    );
    engine.makeMove(pawnMoves[0]!);
    expect(engine.hasPendingOptionalTriggers()).toBe(false);

    // Black move
    const blackMoves = engine.getLegalMoves().filter(m => 
      m.piece.owner === 'Black'
    );
    engine.makeMove(blackMoves[0]!);
    expect(engine.hasPendingOptionalTriggers()).toBe(false);

    // Move Trapper (SHOULD trigger)
    const trapperMoves = engine.getLegalMoves().filter(m => 
      m.piece.type === 'Trapper'
    );
    expect(trapperMoves.length).toBeGreaterThan(0);
    engine.makeMove(trapperMoves[0]!);
    expect(engine.hasPendingOptionalTriggers()).toBe(true);
    expect(engine.getPendingOptionalTriggers()[0]?.triggerName).toBe('place_trap');
  });
});
