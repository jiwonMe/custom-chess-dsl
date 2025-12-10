import { describe, it, expect } from 'vitest';
import { Lexer } from '../../src/lexer/index.js';
import { Parser } from '../../src/parser/index.js';

describe('Parser', () => {
  function parse(source: string) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
  }

  describe('Level 1: Configuration', () => {
    it('should parse game declaration', () => {
      const ast = parse('game: "King of the Hill"');

      expect(ast.type).toBe('Game');
      expect(ast.name).toBe('King of the Hill');
    });

    it('should parse extends declaration', () => {
      const ast = parse(`
game: "My Game"
extends: "Standard Chess"
`);

      expect(ast.name).toBe('My Game');
      expect(ast.extends).toBe('Standard Chess');
    });

    it('should parse board section', () => {
      const ast = parse(`
game: "Test"
board:
    size: 8x8
    zones:
        hill: [d4, d5, e4, e5]
`);

      expect(ast.board?.width).toBe(8);
      expect(ast.board?.height).toBe(8);
      expect(ast.board?.zones.get('hill')).toEqual(['d4', 'd5', 'e4', 'e5']);
    });

    it('should parse rules section', () => {
      const ast = parse(`
game: "Test"
rules:
    castling: true
    en_passant: false
`);

      expect(ast.rules?.castling).toBe(true);
      expect(ast.rules?.enPassant).toBe(false);
    });
  });

  describe('Level 2: Declarative DSL', () => {
    it('should parse piece definition', () => {
      const ast = parse(`
game: "Test"
piece King {
    move: step(any)
    capture: =move
    traits: [royal]
}
`);

      expect(ast.pieces).toHaveLength(1);
      expect(ast.pieces[0]?.name).toBe('King');
      expect(ast.pieces[0]?.traits).toContain('royal');
      expect(ast.pieces[0]?.capture).toBe('same');
    });

    it('should parse piece with state', () => {
      const ast = parse(`
game: "Test"
piece King {
    move: step(any)
    state: { moved: false }
}
`);

      expect(ast.pieces[0]?.state).toEqual({ moved: false });
    });

    it('should parse pattern expressions', () => {
      const ast = parse(`
game: "Test"
piece Queen {
    move: slide(orthogonal) | slide(diagonal)
}
`);

      const move = ast.pieces[0]?.move;
      expect(move?.kind).toBe('or');
      expect(move?.patterns).toHaveLength(2);
    });

    it('should parse leap pattern', () => {
      const ast = parse(`
game: "Test"
piece Knight {
    move: leap(2, 1)
    traits: [jump]
}
`);

      const move = ast.pieces[0]?.move;
      expect(move?.kind).toBe('leap');
      expect(move?.dx).toBe(2);
      expect(move?.dy).toBe(1);
    });

    it('should parse conditional pattern', () => {
      const ast = parse(`
game: "Test"
piece Pawn {
    move: step(forward) where empty
}
`);

      const move = ast.pieces[0]?.move;
      expect(move?.kind).toBe('conditional');
      expect(move?.condition?.kind).toBe('empty');
    });

    it('should parse effect definition', () => {
      const ast = parse(`
game: "Test"
effect trap {
    blocks: enemy
    visual: "X"
}
`);

      expect(ast.effects).toHaveLength(1);
      expect(ast.effects[0]?.name).toBe('trap');
      expect(ast.effects[0]?.blocks).toBe('enemy');
      expect(ast.effects[0]?.visual).toBe('X');
    });

    it('should parse trigger definition', () => {
      const ast = parse(`
game: "Test"
trigger on_move {
    on: move
    when: piece.type == King
    do:
        set piece.state.moved = true
}
`);

      expect(ast.triggers).toHaveLength(1);
      expect(ast.triggers[0]?.name).toBe('on_move');
      expect(ast.triggers[0]?.on).toBe('move');
      expect(ast.triggers[0]?.actions).toHaveLength(1);
    });

    it('should parse pattern definition', () => {
      const ast = parse(`
game: "Test"
pattern orthoslide = slide(orthogonal)
`);

      expect(ast.patterns).toHaveLength(1);
      expect(ast.patterns[0]?.name).toBe('orthoslide');
    });
  });

  describe('Conditions', () => {
    it('should parse logical conditions', () => {
      const ast = parse(`
game: "Test"
piece Pawn {
    move: step(forward) where empty and first_move
}
`);

      const move = ast.pieces[0]?.move;
      expect(move?.kind).toBe('conditional');
      expect(move?.condition?.kind).toBe('logical');
      expect(move?.condition?.op).toBe('and');
    });

    it('should parse comparison conditions', () => {
      const ast = parse(`
game: "Test"
trigger test {
    on: move
    when: piece.state.count >= 3
    do:
        win White
}
`);

      const when = ast.triggers[0]?.when;
      // Comparison is now wrapped in expression condition
      // The comparison operator is parsed within the expression itself
      expect(when?.kind).toBe('expression');
      // The left side contains the binary expression with the comparison
      expect(when?.left?.kind).toBe('binary');
      expect(when?.left?.op).toBe('>=');
    });
  });

  describe('Victory and Draw', () => {
    it('should parse victory conditions', () => {
      const ast = parse(`
game: "Test"
victory:
    checkmate: check and no_legal_moves
`);

      expect(ast.victory).toHaveLength(1);
      expect(ast.victory[0]?.name).toBe('checkmate');
    });

    it('should parse draw conditions', () => {
      const ast = parse(`
game: "Test"
draw:
    stalemate: not check and no_legal_moves
`);

      expect(ast.draw).toHaveLength(1);
      expect(ast.draw[0]?.name).toBe('stalemate');
    });
  });

  describe('Level 3: Scripts', () => {
    it('should parse script block', () => {
      const ast = parse(`
game: "Test"
script {
    function test() {
        return 42;
    }
}
`);

      expect(ast.scripts).toHaveLength(1);
      expect(ast.scripts[0]?.code).toContain('function');
    });
  });

  describe('Complex example', () => {
    it('should parse King of the Hill variant', () => {
      const source = `
game: "King of the Hill"
extends: "Standard Chess"

board:
    zones:
        hill: [d4, d5, e4, e5]

victory:
    add:
        hill_victory: King in hill
`;

      const ast = parse(source);

      expect(ast.name).toBe('King of the Hill');
      expect(ast.extends).toBe('Standard Chess');
      expect(ast.board?.zones.get('hill')).toEqual(['d4', 'd5', 'e4', 'e5']);
    });
  });
});
