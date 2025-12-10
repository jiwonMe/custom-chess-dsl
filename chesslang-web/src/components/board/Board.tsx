'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Square } from './Square';
import { Piece } from './Piece';
import { MoveIndicator } from './MoveIndicator';
import { DragOverlay } from './DragOverlay';
import { PromotionModal } from './PromotionModal';
import { cn } from '@/lib/utils/cn';
import type { Position, Move, Piece as PieceType, Color, Effect } from '@/types';

interface BoardSquare {
  pos: Position;
  piece: PieceType | null;
  effects?: Effect[];
}

interface BoardState {
  board: BoardSquare[][];
  currentPlayer: Color;
  lastMove?: Move;
  effects?: Effect[];  // Game-level effects with positions
}

interface BoardProps {
  state: BoardState;
  legalMoves?: Move[];
  selectedPiece?: PieceType | null;
  gazeTargets?: PieceType[];  // Pieces in gaze line of sight (for highlighting)
  flipped?: boolean;
  interactive?: boolean;
  highlightLastMove?: boolean;
  showCoordinates?: boolean;
  enableZoomPan?: boolean;
  enableKeyboard?: boolean;
  showGazeHighlight?: boolean;  // Whether to show gaze target highlights
  onSquareClick?: (pos: Position) => void;
  onPieceSelect?: (piece: PieceType | null) => void;
  onMove?: (move: Move) => void;
  onPromotion?: (move: Move, pieceType: string) => void;
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
  gazeTargets = [],
  flipped = false,
  interactive = true,
  highlightLastMove = true,
  showCoordinates = true,
  enableZoomPan = true,
  enableKeyboard = true,
  showGazeHighlight = true,
  onSquareClick,
  onPieceSelect,
  onMove,
  onPromotion,
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
  const boardRef = useRef<HTMLDivElement>(null);

  // Space 키 상태 추적
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 드래그 상태
  const [draggedPiece, setDraggedPiece] = useState<PieceType | null>(null);
  const [dragOverPos, setDragOverPos] = useState<Position | null>(null);

  // 키보드 네비게이션 상태
  const [focusedPos, setFocusedPos] = useState<Position | null>(null);

  // 프로모션 모달 상태
  const [promotionMove, setPromotionMove] = useState<Move | null>(null);

  // Legal move targets 계산 (선택된 기물의 이동만)
  const legalTargets = useMemo(() => {
    const targets = new Set<string>();
    if (!selectedPiece) return targets;
    
    for (const move of legalMoves) {
      // 선택된 기물의 이동만 필터링
      if (
        move.from.file === selectedPiece.pos.file &&
        move.from.rank === selectedPiece.pos.rank
      ) {
        targets.add(`${move.to.file},${move.to.rank}`);
      }
    }
    return targets;
  }, [legalMoves, selectedPiece]);

  // 드래그 중인 기물의 합법 이동 위치
  const dragLegalTargets = useMemo(() => {
    if (!draggedPiece) return new Set<string>();
    const targets = new Set<string>();
    for (const move of legalMoves) {
      if (
        move.from.file === draggedPiece.pos.file &&
        move.from.rank === draggedPiece.pos.rank
      ) {
        targets.add(`${move.to.file},${move.to.rank}`);
      }
    }
    return targets;
  }, [draggedPiece, legalMoves]);

  // Gaze target positions (for highlighting enemies in line of sight)
  const gazeTargetPositions = useMemo(() => {
    if (!showGazeHighlight || gazeTargets.length === 0) return new Set<string>();
    const positions = new Set<string>();
    for (const target of gazeTargets) {
      positions.add(`${target.pos.file},${target.pos.rank}`);
    }
    return positions;
  }, [gazeTargets, showGazeHighlight]);

  // Space 키 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Board 포커스 상태
  const [isBoardFocused, setIsBoardFocused] = useState(false);

  // 칸 클릭 핸들러 (먼저 정의해야 handleBoardKeyDown에서 사용 가능)
  const handleSquareClick = useCallback(
    (pos: Position) => {
      if (!interactive || isPanning || isSpacePressed) return;

      onSquareClick?.(pos);

      const square = state.board[pos.rank]?.[pos.file];
      const piece = square?.piece ?? null;

      // 선택된 기물이 있고 합법 이동인 경우
      if (selectedPiece) {
        const move = legalMoves.find(
          (m) =>
            m.from.file === selectedPiece.pos.file &&
            m.from.rank === selectedPiece.pos.rank &&
            m.to.file === pos.file &&
            m.to.rank === pos.rank
        );

        if (move) {
          // 프로모션 체크
          if (isPromotionMove(move, state.board)) {
            setPromotionMove(move);
          } else {
            onMove?.(move);
          }
          return;
        }
      }

      // 자신의 기물 선택
      if (piece && piece.owner === state.currentPlayer) {
        onPieceSelect?.(piece);
        setFocusedPos(pos);
      } else {
        onPieceSelect?.(null);
      }
    },
    [interactive, isPanning, isSpacePressed, state, selectedPiece, legalMoves, onSquareClick, onPieceSelect, onMove]
  );

