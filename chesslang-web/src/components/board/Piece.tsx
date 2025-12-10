'use client';

import { cn } from '@/lib/utils/cn';
import type { Color } from '@/types';

interface PieceProps {
  type: string;
  color: Color;
  isDraggable?: boolean;
  state?: Record<string, unknown> | null;
  showState?: boolean;
}

// Unicode chess pieces (standard pieces)
const pieceSymbols: Record<string, { White: string; Black: string }> = {
  King: { White: '♔', Black: '♚' },
  Queen: { White: '♕', Black: '♛' },
  Rook: { White: '♖', Black: '♜' },
  Bishop: { White: '♗', Black: '♝' },
  Knight: { White: '♘', Black: '♞' },
  Pawn: { White: '♙', Black: '♟' },
};

// Emoji mappings for custom pieces
const customPieceEmojis: Record<string, string> = {
  // Popular fairy chess pieces
  Amazon: '👑',
  Chancellor: '🏰',
  Empress: '👸',
  Archbishop: '⛪',
  Princess: '🎀',
  Dragon: '🐉',
  Griffin: '🦅',
  Phoenix: '🔥',
  Unicorn: '🦄',
  Nightrider: '🌙',
  Camel: '🐫',
  Zebra: '🦓',
  Grasshopper: '🦗',
  Cannon: '💣',
  Alfil: '🐘',
  Ferz: '🔷',
  Wazir: '🔶',
  Guard: '🛡️',
  Centaur: '🐴',
  Hawk: '🦅',
  Elephant: '🐘',
  Lion: '🦁',
  Tiger: '🐯',
  // Generic fallbacks by first letter
};

// Get emoji for a custom piece type
function getCustomPieceEmoji(type: string): string {
  // Check direct mapping first
  if (customPieceEmojis[type]) {
    return customPieceEmojis[type];
  }

  // Fallback: use first letter with some variation
  const firstLetter = type.charAt(0).toUpperCase();
  const letterEmojis: Record<string, string> = {
    A: '🅰️', B: '🅱️', C: '©️', D: '🔷', E: '📧',
    F: '🎏', G: '🌀', H: '♓', I: 'ℹ️', J: '🎷',
    K: '🔑', L: '🔷', M: 'Ⓜ️', N: '♑', O: '⭕',
    P: '🅿️', Q: '❓', R: '®️', S: '💲', T: '✝️',
    U: '⛎', V: '✔️', W: '〰️', X: '❌', Y: '💹',
    Z: '💤',
  };

  return letterEmojis[firstLetter] || '⚡';
}

// Get cooldown value from state
function getCooldown(state?: Record<string, unknown> | null): number | null {
  if (!state) return null;
  const cooldown = state['cooldown'];
  return typeof cooldown === 'number' ? cooldown : null;
}

// Format state for display
function formatStateValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'number') return value.toString();
  return String(value);
}

export function Piece({ type, color, isDraggable = false, state, showState = true }: PieceProps) {
  const isStandardPiece = type in pieceSymbols;
  const symbol = isStandardPiece
    ? pieceSymbols[type]![color]
    : getCustomPieceEmoji(type);

  const cooldown = getCooldown(state);
  const hasCooldown = cooldown !== null && cooldown > 0;

  // State badge component
  const StateBadge = () => {
    if (!showState || !state || Object.keys(state).length === 0) return null;

    return (
      <div
        className={cn(
          // 포지셔닝
          'absolute -top-1 -right-1 z-10',
          // 크기
          'min-w-4 h-4 px-1',
          // 레이아웃
          'flex items-center justify-center',
          // 스타일
          'rounded-full',
          'text-[10px] font-bold',
          // 색상 - 쿨다운이면 파란색, 아니면 노란색
          hasCooldown
            ? 'bg-blue-500 text-white border border-blue-300'
            : 'bg-amber-500 text-white border border-amber-300',
          // 그림자
          'shadow-sm'
        )}
        title={Object.entries(state).map(([k, v]) => `${k}: ${formatStateValue(k, v)}`).join('\n')}
      >
        {hasCooldown ? cooldown : '⚡'}
      </div>
    );
  };

  // Standard pieces use unicode chess symbols
  if (isStandardPiece) {
    return (
      <div
        className={cn(
          // 포지셔닝
          'absolute inset-0',
          // 레이아웃
          'flex items-center justify-center',
          // 선택
          'select-none',
          // 드래그
          isDraggable && 'cursor-grab active:cursor-grabbing',
          // 쿨다운 시 반투명
          hasCooldown && 'opacity-60'
        )}
        draggable={isDraggable}
      >
        <span
          className={cn(
            // 텍스트 크기
            'text-4xl md:text-5xl leading-none',
            // 그림자
            'drop-shadow-sm',
            // 색상
            color === 'White' ? 'text-white' : 'text-gray-900',
            // 윤곽선 (가시성 향상)
            color === 'White' && '[text-shadow:_0_0_2px_rgb(0_0_0_/_80%)]'
          )}
          style={{
            fontFamily: "'Noto Sans Symbols 2', 'Segoe UI Symbol', sans-serif",
          }}
        >
          {symbol}
        </span>
        <StateBadge />
      </div>
    );
  }

  // Custom pieces use emoji on colored background
  return (
    <div
      className={cn(
        // 포지셔닝
        'absolute inset-0',
        // 레이아웃
        'flex items-center justify-center',
        // 선택
        'select-none',
        // 드래그
        isDraggable && 'cursor-grab active:cursor-grabbing',
        // 쿨다운 시 반투명
        hasCooldown && 'opacity-60'
      )}
      draggable={isDraggable}
    >
      {/* 배경 원 */}
      <div
        className={cn(
          // 크기
          'w-10 h-10 md:w-12 md:h-12',
          // 라운드
          'rounded-full',
          // 그림자
          'shadow-md',
          // 보더
          'border-2',
          // 색상
          color === 'White'
            ? 'bg-gradient-to-br from-white to-gray-200 border-gray-400'
            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600',
          // 레이아웃
          'flex items-center justify-center',
          // 쿨다운 시 그레이스케일
          hasCooldown && 'grayscale-[30%]'
        )}
      >
        {/* 이모지 */}
        <span
          className={cn(
            // 텍스트 크기
            'text-xl md:text-2xl',
            // 필터 (검정 기물일 때 약간 밝게)
            color === 'Black' && 'brightness-125'
          )}
          role="img"
          aria-label={type}
        >
          {symbol}
        </span>
      </div>
      <StateBadge />
    </div>
  );
}
