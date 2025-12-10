/**
 * Tests for setup: add: and setup: replace: functionality
 */

import { describe, it, expect } from 'vitest';
import { parse, compile, GameEngine } from '../src/index.js';

describe('Setup Add Mode', () => {
  it('should parse setup add section with additive flag', () => {
    const code = `
game: "Test Add Setup"
extends: "Standard Chess"

piece Mimic {
  move: step(any)
  capture: =move
}

setup:
  add:
    White Mimic: [d2, e2]
    Black Mimic: [d7, e7]
`;
    const ast = parse(code);
    
    expect(ast.setup).toBeDefined();
    expect(ast.setup?.additive).toBe(true);
    expect(ast.setup?.placements.length).toBe(4);
  });

  it('should compile additive setup correctly', () => {
    const code = `
game: "Test Add Setup"
extends: "Standard Chess"

piece Mimic {
  move: step(any)
  capture: =move
}

setup:
  add:
    White Mimic: [d2]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    
    expect(compiled.setup.additive).toBe(true);
    expect(compiled.setup.placements.length).toBe(1);
    expect(compiled.setup.placements[0]?.pieceType).toBe('Mimic');
  });

  it('should add pieces on top of standard chess setup', () => {
    const code = `
game: "Mimic Chess"
extends: "Standard Chess"

piece Mimic {
  move: step(any)
  capture: =move
}

setup:
  add:
    White Mimic: [d3]
    Black Mimic: [d6]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Should have standard chess pieces + 2 Mimics
    // Standard: 32 pieces, Added: 2 Mimics = 34 total
    expect(state.pieces.length).toBe(34);
    
    // Check Mimic exists at d3
    const mimicD3 = state.pieces.find(
      p => p.type === 'Mimic' && p.pos.file === 3 && p.pos.rank === 2
    );
    expect(mimicD3).toBeDefined();
    expect(mimicD3?.owner).toBe('White');
    
    // Check Mimic exists at d6
    const mimicD6 = state.pieces.find(
      p => p.type === 'Mimic' && p.pos.file === 3 && p.pos.rank === 5
    );
    expect(mimicD6).toBeDefined();
    expect(mimicD6?.owner).toBe('Black');
    
    // Standard pieces should still exist
    const whiteKing = state.pieces.find(
      p => p.type === 'King' && p.owner === 'White'
    );
    expect(whiteKing).toBeDefined();
  });

  it('should replace existing piece when adding to occupied square', () => {
    const code = `
game: "Replace Pawn"
extends: "Standard Chess"

piece Amazon {
  move: slide(any)
  capture: =move
}

setup:
  add:
    White Amazon: [d2]
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // d2 should have Amazon instead of Pawn
    const amazonD2 = state.pieces.find(
      p => p.pos.file === 3 && p.pos.rank === 1
    );
    expect(amazonD2?.type).toBe('Amazon');
    expect(amazonD2?.owner).toBe('White');
    
    // Should have 32 pieces (Amazon replaced Pawn)
    expect(state.pieces.length).toBe(32);
  });
});

describe('Setup Replace Mode', () => {
  it('should parse setup replace section', () => {
    const code = `
game: "Amazon Chess"
extends: "Standard Chess"

piece Amazon {
  move: slide(any)
  capture: =move
}

setup:
  replace:
    Queen: Amazon
`;
    const ast = parse(code);
    
    expect(ast.setup).toBeDefined();
    expect(ast.setup?.replace).toBeDefined();
    expect(ast.setup?.replace?.get('Queen')).toBe('Amazon');
  });

  it('should compile replace setup correctly', () => {
    const code = `
game: "Amazon Chess"
extends: "Standard Chess"

piece Amazon {
  move: slide(any)
  capture: =move
}

setup:
  replace:
    Queen: Amazon
`;
    const ast = parse(code);
    const compiled = compile(ast);
    
    expect(compiled.setup.replace).toBeDefined();
    expect(compiled.setup.replace?.get('Queen')).toBe('Amazon');
  });

  it('should replace all Queens with Amazons', () => {
    const code = `
game: "Amazon Chess"
extends: "Standard Chess"

piece Amazon {
  move: slide(any)
  capture: =move
}

setup:
  replace:
    Queen: Amazon
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Should have no Queens
    const queens = state.pieces.filter(p => p.type === 'Queen');
    expect(queens.length).toBe(0);
    
    // Should have 2 Amazons (one for each side)
    const amazons = state.pieces.filter(p => p.type === 'Amazon');
    expect(amazons.length).toBe(2);
    
    // Check positions (d1 for White, d8 for Black)
    const whiteAmazon = amazons.find(p => p.owner === 'White');
    expect(whiteAmazon?.pos.file).toBe(3); // d file
    expect(whiteAmazon?.pos.rank).toBe(0); // rank 1
    
    const blackAmazon = amazons.find(p => p.owner === 'Black');
    expect(blackAmazon?.pos.file).toBe(3); // d file
    expect(blackAmazon?.pos.rank).toBe(7); // rank 8
    
    // Total should still be 32
    expect(state.pieces.length).toBe(32);
  });

  it('should replace multiple piece types', () => {
    const code = `
game: "Custom Chess"
extends: "Standard Chess"

piece Dragon {
  move: slide(any)
  capture: =move
}

piece Teleporter {
  move: leap(2, 1)
  capture: =move
}

setup:
  replace:
    Queen: Dragon
    Knight: Teleporter
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // No Queens or Knights
    expect(state.pieces.filter(p => p.type === 'Queen').length).toBe(0);
    expect(state.pieces.filter(p => p.type === 'Knight').length).toBe(0);
    
    // 2 Dragons (replacing Queens)
    expect(state.pieces.filter(p => p.type === 'Dragon').length).toBe(2);
    
    // 4 Teleporters (replacing Knights)
    expect(state.pieces.filter(p => p.type === 'Teleporter').length).toBe(4);
  });
});

describe('Setup Add and Replace Combined', () => {
  it('should handle both add and replace in same setup', () => {
    const code = `
game: "Combined Setup"
extends: "Standard Chess"

piece Amazon {
  move: slide(any)
  capture: =move
}

piece Mimic {
  move: step(any)
  capture: =move
}

setup:
  add:
    White Mimic: [d3]
  replace:
    Queen: Amazon
`;
    const ast = parse(code);
    const compiled = compile(ast);
    const game = new GameEngine(compiled);
    const state = game.getState();
    
    // Should have Mimics added
    const mimics = state.pieces.filter(p => p.type === 'Mimic');
    expect(mimics.length).toBe(1);
    
    // Queens replaced with Amazons
    expect(state.pieces.filter(p => p.type === 'Queen').length).toBe(0);
    expect(state.pieces.filter(p => p.type === 'Amazon').length).toBe(2);
    
    // Total: 32 standard + 1 Mimic = 33
    expect(state.pieces.length).toBe(33);
  });
});

describe('Setup Without Add (Direct Placement)', () => {
  it('should default additive to false when setup section is empty', () => {
    const code = `
game: "Custom Only"
extends: "Standard Chess"

piece King {
  move: step(any)
  capture: =move
}
`;
    const ast = parse(code);
    
    // Without setup section, setup is undefined
    // Or if parsed, additive should be false by default
    expect(ast.setup?.additive ?? false).toBe(false);
  });
});
