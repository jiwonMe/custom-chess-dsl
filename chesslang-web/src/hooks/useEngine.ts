'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useGameStore } from '@/stores/gameStore';
import type { Move, GameState, CompiledGame } from '@/types';

// Import chesslang modules via TypeScript path mapping (configured in tsconfig.json)
import { Lexer } from 'chesslang/lexer';
import { Parser } from 'chesslang/parser';
import { Compiler } from 'chesslang/compiler';
import { GameEngine } from 'chesslang/engine/game';
import { STANDARD_CHESS } from 'chesslang/stdlib/standard-chess';

interface EngineHook {
  compile: () => void;
  makeMove: (move: Move) => void;
  getLegalMoves: () => Move[];
  reset: () => void;
  undo: () => void;
  executeOptionalTrigger: (triggerId: string) => void;
  skipOptionalTrigger: (triggerId: string) => void;
  isReady: boolean;
}

export function useEngine(): EngineHook {
  const [isReady, setIsReady] = useState(false);
  const engineRef = useRef<{
    Lexer: typeof Lexer;
    Parser: typeof Parser;
    Compiler: typeof Compiler;
    GameEngine: typeof GameEngine;
    STANDARD_CHESS: typeof STANDARD_CHESS;
    instance: InstanceType<typeof GameEngine> | null;
  } | null>(null);

  const code = useEditorStore((s) => s.code);
  const setErrors = useEditorStore((s) => s.setErrors);
  const setIsCompiling = useEditorStore((s) => s.setIsCompiling);

  const setGameState = useGameStore((s) => s.setGameState);
  const setCompiledGame = useGameStore((s) => s.setCompiledGame);
  const setLegalMoves = useGameStore((s) => s.setLegalMoves);
  const addMove = useGameStore((s) => s.addMove);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const selectPiece = useGameStore((s) => s.selectPiece);

  // Initialize engine on mount
  useEffect(() => {
    try {
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
  }, [setErrors]);

  // Update game state from engine
  const updateState = useCallback(
    (engine: any) => {
      if (!engine) return;

      const state = engine.getState();
      const board = engine.getBoard();

      // Get dynamic board dimensions
      const { width, height } = board.dimensions;

      // Convert to web format
      const boardState: GameState['board'] = [];
      for (let rank = 0; rank < height; rank++) {
        const row = [];
        for (let file = 0; file < width; file++) {
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

  // Execute optional trigger
  const executeOptionalTrigger = useCallback(
    (triggerId: string) => {
      if (!engineRef.current?.instance) return;

      const engine = engineRef.current.instance;
      engine.executeOptionalTrigger(triggerId);
      updateState(engine);
    },
    [updateState]
  );

  // Skip optional trigger
  const skipOptionalTrigger = useCallback(
    (triggerId: string) => {
      if (!engineRef.current?.instance) return;

      const engine = engineRef.current.instance;
      engine.skipOptionalTrigger(triggerId);
      updateState(engine);
    },
    [updateState]
  );

  return {
    compile,
    makeMove,
    getLegalMoves,
    reset,
    undo,
    executeOptionalTrigger,
    skipOptionalTrigger,
    isReady,
  };
}
