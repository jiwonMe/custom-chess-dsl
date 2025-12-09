'use client';

import { cn } from '@/lib/utils/cn';
import type { Color } from '@/types';

interface PieceProps {
  type: string;
  color: Color;
  isDraggable?: boolean;
}

// Unicode chess pieces
const pieceSymbols: Record<string, { White: string; Black: string }> = {
  King: { White: '♔', Black: '♚' },
  Queen: { White: '♕', Black: '♛' },
  Rook: { White: '♖', Black: '♜' },
  Bishop: { White: '♗', Black: '♝' },
  Knight: { White: '♘', Black: '♞' },
  Pawn: { White: '♙', Black: '♟' },
};

export function Piece({ type, color, isDraggable = false }: PieceProps) {
  const symbol = pieceSymbols[type]?.[color] ?? '?';

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center select-none',
        isDraggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={isDraggable}
    >
      <span
        className={cn(
          'text-4xl md:text-5xl leading-none drop-shadow-sm',
          color === 'White' ? 'text-white' : 'text-gray-900',
          // Add stroke for better visibility
          color === 'White' && '[text-shadow:_0_0_2px_rgb(0_0_0_/_80%)]'
        )}
        style={{
          // Use proper chess piece font if available
          fontFamily: "'Noto Sans Symbols 2', 'Segoe UI Symbol', sans-serif",
        }}
      >
        {symbol}
      </span>
    </div>
  );
}
