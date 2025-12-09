'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Square } from './Square';
import { Piece } from './Piece';
import { MoveIndicator } from './MoveIndicator';
import { cn } from '@/lib/utils/cn';
import type { Position, Move, Piece as PieceType, Color } from '@/types';

interface BoardSquare {
  pos: Position;
  piece: PieceType | null;
}

interface BoardState {
  board: BoardSquare[][];
  currentPlayer: Color;
  lastMove?: Move;
}

interface BoardProps {
  state: BoardState;
  legalMoves?: Move[];
  selectedPiece?: PieceType | null;
  flipped?: boolean;
  interactive?: boolean;
  highlightLastMove?: boolean;
  showCoordinates?: boolean;
  enableZoomPan?: boolean;
  onSquareClick?: (pos: Position) => void;
  onPieceSelect?: (piece: PieceType | null) => void;
  className?: string;
}

// Zoom/Pan 제한
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.001;

export function Board({
  state,
  legalMoves = [],
  selectedPiece = null,
  flipped = false,
  interactive = true,
  highlightLastMove = true,
  showCoordinates = true,
  enableZoomPan = true,
  onSquareClick,
  onPieceSelect,
  className,
}: BoardProps) {
  // 직사각형 보드 지원
  const boardHeight = state.board.length;
  const boardWidth = state.board[0]?.length ?? boardHeight;

  // Zoom/Pan 상태
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate legal move targets
  const legalTargets = useMemo(() => {
    const targets = new Set<string>();
    for (const move of legalMoves) {
      targets.add(`${move.to.file},${move.to.rank}`);
    }
    return targets;
  }, [legalMoves]);

  const handleSquareClick = useCallback(
    (pos: Position) => {
      if (!interactive || isPanning) return;

      onSquareClick?.(pos);

      const square = state.board[pos.rank]?.[pos.file];
      const piece = square?.piece ?? null;

      if (piece && piece.owner === state.currentPlayer) {
        onPieceSelect?.(piece);
      } else if (selectedPiece) {
        const isLegal = legalTargets.has(`${pos.file},${pos.rank}`);
        if (!isLegal) {
          onPieceSelect?.(null);
        }
      }
    },
    [interactive, isPanning, state, selectedPiece, legalTargets, onSquareClick, onPieceSelect]
  );

  // 휠 줌 핸들러
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enableZoomPan) return;
      e.preventDefault();

      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta * prev)));
    },
    [enableZoomPan]
  );

  // 마우스 다운 (패닝 시작)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enableZoomPan || e.button !== 1) return; // 휠 클릭만
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [enableZoomPan, pan]
  );

  // 마우스 이동 (패닝)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    },
    [isPanning, panStart]
  );

  // 마우스 업 (패닝 종료)
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // 터치 이벤트 지원
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enableZoomPan) return;

      if (e.touches.length === 2) {
        // 핀치 줌 시작
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
        lastTouchCenter.current = {
          x: (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2,
          y: (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2,
        };
      } else if (e.touches.length === 1) {
        // 패닝 시작
        setIsPanning(true);
        setPanStart({
          x: e.touches[0]!.clientX - pan.x,
          y: e.touches[0]!.clientY - pan.y,
        });
      }
    },
    [enableZoomPan, pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enableZoomPan) return;

      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        // 핀치 줌
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / lastTouchDistance.current;

        setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * scale)));
        lastTouchDistance.current = distance;
      } else if (e.touches.length === 1 && isPanning) {
        // 패닝
        setPan({
          x: e.touches[0]!.clientX - panStart.x,
          y: e.touches[0]!.clientY - panStart.y,
        });
      }
    },
    [enableZoomPan, isPanning, panStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  }, []);

  // 줌/패닝 리셋
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Determine ranks/files order based on flip
  const ranks = flipped
    ? Array.from({ length: boardHeight }, (_, i) => i)
    : Array.from({ length: boardHeight }, (_, i) => boardHeight - 1 - i);
  const files = flipped
    ? Array.from({ length: boardWidth }, (_, i) => boardWidth - 1 - i)
    : Array.from({ length: boardWidth }, (_, i) => i);

  const isKingInCheck = (piece: PieceType | null, color: Color) => {
    return false;
  };

  return (
    <div className={cn('select-none relative', className)}>
      {/* Zoom/Pan 컨트롤 */}
      {enableZoomPan && (
        <div
          className={cn(
            // 포지셔닝
            'absolute top-2 right-2 z-10',
            // 레이아웃
            'flex flex-col gap-1'
          )}
        >
          {/* 줌 인 */}
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
            className={cn(
              // 크기
              'w-8 h-8',
              // 배경
              'bg-zinc-800/80 hover:bg-zinc-700',
              // 테두리
              'rounded border border-zinc-600',
              // 텍스트
              'text-white text-lg font-bold',
              // 트랜지션
              'transition-colors'
            )}
          >
            +
          </button>

          {/* 줌 아웃 */}
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
            className={cn(
              'w-8 h-8',
              'bg-zinc-800/80 hover:bg-zinc-700',
              'rounded border border-zinc-600',
              'text-white text-lg font-bold',
              'transition-colors'
            )}
          >
            −
          </button>

          {/* 리셋 */}
          <button
            onClick={resetView}
            className={cn(
              'w-8 h-8',
              'bg-zinc-800/80 hover:bg-zinc-700',
              'rounded border border-zinc-600',
              'text-white text-xs font-medium',
              'transition-colors'
            )}
          >
            ⟲
          </button>
        </div>
      )}

      {/* 줌 레벨 표시 */}
      {enableZoomPan && zoom !== 1 && (
        <div
          className={cn(
            'absolute bottom-2 right-2 z-10',
            'px-2 py-1',
            'bg-zinc-800/80 rounded',
            'text-xs text-zinc-300'
          )}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}

      {/* 보드 컨테이너 */}
      <div
        ref={containerRef}
        className={cn(
          // 오버플로우
          'overflow-hidden',
          // 커서
          isPanning && 'cursor-grabbing',
          enableZoomPan && !isPanning && 'cursor-grab'
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            className="grid gap-0 border-2 border-gray-800 rounded shadow-lg"
            style={{
              gridTemplateColumns: `repeat(${boardWidth}, 1fr)`,
              aspectRatio: `${boardWidth} / ${boardHeight}`,
            }}
          >
            {ranks.map((rank) =>
              files.map((file) => {
                const pos = { file, rank };
                const square = state.board[rank]?.[file];
                const piece = square?.piece ?? null;

                const isSelected =
                  selectedPiece?.pos.file === file && selectedPiece?.pos.rank === rank;
                const isLegalMove = legalTargets.has(`${file},${rank}`);
                const isLastMoveSquare =
                  highlightLastMove &&
                  state.lastMove &&
                  ((state.lastMove.from.file === file && state.lastMove.from.rank === rank) ||
                    (state.lastMove.to.file === file && state.lastMove.to.rank === rank));
                const isCheck =
                  piece?.type === 'King' &&
                  piece?.owner === state.currentPlayer &&
                  isKingInCheck(piece, state.currentPlayer);

                return (
                  <Square
                    key={`${file}-${rank}`}
                    pos={pos}
                    isLight={(file + rank) % 2 === 1}
                    isSelected={isSelected}
                    isLastMove={isLastMoveSquare}
                    isCheck={isCheck}
                    onClick={() => handleSquareClick(pos)}
                    showCoordinates={showCoordinates}
                    showRank={file === (flipped ? boardWidth - 1 : 0)}
                    showFile={rank === (flipped ? boardHeight - 1 : 0)}
                  >
                    {piece && (
                      <Piece
                        type={piece.type}
                        color={piece.owner}
                        isDraggable={interactive && piece.owner === state.currentPlayer}
                      />
                    )}
                    {isLegalMove && <MoveIndicator isCapture={piece !== null} />}
                  </Square>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
