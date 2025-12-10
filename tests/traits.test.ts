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