  // 키보드 네비게이션 핸들러 (Board가 포커스되었을 때만)
  const handleBoardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enableKeyboard || !interactive || !isBoardFocused) return;
      
      // 모달이 열려있으면 무시
      if (promotionMove) return;

      // 포커스가 없으면 중앙에서 시작
      if (!focusedPos && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setFocusedPos({ file: Math.floor(boardWidth / 2), rank: Math.floor(boardHeight / 2) });
        return;
      }

      if (!focusedPos) return;

      let newPos = { ...focusedPos };

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newPos.rank = Math.min(boardHeight - 1, focusedPos.rank + (flipped ? -1 : 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          newPos.rank = Math.max(0, focusedPos.rank + (flipped ? 1 : -1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newPos.file = Math.max(0, focusedPos.file + (flipped ? 1 : -1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          newPos.file = Math.min(boardWidth - 1, focusedPos.file + (flipped ? -1 : 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSquareClick(focusedPos);
          return;
        case 'Escape':
          e.preventDefault();
          setFocusedPos(null);
          onPieceSelect?.(null);
          return;
        default:
          return;
      }

      setFocusedPos(newPos);
    },
    [enableKeyboard, interactive, isBoardFocused, focusedPos, flipped, boardWidth, boardHeight, promotionMove, onPieceSelect, handleSquareClick]
  );

  // 드래그 시작
  const handleDragStart = useCallback(
    (piece: PieceType) => {
      if (!interactive || piece.owner !== state.currentPlayer) return;
      setDraggedPiece(piece);
      onPieceSelect?.(piece);
    },
    [interactive, state.currentPlayer, onPieceSelect]
  );

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
    setDragOverPos(null);
  }, []);

  // 드롭
  const handleDrop = useCallback(
    (pos: Position) => {
      if (!draggedPiece) return;

      const move = legalMoves.find(
        (m) =>
          m.from.file === draggedPiece.pos.file &&
          m.from.rank === draggedPiece.pos.rank &&
          m.to.file === pos.file &&
          m.to.rank === pos.rank
      );

      if (move) {
        if (isPromotionMove(move, state.board)) {
          setPromotionMove(move);
        } else {
          onMove?.(move);
        }
      }

      setDraggedPiece(null);
      setDragOverPos(null);
    },
    [draggedPiece, legalMoves, state.board, onMove]
  );

  // 프로모션 선택
  const handlePromotionSelect = useCallback(
    (pieceType: string) => {
      if (promotionMove) {
        onPromotion?.(promotionMove, pieceType);
        // fallback: onMove도 호출
        if (!onPromotion) {
          onMove?.(promotionMove);
        }
      }
      setPromotionMove(null);
    },
    [promotionMove, onPromotion, onMove]
  );

  // 프로모션 취소
  const handlePromotionCancel = useCallback(() => {
    setPromotionMove(null);
    onPieceSelect?.(null);
  }, [onPieceSelect]);

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
      if (!enableZoomPan) return;
      const shouldPan = e.button === 2 || e.button === 1 || (e.button === 0 && isSpacePressed);

      if (shouldPan) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [enableZoomPan, pan, isSpacePressed]
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

  // 컨텍스트 메뉴 방지
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (enableZoomPan) {
        e.preventDefault();
      }
    },
    [enableZoomPan]
  );

  // 터치 이벤트 지원
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enableZoomPan) return;
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
        lastTouchCenter.current = {
          x: (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2,
          y: (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2,
        };
        setIsPanning(true);
        setPanStart({
          x: lastTouchCenter.current.x - pan.x,
          y: lastTouchCenter.current.y - pan.y,
        });
      }
    },
    [enableZoomPan, pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enableZoomPan) return;
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        e.preventDefault();
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / lastTouchDistance.current;

        setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * scale)));
        lastTouchDistance.current = distance;

        const newCenter = {
          x: (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2,
          y: (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2,
        };
        if (isPanning) {
          setPan({
            x: newCenter.x - panStart.x,
            y: newCenter.y - panStart.y,
          });
        }
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

  const isPanMode = isSpacePressed || isPanning;

  return (
    <div
      className={cn(
        'select-none relative',
        // 포커스 시 외곽선
        enableKeyboard && 'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-lg',
        className
      )}
      tabIndex={enableKeyboard ? 0 : undefined}
      onFocus={() => {
        setIsBoardFocused(true);
        if (enableKeyboard && !focusedPos) {
          setFocusedPos({ file: Math.floor(boardWidth / 2), rank: Math.floor(boardHeight / 2) });
        }
      }}
      onBlur={() => {
        setIsBoardFocused(false);
        setFocusedPos(null);
      }}
      onKeyDown={handleBoardKeyDown}
    >
      {/* Zoom/Pan 컨트롤 */}
      {enableZoomPan && (
        <div className={cn('absolute top-2 right-2 z-10', 'flex flex-col gap-1')}>
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
            className={cn(
              'w-8 h-8',
              'bg-zinc-800/80 hover:bg-zinc-700',
              'rounded border border-zinc-600',
              'text-white text-lg font-bold',
              'transition-colors'
            )}
            title="줌 인"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
            className={cn(
              'w-8 h-8',
              'bg-zinc-800/80 hover:bg-zinc-700',
              'rounded border border-zinc-600',
              'text-white text-lg font-bold',
              'transition-colors'
            )}
            title="줌 아웃"
          >
            −
          </button>
          <button
            onClick={resetView}
            className={cn(
              'w-8 h-8',
              'bg-zinc-800/80 hover:bg-zinc-700',
              'rounded border border-zinc-600',
              'text-white text-xs font-medium',
              'transition-colors'
            )}
            title="뷰 리셋"
          >
            ⟲
          </button>
        </div>
      )}

      {/* 줌 레벨 & 힌트 표시 */}
      {enableZoomPan && (
        <div
          className={cn(
            'absolute bottom-2 right-2 z-10',
            'px-2 py-1',
            'bg-zinc-800/80 rounded',
            'text-xs text-zinc-300',
            'flex flex-col items-end gap-0.5'
          )}
        >
          {zoom !== 1 && <span>{Math.round(zoom * 100)}%</span>}
          {isSpacePressed && <span className="text-emerald-400">패닝 모드</span>}
          {focusedPos && <span className="text-yellow-400">키보드 모드</span>}
        </div>
      )}

      {/* 보드 컨테이너 */}
      <div
        ref={containerRef}
        className={cn('overflow-hidden', isPanMode ? 'cursor-grabbing' : enableZoomPan ? 'cursor-default' : '')}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
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
            ref={boardRef}
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
                const posKey = `${file},${rank}`;

                const isSelected = selectedPiece?.pos.file === file && selectedPiece?.pos.rank === rank;
                const isLegalMove = legalTargets.has(posKey);
                const isLastMoveSquare =
                  highlightLastMove &&
                  state.lastMove &&
                  ((state.lastMove.from.file === file && state.lastMove.from.rank === rank) ||
                    (state.lastMove.to.file === file && state.lastMove.to.rank === rank));
                const isCheck = piece?.type === 'King' && piece?.traits?.has('royal') && false; // TODO: 실제 체크 감지
                const isDragOver = dragOverPos?.file === file && dragOverPos?.rank === rank;
                const isLegalDrop = dragLegalTargets.has(posKey);
                const isFocused = focusedPos?.file === file && focusedPos?.rank === rank;
                const isDragging = draggedPiece?.pos.file === file && draggedPiece?.pos.rank === rank;
                const isGazeTarget = gazeTargetPositions.has(posKey);
                
                // Get effects for this square
                const squareEffects = square?.effects ?? [];
                // Also check game-level effects
                const gameEffects = (state.effects ?? []).filter(
                  (e) => e.position?.file === file && e.position?.rank === rank
                );
                const allEffects = [...squareEffects, ...gameEffects];

                return (
                  <Square
                    key={`${file}-${rank}`}
                    pos={pos}
                    isLight={(file + rank) % 2 === 1}
                    isSelected={isSelected}
                    isLastMove={isLastMoveSquare}
                    isCheck={isCheck}
                    isDragOver={isDragOver}
                    isLegalDrop={isLegalDrop}
                    isFocused={isFocused}
                    isGazeTarget={isGazeTarget}
                    effects={allEffects}
                    onClick={() => handleSquareClick(pos)}
                    onDragEnter={() => setDragOverPos(pos)}
                    onDragLeave={() => {
                      if (dragOverPos?.file === file && dragOverPos?.rank === rank) {
                        setDragOverPos(null);
                      }
                    }}
                    onDrop={() => handleDrop(pos)}
                    showCoordinates={showCoordinates}
                    showRank={file === (flipped ? boardWidth - 1 : 0)}
                    showFile={rank === (flipped ? boardHeight - 1 : 0)}
                  >
                    {piece && (
                      <Piece
                        type={piece.type}
                        color={piece.owner}
                        isDraggable={interactive && piece.owner === state.currentPlayer && !isPanMode}
                        isDragging={isDragging}
                        state={piece.state}
                        showState={true}
                        onDragStart={() => handleDragStart(piece)}
                        onDragEnd={handleDragEnd}
                      />
                    )}
                    {/* 선택된 기물이 있을 때만 이동 가능 칸 표시 */}
                    {selectedPiece && isLegalMove && !isDragOver && (
                      <MoveIndicator isCapture={piece !== null} />
                    )}
                  </Square>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 드래그 오버레이 */}
      {draggedPiece && (
        <DragOverlay type={draggedPiece.type} color={draggedPiece.owner} isVisible={true} />
      )}

      {/* 프로모션 모달 */}
      <PromotionModal
        isOpen={promotionMove !== null}
        color={state.currentPlayer}
        position={promotionMove?.to ?? { file: 0, rank: 0 }}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
}

// 프로모션 이동인지 확인
function isPromotionMove(move: Move, board: BoardSquare[][]): boolean {
  const piece = move.piece;
  if (piece.type !== 'Pawn') return false;

  // 백은 7번 랭크에서 8번으로, 흑은 0번 랭크로
  if (piece.owner === 'White' && move.to.rank === board.length - 1) return true;
  if (piece.owner === 'Black' && move.to.rank === 0) return true;

  return false;
}
