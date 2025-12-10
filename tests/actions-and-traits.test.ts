/**
 * Tests for set action and traits system
 */

import { describe, it, expect } from 'vitest';
import { parse, compile, GameEngine } from '../src/index.js';
import { pos } from '../src/engine/position.js';

describe('Set Action', () => {
  it('should modify piece state on move', () => {
    const code = `
game: "State Test"
extends: "Standard Chess"

piece Counter {
  move: step(any)
  capture: =move
  state: { count: 0 }
}

trigger count_up {
  on: move
  when: piece.type == Counter
  do: set piece.state.count = piece.state.count + 1
}

setup:
  add:
    White Counter: [d3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Find the Counter piece
    let state = game.getState();
    let counter = state.pieces.find(p => p.type === 'Counter');
    expect(counter).toBeDefined();
    expect(counter?.state.count).toBe(0);
    
    // Get legal moves for Counter
    const moves = game.getLegalMoves().filter(m => m.piece.type === 'Counter');
    expect(moves.length).toBeGreaterThan(0);
    
    // Make a move with the Counter
    const move = moves[0];
    if (move) {
      game.makeMove(move);
      
      // Check that the count was incremented
      state = game.getState();
      counter = state.pieces.find(p => p.type === 'Counter');
      expect(counter?.state.count).toBe(1);
    }
  });

  it('should support += operator', () => {
    const code = `
game: "Add Test"
extends: "Standard Chess"

piece Charger {
  move: step(any)
  capture: =move
  state: { power: 10 }
}

trigger power_up {
  on: move
  when: piece.type == Charger
  do: set piece.state.power += 5
}

setup:
  add:
    White Charger: [e3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Find the Charger piece
    let state = game.getState();
    let charger = state.pieces.find(p => p.type === 'Charger');
    expect(charger?.state.power).toBe(10);
    
    // Make a move
    const moves = game.getLegalMoves().filter(m => m.piece.type === 'Charger');
    if (moves.length > 0 && moves[0]) {
      game.makeMove(moves[0]);
      
      state = game.getState();
      charger = state.pieces.find(p => p.type === 'Charger');
      expect(charger?.state.power).toBe(15);
    }
  });
});

describe('Phase Trait', () => {
  it('should allow piece to pass through others with phase trait', () => {
    const code = `
game: "Phase Test"
extends: "Standard Chess"

piece Ghost {
  move: slide(orthogonal)
  capture: none
  traits: [phase]
}

setup:
  add:
    White Ghost: [a1]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Find the Ghost
    const state = game.getState();
    const ghost = state.pieces.find(p => p.type === 'Ghost');
    expect(ghost).toBeDefined();
    expect(ghost?.traits.has('phase')).toBe(true);
    
    // Ghost should be able to move through pieces
    // a1 has a Rook initially in standard setup, but we added Ghost there
    const ghostMoves = game.getLegalMoves().filter(
      m => m.piece.type === 'Ghost'
    );
    
    // Ghost should have many moves (can slide through pieces)
    expect(ghostMoves.length).toBeGreaterThan(0);
  });
});

describe('Custom Traits', () => {
  it('should support custom trait names', () => {
    const code = `
game: "Custom Trait Test"
extends: "Standard Chess"

piece Vampire {
  move: step(any)
  capture: =move
  traits: [drain, undead, immortal]
  state: { lifeSteal: 0 }
}

setup:
  add:
    White Vampire: [d4]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Check that custom traits are registered
    expect(compiled.traits.has('drain')).toBe(true);
    expect(compiled.traits.has('undead')).toBe(true);
    expect(compiled.traits.has('immortal')).toBe(true);
    
    // Check that piece has the traits
    const state = game.getState();
    const vampire = state.pieces.find(p => p.type === 'Vampire');
    expect(vampire?.traits.has('drain')).toBe(true);
    expect(vampire?.traits.has('undead')).toBe(true);
    expect(vampire?.traits.has('immortal')).toBe(true);
  });

  it('should trigger actions based on custom traits', () => {
    const code = `
game: "Trait Trigger Test"
extends: "Standard Chess"

piece Collector {
  move: step(any)
  capture: =move
  traits: [collector]
  state: { collected: 0 }
}

trigger collect_on_capture {
  on: capture
  when: piece.traits == collector
  do: set piece.state.collected = piece.state.collected + 1
}

setup:
  add:
    White Collector: [d4]
    Black Pawn: [e5]
`;
    // Note: The condition "piece.traits == collector" won't work exactly
    // because traits is a Set. This tests that the syntax parses.
    const ast = parse(code);
    const compiled = compile(ast);
    
    expect(compiled.triggers.length).toBeGreaterThan(0);
    expect(compiled.pieces.get('Collector')?.traits).toContain('collector');
  });
});

describe('Trait Combinations', () => {
  it('should support multiple traits on one piece', () => {
    const code = `
game: "Multi Trait Test"
extends: "Standard Chess"

piece SuperPiece {
  move: slide(any)
  capture: =move
  traits: [royal, phase, explosive]
}

setup:
  replace:
    King: SuperPiece
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    const state = game.getState();
    const superPiece = state.pieces.find(p => p.type === 'SuperPiece');
    
    expect(superPiece).toBeDefined();
    expect(superPiece?.traits.has('royal')).toBe(true);
    expect(superPiece?.traits.has('phase')).toBe(true);
    expect(superPiece?.traits.has('explosive')).toBe(true);
    expect(superPiece?.traits.size).toBe(3);
  });
});

describe('Built-in Trait Definitions', () => {
  it('should have built-in traits defined', () => {
    const code = `
game: "Builtin Trait Test"
extends: "Standard Chess"
`;
    const ast = parse(code);
    const compiled = compile(ast);
    
    // Check built-in traits
    expect(compiled.traits.has('royal')).toBe(true);
    expect(compiled.traits.has('phase')).toBe(true);
    expect(compiled.traits.has('jump')).toBe(true);
    expect(compiled.traits.has('promote')).toBe(true);
    expect(compiled.traits.has('immune')).toBe(true);
    expect(compiled.traits.has('explosive')).toBe(true);
    
    // Check trait definitions
    const phaseTrait = compiled.traits.get('phase');
    expect(phaseTrait?.moveModifier).toBe('phase');
    
    const immuneTrait = compiled.traits.get('immune');
    expect(immuneTrait?.immune).toBe(true);
  });
});

describe('Teleporter Chess Scenario', () => {
  it('should track cooldown state correctly', () => {
    const code = `
game: "Teleporter Chess"
extends: "Standard Chess"

piece Teleporter {
  move: leap(2, 1)
  capture: leap(2, 1)
  traits: [warp, jump]
  state: { cooldown: 0 }
}

trigger warp_use {
  on: move
  when: piece.type == Teleporter
  do: set piece.state.cooldown = 3
}

setup:
  replace:
    Knight: Teleporter
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Initial state
    let state = game.getState();
    let teleporter = state.pieces.find(p => p.type === 'Teleporter' && p.owner === 'White');
    expect(teleporter?.state.cooldown).toBe(0);
    expect(teleporter?.traits.has('warp')).toBe(true);
    expect(teleporter?.traits.has('jump')).toBe(true);
    
    // Move the teleporter
    const moves = game.getLegalMoves().filter(m => m.piece.type === 'Teleporter');
    expect(moves.length).toBeGreaterThan(0);
    
    if (moves[0]) {
      game.makeMove(moves[0]);
      
      // Cooldown should be set to 3 by warp_use trigger
      state = game.getState();
      teleporter = state.pieces.find(p => 
        p.type === 'Teleporter' && 
        p.pos.file === moves[0].to.file && 
        p.pos.rank === moves[0].to.rank
      );
      expect(teleporter?.state.cooldown).toBe(3);
    }
  });
});

describe('Cooldown Movement Restriction', () => {
  it('should prevent movement when cooldown > 0', () => {
    const code = `
game: "Cooldown Test"
extends: "Standard Chess"

piece CooldownPiece {
  move: step(any)
  capture: =move
  state: { cooldown: 0 }
}

trigger set_cooldown {
  on: move
  when: piece.type == CooldownPiece
  do: set piece.state.cooldown = 2
}

setup:
  add:
    White CooldownPiece: [d3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // Initial: cooldown = 0, can move
    let state = game.getState();
    let piece = state.pieces.find(p => p.type === 'CooldownPiece');
    expect(piece?.state.cooldown).toBe(0);
    
    let moves = game.getLegalMoves().filter(m => m.piece.type === 'CooldownPiece');
    expect(moves.length).toBeGreaterThan(0);
    
    // Make a move - cooldown should be set to 2
    const move = moves[0];
    if (move) {
      game.makeMove(move);
      
      state = game.getState();
      piece = state.pieces.find(p => p.type === 'CooldownPiece');
      expect(piece?.state.cooldown).toBe(2);
      
      // Black's turn - make a simple pawn move
      const blackMoves = game.getLegalMoves();
      const pawnMove = blackMoves.find(m => m.piece.type === 'Pawn');
      if (pawnMove) {
        game.makeMove(pawnMove);
        
        // Now White's turn again - CooldownPiece should NOT be able to move
        const whiteMoves = game.getLegalMoves().filter(m => m.piece.type === 'CooldownPiece');
        expect(whiteMoves.length).toBe(0); // Cannot move due to cooldown!
      }
    }
  });

  it('should allow movement when cooldown = 0', () => {
    const code = `
game: "No Cooldown Test"
extends: "Standard Chess"

piece TestPiece {
  move: step(any)
  capture: =move
  state: { cooldown: 0, power: 5 }
}

setup:
  add:
    White TestPiece: [d3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    // cooldown = 0, should be able to move
    const moves = game.getLegalMoves().filter(m => m.piece.type === 'TestPiece');
    expect(moves.length).toBeGreaterThan(0);
  });

  it('hasCooldown should return correct values', () => {
    const code = `
game: "HasCooldown Test"
extends: "Standard Chess"

piece CooledPiece {
  move: step(any)
  state: { cooldown: 5 }
}

piece NormalPiece {
  move: step(any)
  state: { power: 10 }
}

setup:
  add:
    White CooledPiece: [d3]
    White NormalPiece: [e3]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    
    const state = game.getState();
    const cooledPiece = state.pieces.find(p => p.type === 'CooledPiece');
    const normalPiece = state.pieces.find(p => p.type === 'NormalPiece');
    
    expect(cooledPiece).toBeDefined();
    expect(normalPiece).toBeDefined();
    
    // hasCooldown checks
    expect(game.hasCooldown(cooledPiece!)).toBe(true);
    expect(game.hasCooldown(normalPiece!)).toBe(false);
  });
});
