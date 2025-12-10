'use client';

import { cn } from '@/lib/utils/cn';
import type { Position } from '@/types';

interface SquareProps {
  pos: Position;
  isLight: boolean;
  isSelected?: boolean;
  isLastMove?: boolean;
  isCheck?: boolean;
  isDragOver?: boolean;
  isLegalDrop?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
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
  isDragOver = false,
  isLegalDrop = false,
  isFocused = false,
  onClick,
  onDragEnter,
  onDragLeave,
  onDrop,
  showCoordinates = true,
  showRank = false,
  showFile = false,
  children,
}: SquareProps) {
  return (
    <div
      onClick={onClick}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter?.();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      className={cn(
        // 기본
        'relative aspect-square flex items-center justify-center cursor-pointer',
        // 트랜지션
        'transition-all duration-150',
        // 기본 색상
        isLight ? 'bg-board-light' : 'bg-board-dark',
        // 선택됨
        isSelected && 'bg-board-selected',
        // 마지막 이동
        isLastMove && !isSelected && 'bg-board-highlight',
        // 체크
        isCheck && 'bg-red-500/50 animate-pulse',
        // 호버 효과
        !isSelected && !isDragOver && 'hover:brightness-110',
        // 드래그 오버 (합법 이동)
        isDragOver && isLegalDrop && 'bg-emerald-500/40 ring-2 ring-emerald-400 ring-inset',
        // 드래그 오버 (불법 이동)
        isDragOver && !isLegalDrop && 'bg-red-500/20',
        // 키보드 포커스
        isFocused && 'ring-2 ring-yellow-400 ring-inset'
      )}
    >
      {children}

      {/* Rank label (numbers on the left) */}
      {showCoordinates && showRank && (
        <span
          className={cn(
            'absolute top-0.5 left-0.5 text-xs font-semibold pointer-events-none',
            isLight ? 'text-board-dark/70' : 'text-board-light/70'
          )}
        >
          {getRankLabel(pos.rank)}
        </span>
      )}

      {/* File label (letters on the bottom) */}
      {showCoordinates && showFile && (
        <span
          className={cn(
            'absolute bottom-0.5 right-0.5 text-xs font-semibold pointer-events-none',
            isLight ? 'text-board-dark/70' : 'text-board-light/70'
          )}
        >
          {getFileLabel(pos.file)}
        </span>
      )}
    </div>
  );
}
