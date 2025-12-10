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
  // ========================================
  // Level 1: Configure - Basic Variants
  // ========================================
  
  koth: DEFAULT_CODE,
  
  'three-check': `# Three-Check Chess
# Win by giving check three times!
# Note: Full three-check logic requires engine support.

game: "Three-Check"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    center: [d4, d5, e4, e5]
`,

  'racing-kings': `# Racing Kings
# First King to reach rank 8 wins!

game: "Racing Kings"
extends: "Standard Chess"

board:
  size: 8x8

setup:
  add:
    White King: [a1]
    White Queen: [a2]
    White Rook: [b1, b2]
    White Bishop: [c1, c2]
    White Knight: [d1, d2]
    Black King: [h1]
    Black Queen: [h2]
    Black Rook: [g1, g2]
    Black Bishop: [f1, f2]
    Black Knight: [e1, e2]

victory:
  add:
    racing: King on rank 8
`,

  'horde-chess': `# Horde Chess
# White has many pawns, Black has normal pieces.

game: "Horde Chess"
extends: "Standard Chess"

setup:
  add:
    White Pawn: [a1, b1, c1, d1, e1, f1, g1, h1, a2, b2, c2, d2, e2, f2, g2, h2, a3, b3, c3, d3, e3, f3, g3, h3, a4, b4, c4, d4, e4, f4, g4, h4, f5, g5]
    Black King: [e8]
    Black Queen: [d8]
    Black Rook: [a8, h8]
    Black Bishop: [c8, f8]
    Black Knight: [b8, g8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  // ========================================
  // Level 2: Compose - Custom Pieces
  // ========================================

  atomic: `# Atomic Chess
# Captures cause explosions!

game: "Atomic Chess"
extends: "Standard Chess"

# When a capture occurs, all adjacent non-pawn pieces are removed
trigger atomic_explosion {
  on: capture
  do: {
    remove pieces in radius(1) from target
  }
}

victory:
  add:
    king_exploded: opponent.King == 0
`,

  custom: `# Custom Piece: Amazon
# The Amazon combines Queen + Knight movement.
# Most powerful piece in chess variants!

game: "Amazon Chess"
extends: "Standard Chess"

piece Amazon {
  move: slide(orthogonal) | slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
  value: 12
  symbol: "A"
}

setup:
  replace:
    Queen: Amazon
`,

  'cannon-chess': `# Cannon Chess (Xiangqi-inspired)
# The Cannon moves like a Rook but hops to capture.
# Must jump over exactly one piece to capture.

game: "Cannon Chess"
extends: "Standard Chess"

piece Cannon {
  move: slide(orthogonal)
  capture: hop(orthogonal)
  value: 4
  symbol: "C"
}

setup:
  replace:
    Bishop: Cannon
`,

  'fairy-pieces': `# Fairy Chess Pieces
# Collection of exotic leapers and riders.

game: "Fairy Chess"
extends: "Standard Chess"

# Nightrider: Can repeat Knight jumps in a line
piece Nightrider {
  move: leap(2, 1)
  capture: =move
  traits: [jump]
  value: 4
  symbol: "N"
}

# Camel: (3,1) leaper - longer than Knight
piece Camel {
  move: leap(3, 1)
  capture: =move
  traits: [jump]
  value: 2
  symbol: "M"
}

# Zebra: (3,2) leaper - diagonal Knight
piece Zebra {
  move: leap(3, 2)
  capture: =move
  traits: [jump]
  value: 2
  symbol: "Z"
}

