import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorError {
  line: number;
  column: number;
  message: string;
}

interface EditorState {
  // Code
  code: string;
  setCode: (code: string) => void;

  // Errors
  errors: EditorError[];
  setErrors: (errors: EditorError[]) => void;

  // Compilation state
  isCompiling: boolean;
  setIsCompiling: (isCompiling: boolean) => void;

  // UI state
  showProblems: boolean;
  toggleProblems: () => void;

  // Examples
  loadExample: (example: string) => void;
}

const DEFAULT_CODE = `# ===================================
# King of the Hill (언덕의 왕)
# ===================================
# ChessLang에 오신 것을 환영합니다!
# 이것은 "언덕의 왕" 변형 체스의 간단한 예제입니다.
#
# 게임 목표:
# - 일반 체스처럼 체크메이트로 승리하거나
# - 보드 중앙의 "언덕"에 킹을 올려 승리할 수 있습니다
#
# 주요 문법 설명:
# - game: 게임의 이름을 정의합니다
# - extends: 기본 체스 규칙을 상속받습니다
# - board.zones: 특별한 영역을 정의합니다
# - victory.add: 새로운 승리 조건을 추가합니다

game: "King of the Hill"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    # d4, d5, e4, e5 - 보드 중앙 4칸을 "hill"(언덕) 영역으로 지정
    hill: [d4, d5, e4, e5]

# 승리 조건 (OR 로직으로 결합):
# - 체크메이트 (기본 규칙)
# - 킹이 hill 영역에 도달
victory:
  add:
    hill: King in zone.hill

# 코드를 수정하고 "Run" 버튼을 클릭해 플레이해보세요!
`;

