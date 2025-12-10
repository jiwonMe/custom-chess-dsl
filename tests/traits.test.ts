/**
 * Tests for the traits system
 * Traits are special attributes that can be assigned to pieces
 * Examples: royal, jump, promote, warp, phase, etc.
 */

import { describe, it, expect } from 'vitest';
import { parse, compile, GameEngine } from '../src/index.js';

describe('Traits Parsing', () => {
  it('should parse single trait', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece Guardian {
  move: step(any)
  capture: =move
  traits: [protector]
}
`;
    const ast = parse(code);
    const piece = ast.pieces[0];
    
    expect(piece).toBeDefined();
    expect(piece?.traits).toEqual(['protector']);
  });

  it('should parse multiple traits', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece Teleporter {
  move: step(orthogonal)
  capture: =move
  traits: [warp, phase, teleport]
}
`;
    const ast = parse(code);
    const piece = ast.pieces[0];
    
    expect(piece).toBeDefined();
    expect(piece?.traits).toHaveLength(3);
    expect(piece?.traits).toContain('warp');
    expect(piece?.traits).toContain('phase');
    expect(piece?.traits).toContain('teleport');
  });

  it('should parse empty traits array', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece Basic {
  move: step(any)
  capture: =move
  traits: []
}
`;
    const ast = parse(code);
    const piece = ast.pieces[0];
    
    expect(piece).toBeDefined();
    expect(piece?.traits).toEqual([]);
  });

  it('should parse traits with other properties', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece ComplexPiece {
  move: slide(diagonal)
  capture: step(orthogonal)
  traits: [royal, jump]
  state: { power: 10, active: true }
}
`;
    const ast = parse(code);
    const piece = ast.pieces[0];
    
    expect(piece).toBeDefined();
    expect(piece?.traits).toEqual(['royal', 'jump']);
    expect(piece?.state).toEqual({ power: 10, active: true });
  });
});

describe('Traits Compilation', () => {
  it('should compile traits to piece definition', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece Vampire {
  move: step(any)
  capture: =move
  traits: [drain, immortal]
}
`;
    const ast = parse(code);
    const compiled = compile(ast);
    
    const vampire = compiled.pieces.get('Vampire');
    expect(vampire).toBeDefined();
    expect(vampire?.traits).toEqual(['drain', 'immortal']);
  });

  it('should compile multiple custom pieces with traits', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece Ghost {
  move: slide(any)
  capture: none
  traits: [phase, intangible]
}

piece Tank {
  move: step(orthogonal)
  capture: =move
  traits: [heavy, armored, slow]
}
`;
    const ast = parse(code);
    const compiled = compile(ast);
    
    const ghost = compiled.pieces.get('Ghost');
    expect(ghost).toBeDefined();
    expect(ghost?.traits).toEqual(['phase', 'intangible']);
    
    const tank = compiled.pieces.get('Tank');
    expect(tank).toBeDefined();
    expect(tank?.traits).toEqual(['heavy', 'armored', 'slow']);
  });
});

describe('Traits in Game Engine', () => {
  it('should assign traits to pieces on board', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece Teleporter {
  move: step(orthogonal)
  capture: =move
  traits: [warp, phase]
}

setup:
  add:
    White Teleporter: [d3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Find the Teleporter piece
    const teleporter = state.pieces.find(
      p => p.type === 'Teleporter' && p.pos.file === 3 && p.pos.rank === 2
    );
    
    expect(teleporter).toBeDefined();
    // Piece.traits is a Set<string>
    expect(teleporter?.traits).toBeInstanceOf(Set);
    expect(teleporter?.traits.has('warp')).toBe(true);
    expect(teleporter?.traits.has('phase')).toBe(true);
    expect(teleporter?.traits.size).toBe(2);
  });

  it('should assign standard piece traits correctly', () => {
    const code = `
game: "Test"
extends: "Standard Chess"
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Find the White King
    const whiteKing = state.pieces.find(
      p => p.type === 'King' && p.owner === 'White'
    );
    expect(whiteKing).toBeDefined();
    expect(whiteKing?.traits.has('royal')).toBe(true);
    
    // Find a Knight
    const knight = state.pieces.find(
      p => p.type === 'Knight' && p.owner === 'White'
    );
    expect(knight).toBeDefined();
    expect(knight?.traits.has('jump')).toBe(true);
    
    // Find a Pawn
    const pawn = state.pieces.find(
      p => p.type === 'Pawn' && p.owner === 'White'
    );
    expect(pawn).toBeDefined();
    expect(pawn?.traits.has('promote')).toBe(true);
  });

  it('should preserve traits after piece replacement', () => {
    const code = `
game: "Test"
extends: "Standard Chess"

piece SuperKnight {
  move: leap(2, 1)
  capture: =move
  traits: [jump, super, enhanced]
}

setup:
  replace:
    Knight: SuperKnight
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Find SuperKnight pieces (should be 4 - replacing all Knights)
    const superKnights = state.pieces.filter(p => p.type === 'SuperKnight');
    expect(superKnights.length).toBe(4);
    
    // Check traits
    for (const sk of superKnights) {
      expect(sk.traits.has('jump')).toBe(true);
      expect(sk.traits.has('super')).toBe(true);
      expect(sk.traits.has('enhanced')).toBe(true);
    }
  });
});