setup:
  add:
    White Nightrider: [b1, g1]
    White Camel: [c1]
    White Zebra: [f1]
    White Rook: [a1, h1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Nightrider: [b8, g8]
    Black Camel: [c8]
    Black Zebra: [f8]
    Black Rook: [a8, h8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'berserk-chess': `# Berserk Chess
# Berserkers combine King and Knight movement.

game: "Berserk Chess"
extends: "Standard Chess"

piece Berserker {
  move: step(any) | leap(2, 1)
  capture: =move
  traits: [jump]
  state: { rage: 0 }
  value: 5
  symbol: "B"
}

# Berserker gains rage when capturing
trigger gain_rage {
  on: capture
  when: piece.type == Berserker
  do: set piece.state.rage = piece.state.rage + 1
}

setup:
  replace:
    Knight: Berserker
`,

  // ========================================
  // Level 2: Compose - Advanced Pieces
  // ========================================

  'gryphon': `# Gryphon Chess
# Gryphon: Step diagonally, then slide orthogonally.
# Unique composite movement pattern!

game: "Gryphon Chess"
extends: "Standard Chess"

piece Gryphon {
  move: step(diagonal) + slide(orthogonal)
  capture: =move
  value: 7
  symbol: "G"
}

setup:
  replace:
    Queen: Gryphon
`,

  'superpawn': `# Super Pawn Chess
# Pawns with enhanced movement abilities.

game: "Super Pawn Chess"
extends: "Standard Chess"

piece SuperPawn {
  move: step(forward) | step(diagonal) where empty
  capture: step(diagonal) where enemy
  traits: [promote]
  value: 2
  symbol: "S"
}

setup:
  replace:
    Pawn: SuperPawn
`,

  'dragon': `# Dragon Chess
# The Dragon slides and can leap over pieces.

game: "Dragon Chess"
extends: "Standard Chess"

piece Dragon {
  move: slide(any) | leap(3, 0)
  capture: =move
  traits: [jump]
  value: 10
  symbol: "D"
}

setup:
  add:
    White Dragon: [d1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Bishop: [c1, f1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Dragon: [d8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Bishop: [c8, f8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  // ========================================
  // Level 2: Compose - Effects & Triggers
  // ========================================

  'trapper': `# Trapper Chess
# Trappers leave traps on squares they leave.

game: "Trapper Chess"
extends: "Standard Chess"

piece Trapper {
  move: step(any)
  capture: =move
  state: { traps: 0 }
  value: 3
  symbol: "T"
}

effect trap {
  damages: [enemy]
  visual: highlight(red)
}

trigger place_trap {
  on: move
  when: piece.type == Trapper and piece.state.traps < 3
  do: {
    mark origin with trap
    set piece.state.traps = piece.state.traps + 1
  }
}

setup:
  add:
    White Trapper: [d1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Bishop: [c1, f1]
    White Queen: [e1]
    White King: [f1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Trapper: [d8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Bishop: [c8, f8]
    Black Queen: [e8]
    Black King: [f8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'phoenix': `# Phoenix Chess
# Phoenix pieces can resurrect after capture!

game: "Phoenix Chess"
extends: "Standard Chess"

piece Phoenix {
  move: slide(diagonal)
  capture: =move
  state: { canResurrect: true }
  value: 4
  symbol: "P"
}

# Phoenix returns to its starting rank when captured
trigger phoenix_rebirth {
  on: capture
  when: captured.type == Phoenix and captured.state.canResurrect
  do: {
    create Phoenix at start_position
    set captured.state.canResurrect = false
  }
}

setup:
  replace:
    Bishop: Phoenix
`,

  'bomber': `# Bomber Chess
# Bombers explode when captured, damaging nearby pieces.

game: "Bomber Chess"
extends: "Standard Chess"

piece Bomber {
  move: step(any)
  capture: =move
  value: 2
  symbol: "X"
}

trigger bomber_explosion {
  on: capture
  when: captured.type == Bomber
  do: {
    remove pieces in radius(1) from target
  }
}

setup:
  add:
    White Bomber: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Bomber: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  // ========================================
  // Level 2: Compose - Zone-based Games
  // ========================================

  'fortress': `# Fortress Chess
# Each side has a fortress zone.
# Capture enemy pieces in your fortress to gain points!

game: "Fortress Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    white_fortress: [a1, b1, c1, a2, b2, c2]
    black_fortress: [f8, g8, h8, f7, g7, h7]
    center: [d4, d5, e4, e5]

victory:
  add:
    fortress_king: King in zone.center
`,

  'safe_zones': `# Safe Zone Chess
# Pieces in safe zones cannot be captured.

game: "Safe Zone Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    white_safe: [a1, b1, c1, d1]
    black_safe: [e8, f8, g8, h8]
    neutral: [d4, e4, d5, e5]

# King in neutral zone wins
victory:
  add:
    hill: King in zone.neutral
`,

  // ========================================
  // Level 3: Script - Advanced Logic
  // ========================================

  'progressive': `# Progressive Chess
# Each turn, you make one more move than the last turn.
# White: 1 move, Black: 2 moves, White: 3 moves...

game: "Progressive Chess"
extends: "Standard Chess"

# Turn progression: 1, 2, 3, 4...
# Check ends the turn immediately.

script {
  game.state.movesThisTurn = 0;
  game.state.movesRequired = 1;

  game.on("move", function(event) {
    game.state.movesThisTurn++;
    
    if (game.isCheck(event.player === "White" ? "Black" : "White") || 
        game.state.movesThisTurn >= game.state.movesRequired) {
      game.endTurn();
    }
  });

  game.on("turnEnd", function(event) {
    game.state.movesRequired++;
    game.state.movesThisTurn = 0;
  });
}
`,

  'countdown': `# Countdown Chess
# Each player has 50 moves total.
# Run out of moves and you lose!

game: "Countdown Chess"
extends: "Standard Chess"

script {
  game.state.whiteMoves = 50;
  game.state.blackMoves = 50;

  game.on("move", function(event) {
    if (event.player === "White") {
      game.state.whiteMoves--;
      console.log("White moves left:", game.state.whiteMoves);
      if (game.state.whiteMoves <= 0) {
        game.declareWinner("Black", "White ran out of moves");
      }
    } else {
      game.state.blackMoves--;
      console.log("Black moves left:", game.state.blackMoves);
      if (game.state.blackMoves <= 0) {
        game.declareWinner("White", "Black ran out of moves");
      }
    }
    game.endTurn();
  });
}
`,

  'capture-the-flag': `# Capture the Flag Chess
# Capture opponent's flag piece to win!

game: "Capture the Flag"
extends: "Standard Chess"

piece Flag {
  move: step(any)
  capture: =move
  value: 100
}

script {
  game.on("capture", function(event) {
    if (event.captured && event.captured.type === "Flag") {
      game.declareWinner(event.player, "Captured the flag!");
    }
  });
}

setup:
  add:
    White Flag: [d1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Bishop: [c1, f1]
    White Queen: [e1]
    White King: [g1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Flag: [d8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Bishop: [c8, f8]
    Black Queen: [e8]
    Black King: [g8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'material-race': `# Material Race
# First to capture 15 points of material wins!

game: "Material Race"
extends: "Standard Chess"

# Point values: Q=9, R=5, B=3, N=3, P=1

script {
  game.state.whiteCaptures = 0;
  game.state.blackCaptures = 0;

  var pieceValues = {
    "Pawn": 1,
    "Knight": 3,
    "Bishop": 3,
    "Rook": 5,
    "Queen": 9
  };

  game.on("capture", function(event) {
    var capturedType = event.captured.type;
    var value = pieceValues[capturedType] || 0;

    if (event.player === "White") {
      game.state.whiteCaptures += value;
      console.log("White captures:", game.state.whiteCaptures);
      if (game.state.whiteCaptures >= 15) {
        game.declareWinner("White", "Captured 15 points");
      }
    } else {
      game.state.blackCaptures += value;
      console.log("Black captures:", game.state.blackCaptures);
      if (game.state.blackCaptures >= 15) {
        game.declareWinner("Black", "Captured 15 points");
      }
    }
  });
}
`,

  'peaceful-turns': `# Peaceful Turns
# Every 5 turns, no captures allowed!

game: "Peaceful Turns"
extends: "Standard Chess"

script {
  game.state.turnCount = 0;

  game.on("turnEnd", function(event) {
    game.state.turnCount++;
    
    if (game.state.turnCount % 5 === 0) {
      console.log("Peace turn! No captures allowed next turn.");
    }
  });
}
`,

  // ========================================
  // More Custom Pieces
  // ========================================

  'wazir': `# Wazir Chess
# The Wazir moves one step orthogonally.
# A weak but useful piece from Shatranj.

game: "Wazir Chess"
extends: "Standard Chess"

piece Wazir {
  move: step(orthogonal)
  capture: =move
  value: 2
}

setup:
  add:
    White Wazir: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Wazir: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'ferz': `# Ferz Chess
# The Ferz moves one step diagonally.
# From ancient Shatranj - predecessor to the Queen.

game: "Ferz Chess"
extends: "Standard Chess"

piece Ferz {
  move: step(diagonal)
  capture: =move
  value: 2
}

setup:
  add:
    White Ferz: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Ferz: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'elephant': `# Elephant Chess
# The Elephant leaps (2,2) diagonally.
# From Xiangqi (Chinese Chess).

game: "Elephant Chess"
extends: "Standard Chess"

piece Elephant {
  move: leap(2, 2)
  capture: =move
  traits: [jump]
  value: 3
}

setup:
  replace:
    Bishop: Elephant
`,

  'camel': `# Camel Chess
# The Camel is a (3,1) leaper.
# Longer-reaching than a Knight.

game: "Camel Chess"
extends: "Standard Chess"

piece Camel {
  move: leap(3, 1)
  capture: =move
  traits: [jump]
  value: 3
}

setup:
  add:
    White Camel: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Camel: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'zebra': `# Zebra Chess
# The Zebra is a (3,2) leaper.
# A diagonal Knight variant.

game: "Zebra Chess"
extends: "Standard Chess"

piece Zebra {
  move: leap(3, 2)
  capture: =move
  traits: [jump]
  value: 3
}

setup:
  replace:
    Knight: Zebra
`,

  // ========================================
  // More Zone-Based Games
  // ========================================

  'center-control': `# Center Control Chess
# Control the center to win!

game: "Center Control Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    center: [d4, d5, e4, e5]
    extended_center: [c3, c4, c5, c6, d3, d6, e3, e6, f3, f4, f5, f6]

victory:
  add:
    center_king: King in zone.center
`,

  'quadrant-chess': `# Quadrant Chess
# Each quadrant has special properties.

game: "Quadrant Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    nw_quadrant: [a5, a6, a7, a8, b5, b6, b7, b8, c5, c6, c7, c8, d5, d6, d7, d8]
    ne_quadrant: [e5, e6, e7, e8, f5, f6, f7, f8, g5, g6, g7, g8, h5, h6, h7, h8]
    sw_quadrant: [a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4]
    se_quadrant: [e1, e2, e3, e4, f1, f2, f3, f4, g1, g2, g3, g4, h1, h2, h3, h4]
`,

  // ========================================
  // Board Size Variants
  // ========================================

  'large-board': `# Grand Chess (10x10)
# Large board with Marshal and Cardinal pieces.

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

  'mini-chess': `# Mini Chess (5x6)
# A smaller, faster game with fewer pieces.

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

  'wide-board': `# Capablanca Chess (12x8)
# Wide board with Chancellor and Archbishop.

game: "Capablanca Chess"
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

  // ========================================
  // Special Rules Variants
  // ========================================

  'no-castling': `# No Castling Chess
# Standard chess without castling.

game: "No Castling Chess"
extends: "Standard Chess"

# Castling is disabled in this variant
`,

  'antichess': `# Antichess (Losing Chess)
# The goal is to lose all your pieces!

game: "Antichess"
extends: "Standard Chess"

# Captures are mandatory
# First player to lose all pieces wins
`,

  'zombie-chess': `# Zombie Chess
# Defeated pawns rise again as Zombies!

game: "Zombie Chess"
extends: "Standard Chess"

piece Zombie {
  move: step(any)
  capture: =move
}
`,

  'extinction-chess': `# Extinction Chess
# Lose when any piece type goes extinct!
# Win when opponent's King is captured.

game: "Extinction Chess"
extends: "Standard Chess"

# In Extinction Chess, capturing the King wins
victory:
  add:
    king_gone: King captured
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

// Export example keys for UI
export const EXAMPLE_CATEGORIES = {
  'Level 1: Basic Variants': ['koth', 'three-check', 'racing-kings', 'horde-chess'],
  'Level 2: Custom Pieces': ['custom', 'cannon-chess', 'fairy-pieces', 'gryphon', 'superpawn', 'dragon', 'wazir', 'ferz', 'elephant', 'camel', 'zebra'],
  'Level 2: Effects & Triggers': ['atomic', 'berserk-chess', 'trapper', 'phoenix', 'bomber'],
  'Level 2: Zone Games': ['fortress', 'safe_zones', 'center-control', 'quadrant-chess'],
  'Level 3: Scripts': ['progressive', 'countdown', 'capture-the-flag', 'material-race', 'peaceful-turns'],
  'Board Sizes': ['mini-chess', 'large-board', 'wide-board'],
  'Special Rules': ['no-castling', 'antichess', 'zombie-chess', 'extinction-chess'],
};

export const EXAMPLE_NAMES: Record<string, string> = {
  // Level 1
  koth: 'King of the Hill',
  'three-check': 'Three-Check',
  'racing-kings': 'Racing Kings',
  'horde-chess': 'Horde Chess',
  // Level 2 - Custom Pieces
  custom: 'Amazon Chess',
  'cannon-chess': 'Cannon Chess',
  'fairy-pieces': 'Fairy Pieces',
  gryphon: 'Gryphon Chess',
  superpawn: 'Super Pawn Chess',
  dragon: 'Dragon Chess',
  wazir: 'Wazir Chess',
  ferz: 'Ferz Chess',
  elephant: 'Elephant Chess',
  camel: 'Camel Chess',
  zebra: 'Zebra Chess',
  // Level 2 - Effects & Triggers
  atomic: 'Atomic Chess',
  'berserk-chess': 'Berserk Chess',
  trapper: 'Trapper Chess',
  phoenix: 'Phoenix Chess',
  bomber: 'Bomber Chess',
  // Level 2 - Zones
  fortress: 'Fortress Chess',
  safe_zones: 'Safe Zone Chess',
  'center-control': 'Center Control Chess',
  'quadrant-chess': 'Quadrant Chess',
  // Level 3 - Scripts
  progressive: 'Progressive Chess',
  countdown: 'Countdown Chess',
  'capture-the-flag': 'Capture the Flag',
  'material-race': 'Material Race',
  'peaceful-turns': 'Peaceful Turns',
  // Board Sizes
  'mini-chess': 'Mini Chess (5×6)',
  'large-board': 'Grand Chess (10×10)',
  'wide-board': 'Capablanca Chess (12×8)',
  // Special Rules
  'no-castling': 'No Castling',
  antichess: 'Antichess',
  'zombie-chess': 'Zombie Chess',
  'extinction-chess': 'Extinction Chess',
};
