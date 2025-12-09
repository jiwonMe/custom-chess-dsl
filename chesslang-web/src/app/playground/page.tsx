'use client';

import { useEffect, useCallback } from 'react';
import { Editor } from '@/components/editor/Editor';
import { Board } from '@/components/board/Board';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editorStore';
import { useGameStore } from '@/stores/gameStore';
import { useEngine } from '@/hooks/useEngine';
import {
  Play,
  RotateCcw,
  Undo2,
  FlipVertical,
  AlertCircle,
  ChevronDown,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Position, Move } from '@/types';

const examples = [
  { id: 'koth', name: 'King of the Hill' },
  { id: 'three-check', name: 'Three-Check' },
  { id: 'atomic', name: 'Atomic Chess' },
  { id: 'custom', name: 'Custom Pieces' },
  { id: 'large-board', name: 'Large Board (10x10)' },
  { id: 'mini-chess', name: 'Mini Chess (5x6)' },
  { id: 'wide-board', name: 'Wide Board (12x8)' },
];

export default function PlaygroundPage() {
  const { code, setCode, errors, showProblems, toggleProblems, loadExample } = useEditorStore();
  const {
    gameState,
    selectedPiece,
    selectPiece,
    legalMoves,
    boardFlipped,
    toggleBoardFlip,
    isGameOver,
    winner,
    gameOverReason,
  } = useGameStore();

  const { compile, makeMove, reset, undo, isReady } = useEngine();

  // Compile on mount
  useEffect(() => {
    if (isReady) {
      compile();
    }
  }, [isReady, compile]);

  // Handle square click
  const handleSquareClick = useCallback(
    (pos: Position) => {
      if (!gameState || isGameOver) return;

      // Find piece at clicked position
      const square = gameState.board[pos.rank]?.[pos.file];
      const clickedPiece = square?.piece;

      // If we have a selected piece, try to make a move
      if (selectedPiece) {
        const move = legalMoves.find(
          (m) =>
            m.from.file === selectedPiece.pos.file &&
            m.from.rank === selectedPiece.pos.rank &&
            m.to.file === pos.file &&
            m.to.rank === pos.rank
        );

        if (move) {
          makeMove(move);
          return;
        }
      }

      // Select the clicked piece if it belongs to current player
      if (clickedPiece && clickedPiece.owner === gameState.currentPlayer) {
        selectPiece(clickedPiece);
      } else {
        selectPiece(null);
      }
    },
    [gameState, selectedPiece, legalMoves, isGameOver, makeMove, selectPiece]
  );

  // Filter legal moves for selected piece
  const selectedPieceMoves = selectedPiece
    ? legalMoves.filter(
        (m) => m.from.file === selectedPiece.pos.file && m.from.rank === selectedPiece.pos.rank
      )
    : [];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          {/* Examples dropdown */}
          <div className="relative group">
            <Button variant="outline" size="sm">
              Examples
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {examples.map((ex) => (
                <button
                  key={ex.id}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  onClick={() => loadExample(ex.id)}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={compile} disabled={!isReady} size="sm">
            <Play className="mr-1 h-4 w-4" />
            Run
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <Button variant="ghost" size="icon" onClick={undo}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleBoardFlip}>
            <FlipVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Editor panel */}
        <div className="w-1/2 border-r flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <Editor
              value={code}
              onChange={setCode}
              errors={errors}
              className="h-full"
            />
          </div>

          {/* Problems panel */}
          {showProblems && errors.length > 0 && (
            <div className="border-t bg-muted/30 max-h-32 overflow-auto">
              <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 text-destructive" />
                  Problems ({errors.length})
                </span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={toggleProblems}
                >
                  Hide
                </button>
              </div>
              <div className="p-2 space-y-1">
                {errors.map((error, i) => (
                  <div key={i} className="text-sm text-destructive flex items-start gap-2">
                    <span className="text-muted-foreground">
                      Ln {error.line}, Col {error.column}:
                    </span>
                    <span>{error.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game panel */}
        <div className="w-1/2 p-4 flex flex-col items-center justify-center bg-muted/10">
          {gameState ? (
            <>
              {/* Game info */}
              <div className="mb-4 text-center">
                {isGameOver ? (
                  <div className="text-lg font-semibold">
                    {winner ? (
                      <span className={winner === 'White' ? 'text-gray-200' : 'text-gray-800'}>
                        {winner} wins!
                      </span>
                    ) : (
                      <span>Draw</span>
                    )}
                    {gameOverReason && (
                      <span className="text-sm text-muted-foreground ml-2">({gameOverReason})</span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {gameState.currentPlayer} to move
                  </div>
                )}
              </div>

              {/* Board */}
              <Board
                state={{
                  board: gameState.board,
                  currentPlayer: gameState.currentPlayer,
                  lastMove: gameState.lastMove,
                }}
                legalMoves={selectedPieceMoves}
                selectedPiece={selectedPiece}
                flipped={boardFlipped}
                interactive={!isGameOver}
                onSquareClick={handleSquareClick}
                onPieceSelect={selectPiece}
                className="w-full max-w-md"
              />

              {/* Move history */}
              {gameState.moveHistory.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground max-w-md w-full">
                  <div className="font-medium mb-1">Moves</div>
                  <div className="flex flex-wrap gap-1">
                    {gameState.moveHistory.map((move, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                        {formatMove(move)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground">
              {isReady ? 'Click "Run" to compile and play' : 'Loading engine...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Get file label (a-z, then aa, ab, ...)
function getFileLabel(file: number): string {
  if (file < 26) {
    return String.fromCharCode(97 + file);
  }
  const first = Math.floor(file / 26) - 1;
  const second = file % 26;
  return String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
}

// Format a move for display
function formatMove(move: Move): string {
  const from = `${getFileLabel(move.from.file)}${move.from.rank + 1}`;
  const to = `${getFileLabel(move.to.file)}${move.to.rank + 1}`;
  const piece = move.piece.type === 'Pawn' ? '' : move.piece.type[0];
  const capture = move.captured ? 'x' : '';
  return `${piece}${from}${capture}${to}`;
}
