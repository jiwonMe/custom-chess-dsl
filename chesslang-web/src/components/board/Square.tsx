'use client';

import { cn } from '@/lib/utils/cn';
import type { Position, Effect } from '@/types';

interface SquareProps {
  pos: Position;
  isLight: boolean;
  isSelected?: boolean;
  isLastMove?: boolean;
  isCheck?: boolean;
  isDragOver?: boolean;
  isLegalDrop?: boolean;
  isFocused?: boolean;
  isGazeTarget?: boolean;  // Piece at this square is in gaze line of sight
  effects?: Effect[];
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

// Effect 시각적 스타일 매핑
const effectStyles: Record<string, { bg: string; icon: string; title: string }> = {
  // 기본 효과
  trap: { bg: 'bg-red-500/30', icon: '⚠️', title: '덫' },
  fire: { bg: 'bg-orange-500/40', icon: '🔥', title: '불' },
  ice: { bg: 'bg-blue-400/40', icon: '❄️', title: '얼음' },
  poison: { bg: 'bg-green-500/30', icon: '☠️', title: '독' },
  shield: { bg: 'bg-yellow-400/30', icon: '🛡️', title: '방패' },
  // Medusa/Gaze 관련 효과
  frozen: { bg: 'bg-cyan-400/40', icon: '❄️', title: '석화' },
  petrify: { bg: 'bg-cyan-500/30', icon: '🗿', title: '석화' },
  gaze: { bg: 'bg-purple-400/30', icon: '👁️', title: '응시' },
};

function getEffectStyle(effect: Effect) {
  const visual = effect.visual?.toLowerCase() ?? effect.type?.toLowerCase() ?? '';
  const effectType = effect.type?.toLowerCase() ?? '';
  
  // visual 속성에서 색상 추출
  if (visual.includes('cyan')) return { bg: 'bg-cyan-400/40', icon: '❄️', title: effect.type ?? 'frozen' };
  if (visual.includes('red')) return { bg: 'bg-red-500/30', icon: '⚠️', title: effect.type ?? 'danger' };
  if (visual.includes('blue')) return { bg: 'bg-blue-500/30', icon: '❄️', title: effect.type ?? 'ice' };
  if (visual.includes('green')) return { bg: 'bg-green-500/30', icon: '☠️', title: effect.type ?? 'poison' };
  if (visual.includes('yellow')) return { bg: 'bg-yellow-500/30', icon: '⚡', title: effect.type ?? 'energy' };
  if (visual.includes('orange')) return { bg: 'bg-orange-500/30', icon: '🔥', title: effect.type ?? 'fire' };
  if (visual.includes('purple')) return { bg: 'bg-purple-500/30', icon: '👁️', title: effect.type ?? 'magic' };
  
  // 미리 정의된 스타일 (type으로 찾기)
  if (effectStyles[effectType]) {
    return effectStyles[effectType];
  }
  
  // 미리 정의된 스타일 (원래 type으로 찾기)
  return effectStyles[effect.type ?? ''] ?? { bg: 'bg-purple-500/30', icon: '✨', title: effect.type ?? 'effect' };
}

export function Square({
  pos,
  isLight,
  isSelected = false,
  isLastMove = false,
  isCheck = false,
  isDragOver = false,
  isLegalDrop = false,
  isFocused = false,
  isGazeTarget = false,
  effects = [],
  onClick,
  onDragEnter,
  onDragLeave,
  onDrop,
  showCoordinates = true,
  showRank = false,
  showFile = false,
  children,
}: SquareProps) {
  const hasEffects = effects.length > 0;
  const primaryEffect = effects[0];
  const effectStyle = primaryEffect ? getEffectStyle(primaryEffect) : null;

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
        isFocused && 'ring-2 ring-yellow-400 ring-inset',
        // Gaze 시야 내 적 하이라이트
        isGazeTarget && 'ring-2 ring-purple-500 ring-inset bg-purple-500/20',
        // Effect 배경
        hasEffects && effectStyle?.bg
      )}
    >
      {/* Gaze Target 표시 (응시 대상) */}
      {isGazeTarget && (
        <div
          className={cn(
            // 포지셔닝
            'absolute top-0.5 left-0.5 z-20',
            // 포인터
            'pointer-events-none'
          )}
          title="응시 대상 (석화 위험)"
        >
          <span className="text-sm opacity-80">👁️</span>
        </div>
      )}

      {/* Effect 표시 */}
      {hasEffects && effectStyle && (
        <div
          className={cn(
            // 포지셔닝
            'absolute inset-0',
            // 레이아웃
            'flex items-center justify-center',
            // 포인터
            'pointer-events-none'
          )}
          title={`${effectStyle.title} (${effects.length}개)`}
        >
          {/* 효과 아이콘 */}
          <span
            className={cn(
              'text-lg opacity-60',
              // 애니메이션
              'animate-pulse'
            )}
          >
            {effectStyle.icon}
          </span>
        </div>
      )}

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

      {/* Effect 카운트 뱃지 (여러 개일 때) */}
      {effects.length > 1 && (
        <span
          className={cn(
            'absolute top-0.5 right-0.5',
            'w-4 h-4 rounded-full',
            'bg-red-600 text-white',
            'text-[10px] font-bold',
            'flex items-center justify-center',
            'pointer-events-none'
          )}
        >
          {effects.length}
        </span>
      )}
    </div>
  );
}
