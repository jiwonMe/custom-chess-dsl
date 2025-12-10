'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { Color } from '@/types';

interface DragOverlayProps {
  type: string;
  color: Color;
  isVisible: boolean;
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

// Custom piece emojis
const customPieceEmojis: Record<string, string> = {
  Amazon: '👑',
  Chancellor: '🏰',
  Archbishop: '⛪',
  Cannon: '💣',
  Camel: '🐫',
  Zebra: '🦓',
  Dragon: '🐉',
  Phoenix: '🔥',
};

function getSymbol(type: string, color: Color): string {
  if (pieceSymbols[type]) {
    return pieceSymbols[type][color];
  }
  return customPieceEmojis[type] || type.charAt(0).toUpperCase();
}

/**
 * 드래그 중인 기물을 마우스 커서에 따라 표시하는 오버레이
 */
export function DragOverlay({ type, color, isVisible }: DragOverlayProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isVisible) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible]);

  if (!isVisible) return null;

  const isStandard = type in pieceSymbols;
  const symbol = getSymbol(type, color);

  return (
    <div
      className={cn(
        // 포지셔닝
        'fixed pointer-events-none z-50',
        // 트랜스폼
        'transform -translate-x-1/2 -translate-y-1/2',
        // 애니메이션
        'animate-in fade-in zoom-in-110 duration-100'
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {isStandard ? (
        // Standard piece
        <span
          className={cn(
            // 크기
            'text-6xl',
            // 그림자
            'drop-shadow-xl',
            // 색상
            color === 'White' ? 'text-white' : 'text-gray-900',
            // 윤곽선
            color === 'White' && '[text-shadow:_0_0_4px_rgb(0_0_0_/_90%)]',
            // 투명도
            'opacity-90'
          )}
          style={{
            fontFamily: "'Noto Sans Symbols 2', 'Segoe UI Symbol', sans-serif",
          }}
        >
          {symbol}
        </span>
      ) : (
        // Custom piece
        <div
          className={cn(
            // 크기
            'w-14 h-14',
            // 라운드
            'rounded-full',
            // 그림자
            'shadow-2xl',
            // 보더
            'border-2',
            // 색상
            color === 'White'
              ? 'bg-gradient-to-br from-white to-gray-200 border-gray-400'
              : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600',
            // 레이아웃
            'flex items-center justify-center',
            // 투명도
            'opacity-90'
          )}
        >
          <span className="text-3xl">{symbol}</span>
        </div>
      )}
    </div>
  );
}
