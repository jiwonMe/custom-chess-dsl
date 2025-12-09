'use client';

import { useState, useCallback, useMemo } from 'react';
import { Square } from './Square';
import { Piece } from './Piece';
import { MoveIndicator } from './MoveIndicator';
import { cn } from '@/lib/utils/cn';
import type { Position, Move, Piece as PieceType, Color } from '@/types';

interface BoardSquare {
  pos: Position;
  piece: PieceType | null;
}

interface BoardState {
  board: BoardSquare[][];
  currentPlayer: Color;
  lastMove?: Move;
}

interface BoardProps {
  state: BoardState;
  legalMoves?: Move[];
  selectedPiece?: PieceType | null;
  flipped?: boolean;
  interactive?: boolean;
  highlightLastMove?: boolean;
  showCoordinates?: boolean;
  onSquareClick?: (pos: Position) => void;
  onPieceSelect?: (piece: PieceType | null) => void;
  className?: string;
}

export function Board({
  state,
  legalMoves = [],
  selectedPiece = null,
  flipped = false,
  interactive = true,
  highlightLastMove = true,
  showCoordinates = true,
  onSquareClick,
  onPieceSelect,
  className,
}: BoardProps) {
  const boardSize = state.board.length;

  // Calculate legal move targets
  const legalTargets = useMemo(() => {
    const targets = new Set<string>();
    for (const move of legalMoves) {
      targets.add(`${move.to.file},${move.to.rank}`);
    }
    return targets;
  }, [legalMoves]);

  const handleSquareClick = useCallback(
    (pos: Position) => {
      if (!interactive) return;

      onSquareClick?.(pos);

      // Find piece at position
      const square = state.board[pos.rank]?.[pos.file];
      const piece = square?.piece ?? null;

      // If clicking on own piece, select it
      if (piece && piece.owner === state.currentPlayer) {
        onPieceSelect?.(piece);
      } else if (selectedPiece) {
        // Check if this is a legal move
        const isLegal = legalTargets.has(`${pos.file},${pos.rank}`);
        if (!isLegal) {
          onPieceSelect?.(null);
        }
      }
    },
    [interactive, state, selectedPiece, legalTargets, onSquareClick, onPieceSelect]
  );

  // Determine ranks/files order based on flip
  const ranks = flipped
    ? Array.from({ length: boardSize }, (_, i) => i)
    : Array.from({ length: boardSize }, (_, i) => boardSize - 1 - i);
  const files = flipped
    ? Array.from({ length: boardSize }, (_, i) => boardSize - 1 - i)
    : Array.from({ length: boardSize }, (_, i) => i);

  // Check if king is in check (for highlighting)
  const isKingInCheck = (piece: PieceType | null, color: Color) => {
    // Simple check - would need to use engine for real check detection
    return false;
  };

  return (
    <div className={cn('select-none', className)}>
      <div
        className="grid gap-0 border-2 border-gray-800 rounded shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          aspectRatio: '1',
        }}
      >
        {ranks.map((rank) =>
          files.map((file) => {
            const pos = { file, rank };
            const square = state.board[rank]?.[file];
            const piece = square?.piece ?? null;

            const isSelected =
              selectedPiece?.pos.file === file && selectedPiece?.pos.rank === rank;
            const isLegalMove = legalTargets.has(`${file},${rank}`);
            const isLastMoveSquare =
              highlightLastMove &&
              state.lastMove &&
              ((state.lastMove.from.file === file && state.lastMove.from.rank === rank) ||
                (state.lastMove.to.file === file && state.lastMove.to.rank === rank));
            const isCheck =
              piece?.type === 'King' &&
              piece?.owner === state.currentPlayer &&
              isKingInCheck(piece, state.currentPlayer);

            return (
              <Square
                key={`${file}-${rank}`}
                pos={pos}
                isLight={(file + rank) % 2 === 1}
                isSelected={isSelected}
                isLastMove={isLastMoveSquare}
                isCheck={isCheck}
                onClick={() => handleSquareClick(pos)}
                showCoordinates={showCoordinates}
                showRank={file === (flipped ? boardSize - 1 : 0)}
                showFile={rank === (flipped ? boardSize - 1 : 0)}
              >
                {piece && (
                  <Piece
                    type={piece.type}
                    color={piece.owner}
                    isDraggable={interactive && piece.owner === state.currentPlayer}
                  />
                )}
                {isLegalMove && <MoveIndicator isCapture={piece !== null} />}
              </Square>
            );
          })
        )}
      </div>
    </div>
  );
}
