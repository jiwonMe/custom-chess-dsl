import { describe, it, expect } from 'vitest';
import { parse, compileSource } from '../src/index.js';

// Test examples using currently supported parser syntax
const TEST_EXAMPLES: Record<string, string> = {
  // Basic piece with move pattern
  basicPiece: `# Basic Piece Test
game: "Basic Test"
extends: "Standard Chess"

piece Slider {
  move: slide(orthogonal)
  capture: =move
  traits: [basic]
}

setup:
  replace:
    Rook: Slider
`,

  // Piece with state (literals only)
  pieceWithState: `# Piece With State
game: "State Test"
extends: "Standard Chess"

piece Counter {
  move: step(any)
  capture: =move
  traits: [counter]
  state: { count: 0, active: true }
}

setup:
  replace:
    Pawn: Counter
`,

  // Piece with leap pattern
  leaper: `# Leaper Test
game: "Leaper Test"
extends: "Standard Chess"

piece Camel {
  move: leap(3, 1)
  capture: =move
  traits: [jump]
}

setup:
  replace:
    Knight: Camel
`,

  // Piece with compound pattern
  compound: `# Compound Pattern Test
game: "Compound Test"
extends: "Standard Chess"

piece Amazon {
  move: slide(orthogonal) | slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [royal, powerful]
}

setup:
  replace:
    Queen: Amazon
`,

  // Zone definition
  zoneGame: `# Zone Test
game: "Zone Test"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    center: [d4, d5, e4, e5]
    corners: [a1, a8, h1, h8]

victory:
  add:
    center_control: King in zone.center
`,

  // Setup modifications
  setupMod: `# Setup Modification Test
game: "Setup Test"
extends: "Standard Chess"

piece Dragon {
  move: slide(any)
  capture: =move
  traits: [flying]
}

setup:
  replace:
    Queen: Dragon
  add:
    White Dragon: [d3]
`,

  // Multiple pieces
  multiplePieces: `# Multiple Pieces Test
game: "Multiple Test"
extends: "Standard Chess"

piece Wazir {
  move: step(orthogonal)
  capture: =move
}

piece Ferz {
  move: step(diagonal)
  capture: =move
}

piece Elephant {
  move: leap(2, 2)
  capture: =move
  traits: [jump]
}

setup:
  replace:
    Bishop: Ferz
    Knight: Elephant
`,

  // Victory condition
  victoryCondition: `# Victory Test
game: "Victory Test"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    goal: [a8, b8, c8, d8, e8, f8, g8, h8]

victory:
  add:
    racing: King in zone.goal
`,

  // Draw condition
  drawCondition: `# Draw Test
game: "Draw Test"
extends: "Standard Chess"

draw:
  add:
    mutual: stalemate
`,

  // Effect definition
  effectDef: `# Effect Test
game: "Effect Test"
extends: "Standard Chess"

effect frozen {
  blocks: all
  visual: "blue"
}

piece Freezer {
  move: step(any)
  capture: =move
  traits: [ice]
}
`,

  // Simple trigger with set action
  simpleTrigger: `# Simple Trigger Test
game: "Trigger Test"
extends: "Standard Chess"

piece Tracker {
  move: step(any)
  capture: =move
  traits: [track]
  state: { moved: false }
}

trigger on_move {
  on: move
  when: piece.type == Tracker
  do: set piece.state.moved = true
}

setup:
  replace:
    Pawn: Tracker
`,
};