describe('Traits Usage Scenarios', () => {
  it('should support royal trait for custom King-like pieces', () => {
    const code = `
game: "Two Kings"
extends: "Standard Chess"

piece Emperor {
  move: step(any)
  capture: =move
  traits: [royal]
}

setup:
  add:
    White Emperor: [d3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Find Emperor
    const emperor = state.pieces.find(p => p.type === 'Emperor');
    expect(emperor).toBeDefined();
    expect(emperor?.traits.has('royal')).toBe(true);
    
    // Original King should also have royal
    const king = state.pieces.find(
      p => p.type === 'King' && p.owner === 'White'
    );
    expect(king?.traits.has('royal')).toBe(true);
  });

  it('should support common game traits', () => {
    const code = `
game: "Trait Test"
extends: "Standard Chess"

piece Ghost {
  move: slide(any)
  capture: none
  traits: [phase, ghost, intangible]
}

piece Bomber {
  move: step(any)
  capture: =move
  traits: [explosive, volatile]
}

piece Summoner {
  move: step(orthogonal)
  capture: =move
  traits: [summon, magical]
}

setup:
  add:
    White Ghost: [a3]
    White Bomber: [b3]
    White Summoner: [c3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Ghost traits
    const ghost = state.pieces.find(p => p.type === 'Ghost');
    expect(ghost?.traits.has('phase')).toBe(true);
    expect(ghost?.traits.has('ghost')).toBe(true);
    expect(ghost?.traits.has('intangible')).toBe(true);
    
    // Bomber traits
    const bomber = state.pieces.find(p => p.type === 'Bomber');
    expect(bomber?.traits.has('explosive')).toBe(true);
    expect(bomber?.traits.has('volatile')).toBe(true);
    
    // Summoner traits
    const summoner = state.pieces.find(p => p.type === 'Summoner');
    expect(summoner?.traits.has('summon')).toBe(true);
    expect(summoner?.traits.has('magical')).toBe(true);
  });
});

describe('Frozen Effect', () => {
  it('should prevent piece from moving when frozen > 0', () => {
    const code = `
game: "Frozen Test"
extends: "Standard Chess"

piece Medusa {
  move: step(any)
  capture: slide(diagonal)
  traits: [gaze, petrify]
  state: { frozen: 0 }
}

effect frozen {
  blocks: all
  visual: "cyan"
}

trigger medusa_petrify {
  on: capture
  when: piece.type == Medusa
  do: set piece.state.frozen = piece.state.frozen + 1
}

setup:
  add:
    White Medusa: [d4]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Find Medusa at d4
    let state = game.getState();
    const medusa = state.pieces.find(
      p => p.type === 'Medusa' && p.owner === 'White'
    );
    
    expect(medusa).toBeDefined();
    expect(medusa?.state['frozen']).toBe(0);
    
    // Medusa should be able to move initially (d4 is open)
    const initialMoves = game.getLegalMovesForPiece(medusa!);
    expect(initialMoves.length).toBeGreaterThan(0);
    
    // Manually set frozen to 1 to test
    medusa!.state['frozen'] = 1;
    
    // Now Medusa should NOT be able to move
    const frozenMoves = game.getLegalMovesForPiece(medusa!);
    expect(frozenMoves.length).toBe(0);
    
    // Reset frozen
    medusa!.state['frozen'] = 0;
    
    // Should be able to move again
    const unfrozenMoves = game.getLegalMovesForPiece(medusa!);
    expect(unfrozenMoves.length).toBeGreaterThan(0);
  });

  it('should check isFrozen correctly', () => {
    const code = `
game: "isFrozen Test"
extends: "Standard Chess"

piece TestPiece {
  move: step(any)
  capture: =move
  state: { frozen: 0 }
}

setup:
  add:
    White TestPiece: [d4]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    const state = game.getState();
    const testPiece = state.pieces.find(p => p.type === 'TestPiece')!;
    
    // Initially not frozen
    expect(game.isFrozen(testPiece)).toBe(false);
    
    // Set frozen to 1
    testPiece.state['frozen'] = 1;
    expect(game.isFrozen(testPiece)).toBe(true);
    
    // Set frozen to 5
    testPiece.state['frozen'] = 5;
    expect(game.isFrozen(testPiece)).toBe(true);
    
    // Set frozen back to 0
    testPiece.state['frozen'] = 0;
    expect(game.isFrozen(testPiece)).toBe(false);
    
    // Test with negative value (not frozen)
    testPiece.state['frozen'] = -1;
    expect(game.isFrozen(testPiece)).toBe(false);
  });

  it('should use isBlocked to combine cooldown and frozen checks', () => {
    const code = `
game: "isBlocked Test"
extends: "Standard Chess"

piece TestPiece {
  move: step(any)
  capture: =move
  state: { frozen: 0, cooldown: 0 }
}

setup:
  add:
    White TestPiece: [e4]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    const state = game.getState();
    const testPiece = state.pieces.find(p => p.type === 'TestPiece')!;
    
    // Initially not blocked
    expect(game.isBlocked(testPiece)).toBe(false);
    
    // Set frozen only
    testPiece.state['frozen'] = 2;
    expect(game.isBlocked(testPiece)).toBe(true);
    
    testPiece.state['frozen'] = 0;
    expect(game.isBlocked(testPiece)).toBe(false);
    
    // Set cooldown only
    testPiece.state['cooldown'] = 1;
    expect(game.isBlocked(testPiece)).toBe(true);
    
    testPiece.state['cooldown'] = 0;
    expect(game.isBlocked(testPiece)).toBe(false);
    
    // Set both
    testPiece.state['frozen'] = 1;
    testPiece.state['cooldown'] = 1;
    expect(game.isBlocked(testPiece)).toBe(true);
  });
});

describe('Gaze Trait and Petrify', () => {
  it('should freeze enemies in line of sight with gaze trait', () => {
    const code = `
game: "Medusa Chess"
extends: "Standard Chess"

piece Medusa {
  move: step(any)
  capture: slide(diagonal)
  traits: [gaze, petrify]
  state: { frozen: 0 }
}

piece Target {
  move: step(any)
  capture: =move
  state: { frozen: 0 }
}

setup:
  add:
    White Medusa: [d4]
    Black Target: [f6]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Find the Medusa and Black Target
    let state = game.getState();
    const medusa = state.pieces.find(p => p.type === 'Medusa')!;
    const target = state.pieces.find(
      p => p.type === 'Target' && p.owner === 'Black'
    )!;
    
    expect(medusa).toBeDefined();
    expect(target).toBeDefined();
    expect(target.pos.file).toBe(5); // f = 5
    expect(target.pos.rank).toBe(5); // 6 - 1 = 5 (0-indexed)
    
    // Initially, target should not be frozen
    expect(target.state['frozen'] ?? 0).toBe(0);
    
    // Get gaze targets - Medusa at d4 can see diagonally to f6
    const gazeTargets = game.getGazeTargets(medusa);
    expect(gazeTargets.length).toBeGreaterThan(0);
    expect(gazeTargets.some(p => p.id === target.id)).toBe(true);
    
    // Make a move with White (e.g., move a pawn)
    const whitePawn = state.pieces.find(
      p => p.type === 'Pawn' && p.owner === 'White' && p.pos.file === 4
    )!;
    const legalMoves = game.getLegalMovesForPiece(whitePawn);
    expect(legalMoves.length).toBeGreaterThan(0);
    
    // Execute move
    game.makeMove(legalMoves[0]!);
    
    // After White's turn ends, gaze effect should freeze enemies in sight
    state = game.getState();
    const frozenTarget = state.pieces.find(
      p => p.type === 'Target' && p.owner === 'Black'
    )!;
    
    expect(frozenTarget.state['frozen']).toBe(1);
    
    // Frozen target should not be able to move
    const frozenMoves = game.getLegalMovesForPiece(frozenTarget);
    expect(frozenMoves.length).toBe(0);
  });

  it('should thaw frozen pieces after their turn starts', () => {
    const code = `
game: "Thaw Test"
extends: "Standard Chess"

piece TestPiece {
  move: step(any)
  capture: =move
  state: { frozen: 0 }
}

setup:
  add:
    Black TestPiece: [e5]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Find the test piece
    let state = game.getState();
    const testPiece = state.pieces.find(p => p.type === 'TestPiece')!;
    
    // Manually freeze it
    testPiece.state['frozen'] = 2;
    expect(game.isFrozen(testPiece)).toBe(true);
    
    // Make a White move
    const whitePawn = state.pieces.find(
      p => p.type === 'Pawn' && p.owner === 'White' && p.pos.file === 4
    )!;
    const moves = game.getLegalMovesForPiece(whitePawn);
    game.makeMove(moves[0]!);
    
    // Now it's Black's turn - frozen should have decayed to 1
    state = game.getState();
    expect(state.currentPlayer).toBe('Black');
    const updatedPiece = state.pieces.find(p => p.type === 'TestPiece')!;
    expect(updatedPiece.state['frozen']).toBe(1);
    
    // Still frozen
    expect(game.isFrozen(updatedPiece)).toBe(true);
    expect(game.getLegalMovesForPiece(updatedPiece).length).toBe(0);
    
    // Make a Black move (use a different piece)
    const blackPawn = state.pieces.find(
      p => p.type === 'Pawn' && p.owner === 'Black' && p.pos.file === 0
    )!;
    const blackMoves = game.getLegalMovesForPiece(blackPawn);
    game.makeMove(blackMoves[0]!);
    
    // Now White's turn again
    // Make another White move
    state = game.getState();
    const anotherWhitePawn = state.pieces.find(
      p => p.type === 'Pawn' && p.owner === 'White' && p.pos.file === 0
    )!;
    const whiteMoves2 = game.getLegalMovesForPiece(anotherWhitePawn);
    game.makeMove(whiteMoves2[0]!);
    
    // Now it's Black's turn again - frozen should have decayed to 0
    state = game.getState();
    expect(state.currentPlayer).toBe('Black');
    const thawedPiece = state.pieces.find(p => p.type === 'TestPiece')!;
    expect(thawedPiece.state['frozen']).toBe(0);
    
    // Should be able to move now
    expect(game.isFrozen(thawedPiece)).toBe(false);
    expect(game.getLegalMovesForPiece(thawedPiece).length).toBeGreaterThan(0);
  });

  it('should support Medusa Chess scenario from DSL', () => {
    const code = `
game: "Medusa Chess"
extends: "Standard Chess"

piece Medusa {
  move: step(any)
  capture: slide(diagonal)
  traits: [gaze, petrify]
  state: { frozen: 0 }
}

effect frozen {
  blocks: all
  visual: "cyan"
}

setup:
  replace:
    Queen: Medusa
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Verify Medusa replaced Queens
    const state = game.getState();
    const medusas = state.pieces.filter(p => p.type === 'Medusa');
    expect(medusas.length).toBe(2); // One for each color
    
    // White Medusa should have gaze trait
    const whiteMedusa = medusas.find(m => m.owner === 'White')!;
    expect(whiteMedusa.traits.has('gaze')).toBe(true);
    
    // Check that frozen effect is defined
    expect(compiled.effects.has('frozen')).toBe(true);
    expect(compiled.effects.get('frozen')?.blocks).toBe('all');
  });
});
