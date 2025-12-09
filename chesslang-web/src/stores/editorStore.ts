import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorError {
  line: number;
  column: number;
  message: string;
}

interface EditorState {
  // Code
  code: string;
  setCode: (code: string) => void;

  // Errors
  errors: EditorError[];
  setErrors: (errors: EditorError[]) => void;

  // Compilation state
  isCompiling: boolean;
  setIsCompiling: (isCompiling: boolean) => void;

  // UI state
  showProblems: boolean;
  toggleProblems: () => void;

  // Examples
  loadExample: (example: string) => void;
}

const DEFAULT_CODE = `# Welcome to ChessLang!
# This is a simple example of King of the Hill variant.

game: "King of the Hill"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    hill: [d4, d5, e4, e5]

victory:
  add:
    hill: King in zone.hill

# Try modifying this code and click "Run" to play!
`;

const EXAMPLES: Record<string, string> = {
  koth: DEFAULT_CODE,
  'three-check': `# Three-Check Chess
# Win by giving check three times!

game: "Three-Check"
extends: "Standard Chess"

victory:
  add:
    three_checks: checks >= 3
`,
  atomic: `# Atomic Chess
# Captures cause explosions!

game: "Atomic Chess"
extends: "Standard Chess"

trigger explosion {
  on: capture
  do: remove adjacent(destination)
}
`,
  custom: `# Custom Piece Example
# Define your own pieces!

game: "Custom Game"
extends: "Standard Chess"

piece Amazon {
  move: slide(orthogonal) | slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

setup:
  replace:
    Queen: Amazon
`,
  'large-board': `# Large Board Example
# 10x10 board with custom pieces!

game: "Grand Chess"
extends: "Standard Chess"

board:
  size: 10x10

piece Marshal {
  move: slide(orthogonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

piece Cardinal {
  move: slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

setup:
  add:
    White Rook: [a1, j1]
    White Knight: [b1, i1]
    White Bishop: [c1, h1]
    White Queen: [d1]
    White King: [f1]
    White Marshal: [e1]
    White Cardinal: [g1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2, i2, j2]
    Black Rook: [a10, j10]
    Black Knight: [b10, i10]
    Black Bishop: [c10, h10]
    Black Queen: [d10]
    Black King: [f10]
    Black Marshal: [e10]
    Black Cardinal: [g10]
    Black Pawn: [a9, b9, c9, d9, e9, f9, g9, h9, i9, j9]
`,
  'mini-chess': `# Mini Chess
# 5x6 rectangular board!

game: "Mini Chess"
extends: "Standard Chess"

board:
  size: 5x6

setup:
  add:
    White Rook: [a1, e1]
    White Knight: [b1]
    White Bishop: [d1]
    White King: [c1]
    White Pawn: [a2, b2, c2, d2, e2]
    Black Rook: [a6, e6]
    Black Knight: [b6]
    Black Bishop: [d6]
    Black King: [c6]
    Black Pawn: [a5, b5, c5, d5, e5]
`,
  'wide-board': `# Wide Board
# 12x8 horizontal rectangular board

game: "Wide Chess"
extends: "Standard Chess"

board:
  size: 12x8

piece Chancellor {
  move: slide(orthogonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

piece Archbishop {
  move: slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

setup:
  add:
    White Rook: [a1, l1]
    White Knight: [b1, k1]
    White Bishop: [c1, j1]
    White Chancellor: [d1]
    White Archbishop: [i1]
    White Queen: [e1]
    White King: [h1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2, i2, j2, k2, l2]
    Black Rook: [a8, l8]
    Black Knight: [b8, k8]
    Black Bishop: [c8, j8]
    Black Chancellor: [d8]
    Black Archbishop: [i8]
    Black Queen: [e8]
    Black King: [h8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7, i7, j7, k7, l7]
`,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      code: DEFAULT_CODE,
      setCode: (code) => set({ code }),

      errors: [],
      setErrors: (errors) => set({ errors }),

      isCompiling: false,
      setIsCompiling: (isCompiling) => set({ isCompiling }),

      showProblems: true,
      toggleProblems: () => set((state) => ({ showProblems: !state.showProblems })),

      loadExample: (example) => {
        const code = EXAMPLES[example] ?? DEFAULT_CODE;
        set({ code, errors: [] });
      },
    }),
    {
      name: 'chesslang-editor',
      partialize: (state) => ({ code: state.code }),
    }
  )
);
