'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useGameStore } from '@/stores/gameStore';
import type { Move, GameState, CompiledGame } from '@/types';

// Since we can't use Web Workers easily in Next.js without extra config,
// we'll run the engine directly (synchronously) for now.
// In production, this should be moved to a Web Worker.

interface EngineHook {
  compile: () => void;
  makeMove: (move: Move) => void;
  getLegalMoves: () => Move[];
  reset: () => void;
  undo: () => void;
  isReady: boolean;
}

export function useEngine(): EngineHook {
  const [isReady, setIsReady] = useState(false);
  const engineRef = useRef<any>(null);

  const code = useEditorStore((s) => s.code);
  const setErrors = useEditorStore((s) => s.setErrors);
  const setIsCompiling = useEditorStore((s) => s.setIsCompiling);

  const setGameState = useGameStore((s) => s.setGameState);
  const setCompiledGame = useGameStore((s) => s.setCompiledGame);
  const setLegalMoves = useGameStore((s) => s.setLegalMoves);
  const addMove = useGameStore((s) => s.addMove);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const selectPiece = useGameStore((s) => s.selectPiece);

  // Load engine modules dynamically
  useEffect(() => {
    async function loadEngine() {
      try {
        // Dynamic import of the chesslang modules
        const { Lexer } = await import('chesslang/lexer/index.js');
        const { Parser } = await import('chesslang/parser/index.js');
        const { Compiler } = await import('chesslang/compiler/index.js');
        const { GameEngine } = await import('chesslang/engine/game.js');
        const { STANDARD_CHESS } = await import('chesslang/stdlib/standard-chess.js');

        engineRef.current = {
          Lexer,
          Parser,
          Compiler,
          GameEngine,
          STANDARD_CHESS,
          instance: null,
        };

        // Initialize with standard chess by default
        const engine = new GameEngine(STANDARD_CHESS);
        engineRef.current.instance = engine;

        updateState(engine);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to load engine:', error);
        setErrors([{ line: 1, column: 1, message: 'Failed to load engine' }]);
      }
    }

    loadEngine();
  }, [setErrors]);

  // Update game state from engine
  const updateState = useCallback(
    (engine: any) => {
      if (!engine) return;

      const state = engine.getState();
      const board = engine.getBoard();

      // Convert to web format
      const boardState: GameState['board'] = [];
      for (let rank = 0; rank < 8; rank++) {
        const row = [];
        for (let file = 0; file < 8; file++) {
          const piece = board.at({ file, rank });
          row.push({
            pos: { file, rank },
            piece: piece ?? null,
            effects: [],
          });
        }
        boardState.push(row);
      }

      setGameState({
        ...state,
        board: boardState,
        lastMove: state.moveHistory[state.moveHistory.length - 1],
      });

      // Check for game over
      if (state.result) {
        setGameOver(true, state.result.winner, state.result.reason);
      }

      // Update legal moves
      const moves = engine.getLegalMoves();
      setLegalMoves(moves);
    },
    [setGameState, setLegalMoves, setGameOver]
  );

  // Compile code
  const compile = useCallback(() => {
    if (!engineRef.current || !isReady) return;

    setIsCompiling(true);
    setErrors([]);
    selectPiece(null);

    try {
      const { Lexer, Parser, Compiler, GameEngine, STANDARD_CHESS } = engineRef.current;

      // If code is empty or just whitespace, use standard chess
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        const engine = new GameEngine(STANDARD_CHESS);
        engineRef.current.instance = engine;
        updateState(engine);
        setCompiledGame(STANDARD_CHESS);
        setIsCompiling(false);
        return;
      }

      // Parse and compile
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const compiler = new Compiler(ast);
      const compiled = compiler.compile();

      // Create engine with compiled game
      const engine = new GameEngine(compiled);
      engineRef.current.instance = engine;

      updateState(engine);
      setCompiledGame(compiled);
      setIsCompiling(false);
    } catch (error: any) {
      console.error('Compilation error:', error);

      // Extract line/column from error if available
      const location = error.location ?? { line: 1, column: 1 };
      setErrors([
        {
          line: location.line,
          column: location.column,
          message: error.message,
        },
      ]);
      setIsCompiling(false);
    }
  }, [code, isReady, setErrors, setIsCompiling, updateState, setCompiledGame, selectPiece]);

  // Make a move
  const makeMove = useCallback(
    (move: Move) => {
      if (!engineRef.current?.instance) return;

      const engine = engineRef.current.instance;
      const result = engine.makeMove(move);

      if (result.success) {
        addMove(move);
        selectPiece(null);
        updateState(engine);
      }
    },
    [addMove, selectPiece, updateState]
  );

  // Get legal moves (already cached in store, but can refresh)
  const getLegalMoves = useCallback((): Move[] => {
    if (!engineRef.current?.instance) return [];
    return engineRef.current.instance.getLegalMoves();
  }, []);

  // Reset game
  const reset = useCallback(() => {
    if (!engineRef.current?.instance) return;

    engineRef.current.instance.reset();
    selectPiece(null);
    setGameOver(false, null, null);
    updateState(engineRef.current.instance);
  }, [selectPiece, setGameOver, updateState]);

  // Undo move
  const undo = useCallback(() => {
    if (!engineRef.current?.instance) return;

    const success = engineRef.current.instance.undoMove();
    if (success) {
      selectPiece(null);
      setGameOver(false, null, null);
      updateState(engineRef.current.instance);
    }
  }, [selectPiece, setGameOver, updateState]);

  return {
    compile,
    makeMove,
    getLegalMoves,
    reset,
    undo,
    isReady,
  };
}
