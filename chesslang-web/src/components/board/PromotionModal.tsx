'use client';

import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import type { Color, Position } from '@/types';

interface PromotionModalProps {
  isOpen: boolean;
  color: Color;
  position: Position;
  onSelect: (pieceType: string) => void;
  onCancel: () => void;
  promotionPieces?: string[];
}

// Unicode chess pieces
const pieceSymbols: Record<string, { White: string; Black: string }> = {
  Queen: { White: '♕', Black: '♛' },
  Rook: { White: '♖', Black: '♜' },
  Bishop: { White: '♗', Black: '♝' },
  Knight: { White: '♘', Black: '♞' },
};

const defaultPromotionPieces = ['Queen', 'Rook', 'Bishop', 'Knight'];

/**
 * 폰 프로모션 선택 모달
 */
export function PromotionModal({
  isOpen,
  color,
  position,
  onSelect,
  onCancel,
  promotionPieces = defaultPromotionPieces,
}: PromotionModalProps) {
  // ESC 키로 취소
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      // 숫자키로 선택 (1-4)
      const num = parseInt(e.key);
      if (num >= 1 && num <= promotionPieces.length) {
        onSelect(promotionPieces[num - 1]!);
      }
    },
    [onCancel, onSelect, promotionPieces]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={cn(
          // 포지셔닝
          'fixed inset-0 z-40',
          // 배경
          'bg-black/50 backdrop-blur-sm',
          // 애니메이션
          'animate-in fade-in duration-200'
        )}
        onClick={onCancel}
      />

      {/* 모달 */}
      <div
        className={cn(
          // 포지셔닝
          'fixed z-50',
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          // 레이아웃
          'flex flex-col items-center gap-4',
          // 패딩
          'p-6',
          // 배경
          'bg-zinc-900 border border-zinc-700',
          // 라운드
          'rounded-xl',
          // 그림자
          'shadow-2xl',
          // 애니메이션
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* 타이틀 */}
        <h3 className="text-lg font-semibold text-white">프로모션 선택</h3>
        <p className="text-sm text-zinc-400">승진할 기물을 선택하세요</p>

        {/* 기물 선택 버튼 */}
        <div className="flex gap-2">
          {promotionPieces.map((pieceType, index) => {
            const symbol = pieceSymbols[pieceType]?.[color] || pieceType[0];
            return (
              <button
                key={pieceType}
                onClick={() => onSelect(pieceType)}
                className={cn(
                  // 크기
                  'w-16 h-16',
                  // 레이아웃
                  'flex flex-col items-center justify-center gap-1',
                  // 배경
                  'bg-zinc-800 hover:bg-zinc-700',
                  // 보더
                  'border-2 border-zinc-600 hover:border-emerald-500',
                  // 라운드
                  'rounded-lg',
                  // 트랜지션
                  'transition-all duration-150',
                  // 포커스
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                )}
                title={`${pieceType} (${index + 1})`}
              >
                <span
                  className={cn(
                    // 크기
                    'text-4xl',
                    // 색상
                    color === 'White' ? 'text-white' : 'text-gray-300',
                    // 윤곽선
                    color === 'White' && '[text-shadow:_0_0_2px_rgb(0_0_0_/_80%)]'
                  )}
                  style={{
                    fontFamily: "'Noto Sans Symbols 2', 'Segoe UI Symbol', sans-serif",
                  }}
                >
                  {symbol}
                </span>
                <span className="text-[10px] text-zinc-400">{index + 1}</span>
              </button>
            );
          })}
        </div>

        {/* 힌트 */}
        <p className="text-xs text-zinc-500">
          숫자키(1-{promotionPieces.length}) 또는 클릭으로 선택 · ESC로 취소
        </p>
      </div>
    </>
  );
}