export const EXAMPLES: Record<string, string> = {
  // ========================================
  // Level 1: Configure - Basic Variants
  // ========================================
  
  koth: DEFAULT_CODE,
  
  'three-check': `# ===================================
# Three-Check Chess (쓰리 체크 체스)
# ===================================
# 상대방에게 체크를 3번 주면 승리!
#
# 게임 규칙:
# - 일반 체스 규칙을 따릅니다
# - 체크를 3번 주면 체크메이트 없이도 승리
# - 체크메이트도 여전히 유효한 승리 조건
#
# 전략 팁:
# - 공격적인 플레이가 유리합니다
# - 킹을 노출시키면 빠르게 3체크 당할 수 있습니다

game: "Three-Check"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    # 중앙 영역 정의 (추가 규칙용)
    center: [d4, d5, e4, e5]
`,

  'racing-kings': `# ===================================
# Racing Kings (레이싱 킹)
# ===================================
# 킹을 가장 먼저 8번째 랭크(줄)에 도달시키면 승리!
#
# 특별 규칙:
# - 체크를 줄 수 없습니다
# - 폰이 없습니다
# - 모든 기물이 1-2번째 줄에서 시작합니다
#
# 전략 팁:
# - 킹을 빠르게 전진시키세요
# - 상대 킹의 경로를 차단하세요
# - 기물로 킹을 호위하며 전진하세요

game: "Racing Kings"
extends: "Standard Chess"

board:
  size: 8x8

# setup.add: 기존 배치에 기물 추가
# 이 예제는 빈 보드에 새로운 배치를 정의합니다
setup:
  add:
    # 백 기물 (왼쪽에 배치)
    White King: [a1]
    White Queen: [a2]
    White Rook: [b1, b2]
    White Bishop: [c1, c2]
    White Knight: [d1, d2]
    # 흑 기물 (오른쪽에 배치)
    Black King: [h1]
    Black Queen: [h2]
    Black Rook: [g1, g2]
    Black Bishop: [f1, f2]
    Black Knight: [e1, e2]

# 승리 조건: 킹이 8번째 줄에 도달
victory:
  add:
    racing: King on rank 8
`,

  'horde-chess': `# ===================================
# Horde Chess (호드 체스)
# ===================================
# 백: 폰 대군단 vs 흑: 일반 체스 기물
#
# 승리 조건:
# - 백: 흑 킹을 체크메이트
# - 흑: 모든 백 폰을 제거
#
# 특징:
# - 백은 36개의 폰으로 시작 (4줄 + 추가 2개)
# - 흑은 킹이 있는 일반 체스 배치
# - 비대칭적인 게임 플레이
#
# 전략 팁:
# - 백: 폰 웨이브로 압박하세요
# - 흑: 폰을 효율적으로 제거하세요

game: "Horde Chess"
extends: "Standard Chess"

setup:
  add:
    # 백 폰 대군단: 1-4줄 전체 + f5, g5
    White Pawn: [a1, b1, c1, d1, e1, f1, g1, h1, a2, b2, c2, d2, e2, f2, g2, h2, a3, b3, c3, d3, e3, f3, g3, h3, a4, b4, c4, d4, e4, f4, g4, h4, f5, g5]
    # 흑 일반 배치
    Black King: [e8]
    Black Queen: [d8]
    Black Rook: [a8, h8]
    Black Bishop: [c8, f8]
    Black Knight: [b8, g8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  // ========================================
  // Level 2: Compose - Custom Pieces
  // ========================================

  atomic: `# ===================================
# Atomic Chess (원자 체스)
# ===================================
# 기물을 잡으면 폭발이 일어납니다!
#
# 특별 규칙:
# - 기물을 잡으면 인접한 모든 기물이 폭발로 제거됩니다
# - 단, 폰(Pawn)은 폭발에서 살아남습니다
# - 상대 킹이 폭발로 제거되면 승리!
#
# 전략 팁:
# - 자신의 킹 주변에서 잡기를 피하세요
# - 상대 킹 주변에서 전략적으로 폭발시키세요
# - 폰은 폭발에서 살아남으므로 방패로 사용하세요
#
# 문법 설명:
# - trigger: 이벤트 발생 시 실행되는 동작 정의
# - on: capture: 기물을 잡을 때 발동
# - radius(1): 반경 1칸 (인접한 8칸)
# - where not Pawn: 폰은 제외하고 제거

game: "Atomic Chess"
extends: "Standard Chess"

# 폭발 트리거: 기물을 잡으면 주변 기물 모두 제거 (폰 제외)
trigger atomic_explosion {
  on: capture
  do: {
    remove pieces in radius(1) from destination where not Pawn
  }
}
`,

  custom: `# ===================================
# Amazon Chess (아마존 체스)
# ===================================
# 아마존: 퀸 + 나이트의 이동을 결합한 최강의 기물!
#
# 아마존 이동 방식:
# - 퀸처럼 직선/대각선으로 슬라이드
# - 나이트처럼 L자 점프 (다른 기물 뛰어넘기 가능)
#
# 문법 설명:
# - piece: 새로운 기물 타입 정의
# - move: 이동 패턴 (| 연산자로 여러 패턴 결합)
# - slide(orthogonal): 직선으로 무제한 이동
# - slide(diagonal): 대각선으로 무제한 이동
# - leap(2, 1): 나이트 점프 (2칸+1칸 L자)
# - capture: =move: 이동과 동일한 방식으로 잡기
# - traits: [jump]: 점프 특성 (다른 기물 뛰어넘기)
# - value: 기물의 점수 가치
# - setup.replace: 기존 기물을 새 기물로 대체

game: "Amazon Chess"
extends: "Standard Chess"

piece Amazon {
  move: slide(orthogonal) | slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
  value: 12
  symbol: "A"
}

# 퀸을 아마존으로 대체
setup:
  replace:
    Queen: Amazon
`,

  'cannon-chess': `# ===================================
# Cannon Chess (포 체스)
# ===================================
# 중국 장기(샹치)에서 영감을 받은 변형
# 포(砲)는 특별한 잡기 방식을 가집니다!
#
# 포의 이동 규칙:
# - 이동: 룩처럼 직선으로 슬라이드
# - 잡기: 정확히 1개의 기물을 뛰어넘어야 잡을 수 있음
#   (뛰어넘는 기물은 아군/적군 상관없음)
#
# 문법 설명:
# - slide(orthogonal): 직선(상하좌우)으로 무제한 이동
# - hop(orthogonal): 직선 방향으로 1개 기물을 뛰어넘어 잡기
#
# 전략 팁:
# - 포는 "발판"이 되는 기물이 필요합니다
# - 게임 후반 기물이 줄어들면 포의 위력이 감소합니다

game: "Cannon Chess"
extends: "Standard Chess"

piece Cannon {
  move: slide(orthogonal)
  capture: hop(orthogonal)
  value: 4
  symbol: "C"
}

# 비숍을 포로 대체
setup:
  replace:
    Bishop: Cannon
`,

  'fairy-pieces': `# ===================================
# Fairy Chess (페어리 체스)
# ===================================
# 다양한 이국적인 점프형 기물들의 컬렉션
#
# 포함된 기물들:
# - 나이트라이더: 나이트 점프를 연속으로 수행
# - 낙타(Camel): (3,1) 점프 - 나이트보다 멀리
# - 얼룩말(Zebra): (3,2) 점프 - 대각선 나이트
#
# leap(dx, dy) 문법:
# - leap(2, 1): 나이트 점프 (2칸+1칸 L자)
# - leap(3, 1): 낙타 점프 (3칸+1칸)
# - leap(3, 2): 얼룩말 점프 (3칸+2칸)
# - 모든 leap은 다른 기물을 뛰어넘습니다

game: "Fairy Chess"
extends: "Standard Chess"

# 나이트라이더: 나이트 점프를 한 방향으로 반복
piece Nightrider {
  move: leap(2, 1)
  capture: =move
  traits: [jump]
  value: 4
  symbol: "N"
}

# 낙타: (3,1) 점프 - 나이트보다 긴 L자
piece Camel {
  move: leap(3, 1)
  capture: =move
  traits: [jump]
  value: 2
  symbol: "M"
}

# 얼룩말: (3,2) 점프 - 대각선 방향의 나이트
piece Zebra {
  move: leap(3, 2)
  capture: =move
  traits: [jump]
  value: 2
  symbol: "Z"
}

setup:
  add:
    # 백 기물 배치
    White Nightrider: [b1, g1]
    White Camel: [c1]
    White Zebra: [f1]
    White Rook: [a1, h1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    # 흑 기물 배치
    Black Nightrider: [b8, g8]
    Black Camel: [c8]
    Black Zebra: [f8]
    Black Rook: [a8, h8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'berserk-chess': `# ===================================
# Berserk Chess (광전사 체스)
# ===================================
# 광전사는 킹 + 나이트의 이동을 결합합니다!
#
# 광전사 특징:
# - step(any): 모든 방향으로 1칸 이동 (킹처럼)
# - leap(2, 1): L자 점프 (나이트처럼)
# - 기물을 잡을 때마다 "분노(rage)" 축적
#
# state(상태) 시스템:
# - 기물이 내부 상태를 가질 수 있습니다
# - 트리거로 상태를 변경할 수 있습니다
# - 예: { rage: 0 } -> 잡을 때마다 +1
#
# 문법 설명:
# - state: { rage: 0 }: 초기 상태 정의
# - trigger: 이벤트 기반 동작
# - when: 조건 (piece.type == Berserker)
# - do: set piece.state.rage = ...: 상태 변경

game: "Berserk Chess"
extends: "Standard Chess"

piece Berserker {
  move: step(any) | leap(2, 1)
  capture: =move
  traits: [jump]
  state: { rage: 0 }
  value: 5
  symbol: "B"
}

# 광전사가 기물을 잡으면 분노 축적
trigger gain_rage {
  on: capture
  when: piece.type == Berserker
  do: set piece.state.rage = piece.state.rage + 1
}

# 나이트를 광전사로 대체
setup:
  replace:
    Knight: Berserker
`,

  // ========================================
  // Level 2: Compose - Advanced Pieces
  // ========================================

  'gryphon': `# ===================================
# Gryphon Chess (그리폰 체스)
# ===================================
# 그리폰: 독특한 복합 이동 패턴을 가진 기물
#
# 그리폰 이동 방식:
# 1. 먼저 대각선으로 1칸 이동 (step)
# 2. 그 후 직선으로 무제한 이동 (slide)
# 
# 복합 이동 문법:
# - pattern1 + pattern2: 순차적 이동
#   (먼저 pattern1, 그 다음 pattern2)
# - pattern1 | pattern2: 선택적 이동
#   (pattern1 또는 pattern2 중 하나)
#
# 전략 팁:
# - L자 형태로 이동 후 긴 직선 공격 가능
# - 퀸보다 예측하기 어려운 이동 경로

game: "Gryphon Chess"
extends: "Standard Chess"

piece Gryphon {
  # 대각선 1칸 + 직선 슬라이드
  move: step(diagonal) + slide(orthogonal)
  capture: =move
  value: 7
  symbol: "G"
}

# 퀸을 그리폰으로 대체
setup:
  replace:
    Queen: Gryphon
`,

  'superpawn': `# ===================================
# Super Pawn Chess (슈퍼 폰 체스)
# ===================================
# 강화된 이동 능력을 가진 폰!
#
# 슈퍼 폰 이동 방식:
# - 앞으로 1칸 이동 (일반 폰과 동일)
# - 대각선으로도 1칸 이동 가능! (빈 칸일 때)
# - 잡기는 대각선 (적이 있을 때)
#
# 조건부 이동 문법:
# - where empty: 해당 칸이 비어있을 때만
# - where enemy: 해당 칸에 적이 있을 때만
# - where friend: 해당 칸에 아군이 있을 때만
#
# traits: [promote]
# - 프로모션 가능 (마지막 줄 도달 시)
#
# 전략 팁:
# - 대각선 이동으로 더 유연한 전진 가능
# - 일반 폰보다 빠르게 승격 가능

game: "Super Pawn Chess"
extends: "Standard Chess"

piece SuperPawn {
  # 앞으로 또는 대각선으로 이동 (빈 칸)
  move: step(forward) | step(diagonal) where empty
  # 대각선으로 잡기 (적 기물)
  capture: step(diagonal) where enemy
  traits: [promote]
  value: 2
  symbol: "S"
}

# 모든 폰을 슈퍼 폰으로 대체
setup:
  replace:
    Pawn: SuperPawn
`,

  'dragon': `# ===================================
# Dragon Chess (드래곤 체스)
# ===================================
# 드래곤: 퀸의 슬라이드 + 긴 점프를 가진 최강 기물!
#
# 드래곤 이동 방식:
# - slide(any): 모든 방향으로 무제한 슬라이드
# - leap(3, 0): 직선으로 3칸 점프 (기물 뛰어넘기)
#
# 이동 패턴 설명:
# - slide(any) = slide(orthogonal) | slide(diagonal)
# - leap(3, 0): 3칸 직선 점프 (상하좌우 방향)
#
# 전략 팁:
# - 퀸보다 강력한 이동 범위
# - 점프로 방어선 돌파 가능
# - value: 10 (퀸의 9보다 높음)

game: "Dragon Chess"
extends: "Standard Chess"

piece Dragon {
  # 모든 방향 슬라이드 + 3칸 직선 점프
  move: slide(any) | leap(3, 0)
  capture: =move
  traits: [jump]
  value: 10
  symbol: "D"
}

# 드래곤을 d1/d8에 배치 (퀸 위치)
setup:
  add:
    White Dragon: [d1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Bishop: [c1, f1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Dragon: [d8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Bishop: [c8, f8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  // ========================================
  // Level 2: Compose - Effects & Triggers
  // ========================================

  'trapper': `# ===================================
# Trapper Chess (덫 설치자 체스)
# ===================================
# 트래퍼: 이동하면 이전 위치에 덫을 설치!
#
# 트래퍼 특징:
# - 모든 방향으로 1칸 이동
# - 이동 후 원래 위치에 덫 설치
# - 최대 3개의 덫 설치 가능
#
# effect 시스템:
# - 보드의 특정 칸에 효과를 부여
# - blocks: enemy - 적의 이동 차단
# - visual: "color" - 시각적 표시 (문자열)
#
# trigger 복합 액션:
# - do: { action1; action2 } - 여러 액션 순차 실행
# - mark origin with trap: 출발 위치에 trap 효과 부여
# - set piece.state.traps += 1: 설치 카운트 증가
#
# 선택적 트리거:
# - optional: true - 사용자가 실행 여부 선택 가능
# - description: "..." - 선택 다이얼로그에 표시할 메시지
#
# 전략 팁:
# - 주요 통로에 덫을 설치하세요
# - 적이 덫을 피해 움직이도록 유도하세요

game: "Trapper Chess"
extends: "Standard Chess"

piece Trapper {
  move: step(any)
  capture: =move
  state: { traps: 0 }
  value: 3
  symbol: "T"
}

# 덫 효과 정의
effect trap {
  blocks: enemy
  visual: "red"
}

# 이동 시 덫 설치 (최대 3개, 선택적)
trigger place_trap {
  on: move
  when: piece.type == Trapper and piece.state.traps < 3
  optional: true
  description: "덫을 설치하시겠습니까?"
  do: {
    mark origin with trap
    set piece.state.traps = piece.state.traps + 1
  }
}

setup:
  add:
    White Trapper: [d1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Bishop: [c1, f1]
    White Queen: [e1]
    White King: [f1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Trapper: [d8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Bishop: [c8, f8]
    Black Queen: [e8]
    Black King: [f8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'phoenix': `# ===================================
# Phoenix Chess (불사조 체스)
# ===================================
# 불사조: 잡혀도 부활할 수 있는 기물!
#
# 불사조 특징:
# - 대각선으로 무제한 슬라이드 (비숍처럼)
# - 처음 잡힐 때 시작 위치에서 부활
# - 두 번째 잡히면 완전히 제거됨
#
# 부활 메커니즘:
# - state: { canResurrect: true } - 부활 가능 상태
# - captured.type == Phoenix - 잡힌 기물이 불사조인지 확인
# - captured.state.canResurrect - 부활 가능 여부 확인
# - create Phoenix at origin - 잡힌 위치에 새 불사조 생성 (소유자는 현재 플레이어)
# - set captured.state.canResurrect = false - 부활 불가로 변경
#
# 전략 팁:
# - 불사조를 먼저 잡아 부활권을 소모시키세요
# - 불사조는 공격적으로 사용해도 안전합니다

game: "Phoenix Chess"
extends: "Standard Chess"

piece Phoenix {
  move: slide(diagonal)
  capture: =move
  state: { canResurrect: true }
  value: 4
  symbol: "P"
}

# 불사조 부활 트리거
trigger phoenix_rebirth {
  on: capture
  when: captured.type == Phoenix and captured.state.canResurrect
  do: {
    create Phoenix at origin
    set captured.state.canResurrect = false
  }
}

# 비숍을 불사조로 대체
setup:
  replace:
    Bishop: Phoenix
`,

  'bomber': `# ===================================
# Bomber Chess (폭탄병 체스)
# ===================================
# 폭탄병: 잡히면 폭발하여 주변을 파괴!
#
# 폭탄병 특징:
# - 모든 방향으로 1칸 이동/잡기
# - 잡히면 반경 1칸 내 모든 기물 제거
# - 잡은 기물도 함께 폭발로 제거됨!
#
# captured vs piece:
# - piece: 행동을 수행하는 기물
# - captured: 잡힌(희생된) 기물
# - when: captured.type == Bomber - 폭탄병이 잡혔을 때
#
# radius(N) 문법:
# - target 위치 기준 반경 N칸
# - radius(1): 인접 8칸 + 중앙 = 총 9칸
#
# 전략 팁:
# - 폭탄병을 적 기물 밀집 지역으로 유인하세요
# - 킹 근처에서 폭발하면 게임 오버!

game: "Bomber Chess"
extends: "Standard Chess"

piece Bomber {
  move: step(any)
  capture: =move
  value: 2
  symbol: "X"
}

# 폭탄병이 잡히면 주변 기물 모두 제거
trigger bomber_explosion {
  on: capture
  when: captured.type == Bomber
  do: {
    remove pieces in radius(1) from target
  }
}

setup:
  add:
    # 비숍 위치(c1, f1)에 폭탄병 배치
    White Bomber: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Bomber: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  // ========================================
  // Level 2: Advanced Custom Pieces
  // ========================================

  'vampire': `# ===================================
# Vampire Chess (뱀파이어 체스)
# ===================================
# 뱀파이어: 강화된 이동과 흡혈 능력을 가진 기물
#
# 뱀파이어 이동 방식:
# - step(any): 모든 방향 1칸 (킹처럼)
# - leap(2, 0): 직선으로 2칸 점프 (상하좌우)
#
# 뱀파이어 특성:
# - traits: [jump, predator]
#   - jump: 다른 기물 뛰어넘기 가능
#   - predator: 포식자 (커스텀 특성)
# - state: { thralls: 0 }
#   - thralls: 잡은 기물 수 (하수인 수)
#
# 흡혈 메커니즘:
# - 기물을 잡을 때마다 thralls +1
# - 이를 활용해 추가 능력 구현 가능
#
# 전략 팁:
# - 직선 점프로 빠른 포지셔닝
# - 공격적으로 기물을 잡아 thralls 축적

game: "Vampire Chess"
extends: "Standard Chess"

piece Vampire {
  # 1칸 이동 + 2칸 직선 점프
  move: step(any) | leap(2, 0)
  capture: =move
  traits: [jump, predator]
  state: { thralls: 0 }
}

# 기물을 잡으면 thralls(하수인) 증가
trigger vampire_feed {
  on: capture
  when: piece.type == Vampire
  do: set piece.state.thralls = piece.state.thralls + 1
}

# 퀸을 뱀파이어로 대체
setup:
  replace:
    Queen: Vampire
`,

  'shapeshifter': `# ===================================
# Shapeshifter Chess (변신술사 체스)
# ===================================
# 변신술사: 잡은 기물 수를 추적하는 진화형 기물
#
# 변신술사 특징:
# - 나이트처럼 L자 점프 이동
# - 기물을 잡을 때마다 captureCount 증가
# - 향후 captureCount에 따라 능력 변화 구현 가능
#
# traits 설명:
# - [jump]: 다른 기물 위로 점프 가능
# - [morph]: 변신 특성 (커스텀)
#
# 진화 시스템 아이디어:
# - captureCount 1: 비숍 이동 추가
# - captureCount 2: 룩 이동 추가
# - captureCount 3: 퀸처럼 이동
# (현재는 카운트만 추적)

game: "Shapeshifter Chess"
extends: "Standard Chess"

piece Shapeshifter {
  move: leap(2, 1)
  capture: =move
  traits: [jump, morph]
  state: { captureCount: 0 }
}

# 잡을 때마다 진화 포인트 축적
trigger shapeshifter_evolve {
  on: capture
  when: piece.type == Shapeshifter
  do: set piece.state.captureCount = piece.state.captureCount + 1
}

# 나이트를 변신술사로 대체
setup:
  replace:
    Knight: Shapeshifter
`,

  'guardian': `# ===================================
# Guardian Chess (수호자 체스)
# ===================================
# 수호자: 아군을 보호하는 방어형 기물
#
# 수호자 특징:
# - 모든 방향 1칸 이동/잡기
# - 3개의 방패(shields) 보유
# - 기물을 잡을 때마다 방패 소모
#
# 방패 시스템:
# - state: { shields: 3 } - 초기 방패 3개
# - 잡기 행동 시 방패 -1
# - 방패가 0이 되면 일반 기물처럼 동작
#
# setup.add 문법:
# - 기존 체스 배치에 추가로 기물 배치
# - 기존 기물은 그대로 유지됨
#
# 전략 팁:
# - 킹 근처에서 방어 역할
# - 방패 소모를 신중히 관리하세요

game: "Guardian Chess"
extends: "Standard Chess"

piece Guardian {
  move: step(any)
  capture: =move
  traits: [protector]
  state: { shields: 3 }
}

# 잡기 행동 시 방패 소모
trigger guardian_defend {
  on: capture
  when: piece.type == Guardian
  do: set piece.state.shields = piece.state.shields - 1
}

# 2번 줄에 수호자 추가 (기존 배치 유지)
setup:
  add:
    White Guardian: [d2, e2]
    Black Guardian: [d7, e7]
`,

  'lancer': `# ===================================
# Lancer Chess (창기병 체스)
# ===================================
# 창기병: 돌격 능력과 피로 시스템을 가진 기물
#
# 이동과 잡기 분리:
# - move: step(orthogonal) - 직선 1칸 이동
# - capture: slide(forward) - 앞으로 돌격하며 잡기
# (이동과 잡기 패턴이 다른 예시)
#
# 피로 시스템:
# - state: { exhausted: false } - 피로 상태
# - 잡기 후 exhausted = true (피로)
# - 턴 시작 시 exhausted = false (회복)
#
# 트리거 이벤트:
# - on: capture - 기물을 잡을 때
# - on: turn_start - 턴 시작할 때
#
# 전략 팁:
# - 긴 돌격 거리로 의외의 공격 가능
# - 돌격 후 회복 턴 동안 취약해짐

game: "Lancer Chess"
extends: "Standard Chess"

piece Lancer {
  # 이동: 직선 1칸
  move: step(orthogonal)
  # 잡기: 앞으로 무제한 돌격
  capture: slide(forward)
  traits: [charge]
  state: { exhausted: false }
}

# 잡기 후 피로
trigger lancer_tire {
  on: capture
  when: piece.type == Lancer
  do: set piece.state.exhausted = true
}

# 턴 시작 시 피로 회복
trigger lancer_rest {
  on: turn_start
  when: piece.type == Lancer
  do: set piece.state.exhausted = false
}

# 비숍을 창기병으로 대체
setup:
  replace:
    Bishop: Lancer
`,

  'necromancer': `# ===================================
# Necromancer Chess (강령술사 체스)
# ===================================
# 강령술사: 영혼을 수집하고 좀비를 소환하는 마법사
#
# 강령술사 특징:
# - 대각선 1칸 이동/잡기 (비숍 축소판)
# - 잡을 때마다 영혼(souls) 수집
# - 영혼으로 좀비 소환 가능 (개념적)
#
# 좀비 특징:
# - 앞으로 1칸 또는 직선 1칸 이동
# - 모든 방향 1칸 잡기
# - 느리지만 유용한 하급 유닛
#
# 다중 기물 정의:
# - 한 게임에 여러 piece 정의 가능
# - 각 기물은 독립적인 이동/잡기 패턴
#
# 소환 시스템 아이디어:
# - souls가 3이면 좀비 소환 가능
# - (현재는 영혼 수집만 구현)

game: "Necromancer Chess"
extends: "Standard Chess"

piece Necromancer {
  move: step(diagonal)
  capture: =move
  traits: [dark, summoner]
  state: { souls: 0 }
}

# 소환 가능한 좀비 정의
piece Zombie {
  # 앞으로 또는 직선으로 이동
  move: step(forward) | step(orthogonal)
  # 모든 방향으로 잡기
  capture: step(any)
  traits: [undead, slow]
}

# 잡을 때마다 영혼 수집
trigger collect_soul {
  on: capture
  when: piece.type == Necromancer
  do: set piece.state.souls = piece.state.souls + 1
}

# 비숍 위치에 강령술사 추가
setup:
  add:
    White Necromancer: [c1]
    Black Necromancer: [f8]
`,

  'jester': `# ===================================
# Jester Chess (광대 체스)
# ===================================
# 광대: 잡지 못하지만 혼란을 일으키는 트릭스터
#
# 광대 특징:
# - 모든 방향 1칸 이동
# - capture: none - 잡기 불가능!
# - 이동할 때마다 swaps 카운트 증가
#
# capture: none 문법:
# - 이 기물은 다른 기물을 잡을 수 없음
# - 적 기물이 있는 칸으로 이동 불가
#
# 트릭스터 특성:
# - traits: [chaos, trickster]
# - 커스텀 특성으로 특수 효과 구현 가능
# - 예: swaps가 3이면 기물 위치 교환
#
# 전략 팁:
# - 광대로 직접 공격 불가
# - 다른 기물의 이동 경로 차단에 활용

game: "Jester Chess"
extends: "Standard Chess"

piece Jester {
  move: step(any)
  # none: 잡기 불가
  capture: none
  traits: [chaos, trickster]
  state: { swaps: 0 }
}

# 이동할 때마다 트릭 포인트 축적
trigger jester_trick {
  on: move
  when: piece.type == Jester
  do: set piece.state.swaps = piece.state.swaps + 1
}

# 퀸 위치에 광대 추가
setup:
  add:
    White Jester: [d1]
    Black Jester: [d8]
`,

  'medusa': `# ===================================
# Medusa Chess (메두사 체스)
# ===================================
# 메두사: 강력한 대각선 공격과 석화 능력
#
# 메두사 이동 방식:
# - move: step(any) - 모든 방향 1칸 이동
# - capture: slide(diagonal) - 대각선 무제한 잡기
# (이동은 제한적, 공격은 강력함)
#
# 석화 시스템:
# - state: { frozen: 0 } - 석화시킨 기물 수
# - 잡을 때마다 frozen +1
# - effect frozen: 석화 효과 정의
#
# effect 정의:
# - blocks: all - 모든 이동 차단
# - visual: "cyan" - 청록색으로 표시
#
# 전략 팁:
# - 1칸 이동으로 포지션 조정
# - 대각선 장거리 공격으로 적 제거

game: "Medusa Chess"
extends: "Standard Chess"

piece Medusa {
  # 이동은 1칸
  move: step(any)
  # 잡기는 대각선 무제한
  capture: slide(diagonal)
  traits: [gaze, petrify]
  state: { frozen: 0 }
}

# 석화 효과 정의
effect frozen {
  blocks: all
  visual: "cyan"
}

# 잡을 때마다 석화 카운트 증가
trigger medusa_petrify {
  on: capture
  when: piece.type == Medusa
  do: set piece.state.frozen = piece.state.frozen + 1
}

# 퀸을 메두사로 대체
setup:
  replace:
    Queen: Medusa
`,

  'timebomb': `# ===================================
# Time Bomb Chess (시한폭탄 체스)
# ===================================
# 시한폭탄: 카운트다운 후 폭발하는 기물
#
# 시한폭탄 특징:
# - 직선 1칸만 이동 가능
# - capture: none - 잡기 불가
# - 매 턴 종료 시 타이머 -1
# - 타이머가 0이 되면 폭발! (개념적)
#
# 카운트다운 시스템:
# - state: { timer: 3 } - 3턴 후 폭발
# - on: turn_end - 모든 턴 종료 시 발동
# - 자동으로 타이머 감소
#
# 폭발 효과 아이디어:
# - timer == 0일 때 주변 기물 제거
# - (별도 트리거로 구현 필요)
#
# 전략 팁:
# - 전략적 위치에 시한폭탄 배치
# - 적이 폭탄을 피해 이동하도록 유도

game: "Time Bomb Chess"
extends: "Standard Chess"

piece TimeBomb {
  # 직선 1칸만 이동
  move: step(orthogonal)
  # 잡기 불가
  capture: none
  traits: [explosive, countdown]
  # 3턴 후 폭발
  state: { timer: 3 }
}

# 매 턴 종료 시 타이머 감소
trigger bomb_tick {
  on: turn_end
  when: piece.type == TimeBomb
  do: set piece.state.timer = piece.state.timer - 1
}

# 3번, 6번 줄에 시한폭탄 추가
setup:
  add:
    White TimeBomb: [d3]
    Black TimeBomb: [d6]
`,

  'summoner': `# ===================================
# Summoner Chess (소환사 체스)
# ===================================
# 소환사: 정수를 모아 미니언을 소환하는 마법사
#
# 소환사 이동:
# - move: step(diagonal) - 대각선 1칸 이동
# - capture: step(any) - 모든 방향 1칸 잡기
#
# 정수 수집:
# - 잡을 때마다 essence +1
# - 충분한 정수로 Minion 소환 가능 (개념적)
#
# 미니언 특징:
# - 폰처럼 앞으로만 이동
# - 대각선으로만 잡기
# - traits: [temporary] - 임시 유닛
#
# 소환 시스템 아이디어:
# - essence >= 3이면 미니언 소환
# - 미니언은 1턴 후 사라짐
#
# 전략 팁:
# - 소환사로 적극적으로 잡아 정수 축적
# - 미니언을 전술적으로 활용

game: "Summoner Chess"
extends: "Standard Chess"

piece Summoner {
  # 대각선 이동
  move: step(diagonal)
  # 모든 방향 잡기
  capture: step(any)
  traits: [creator, magical]
  state: { essence: 0 }
}

# 소환 가능한 미니언
piece Minion {
  move: step(forward)
  capture: step(diagonal)
  traits: [temporary]
}

# 잡을 때마다 정수 수집
trigger gain_essence {
  on: capture
  when: piece.type == Summoner
  do: set piece.state.essence = piece.state.essence + 1
}

# 비숍 위치에 소환사 추가
setup:
  add:
    White Summoner: [c1]
    Black Summoner: [f8]
`,

  'mimic': `# ===================================
# Mimic Chess (모방자 체스)
# ===================================
# 모방자: 아군의 이동을 복사할 수 있는 적응형 기물
#
# 모방자 특징:
# - 기본: 모든 방향 1칸 이동
# - capture: =move - 이동과 동일한 잡기
# - 이동할 때마다 copies 증가
#
# =move 문법:
# - capture: =move
# - "잡기 패턴 = 이동 패턴"
# - 이동할 수 있는 곳이면 잡기도 가능
#
# 복사 시스템 아이디어:
# - 인접한 아군 기물의 이동 패턴 복사
# - copies가 늘어날수록 더 많은 패턴 기억
# (현재는 카운트만 구현)
#
# 전략 팁:
# - 퀸 옆에 두면 퀸 이동 복사 (개념적)
# - 유연한 포지셔닝 가능

game: "Mimic Chess"
extends: "Standard Chess"

piece Mimic {
  move: step(any)
  # =move: 이동과 동일한 패턴으로 잡기
  capture: =move
  traits: [copy, adaptable]
  state: { copies: 0 }
}

# 이동할 때마다 적응 카운트 증가
trigger mimic_adapt {
  on: move
  when: piece.type == Mimic
  do: set piece.state.copies = piece.state.copies + 1
}

# 2번 줄에 모방자 추가
setup:
  add:
    White Mimic: [d2, e2]
    Black Mimic: [d7, e7]
`,

  'teleporter': `# ===================================
# Teleporter Chess (텔레포터 체스)
# ===================================
# 텔레포터: 쿨다운이 있는 워프 능력을 가진 기물
#
# 텔레포터 이동:
# - leap(2, 1): 나이트처럼 L자 점프
# - 다른 기물 위로 뛰어넘기 가능
#
# 쿨다운 시스템:
# - 이동하면 cooldown = 3
# - 매 턴 종료 시 cooldown -1
# - (쿨다운 중 이동 제한은 추가 구현 필요)
#
# 듀얼 트리거 시스템:
# - warp_use: 이동 시 쿨다운 설정
# - warp_recover: 턴 종료 시 쿨다운 감소
#
# set 액션 문법:
# - set piece.state.cooldown = 3
# - set piece.state.cooldown = piece.state.cooldown - 1
#
# 전략 팁:
# - 쿨다운 관리가 핵심
# - 쿨다운이 끝날 때까지 방어적 플레이

game: "Teleporter Chess"
extends: "Standard Chess"

piece Teleporter {
  # 나이트처럼 L자 점프
  move: leap(2, 1)
  capture: leap(2, 1)
  traits: [warp, jump]
  # 초기 쿨다운: 0 (즉시 사용 가능)
  state: { cooldown: 0 }
}

# 워프(이동) 시 쿨다운 3 설정
trigger warp_use {
  on: move
  when: piece.type == Teleporter
  do: set piece.state.cooldown = 3
}

# 매 턴 종료 시 쿨다운 1 감소
trigger warp_recover {
  on: turn_end
  when: piece.type == Teleporter
  do: set piece.state.cooldown = piece.state.cooldown - 1
}

# 나이트를 텔레포터로 대체
setup:
  replace:
    Knight: Teleporter
`,

  // ========================================
  // Level 2: Compose - Zone-based Games
  // ========================================

  'fortress': `# ===================================
# Fortress Chess (요새 체스)
# ===================================
# 각 진영에 요새 영역이 있는 전략적 변형
#
# 영역(zone) 정의:
# - white_fortress: 백의 요새 (a1-c2, 6칸)
# - black_fortress: 흑의 요새 (f7-h8, 6칸)
# - center: 중앙 언덕 (d4-e5, 4칸)
#
# zone 시스템 활용:
# - zone.white_fortress: 백 요새 영역 참조
# - zone.center: 중앙 영역 참조
# - "King in zone.center": 킹이 중앙에 있으면 승리
#
# 게임 규칙:
# - 일반 체스 규칙 적용
# - 추가 승리 조건: 킹이 중앙 도달
#
# 전략 팁:
# - 요새에서 기물 보호
# - 중앙 진출로 빠른 승리 노림

game: "Fortress Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    # 백의 요새 (왼쪽 하단)
    white_fortress: [a1, b1, c1, a2, b2, c2]
    # 흑의 요새 (오른쪽 상단)
    black_fortress: [f8, g8, h8, f7, g7, h7]
    # 중앙 언덕
    center: [d4, d5, e4, e5]

# 중앙에 킹 도달 시 승리
victory:
  add:
    fortress_king: King in zone.center
`,

  'safe_zones': `# ===================================
# Safe Zone Chess (안전지대 체스)
# ===================================
# 안전지대 내 기물은 잡을 수 없습니다!
#
# 영역 구성:
# - white_safe: 백의 안전지대 (a1-d1, 1번 줄 왼쪽)
# - black_safe: 흑의 안전지대 (e8-h8, 8번 줄 오른쪽)
# - neutral: 중립 지역 (중앙 4칸)
#
# 안전지대 규칙 (개념적):
# - 안전지대 내 기물은 잡기 대상에서 제외
# - 안전지대에서 나오면 다시 잡힐 수 있음
#
# 승리 조건:
# - 킹이 중립 지역에 도달하면 승리
#
# 전략 팁:
# - 중요 기물을 안전지대에 피난
# - 적 킹의 중립 지역 진입 차단

game: "Safe Zone Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    # 백의 안전지대
    white_safe: [a1, b1, c1, d1]
    # 흑의 안전지대
    black_safe: [e8, f8, g8, h8]
    # 중립 지역 (승리 조건)
    neutral: [d4, e4, d5, e5]

# 킹이 중립 지역에 도달하면 승리
victory:
  add:
    hill: King in zone.neutral
`,

  // ========================================
  // Level 3: Script - Advanced Logic
  // ========================================

  'progressive': `# ===================================
# Progressive Chess (프로그레시브 체스)
# ===================================
# 매 턴마다 이동 횟수가 증가하는 변형!
#
# 진행 방식:
# - 1턴: 백 1수
# - 2턴: 흑 2수
# - 3턴: 백 3수
# - 4턴: 흑 4수... (계속 증가)
#
# 특별 규칙:
# - 체크를 주면 즉시 턴 종료
# - 체크메이트 전까지 모든 수를 써야 함
#
# Level 3 Script 문법:
# - script { ... }: JavaScript 코드 블록
# - game.state: 게임 상태 저장소
# - game.on("event", handler): 이벤트 리스너
# - game.isCheck(color): 체크 여부 확인
# - game.endTurn(): 턴 강제 종료
#
# 전략 팁:
# - 후반에 많은 수를 연속으로 둘 수 있음
# - 체크로 상대 턴을 일찍 끝내기

game: "Progressive Chess"
extends: "Standard Chess"

script {
  // 현재 턴에 사용한 이동 수
  game.state.movesThisTurn = 0;
  // 이번 턴에 필요한 이동 수
  game.state.movesRequired = 1;

  // 이동할 때마다 실행
  game.on("move", function(event) {
    game.state.movesThisTurn++;
    
    // 체크를 주거나 필요한 수를 모두 소진하면 턴 종료
    if (game.isCheck(event.player === "White" ? "Black" : "White") || 
        game.state.movesThisTurn >= game.state.movesRequired) {
      game.endTurn();
    }
  });

  // 턴 종료 시 다음 턴 준비
  game.on("turnEnd", function(event) {
    game.state.movesRequired++;
    game.state.movesThisTurn = 0;
  });
}
`,

  'countdown': `# ===================================
# Countdown Chess (카운트다운 체스)
# ===================================
# 각 플레이어는 총 50수만 둘 수 있습니다!
#
# 규칙:
# - 백/흑 각각 50수 제한
# - 50수를 모두 소진하면 패배
# - 체크메이트도 여전히 유효
#
# 스크립트 기능:
# - game.state.whiteMoves: 백 남은 수
# - game.state.blackMoves: 흑 남은 수
# - console.log(): 디버그 출력
# - game.declareWinner(color, reason): 승자 선언
# - game.endTurn(): 턴 종료
#
# 이벤트 핸들러:
# - event.player: 현재 플레이어 ("White" / "Black")
#
# 전략 팁:
# - 효율적인 수 사용 필수
# - 상대의 남은 수 확인하며 플레이
# - 무승부 회피가 중요

game: "Countdown Chess"
extends: "Standard Chess"

script {
  // 각 플레이어 남은 이동 수
  game.state.whiteMoves = 50;
  game.state.blackMoves = 50;

  game.on("move", function(event) {
    if (event.player === "White") {
      game.state.whiteMoves--;
      console.log("백 남은 수:", game.state.whiteMoves);
      // 백 수 소진 시 흑 승리
      if (game.state.whiteMoves <= 0) {
        game.declareWinner("Black", "White ran out of moves");
      }
    } else {
      game.state.blackMoves--;
      console.log("흑 남은 수:", game.state.blackMoves);
      // 흑 수 소진 시 백 승리
      if (game.state.blackMoves <= 0) {
        game.declareWinner("White", "Black ran out of moves");
      }
    }
    game.endTurn();
  });
}
`,

  'capture-the-flag': `# ===================================
# Capture the Flag (깃발 뺏기 체스)
# ===================================
# 상대 깃발을 잡으면 승리!
#
# 깃발(Flag) 특징:
# - 모든 방향 1칸 이동/잡기
# - value: 100 (최고 가치)
# - 잡히면 게임 종료
#
# 승리 조건:
# - 상대 깃발 잡기 (새 조건)
# - 체크메이트 (기존 조건)
#
# script로 승리 조건 구현:
# - game.on("capture", handler)
# - event.captured.type: 잡힌 기물 타입
# - game.declareWinner(): 승자 선언
#
# 전략 팁:
# - 깃발 보호가 최우선
# - 킹보다 깃발이 더 중요!
# - 적 깃발을 노리며 공격

game: "Capture the Flag"
extends: "Standard Chess"

# 깃발 기물 정의
piece Flag {
  move: step(any)
  capture: =move
  value: 100
}

# 깃발 잡기 = 즉시 승리
script {
  game.on("capture", function(event) {
    if (event.captured && event.captured.type === "Flag") {
      game.declareWinner(event.player, "Captured the flag!");
    }
  });
}

# 깃발을 퀸 위치에 배치
setup:
  add:
    White Flag: [d1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Bishop: [c1, f1]
    White Queen: [e1]
    White King: [g1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Flag: [d8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Bishop: [c8, f8]
    Black Queen: [e8]
    Black King: [g8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'material-race': `# ===================================
# Material Race (점수 경쟁)
# ===================================
# 먼저 15점 어치의 기물을 잡으면 승리!
#
# 기물 점수:
# - 퀸(Queen): 9점
# - 룩(Rook): 5점
# - 비숍(Bishop): 3점
# - 나이트(Knight): 3점
# - 폰(Pawn): 1점
# - 킹: 0점 (잡을 수 없음)
#
# JavaScript 변수 사용:
# - var pieceValues = {...}: 점수 테이블
# - pieceValues[type]: 타입별 점수 조회
# - += 연산자: 누적 합산
#
# 승리 조건:
# - 15점 이상 획득 시 승리
# - 체크메이트도 여전히 유효
#
# 전략 팁:
# - 큰 기물 잡기에 집중
# - 퀸(9점)은 게임 체인저!

game: "Material Race"
extends: "Standard Chess"

script {
  // 각 플레이어의 획득 점수
  game.state.whiteCaptures = 0;
  game.state.blackCaptures = 0;

  // 기물별 점수 정의
  var pieceValues = {
    "Pawn": 1,
    "Knight": 3,
    "Bishop": 3,
    "Rook": 5,
    "Queen": 9
  };

  game.on("capture", function(event) {
    var capturedType = event.captured.type;
    var value = pieceValues[capturedType] || 0;

    if (event.player === "White") {
      game.state.whiteCaptures += value;
      console.log("백 획득 점수:", game.state.whiteCaptures);
      // 15점 이상이면 백 승리
      if (game.state.whiteCaptures >= 15) {
        game.declareWinner("White", "Captured 15 points");
      }
    } else {
      game.state.blackCaptures += value;
      console.log("흑 획득 점수:", game.state.blackCaptures);
      // 15점 이상이면 흑 승리
      if (game.state.blackCaptures >= 15) {
        game.declareWinner("Black", "Captured 15 points");
      }
    }
  });
}
`,

  'peaceful-turns': `# ===================================
# Peaceful Turns (평화의 턴)
# ===================================
# 매 5턴마다 잡기가 금지됩니다!
#
# 규칙:
# - 일반: 정상적인 체스 규칙
# - 5, 10, 15... 턴: 잡기 금지
# - 평화 턴에는 이동만 가능
#
# % 연산자 (나머지):
# - turnCount % 5 === 0
# - 5로 나눈 나머지가 0이면 평화 턴
# - 예: 5, 10, 15, 20... 턴
#
# console.log():
# - 브라우저 콘솔에 메시지 출력
# - 디버깅 및 정보 표시용
#
# 전략 팁:
# - 평화 턴 직전에 공격적 포지션 구축
# - 평화 턴 활용해 재배치

game: "Peaceful Turns"
extends: "Standard Chess"

script {
  // 현재 턴 카운트
  game.state.turnCount = 0;

  game.on("turnEnd", function(event) {
    game.state.turnCount++;
    
    // 5의 배수 턴이면 평화 턴 알림
    if (game.state.turnCount % 5 === 0) {
      console.log("평화의 턴! 다음 턴은 잡기 금지입니다.");
    }
  });
}
`,

  // ========================================
  // More Custom Pieces
  // ========================================

  'wazir': `# ===================================
# Wazir Chess (와지르 체스)
# ===================================
# 와지르: 샤트란지(고대 체스)의 약한 기물
#
# 와지르 이동:
# - step(orthogonal): 직선 1칸만 이동
# - 상하좌우 4방향
# - 킹의 직선 이동과 동일
#
# 역사적 배경:
# - 샤트란지: 체스의 전신 (6세기 페르시아)
# - 와지르 = 재상/대신
# - 현대 퀸의 원형
#
# value: 2
# - 폰(1)보다 약간 높음
# - 이동 범위가 제한적이라 낮은 가치
#
# 전략 팁:
# - 근접전에서 유용
# - 킹 주변 방어에 활용

game: "Wazir Chess"
extends: "Standard Chess"

piece Wazir {
  # 직선 1칸만 이동
  move: step(orthogonal)
  capture: =move
  value: 2
}

# 비숍 위치에 와지르 배치
setup:
  add:
    White Wazir: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Wazir: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'ferz': `# ===================================
# Ferz Chess (페르즈 체스)
# ===================================
# 페르즈: 샤트란지의 대각선 기물, 퀸의 전신
#
# 페르즈 이동:
# - step(diagonal): 대각선 1칸만 이동
# - 4개 대각선 방향
# - 킹의 대각선 이동과 동일
#
# 역사적 배경:
# - 샤트란지에서 "장군" 기물
# - 현대 퀸으로 진화하기 전 형태
# - 원래는 가장 약한 기물 중 하나
#
# step vs slide:
# - step(diagonal): 1칸만 이동
# - slide(diagonal): 무제한 이동 (현대 비숍)
#
# 전략 팁:
# - 색상 제한 없음 (1칸이므로)
# - 킹 대각선 방어에 활용

game: "Ferz Chess"
extends: "Standard Chess"

piece Ferz {
  # 대각선 1칸만 이동
  move: step(diagonal)
  capture: =move
  value: 2
}

# 비숍 위치에 페르즈 배치
setup:
  add:
    White Ferz: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Ferz: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'elephant': `# ===================================
# Elephant Chess (코끼리 체스)
# ===================================
# 코끼리: 중국 장기(샹치)에서 온 대각선 점프 기물
#
# 코끼리 이동:
# - leap(2, 2): 대각선으로 정확히 2칸 점프
# - 중간 기물을 뛰어넘음
# - 4개 대각선 방향 점프 가능
#
# leap(dx, dy) 패턴:
# - 현재 위치에서 (±dx, ±dy) 위치로 점프
# - leap(2, 2): 대각선 2칸 점프
# - leap(2, 1): 나이트 L자 점프
#
# 중국 장기와의 차이:
# - 샹치에서는 "막힘" 규칙 있음
# - 이 버전은 막힘 없이 점프
#
# 전략 팁:
# - 비숍과 다른 이동 패턴
# - 색상 고정 (같은 색 칸만 이동)

game: "Elephant Chess"
extends: "Standard Chess"

piece Elephant {
  # 대각선 2칸 점프
  move: leap(2, 2)
  capture: =move
  traits: [jump]
  value: 3
}

# 비숍을 코끼리로 대체
setup:
  replace:
    Bishop: Elephant
`,

  'camel': `# ===================================
# Camel Chess (낙타 체스)
# ===================================
# 낙타: 나이트보다 멀리 뛰는 점프형 기물
#
# 낙타 이동:
# - leap(3, 1): 3칸 + 1칸 L자 점프
# - 나이트(2, 1)보다 한 칸 더 멀리
# - 8개 방향 점프 가능
#
# 나이트와 비교:
# - 나이트: leap(2, 1) - 총 거리 √5
# - 낙타: leap(3, 1) - 총 거리 √10
# - 낙타가 더 긴 사정거리
#
# 색상 패턴:
# - 낙타는 항상 같은 색 칸으로만 이동
# - (3+1=4, 짝수이므로 색상 유지)
#
# 전략 팁:
# - 긴 점프로 예상치 못한 공격
# - 좁은 공간에서는 불리

game: "Camel Chess"
extends: "Standard Chess"

piece Camel {
  # 3칸 + 1칸 L자 점프
  move: leap(3, 1)
  capture: =move
  traits: [jump]
  value: 3
}

# 비숍 위치에 낙타 추가
setup:
  add:
    White Camel: [c1, f1]
    White Rook: [a1, h1]
    White Knight: [b1, g1]
    White Queen: [d1]
    White King: [e1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2]
    Black Camel: [c8, f8]
    Black Rook: [a8, h8]
    Black Knight: [b8, g8]
    Black Queen: [d8]
    Black King: [e8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7]
`,

  'zebra': `# ===================================
# Zebra Chess (얼룩말 체스)
# ===================================
# 얼룩말: 나이트의 대각선 변형, (3,2) 점프
#
# 얼룩말 이동:
# - leap(3, 2): 3칸 + 2칸 점프
# - 나이트처럼 L자이지만 비율이 다름
# - 8개 방향 점프 가능
#
# 점프형 기물 비교:
# - 나이트: leap(2, 1) - 짧은 L자
# - 낙타: leap(3, 1) - 긴 직선 L자
# - 얼룩말: leap(3, 2) - 긴 대각선 L자
#
# 색상 패턴:
# - 얼룩말은 다른 색 칸으로 이동
# - (3+2=5, 홀수이므로 색상 변경)
#
# 전략 팁:
# - 넓은 보드에서 효과적
# - 나이트와 다른 도달 범위

game: "Zebra Chess"
extends: "Standard Chess"

piece Zebra {
  # 3칸 + 2칸 L자 점프
  move: leap(3, 2)
  capture: =move
  traits: [jump]
  value: 3
}

# 나이트를 얼룩말로 대체
setup:
  replace:
    Knight: Zebra
`,

  // ========================================
  // More Zone-Based Games
  // ========================================

  'center-control': `# ===================================
# Center Control Chess (중앙 지배 체스)
# ===================================
# 중앙을 지배하여 승리하세요!
#
# 영역 구성:
# - center: 핵심 중앙 4칸 (d4, d5, e4, e5)
# - extended_center: 확장 중앙 12칸
#
# 중앙의 중요성:
# - 체스에서 중앙 지배 = 게임 주도권
# - 킹이 중앙에 도달하면 승리
# - 확장 중앙까지 추가 정의됨
#
# 영역 정의 팁:
# - zone은 칸 목록으로 정의
# - 여러 영역 동시 정의 가능
# - 영역끼리 겹쳐도 OK
#
# 전략 팁:
# - 오프닝에서 중앙 폰 전진
# - 킹 중앙 진출 경로 확보

game: "Center Control Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    # 핵심 중앙 (4칸)
    center: [d4, d5, e4, e5]
    # 확장 중앙 (12칸) - 주변 영역
    extended_center: [c3, c4, c5, c6, d3, d6, e3, e6, f3, f4, f5, f6]

# 킹이 핵심 중앙에 도달하면 승리
victory:
  add:
    center_king: King in zone.center
`,

  'quadrant-chess': `# ===================================
# Quadrant Chess (사분면 체스)
# ===================================
# 보드를 4개 구역으로 나눈 전략적 변형
#
# 사분면 구성:
# - nw_quadrant: 북서 (a5-d8, 흑 퀸사이드)
# - ne_quadrant: 북동 (e5-h8, 흑 킹사이드)
# - sw_quadrant: 남서 (a1-d4, 백 퀸사이드)
# - se_quadrant: 남동 (e1-h4, 백 킹사이드)
#
# 활용 아이디어:
# - 특정 사분면에서 특별 규칙
# - 예: 적 사분면에서 기물 강화
# - 예: 자기 사분면에서 방어 보너스
#
# 영역 기반 전략:
# - 각 사분면 = 16칸 (4x4)
# - 총 64칸 = 4 × 16칸
# - 사분면별 점수 계산 가능

game: "Quadrant Chess"
extends: "Standard Chess"

board:
  size: 8x8
  zones:
    # 북서 사분면 (흑 퀸사이드)
    nw_quadrant: [a5, a6, a7, a8, b5, b6, b7, b8, c5, c6, c7, c8, d5, d6, d7, d8]
    # 북동 사분면 (흑 킹사이드)
    ne_quadrant: [e5, e6, e7, e8, f5, f6, f7, f8, g5, g6, g7, g8, h5, h6, h7, h8]
    # 남서 사분면 (백 퀸사이드)
    sw_quadrant: [a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4]
    # 남동 사분면 (백 킹사이드)
    se_quadrant: [e1, e2, e3, e4, f1, f2, f3, f4, g1, g2, g3, g4, h1, h2, h3, h4]
`,

  // ========================================
  // Board Size Variants
  // ========================================

  'large-board': `# ===================================
# Grand Chess (그랜드 체스, 10x10)
# ===================================
# 10x10 대형 보드와 추가 기물!
#
# 새 기물:
# - Marshal (원수): 룩 + 나이트
# - Cardinal (추기경): 비숍 + 나이트
#
# 보드 크기 변경:
# - board.size: 10x10
# - 기본 8x8에서 확장
# - a~j 파일, 1~10 랭크
#
# 복합 기물:
# - slide + leap 조합
# - 슬라이드와 점프 동시 사용
# - Amazon(퀸+나이트)보다 약간 약함
#
# 전략 팁:
# - 넓은 보드에서 점프 기물 유리
# - Marshal/Cardinal로 빠른 전개
# - 폰 체인이 길어짐

game: "Grand Chess"
extends: "Standard Chess"

# 10x10 대형 보드
board:
  size: 10x10

# 원수: 룩 + 나이트
piece Marshal {
  move: slide(orthogonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

# 추기경: 비숍 + 나이트
piece Cardinal {
  move: slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

# 10열 배치
setup:
  add:
    White Rook: [a1, j1]
    White Knight: [b1, i1]
    White Bishop: [c1, h1]
    White Queen: [d1]
    White King: [f1]
    White Marshal: [e1]
    White Cardinal: [g1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2, i2, j2]
    Black Rook: [a10, j10]
    Black Knight: [b10, i10]
    Black Bishop: [c10, h10]
    Black Queen: [d10]
    Black King: [f10]
    Black Marshal: [e10]
    Black Cardinal: [g10]
    Black Pawn: [a9, b9, c9, d9, e9, f9, g9, h9, i9, j9]
`,

  'mini-chess': `# ===================================
# Mini Chess (미니 체스, 5x6)
# ===================================
# 더 작고 빠른 체스 변형!
#
# 보드 크기:
# - 5x6 (30칸)
# - 일반 체스의 절반 이하
#
# 기물 축소:
# - 룩 2개
# - 나이트 1개
# - 비숍 1개
# - 킹 1개
# - 폰 5개
# - 퀸 없음!
#
# 게임 특성:
# - 빠른 게임 진행
# - 폰 프로모션이 더 빨라짐
# - 적은 기물로 전술적 플레이
#
# 전략 팁:
# - 룩이 상대적으로 강력
# - 폰 승격이 승부 결정
# - 나이트가 좁은 보드에서 유리

game: "Mini Chess"
extends: "Standard Chess"

# 5x6 소형 보드
board:
  size: 5x6

setup:
  add:
    # 백 기물 (1-2줄)
    White Rook: [a1, e1]
    White Knight: [b1]
    White Bishop: [d1]
    White King: [c1]
    White Pawn: [a2, b2, c2, d2, e2]
    # 흑 기물 (5-6줄)
    Black Rook: [a6, e6]
    Black Knight: [b6]
    Black Bishop: [d6]
    Black King: [c6]
    Black Pawn: [a5, b5, c5, d5, e5]
`,

  'wide-board': `# Capablanca Chess (12x8)
# Wide board with Chancellor and Archbishop.

game: "Capablanca Chess"
extends: "Standard Chess"

board:
  size: 12x8

piece Chancellor {
  move: slide(orthogonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

piece Archbishop {
  move: slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}

setup:
  add:
    White Rook: [a1, l1]
    White Knight: [b1, k1]
    White Bishop: [c1, j1]
    White Chancellor: [d1]
    White Archbishop: [i1]
    White Queen: [e1]
    White King: [h1]
    White Pawn: [a2, b2, c2, d2, e2, f2, g2, h2, i2, j2, k2, l2]
    Black Rook: [a8, l8]
    Black Knight: [b8, k8]
    Black Bishop: [c8, j8]
    Black Chancellor: [d8]
    Black Archbishop: [i8]
    Black Queen: [e8]
    Black King: [h8]
    Black Pawn: [a7, b7, c7, d7, e7, f7, g7, h7, i7, j7, k7, l7]
`,

  // ========================================
  // Special Rules Variants
  // ========================================

  'no-castling': `# No Castling Chess
# Standard chess without castling.

game: "No Castling Chess"
extends: "Standard Chess"

# Castling is disabled in this variant
`,

  'antichess': `# Antichess (Losing Chess)
# The goal is to lose all your pieces!

game: "Antichess"
extends: "Standard Chess"

# Captures are mandatory
# First player to lose all pieces wins
`,

  'zombie-chess': `# ===================================
# Zombie Chess (좀비 체스)
# ===================================
# 잡힌 폰이 좀비로 부활합니다!
#
# 좀비 특징:
# - 모든 방향으로 1칸 이동/잡기
# - 잡힌 폰은 잡은 기물의 원래 위치에 적 좀비로 부활
# - 좀비는 부활하지 않음 (한 번만 부활)
#
# 핵심 메커니즘:
# - captured.type == Pawn: 잡힌 기물이 폰인지 확인
# - create Zombie at origin: 잡는 기물의 출발 위치에 좀비 생성
# - for captured.owner: 잡힌 기물의 소유자 좀비로 생성
# - 좀비는 Pawn이 아니므로 트리거 조건 불충족 → 부활 없음
#
# 게임 흐름 예시:
# 1. White가 d5에서 Black pawn을 잡음 (e4→d5)
# 2. e4(origin)에 Black Zombie가 나타남!
# 3. 이제 White의 뒤에 적 좀비가 있음
#
# 전략 팁:
# - 폰을 잡으면 내 뒤에 적 좀비가 나타남!
# - 폰 교환을 신중하게 하세요
# - 좀비를 잡으면 더 이상 부활하지 않습니다

game: "Zombie Chess"
extends: "Standard Chess"

# 좀비 기물: 모든 방향 1칸 이동/잡기
piece Zombie {
  move: step(any)
  capture: =move
  traits: [undead]
  state: { resurrected: true }
  value: 2
  symbol: "Z"
}

# 폰이 잡히면 잡는 기물의 원래 위치에 적 좀비로 부활
# 좀비(Zombie)는 Pawn이 아니므로 이 트리거에 해당하지 않음 → 부활 없음
trigger pawn_rises {
  on: capture
  when: captured.type == Pawn
  do: create Zombie at origin for captured.owner
}

# 좀비가 잡히면 아무 일도 일어나지 않음
# (captured.type == Zombie 트리거가 없으므로 자동으로 처리됨)
`,

  'extinction-chess': `# Extinction Chess
# Lose when any piece type goes extinct!
# Win when opponent's King is captured.

game: "Extinction Chess"
extends: "Standard Chess"

# In Extinction Chess, capturing the King wins
victory:
  add:
    king_gone: King captured
`,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      code: DEFAULT_CODE,
      setCode: (code) => set({ code }),

      errors: [],
      setErrors: (errors) => set({ errors }),

      isCompiling: false,
      setIsCompiling: (isCompiling) => set({ isCompiling }),

      showProblems: true,
      toggleProblems: () => set((state) => ({ showProblems: !state.showProblems })),

      loadExample: (example) => {
        const code = EXAMPLES[example] ?? DEFAULT_CODE;
        set({ code, errors: [] });
      },
    }),
    {
      name: 'chesslang-editor',
      partialize: (state) => ({ code: state.code }),
    }
  )
);

// Export example keys for UI
export const EXAMPLE_CATEGORIES = {
  'Level 1: Basic Variants': ['koth', 'three-check', 'racing-kings', 'horde-chess'],
  'Level 2: Custom Pieces': ['custom', 'cannon-chess', 'fairy-pieces', 'gryphon', 'superpawn', 'dragon', 'wazir', 'ferz', 'elephant', 'camel', 'zebra'],
  'Level 2: Advanced Pieces': ['vampire', 'shapeshifter', 'guardian', 'lancer', 'necromancer', 'jester', 'medusa', 'timebomb', 'summoner', 'mimic', 'teleporter'],
  'Level 2: Effects & Triggers': ['atomic', 'berserk-chess', 'trapper', 'phoenix', 'bomber'],
  'Level 2: Zone Games': ['fortress', 'safe_zones', 'center-control', 'quadrant-chess'],
  'Level 3: Scripts': ['progressive', 'countdown', 'capture-the-flag', 'material-race', 'peaceful-turns'],
  'Board Sizes': ['mini-chess', 'large-board', 'wide-board'],
  'Special Rules': ['no-castling', 'antichess', 'zombie-chess', 'extinction-chess'],
};

export const EXAMPLE_NAMES: Record<string, string> = {
  // Level 1
  koth: 'King of the Hill',
  'three-check': 'Three-Check',
  'racing-kings': 'Racing Kings',
  'horde-chess': 'Horde Chess',
  // Level 2 - Custom Pieces
  custom: 'Amazon Chess',
  'cannon-chess': 'Cannon Chess',
  'fairy-pieces': 'Fairy Pieces',
  gryphon: 'Gryphon Chess',
  superpawn: 'Super Pawn Chess',
  dragon: 'Dragon Chess',
  wazir: 'Wazir Chess',
  ferz: 'Ferz Chess',
  elephant: 'Elephant Chess',
  camel: 'Camel Chess',
  zebra: 'Zebra Chess',
  // Level 2 - Advanced Pieces
  vampire: 'Vampire Chess',
  shapeshifter: 'Shapeshifter Chess',
  guardian: 'Guardian Chess',
  lancer: 'Lancer Chess',
  necromancer: 'Necromancer Chess',
  jester: 'Jester Chess',
  medusa: 'Medusa Chess',
  timebomb: 'Time Bomb Chess',
  summoner: 'Summoner Chess',
  mimic: 'Mimic Chess',
  teleporter: 'Teleporter Chess',
  // Level 2 - Effects & Triggers
  atomic: 'Atomic Chess',
  'berserk-chess': 'Berserk Chess',
  trapper: 'Trapper Chess',
  phoenix: 'Phoenix Chess',
  bomber: 'Bomber Chess',
  // Level 2 - Zones
  fortress: 'Fortress Chess',
  safe_zones: 'Safe Zone Chess',
  'center-control': 'Center Control Chess',
  'quadrant-chess': 'Quadrant Chess',
  // Level 3 - Scripts
  progressive: 'Progressive Chess',
  countdown: 'Countdown Chess',
  'capture-the-flag': 'Capture the Flag',
  'material-race': 'Material Race',
  'peaceful-turns': 'Peaceful Turns',
  // Board Sizes
  'mini-chess': 'Mini Chess (5×6)',
  'large-board': 'Grand Chess (10×10)',
  'wide-board': 'Capablanca Chess (12×8)',
  // Special Rules
  'no-castling': 'No Castling',
  antichess: 'Antichess',
  'zombie-chess': 'Zombie Chess',
  'extinction-chess': 'Extinction Chess',
};
