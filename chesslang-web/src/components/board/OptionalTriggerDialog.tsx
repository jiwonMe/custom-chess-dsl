'use client';

import { useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import type { PendingOptionalTrigger } from '@/types';

interface OptionalTriggerDialogProps {
  triggers: PendingOptionalTrigger[];
  onExecute: (triggerId: string) => void;
  onSkip: (triggerId: string) => void;
}

/**
 * 선택적 트리거 실행 여부를 묻는 다이얼로그
 */
export function OptionalTriggerDialog({
  triggers,
  onExecute,
  onSkip,
}: OptionalTriggerDialogProps) {
  const currentTrigger = triggers[0];

  // 키보드 단축키
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!currentTrigger) return;

      if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
        e.preventDefault();
        onExecute(currentTrigger.triggerId);
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        e.preventDefault();
        onSkip(currentTrigger.triggerId);
      }
    },
    [currentTrigger, onExecute, onSkip]
  );

  useEffect(() => {
    if (!currentTrigger) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrigger, handleKeyDown]);

  if (!currentTrigger) return null;

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
      />

      {/* 다이얼로그 */}
      <div
        className={cn(
          // 포지셔닝
          'fixed z-50',
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          // 크기
          'w-80 max-w-[90vw]',
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
        {/* 아이콘 */}
        <div
          className={cn(
            'w-12 h-12 rounded-full',
            'bg-amber-500/20',
            'flex items-center justify-center',
            'text-2xl'
          )}
        >
          ⚡
        </div>

        {/* 타이틀 */}
        <h3 className="text-lg font-semibold text-white text-center">
          선택적 액션
        </h3>

        {/* 설명 */}
        <p className="text-sm text-zinc-300 text-center">
          {currentTrigger.description}
        </p>

        {/* 트리거 이름 */}
        <div
          className={cn(
            'px-3 py-1.5',
            'bg-zinc-800 rounded-lg',
            'text-xs text-zinc-400 font-mono'
          )}
        >
          {currentTrigger.triggerName}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => onSkip(currentTrigger.triggerId)}
            className={cn(
              // 크기
              'flex-1 py-2.5',
              // 배경
              'bg-zinc-800 hover:bg-zinc-700',
              // 보더
              'border border-zinc-600',
              // 라운드
              'rounded-lg',
              // 텍스트
              'text-sm font-medium text-zinc-300',
              // 트랜지션
              'transition-colors'
            )}
          >
            건너뛰기 (N)
          </button>
          <button
            onClick={() => onExecute(currentTrigger.triggerId)}
            className={cn(
              // 크기
              'flex-1 py-2.5',
              // 배경
              'bg-emerald-600 hover:bg-emerald-500',
              // 라운드
              'rounded-lg',
              // 텍스트
              'text-sm font-medium text-white',
              // 트랜지션
              'transition-colors'
            )}
          >
            실행 (Y)
          </button>
        </div>

        {/* 남은 트리거 수 */}
        {triggers.length > 1 && (
          <p className="text-xs text-zinc-500">
            {triggers.length - 1}개의 선택 항목이 더 있습니다
          </p>
        )}
      </div>
    </>
  );
}
