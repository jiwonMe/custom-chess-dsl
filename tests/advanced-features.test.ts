import { describe, it, expect } from 'vitest';
import { parse, compileSource } from '../src/index.js';

describe('Advanced Parser Features', () => {
  describe('Cancel Action', () => {
    it('should parse cancel action', () => {
      const code = `trigger guard_protect {
  on: capture
  when: piece.type == Guardian
  do: cancel
}`;
      const ast = parse(code);
      expect(ast.triggers[0]?.actions[0]?.kind).toBe('cancel');
    });

    it('should compile cancel action', () => {
      const code = `game: "Test"
extends: "Standard Chess"

trigger guard {
  on: capture
  when: piece.type == Guardian
  do: cancel
}`;
      const compiled = compileSource(code);
      expect(compiled.triggers[0]?.actions[0]?.type).toBe('cancel');
    });
  });

  describe('Apply Action', () => {
    it('should parse apply action', () => {
      const code = `trigger freeze {
  on: move
  when: piece.type == Medusa
  do: apply frozen to target
}`;
      const ast = parse(code);
      expect(ast.triggers[0]?.actions[0]?.kind).toBe('apply');
      expect(ast.triggers[0]?.actions[0]?.effect).toBe('frozen');
    });

    it('should compile apply action', () => {
      const code = `game: "Test"
extends: "Standard Chess"

effect frozen {
  blocks: all
}

trigger freeze {
  on: move
  when: piece.type == Medusa
  do: apply frozen to piece
}`;
      const compiled = compileSource(code);
      const action = compiled.triggers[0]?.actions[0];
      expect(action?.type).toBe('apply');
      if (action?.type === 'apply') {
        expect(action.effect).toBe('frozen');
      }
    });
  });

  describe('For Loop Action', () => {
    it('should parse for loop action', () => {
      const code = `trigger iterate {
  on: turn_start
  when: piece.type == Master
  do: for target in enemies: {
    set target.state.marked = true
  }
}`;
      const ast = parse(code);
      expect(ast.triggers[0]?.actions[0]?.kind).toBe('for');
      expect(ast.triggers[0]?.actions[0]?.variable).toBe('target');
    });

    it('should compile for loop action', () => {
      const code = `game: "Test"
extends: "Standard Chess"

trigger mark_all {
  on: turn_start
  when: piece.type == Master
  do: for p in pieces: {
    set p.state.marked = true
  }
}`;
      const compiled = compileSource(code);
      const action = compiled.triggers[0]?.actions[0];
      expect(action?.type).toBe('for');
      if (action?.type === 'for') {
        expect(action.variable).toBe('p');
        expect(action.actions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('If Condition Action', () => {
    it('should parse if action', () => {
      const code = `trigger check_power {
  on: capture
  when: piece.type == Hero
  do: if piece.state.power > 10: {
    set piece.state.superMode = true
  }
}`;
      const ast = parse(code);
      expect(ast.triggers[0]?.actions[0]?.kind).toBe('if');
    });

    it('should parse if-else action', () => {
      const code = `trigger branch {
  on: move
  when: piece.type == Hero
  do: if piece.state.energy > 0: {
    set piece.state.energy = piece.state.energy - 1
  } else: {
    set piece.state.exhausted = true
  }
}`;
      const ast = parse(code);
      const ifAction = ast.triggers[0]?.actions[0];
      expect(ifAction?.kind).toBe('if');
      expect(ifAction?.thenActions?.length).toBeGreaterThan(0);
      expect(ifAction?.elseActions?.length).toBeGreaterThan(0);
    });

    it('should compile if action', () => {
      const code = `game: "Test"
extends: "Standard Chess"

trigger evolve {
  on: capture
  when: piece.type == Shapeshifter
  do: if piece.state.captures >= 3: {
    set piece.state.evolved = true
  }
}`;
      const compiled = compileSource(code);
      const action = compiled.triggers[0]?.actions[0];
      expect(action?.type).toBe('if');
      if (action?.type === 'if') {
        expect(action.thenActions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Captured Keyword', () => {
    it('should parse captured as expression', () => {
      const code = `trigger vampire_feed {
  on: capture
  when: piece.type == Vampire
  do: set piece.state.souls = captured.value
}`;
      const ast = parse(code);
      const action = ast.triggers[0]?.actions[0];
      expect(action?.kind).toBe('set');
    });

    it('should compile captured reference', () => {
      const code = `game: "Test"
extends: "Standard Chess"

trigger absorb {
  on: capture
  when: piece.type == Absorber
  do: set piece.state.power = captured.value
}`;
      const compiled = compileSource(code);
      expect(compiled.triggers[0]?.actions[0]?.type).toBe('set');
    });
  });

  describe('Complex Triggers with Multiple Actions', () => {
    it('should parse trigger with brace block actions', () => {
      const code = `trigger complex {
  on: capture
  when: piece.type == Complex
  do: {
    set piece.state.count = piece.state.count + 1
    set piece.state.active = true
    if piece.state.count >= 5: {
      set piece.state.evolved = true
    }
  }
}`;
      const ast = parse(code);
      expect(ast.triggers[0]?.actions.length).toBe(3);
    });

    it('should compile complex trigger', () => {
      const code = `game: "Test"
extends: "Standard Chess"

piece Hero {
  move: step(any)
  capture: =move
  state: { power: 0, ready: false }
}

trigger power_up {
  on: capture
  when: piece.type == Hero
  do: {
    set piece.state.power = piece.state.power + 1
    if piece.state.power >= 3: {
      set piece.state.ready = true
    }
  }
}

setup:
  replace:
    Queen: Hero
`;
      const compiled = compileSource(code);
      expect(compiled.triggers.length).toBeGreaterThan(0);
      expect(compiled.triggers[0]?.actions.length).toBe(2);
    });
  });

  describe('Nested Control Flow', () => {
    it('should parse nested if in for loop', () => {
      const code = `trigger scan {
  on: turn_start
  when: piece.type == Scanner
  do: for target in enemies: {
    if target.state.marked == false: {
      set target.state.marked = true
    }
  }
}`;
      const ast = parse(code);
      const forAction = ast.triggers[0]?.actions[0];
      expect(forAction?.kind).toBe('for');
      expect(forAction?.actions?.[0]?.kind).toBe('if');
    });
  });
});

describe('Playground Examples Parsing', () => {
  const examples = [
    {
      name: 'vampire',
      code: `game: "Vampire Chess"
extends: "Standard Chess"

piece Vampire {
  move: step(any) | leap(2, 0)
  capture: =move
  traits: [jump, predator]
  state: { thralls: 0 }
}

trigger vampire_feed {
  on: capture
  when: piece.type == Vampire
  do: set piece.state.thralls = piece.state.thralls + 1
}

setup:
  replace:
    Queen: Vampire`,
    },
    {
      name: 'shapeshifter',
      code: `game: "Shapeshifter Chess"
extends: "Standard Chess"

piece Shapeshifter {
  move: leap(2, 1)
  capture: =move
  traits: [jump, morph]
  state: { captureCount: 0 }
}

trigger evolve {
  on: capture
  when: piece.type == Shapeshifter
  do: {
    set piece.state.captureCount = piece.state.captureCount + 1
    if piece.state.captureCount >= 3: {
      set piece.state.evolved = true
    }
  }
}

setup:
  replace:
    Knight: Shapeshifter`,
    },
    {
      name: 'guardian_with_cancel',
      code: `game: "Guardian Chess"
extends: "Standard Chess"

piece Guardian {
  move: step(any)
  capture: =move
  traits: [protector]
  state: { shields: 3 }
}

trigger protect {
  on: capture
  when: piece.type == Guardian and piece.state.shields > 0
  do: {
    set piece.state.shields = piece.state.shields - 1
    cancel
  }
}

setup:
  add:
    White Guardian: [d2]
    Black Guardian: [d7]`,
    },
  ];

  examples.forEach(({ name, code }) => {
    it(`should parse ${name} example`, () => {
      expect(() => parse(code)).not.toThrow();
    });

    it(`should compile ${name} example`, () => {
      expect(() => compileSource(code)).not.toThrow();
    });
  });
});
