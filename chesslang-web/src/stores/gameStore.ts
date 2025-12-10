import { create } from 'zustand';
import type { GameState, Move, Piece, CompiledGame, Color, Position } from '@/types';

interface GameStoreState {
  // Game state
  gameState: GameState | null;
  compiledGame: CompiledGame | null;
  setGameState: (state: GameState | null) => void;
  setCompiledGame: (game: CompiledGame | null) => void;

  // Selection
  selectedPiece: Piece | null;
  selectPiece: (piece: Piece | null) => void;

  // Legal moves for selected piece
  legalMoves: Move[];
  setLegalMoves: (moves: Move[]) => void;

  // Gaze targets (enemies in line of sight for pieces with gaze trait)
  gazeTargets: Piece[];
  setGazeTargets: (targets: Piece[]) => void;

  // Move history display
  moveHistory: Move[];
  addMove: (move: Move) => void;
  clearHistory: () => void;

  // Game status
  isGameOver: boolean;
  winner: Color | null;
  gameOverReason: string | null;
  setGameOver: (isOver: boolean, winner?: Color | null, reason?: string | null) => void;

  // UI state
  boardFlipped: boolean;
  toggleBoardFlip: () => void;

  // Reset
  reset: () => void;
}

// Create an empty board state
function createEmptyBoardState(): GameState {
  const board = [];
  for (let rank = 0; rank < 8; rank++) {
    const row = [];
    for (let file = 0; file < 8; file++) {
      row.push({
        pos: { file, rank },
        piece: null,
        effects: [],
      });
    }
    board.push(row);
  }

  return {
    board,
    pieces: [],
    currentPlayer: 'White',
    moveHistory: [],
    halfMoveClock: 0,
    fullMoveNumber: 1,
    positionHistory: [],
    effects: [],
    customState: {},
  };
}

export const useGameStore = create<GameStoreState>()((set) => ({
  gameState: null,
  compiledGame: null,
  setGameState: (state) => set({ gameState: state }),
  setCompiledGame: (game) => set({ compiledGame: game }),

  selectedPiece: null,
  selectPiece: (piece) => set({ selectedPiece: piece }),

  legalMoves: [],
  setLegalMoves: (moves) => set({ legalMoves: moves }),

  gazeTargets: [],
  setGazeTargets: (targets) => set({ gazeTargets: targets }),

  moveHistory: [],
  addMove: (move) => set((state) => ({ moveHistory: [...state.moveHistory, move] })),
  clearHistory: () => set({ moveHistory: [] }),

  isGameOver: false,
  winner: null,
  gameOverReason: null,
  setGameOver: (isOver, winner = null, reason = null) =>
    set({ isGameOver: isOver, winner, gameOverReason: reason }),

  boardFlipped: false,
  toggleBoardFlip: () => set((state) => ({ boardFlipped: !state.boardFlipped })),

  reset: () =>
    set({
      gameState: null,
      selectedPiece: null,
      legalMoves: [],
      gazeTargets: [],
      moveHistory: [],
      isGameOver: false,
      winner: null,
      gameOverReason: null,
    }),
}));