describe('Parser Examples', () => {
  describe('Basic Parsing', () => {
    Object.entries(TEST_EXAMPLES).forEach(([name, code]) => {
      it(`should parse ${name} example without errors`, () => {
        const ast = parse(code);
        expect(ast).toBeDefined();
      });
    });
  });

  describe('Basic Compilation', () => {
    Object.entries(TEST_EXAMPLES).forEach(([name, code]) => {
      it(`should compile ${name} example without errors`, () => {
        const compiled = compileSource(code);
        expect(compiled).toBeDefined();
        expect(compiled.name).toBeDefined();
      });
    });
  });

  describe('Specific Feature Tests', () => {
    it('basicPiece should define Slider with slide pattern', () => {
      const compiled = compileSource(TEST_EXAMPLES.basicPiece);
      const slider = compiled.pieces.get('Slider');

      expect(slider).toBeDefined();
      expect(slider?.move.type).toBe('slide');
      expect(slider?.traits).toContain('basic');
    });

    it('pieceWithState should have initialState object', () => {
      const compiled = compileSource(TEST_EXAMPLES.pieceWithState);
      const counter = compiled.pieces.get('Counter');

      expect(counter).toBeDefined();
      expect(counter?.initialState).toEqual({ count: 0, active: true });
      expect(counter?.traits).toContain('counter');
    });

    it('leaper should have leap pattern', () => {
      const compiled = compileSource(TEST_EXAMPLES.leaper);
      const camel = compiled.pieces.get('Camel');

      expect(camel).toBeDefined();
      expect(camel?.move.type).toBe('leap');
      expect(camel?.traits).toContain('jump');
    });

    it('compound should have composite pattern', () => {
      const compiled = compileSource(TEST_EXAMPLES.compound);
      const amazon = compiled.pieces.get('Amazon');

      expect(amazon).toBeDefined();
      expect(amazon?.move.type).toBe('composite');
      expect(amazon?.traits).toContain('royal');
      expect(amazon?.traits).toContain('powerful');
    });

    it('simpleTrigger should define trigger', () => {
      const compiled = compileSource(TEST_EXAMPLES.simpleTrigger);

      expect(compiled.triggers.length).toBeGreaterThan(0);
      const trigger = compiled.triggers[0];
      expect(trigger?.name).toBe('on_move');
      expect(trigger?.on).toBe('move');
    });

    it('zoneGame should define zones', () => {
      const compiled = compileSource(TEST_EXAMPLES.zoneGame);

      // zones is a Map
      expect(compiled.board.zones).toBeDefined();
      expect(compiled.board.zones.size).toBeGreaterThan(0);
      expect(compiled.board.zones.get('center')).toBeDefined();
      expect(compiled.board.zones.get('corners')).toBeDefined();
    });

    it('victoryCondition should add victory condition', () => {
      const compiled = compileSource(TEST_EXAMPLES.victoryCondition);

      expect(compiled.victory.length).toBeGreaterThan(0);
      const racing = compiled.victory.find((v) => v.name === 'racing');
      expect(racing).toBeDefined();
    });

    it('multiplePieces should define all pieces', () => {
      const compiled = compileSource(TEST_EXAMPLES.multiplePieces);

      expect(compiled.pieces.has('Wazir')).toBe(true);
      expect(compiled.pieces.has('Ferz')).toBe(true);
      expect(compiled.pieces.has('Elephant')).toBe(true);

      const wazir = compiled.pieces.get('Wazir');
      expect(wazir?.move.type).toBe('step');

      const elephant = compiled.pieces.get('Elephant');
      expect(elephant?.move.type).toBe('leap');
    });

    it('effectDef should define effect with blocks', () => {
      const compiled = compileSource(TEST_EXAMPLES.effectDef);

      // effects is a Map
      expect(compiled.effects.size).toBeGreaterThan(0);
      const frozen = compiled.effects.get('frozen');
      expect(frozen).toBeDefined();
      expect(frozen?.blocks).toBe('all');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty traits array', () => {
    const code = `piece Simple {
  move: step(N)
  traits: []
}`;
    const ast = parse(code);
    expect(ast.pieces[0]?.traits).toEqual([]);
  });

  it('should handle multiple directions in step', () => {
    const code = `piece MultiStep {
  move: step(orthogonal) | step(diagonal)
}`;
    const ast = parse(code);
    // The AST type might be PatternExpr wrapper
    expect(ast.pieces[0]?.move).toBeDefined();
  });

  it('should handle capture: none', () => {
    const code = `piece Peaceful {
  move: step(any)
  capture: none
}`;
    const ast = parse(code);
    expect(ast.pieces[0]?.capture).toBe('none');
  });

  it('should handle numeric state values', () => {
    const code = `piece Numbered {
  move: step(N)
  state: { hp: 100, damage: 25, level: 1 }
}`;
    const compiled = compileSource(code);
    const piece = compiled.pieces.get('Numbered');
    expect(piece?.initialState).toEqual({ hp: 100, damage: 25, level: 1 });
  });

  it('should handle boolean state values', () => {
    const code = `piece Flagged {
  move: step(N)
  state: { active: true, dead: false }
}`;
    const compiled = compileSource(code);
    const piece = compiled.pieces.get('Flagged');
    expect(piece?.initialState).toEqual({ active: true, dead: false });
  });

  it('should handle string state values', () => {
    const code = `piece Named {
  move: step(N)
  state: { name: "hero", status: "ready" }
}`;
    const compiled = compileSource(code);
    const piece = compiled.pieces.get('Named');
    expect(piece?.initialState).toEqual({ name: 'hero', status: 'ready' });
  });
});

describe('Playground Examples Validation', () => {
  // These test the examples that will be shown in the playground
  it('should parse King of the Hill example', () => {
    const code = `game: "King of the Hill"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    hill: [d4, d5, e4, e5]

victory:
  add:
    hill: King in zone.hill
`;
    const ast = parse(code);
    expect(ast.name).toBe('King of the Hill');
    expect(ast.board?.zones).toBeDefined();
    expect(ast.victory).toBeDefined();
  });

  it('should compile custom piece with traits', () => {
    const code = `game: "Amazon Test"
extends: "Standard Chess"

piece Amazon {
  move: slide(orthogonal) | slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [royal]
}

setup:
  replace:
    Queen: Amazon
`;
    const compiled = compileSource(code);
    expect(compiled.pieces.has('Amazon')).toBe(true);

    const amazon = compiled.pieces.get('Amazon');
    expect(amazon?.traits).toContain('royal');
    expect(amazon?.move.type).toBe('composite');
  });

  it('should compile piece with state', () => {
    const code = `game: "Stateful Test"
extends: "Standard Chess"

piece Tracker {
  move: step(any)
  capture: =move
  traits: [tracking]
  state: { moves: 0, active: true }
}

setup:
  replace:
    Pawn: Tracker
`;
    const compiled = compileSource(code);
    const tracker = compiled.pieces.get('Tracker');

    expect(tracker).toBeDefined();
    expect(tracker?.initialState).toEqual({ moves: 0, active: true });
    expect(tracker?.traits).toContain('tracking');
  });

  it('should compile trigger with set action', () => {
    const code = `game: "Trigger Test"
extends: "Standard Chess"

piece Counter {
  move: step(any)
  capture: =move
  state: { count: 0 }
}

trigger increment {
  on: move
  when: piece.type == Counter
  do: set piece.state.count = piece.state.count + 1
}

setup:
  replace:
    Pawn: Counter
`;
    const compiled = compileSource(code);

    expect(compiled.triggers.length).toBeGreaterThan(0);
    const trigger = compiled.triggers.find((t) => t.name === 'increment');
    expect(trigger).toBeDefined();
    expect(trigger?.on).toBe('move');
  });
});
