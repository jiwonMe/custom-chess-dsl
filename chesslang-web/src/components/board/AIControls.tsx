'use client';

import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Bot, Brain, Zap, User, ChevronDown } from 'lucide-react';
import type { AIType, AILevel } from 'chesslang/ai';
import type { Color } from '@/types';

interface AIControlsProps {
  enabled: boolean;
  type: AIType;
  level: AILevel;
  color: Color;
  isThinking: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onTypeChange: (type: AIType) => void;
  onLevelChange: (level: AILevel) => void;
  onColorChange: (color: Color) => void;
}

const LEVEL_NAMES: Record<AILevel, string> = {
  1: '쉬움',
  2: '보통',
  3: '어려움',
  4: '매우 어려움',
  5: '최고',
};

export function AIControls({
  enabled,
  type,
  level,
  color,
  isThinking,
  onEnabledChange,
  onTypeChange,
  onLevelChange,
  onColorChange,
}: AIControlsProps) {
  return (
    <div
      className={cn(
        // 컨테이너
        'flex flex-wrap items-center gap-2',
        'p-2 rounded-lg border',
        'bg-muted/30'
      )}
    >
      {/* AI 토글 */}
      <Button
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        onClick={() => onEnabledChange(!enabled)}
        className="gap-1"
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">AI</span>
        <span className="sm:hidden">{enabled ? 'ON' : 'OFF'}</span>
      </Button>

      {enabled && (
        <>
          {/* AI 색상 선택 */}
          <div className="flex items-center border rounded overflow-hidden">
            <button
              onClick={() => onColorChange('White')}
              className={cn(
                'px-2 py-1 text-xs flex items-center gap-1',
                color === 'White'
                  ? 'bg-white text-black border-r'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border-r'
              )}
              title="AI가 백으로 플레이"
            >
              <div className="w-3 h-3 rounded-full bg-white border border-gray-400" />
            </button>
            <button
              onClick={() => onColorChange('Black')}
              className={cn(
                'px-2 py-1 text-xs flex items-center gap-1',
                color === 'Black'
                  ? 'bg-gray-800 text-white'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
              title="AI가 흑으로 플레이"
            >
              <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600" />
            </button>
          </div>

          {/* 난이도 선택 */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="gap-1">
              <Brain className="h-3 w-3" />
              <span className="text-xs">{LEVEL_NAMES[level]}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
            <div
              className={cn(
                // 드롭다운 메뉴
                'absolute top-full left-0 mt-1',
                'bg-popover border rounded-md shadow-md z-50',
                'hidden group-hover:block',
                'min-w-[120px]'
              )}
            >
              {([1, 2, 3, 4, 5] as AILevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => onLevelChange(l)}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-sm',
                    'hover:bg-muted transition-colors',
                    level === l && 'bg-muted font-medium'
                  )}
                >
                  {LEVEL_NAMES[l]}
                </button>
              ))}
            </div>
          </div>

          {/* AI 타입 선택 */}
          <div className="flex items-center border rounded overflow-hidden">
            <button
              onClick={() => onTypeChange('random')}
              className={cn(
                'px-2 py-1 text-xs',
                type === 'random'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
              title="랜덤 AI"
            >
              <Zap className="h-3 w-3" />
            </button>
            <button
              onClick={() => onTypeChange('minimax')}
              className={cn(
                'px-2 py-1 text-xs',
                type === 'minimax'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
              title="Minimax AI"
            >
              <Brain className="h-3 w-3" />
            </button>
          </div>

          {/* 생각 중 표시 */}
          {isThinking && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
              <Bot className="h-4 w-4" />
              <span>생각 중...</span>
            </div>
          )}
        </>
      )}

      {/* 사용자 차례 표시 */}
      {enabled && !isThinking && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <User className="h-3 w-3" />
          <span>당신의 차례</span>
        </div>
      )}
    </div>
  );
}
