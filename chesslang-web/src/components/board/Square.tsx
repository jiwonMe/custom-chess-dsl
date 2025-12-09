'use client';

import { cn } from '@/lib/utils/cn';
import type { Position } from '@/types';

interface SquareProps {
  pos: Position;
  isLight: boolean;
  isSelected?: boolean;
  isLastMove?: boolean;
  isCheck?: boolean;
  onClick?: () => void;
  showCoordinates?: boolean;
  showRank?: boolean;
  showFile?: boolean;
  children?: React.ReactNode;
}

const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const rankLabels = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function Square({
  pos,
  isLight,
  isSelected = false,
  isLastMove = false,
  isCheck = false,
  onClick,
  showCoordinates = true,
  showRank = false,
  showFile = false,
  children,
}: SquareProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative aspect-square flex items-center justify-center cursor-pointer transition-colors',
        isLight ? 'bg-board-light' : 'bg-board-dark',
        isSelected && 'bg-board-selected',
        isLastMove && !isSelected && 'bg-board-highlight',
        isCheck && 'bg-red-500/50'
      )}
    >
      {children}

      {/* Rank label (numbers on the left) */}
      {showCoordinates && showRank && (
        <span
          className={cn(
            'absolute top-0.5 left-0.5 text-xs font-semibold',
            isLight ? 'text-board-dark' : 'text-board-light'
          )}
        >
          {rankLabels[pos.rank]}
        </span>
      )}

      {/* File label (letters on the bottom) */}
      {showCoordinates && showFile && (
        <span
          className={cn(
            'absolute bottom-0.5 right-0.5 text-xs font-semibold',
            isLight ? 'text-board-dark' : 'text-board-light'
          )}
        >
          {fileLabels[pos.file]}
        </span>
      )}
    </div>
  );
}
