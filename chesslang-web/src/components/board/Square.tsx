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

// 동적으로 파일/랭크 레이블 생성 (최대 26x26 보드 지원)
const getFileLabel = (file: number): string => {
  if (file < 26) {
    return String.fromCharCode(97 + file); // a-z
  }
  // 26 이상이면 aa, ab, ... 형식
  const first = Math.floor(file / 26) - 1;
  const second = file % 26;
  return String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
};

const getRankLabel = (rank: number): string => {
  return String(rank + 1);
};

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
          {getRankLabel(pos.rank)}
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
          {getFileLabel(pos.file)}
        </span>
      )}
    </div>
  );
}
