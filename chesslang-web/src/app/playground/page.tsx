'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@/components/editor/Editor';
import { Board } from '@/components/board/Board';
import { Button } from '@/components/ui/button';
import { useEditorStore, EXAMPLE_CATEGORIES, EXAMPLE_NAMES } from '@/stores/editorStore';
import { useGameStore } from '@/stores/gameStore';
import { useEngine } from '@/hooks/useEngine';
import {
  Play,
  RotateCcw,
  Undo2,
  FlipVertical,
  AlertCircle,
  ChevronDown,
  Code2,
  Gamepad2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { OptionalTriggerDialog } from '@/components/board/OptionalTriggerDialog';
import type { Position, Move } from '@/types';

// 모바일 탭 타입
type MobileTab = 'editor' | 'game';

export default function PlaygroundPage() {
  const { code, setCode, errors, showProblems, toggleProblems, loadExample } = useEditorStore();
  const {
    gameState,
    selectedPiece,
    selectPiece,
    legalMoves,
    boardFlipped,
    toggleBoardFlip,
    isGameOver,
    winner,
    gameOverReason,
  } = useGameStore();

  // 모바일 탭 상태
  const [mobileTab, setMobileTab] = useState<MobileTab>('game');

  const { compile, makeMove, reset, undo, executeOptionalTrigger, skipOptionalTrigger, isReady } = useEngine();

  // Pending optional triggers
  const pendingTriggers = gameState?.pendingOptionalTriggers ?? [];

  // Compile on mount
  useEffect(() => {
    if (isReady) {
      compile();
    }
  }, [isReady, compile]);

  // Handle move (from Board component)
  const handleMove = useCallback(
    (move: Move) => {
      if (!gameState || isGameOver) return;
      makeMove(move);
      selectPiece(null);
    },
    [gameState, isGameOver, makeMove, selectPiece]
  );

  // Handle promotion (from Board component)
  const handlePromotion = useCallback(
    (move: Move, pieceType: string) => {
      if (!gameState || isGameOver) return;
      // TODO: 프로모션 타입을 move에 추가하는 로직
      // 현재는 기본 이동만 수행
      makeMove(move);
      selectPiece(null);
    },
    [gameState, isGameOver, makeMove, selectPiece]
  );

  // Run 버튼 클릭 시 모바일에서는 게임 탭으로 전환
  const handleCompile = useCallback(() => {
    compile();
    setMobileTab('game');
  }, [compile]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Toolbar */}
      <div className="border-b px-2 md:px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden border rounded-lg overflow-hidden">
            <button
              onClick={() => setMobileTab('editor')}
              className={cn(
                'px-3 py-1.5 text-sm flex items-center gap-1',
                'transition-colors relative',
                mobileTab === 'editor'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Code2 className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Code</span>
              {/* 에러 인디케이터 */}
              {errors.length > 0 && mobileTab !== 'editor' && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1',
                    'w-4 h-4 text-[10px]',
                    'bg-destructive text-destructive-foreground',
                    'rounded-full flex items-center justify-center',
                    'font-bold'
                  )}
                >
                  {errors.length > 9 ? '!' : errors.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileTab('game')}
              className={cn(
                'px-3 py-1.5 text-sm flex items-center gap-1',
                'transition-colors',
                mobileTab === 'game'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Game</span>
            </button>
          </div>

          {/* Examples dropdown with categories */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Examples
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            {/* 모바일용 축약 버튼 */}
            <Button variant="outline" size="icon" className="flex sm:hidden h-8 w-8">
              <ChevronDown className="h-4 w-4" />
            </Button>
            <div
              className={cn(
                // 포지셔닝
                'absolute top-full left-0 mt-1',
                // 크기
                'w-64',
                // 배경 및 테두리
                'bg-popover border rounded-md shadow-lg',
                // 가시성
                'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                // 트랜지션
                'transition-all',
                // 스택
                'z-50',
                // 스크롤
                'max-h-[70vh] overflow-y-auto'
              )}
            >
              {Object.entries(EXAMPLE_CATEGORIES).map(([category, examples]) => (
                <div key={category}>
                  {/* 카테고리 헤더 */}
                  <div
                    className={cn(
                      'px-3 py-1.5',
                      'text-xs font-semibold text-muted-foreground',
                      'bg-muted/50',
                      'border-b first:rounded-t-md'
                    )}
                  >
                    {category}
                  </div>
                  {/* 예제 목록 */}
                  {examples.map((exId) => (
                    <button
                      key={exId}
                      className={cn(
                        'w-full px-3 py-2',
                        'text-left text-sm',
                        'hover:bg-accent',
                        'transition-colors'
                      )}
                      onClick={() => {
                        loadExample(exId);
                        setMobileTab('game');
                      }}
                    >
                      {EXAMPLE_NAMES[exId] ?? exId}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button onClick={handleCompile} disabled={!isReady} size="sm" className="px-2 md:px-3">
            <Play className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Run</span>
          </Button>
          <Button variant="outline" size="sm" onClick={reset} className="px-2 md:px-3">
            <RotateCcw className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Reset</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={undo} className="h-8 w-8">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleBoardFlip} className="h-8 w-8">
            <FlipVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Editor panel - 데스크탑에서는 항상 표시, 모바일에서는 탭에 따라 */}
        <div
          className={cn(
            // 기본: 전체 너비
            'w-full',
            // 데스크탑: 절반 너비, 항상 표시
            'md:w-1/2 md:block',
            // 모바일: 탭에 따라 표시/숨김
            mobileTab === 'editor' ? 'block' : 'hidden',
            // 보더
            'md:border-r',
            // 플렉스
            'flex flex-col min-h-0'
          )}
        >
          <div className="flex-1 min-h-0">
            <Editor
              value={code}
              onChange={setCode}
              errors={errors}
              className="h-full"
            />
          </div>

          {/* Problems panel */}
          {showProblems && errors.length > 0 && (
            <div className="border-t bg-muted/30 max-h-32 overflow-auto">
              <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 text-destructive" />
                  Problems ({errors.length})
                </span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={toggleProblems}
                >
                  Hide
                </button>
              </div>
              <div className="p-2 space-y-1">
                {errors.map((error, i) => (
                  <div key={i} className="text-sm text-destructive flex items-start gap-2">
                    <span className="text-muted-foreground">
                      Ln {error.line}, Col {error.column}:
                    </span>
                    <span>{error.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game panel - 데스크탑에서는 항상 표시, 모바일에서는 탭에 따라 */}
        <div
          className={cn(
            // 기본: 전체 너비
            'w-full',
            // 데스크탑: 절반 너비, 항상 표시
            'md:w-1/2 md:flex',
            // 모바일: 탭에 따라 표시/숨김
            mobileTab === 'game' ? 'flex' : 'hidden',
            // 패딩 및 정렬
            'p-2 md:p-4 flex-col items-center justify-start md:justify-center',
            // 배경
            'bg-muted/10',
            // 오버플로
            'overflow-y-auto'
          )}
        >
          {gameState ? (
            <>
              {/* Game info */}
              <div className="mb-4 text-center">
                {isGameOver ? (
                  <div className="text-lg font-semibold">
                    {winner ? (
                      <span className={winner === 'White' ? 'text-gray-200' : 'text-gray-800'}>
                        {winner} wins!
                      </span>
                    ) : (
                      <span>Draw</span>
                    )}
                    {gameOverReason && (
                      <span className="text-sm text-muted-foreground ml-2">({gameOverReason})</span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {gameState.currentPlayer} to move
                  </div>
                )}
              </div>

              {/* Board with game over overlay */}
              <div className="relative w-full max-w-md">
                <Board
                  state={{
                    board: gameState.board,
                    currentPlayer: gameState.currentPlayer,
                    lastMove: gameState.moveHistory[gameState.moveHistory.length - 1],
                    effects: gameState.effects,
                  }}
                  legalMoves={legalMoves}
                  selectedPiece={selectedPiece}
                  flipped={boardFlipped}
                  interactive={!isGameOver}
                  enableKeyboard={true}
                  onPieceSelect={selectPiece}
                  onMove={handleMove}
                  onPromotion={handlePromotion}
                  className="w-full"
                />

                {/* Optional Trigger Dialog */}
                {pendingTriggers.length > 0 && (
                  <OptionalTriggerDialog
                    triggers={pendingTriggers}
                    onExecute={executeOptionalTrigger}
                    onSkip={skipOptionalTrigger}
                  />
                )}

                {/* Game Over Overlay */}
                {isGameOver && (
                  <div
                    className={cn(
                      // 포지셔닝
                      'absolute inset-0',
                      // 플렉스
                      'flex flex-col items-center justify-center',
                      // 배경
                      'bg-black/70 backdrop-blur-sm',
                      // 애니메이션
                      'animate-in fade-in duration-300',
                      // 라운드
                      'rounded-lg'
                    )}
                  >
                    {/* 승리/무승부 아이콘 */}
                    <div
                      className={cn(
                        // 크기
                        'text-6xl mb-4',
                        // 애니메이션
                        'animate-in zoom-in duration-500'
                      )}
                    >
                      {winner ? (winner === 'White' ? '♔' : '♚') : '🤝'}
                    </div>

                    {/* 결과 텍스트 */}
                    <div
                      className={cn(
                        // 텍스트
                        'text-3xl font-bold mb-2',
                        // 색상
                        winner === 'White'
                          ? 'text-white'
                          : winner === 'Black'
                          ? 'text-gray-300'
                          : 'text-yellow-400'
                      )}
                    >
                      {winner ? `${winner} Wins!` : 'Draw!'}
                    </div>

                    {/* 승리 이유 */}
                    {gameOverReason && (
                      <div className="text-lg text-gray-400 mb-6 capitalize">
                        by {gameOverReason.replace(/_/g, ' ')}
                      </div>
                    )}

                    {/* 버튼들 */}
                    <div className="flex gap-3">
                      <Button
                        onClick={reset}
                        className={cn(
                          // 배경
                          'bg-emerald-600 hover:bg-emerald-700',
                          // 텍스트
                          'text-white font-semibold',
                          // 패딩
                          'px-6 py-2'
                        )}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Play Again
                      </Button>
                      <Button
                        variant="outline"
                        onClick={undo}
                        className={cn(
                          // 보더
                          'border-gray-500',
                          // 텍스트
                          'text-gray-300 hover:text-white',
                          // 배경
                          'hover:bg-gray-700'
                        )}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />
                        Undo
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Panel - 항상 표시 (레이아웃 안정화) */}
              <div className="mt-4 max-w-md w-full min-h-[120px] flex flex-col gap-3">
                {/* Selected Piece Info */}
                <div className="flex-shrink-0">
                  {selectedPiece ? (
                    <PieceStatePanel piece={selectedPiece} />
                  ) : (
                    <div
                      className={cn(
                        'bg-card/50 border border-dashed border-muted-foreground/30',
                        'rounded-lg p-3',
                        'text-sm text-muted-foreground/50 text-center'
                      )}
                    >
                      기물을 선택하면 정보가 표시됩니다
                    </div>
                  )}
                </div>

                {/* Move history - 항상 표시 */}
                <div className="text-sm text-muted-foreground flex-1">
                  <div className="font-medium mb-1">Moves</div>
                  <div className="flex flex-wrap gap-1 min-h-[24px]">
                    {gameState.moveHistory.length > 0 ? (
                      gameState.moveHistory.map((move, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                          {formatMove(move)}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground/50 text-xs italic">
                        아직 이동 기록이 없습니다
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">
              {isReady ? 'Click "Run" to compile and play' : 'Loading engine...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Get file label (a-z, then aa, ab, ...)
function getFileLabel(file: number): string {
  if (file < 26) {
    return String.fromCharCode(97 + file);
  }
  const first = Math.floor(file / 26) - 1;
  const second = file % 26;
  return String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
}

// Format a move for display
function formatMove(move: Move): string {
  const from = `${getFileLabel(move.from.file)}${move.from.rank + 1}`;
  const to = `${getFileLabel(move.to.file)}${move.to.rank + 1}`;
  const piece = move.piece.type === 'Pawn' ? '' : move.piece.type[0];
  const capture = move.captured ? 'x' : '';
  return `${piece}${from}${capture}${to}`;
}

// Piece State Panel Component
interface PieceStatePanelProps {
  piece: {
    type: string;
    owner: string;
    pos: Position;
    traits?: Set<string>;
    state?: Record<string, unknown>;
  };
}

function PieceStatePanel({ piece }: PieceStatePanelProps) {
  const posLabel = `${getFileLabel(piece.pos.file)}${piece.pos.rank + 1}`;
  const traits = piece.traits ? Array.from(piece.traits) : [];
  const state = piece.state ?? {};
  const stateEntries = Object.entries(state);
  const hasCooldown = typeof state.cooldown === 'number' && state.cooldown > 0;

  return (
    <div
      className={cn(
        // 배경
        'bg-card/80 backdrop-blur-sm',
        // 보더
        'border rounded-lg',
        // 패딩
        'p-3',
        // 그림자
        'shadow-sm'
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            // 크기
            'w-3 h-3 rounded-full',
            // 색상
            piece.owner === 'White' ? 'bg-white border border-gray-400' : 'bg-gray-800'
          )}
        />
        <span className="font-semibold text-sm">{piece.type}</span>
        <span className="text-xs text-muted-foreground">at {posLabel}</span>
        {hasCooldown && (
          <span
            className={cn(
              'ml-auto',
              'px-2 py-0.5',
              'text-xs font-medium',
              'bg-blue-500/20 text-blue-400',
              'rounded-full'
            )}
          >
            ⏱ Cooldown: {String(state.cooldown)}
          </span>
        )}
      </div>

      {/* Traits */}
      {traits.length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-muted-foreground mb-1">Traits</div>
          <div className="flex flex-wrap gap-1">
            {traits.map((trait) => (
              <span
                key={trait}
                className={cn(
                  'px-2 py-0.5',
                  'text-xs',
                  'bg-purple-500/20 text-purple-300',
                  'rounded-full',
                  'border border-purple-500/30'
                )}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* State */}
      {stateEntries.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">State</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {stateEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{key}:</span>
                <span
                  className={cn(
                    'font-mono',
                    // 쿨다운이면 파란색, 그 외는 노란색
                    key === 'cooldown' && typeof value === 'number' && value > 0
                      ? 'text-blue-400'
                      : typeof value === 'boolean'
                      ? value
                        ? 'text-green-400'
                        : 'text-red-400'
                      : 'text-amber-400'
                  )}
                >
                  {formatStateValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상태가 없을 때 */}
      {traits.length === 0 && stateEntries.length === 0 && (
        <div className="text-xs text-muted-foreground italic">No special attributes</div>
      )}
    </div>
  );
}

// Format state value for display
function formatStateValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (value === null || value === undefined) return 'null';
  return String(value);
}
