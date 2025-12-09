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
