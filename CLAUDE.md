# ChessLang

체스 변형 게임을 정의하기 위한 도메인 특화 언어(DSL).

## Quick Reference

### 프로젝트 구조
```
src/
├── types/          # 타입 정의
├── lexer/          # 토큰화
├── parser/         # AST 생성
├── compiler/       # 게임으로 컴파일
├── engine/         # 체스 엔진
├── linter/         # 문법/의미 검사
├── debugger/       # 디버깅 도구
├── lsp/            # Language Server
├── cli/            # CLI 도구
└── stdlib/         # 표준 라이브러리
```

### 핵심 설계: 3-Level 계층

**Level 1 (Configure)**: YAML-like 설정
```yaml
game: "King of the Hill"
extends: "Standard Chess"
board:
  zones:
    hill: [d4, d5, e4, e5]
victory:
  # 여러 승리 조건은 OR로 결합 (하나라도 만족시 승리)
  # add: checkmate OR hill
  # replace: 기존 조건 교체
  # remove: 기존 조건 제거
  add:
    hill: King in zone.hill
```

**Level 2 (Compose)**: 선언적 DSL
```
# 커스텀 기물 정의
piece Trapper {
    move: step(any)
    capture: =move
    traits: [jump]
    state: { traps: 0 }
}

# 칸에 적용되는 효과 정의
effect trap {
    blocks: enemy      # enemy | friend | all | none
    visual: "red"      # 시각적 표시
}

# 이벤트 기반 트리거
trigger place_trap {
    on: move
    when: piece.type == Trapper and piece.state.traps < 3
    optional: true                          # 사용자 선택
    description: "덫을 설치하시겠습니까?"    # 선택 메시지
    do: {
        mark origin with trap               # 효과 적용
        set piece.state.traps = piece.state.traps + 1
    }
}
```

**Level 3 (Script)**: JavaScript subset
```javascript
script {
    Lancer.actions.mount = function(board, piece) {
        return adjacent(piece.pos)
            .filter(pos => board.at(pos)?.type === 'Knight')
            .map(pos => ({ type: 'mount', target: board.at(pos) }));
    };
}
```

### 구현 우선순위

1. **Lexer** - 토큰화 (Level 1, 2, 3 통합)
2. **Parser** - AST 생성
3. **Engine** - 체스 로직 (보드, 이동, 규칙)
4. **Compiler** - AST → 실행 가능 게임
5. **Linter** - 에러 검출
6. **CLI** - 명령줄 도구
7. **Debugger** - 디버깅
8. **LSP** - IDE 지원

### 기술 스택

- TypeScript
- Node.js
- 빌드: tsc
- 테스트: Jest (또는 Vitest)
- CLI: Commander.js

### Commands

```bash
npm run build      # 빌드
npm run test       # 테스트
npm run dev        # 개발 모드
npm start          # CLI 실행
```

### 주요 타입

```typescript
// Position
interface Position { file: number; rank: number; }

// Piece
interface Piece {
    id: string;
    type: string;
    owner: 'White' | 'Black';
    pos: Position;
    traits: Set<string>;
    state: Record<string, unknown>;
}

// Move
interface Move {
    type: 'normal' | 'capture' | 'castle' | 'en_passant' | 'promotion';
    piece: Piece;
    from: Position;
    to: Position;
    captured?: Piece;
}

// Pattern
type Pattern = 
    | { type: 'step'; direction: Direction; distance?: number }
    | { type: 'slide'; direction: Direction }
    | { type: 'leap'; vector: [number, number] }
    | { type: 'composite'; op: 'or' | 'then'; patterns: Pattern[] };
```

### 문법 키워드

**Level 1**: `game`, `extends`, `board`, `pieces`, `setup`, `victory`, `draw`, `rules`

**Level 2**: `piece`, `pattern`, `effect`, `trigger`, `action`, `move`, `capture`, `traits`, `state`, `on`, `when`, `do`, `optional`, `description`, `blocks`, `visual`

**Level 3**: `script`, `function`, `let`, `const`, `if`, `else`, `for`, `while`, `return`

**Patterns**: `step`, `slide`, `leap`, `hop`

**Directions**: `N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`, `orthogonal`, `diagonal`, `any`, `forward`

**Conditions**: `empty`, `enemy`, `friend`, `clear`, `check`, `first_move`, `in`, `and`, `or`, `not`

**Actions**: `set`, `create`, `remove`, `transform`, `mark`, `move`, `win`, `lose`, `draw`

**Built-in Traits**: `royal`, `jump`, `phase`, `promote`, `immune`, `explosive` (커스텀 trait도 가능)

---

### Effect 시스템

칸(square)에 적용되는 효과를 정의합니다.

```
effect <name> {
    blocks: enemy | friend | all | none    # 이동 차단 대상
    visual: "color" | icon                  # 시각적 표시
}
```

**blocks 값:**
- `enemy`: 효과 소유자의 적 기물 이동 차단
- `friend`: 효과 소유자의 아군 기물 이동 차단
- `all`: 모든 기물 이동 차단
- `none`: 차단 없음 (기본값)

**예시:**
```
effect trap { blocks: enemy; visual: "red" }
effect shield { blocks: enemy; visual: "blue" }
effect lava { blocks: all; visual: "orange" }
```

---

### Optional Trigger

사용자에게 실행 여부를 묻는 선택적 트리거입니다.

```
trigger <name> {
    on: <event>
    when: <condition>           # 선택적
    optional: true              # 선택적 트리거 활성화
    description: "메시지"       # 다이얼로그에 표시할 텍스트
    do: <action> | { actions }
}
```

**키보드 단축키:**
- `Y` / `Enter`: 실행
- `N` / `Escape`: 건너뛰기

---

### Mark 액션

칸에 효과를 적용하는 액션입니다.

```
mark <position> with <effect>
```

**position 표현식:**
- `origin`: 이동 출발 위치
- `destination` / `target`: 이동 도착 위치
- `piece.pos`: 기물 현재 위치
- `[e4]`, `{file: 4, rank: 3}`: 특정 위치

**예시:**
```
do: mark origin with trap              # 출발 위치에 덫 설치
do: mark destination with shield       # 도착 위치에 방어막
do: mark [d4] with lava                # d4에 용암
```

---

### 조건 표현식

트리거의 `when` 절에서 사용하는 조건식입니다.

**비교 연산:**
```
piece.type == King
piece.owner == White
piece.state.moves > 0
piece.state.cooldown <= 0
```

**논리 연산:**
```
piece.type == Trapper and piece.state.traps < 3
piece.traits has royal or piece.traits has immune
not piece.state.moved
```

**내장 조건:**
- `empty`: 목적지가 비어있음
- `enemy`: 목적지에 적 기물
- `friend`: 목적지에 아군 기물
- `clear`: 경로가 비어있음
- `first_move`: 기물의 첫 이동
- `in zone.<name>`: 특정 존 내 위치

---

### 상세 스펙

전체 문법과 구현 상세는 `CLAUDE_CODE_PROMPT.md` 참조.

### Current Status

**Core DSL (완료)**
- [x] 타입 정의 (`src/types/index.ts`)
- [x] Lexer (`src/lexer/`) - 토큰화, 인덴트 처리
- [x] Parser (`src/parser/`) - AST 생성, Level 1/2/3 지원
- [x] Compiler (`src/compiler/`) - AST → CompiledGame

**Engine (완료)**
- [x] Position 유틸리티 (`src/engine/position.ts`)
- [x] Board 클래스 (`src/engine/board.ts`)
- [x] Move 생성 (`src/engine/moves.ts`)
- [x] Game Engine (`src/engine/game.ts`) - 게임 실행, 트리거, 액션
- [x] Standard Chess (`src/stdlib/standard-chess.ts`)

**기능 구현 (완료)**
- [x] 이동 패턴: `step`, `slide`, `leap`, `hop`
- [x] 패턴 조합: `|` (or), `+` (then)
- [x] 조건: `where`, `empty`, `enemy`, `friend`, `clear`, `first_move`
- [x] 트리거: `on`, `when`, `do`
- [x] 액션: `set`, `create`, `remove`, `transform`, `mark`, `win`, `lose`, `draw`
- [x] Traits: `royal`, `jump`, `phase`, `promote`, `immune`, `explosive`
- [x] State: 기물별 상태 추적, 쿨다운 시스템
- [x] Setup: `add`, `replace` 모드
- [x] Victory/Draw: `add`, `replace`, `remove` 모드

**Web Platform (완료)**
- [x] Next.js 14 App
- [x] Monaco Editor 기반 Playground
- [x] 실시간 게임 보드
- [x] 예제 갤러리
- [x] MDX 문서

**미구현/개선 예정**
- [ ] Linter - 문법/의미 오류 검출
- [ ] Debugger - 게임 상태 추적
- [ ] LSP - IDE 자동완성, 호버
- [ ] CLI - 명령줄 도구
- [ ] `hop` 패턴 완전 구현
- [ ] 복잡한 `where` 조건

---

## Part 2: Web Platform

### 웹 앱 구조

```
chesslang-web/           # Next.js 14 App
├── src/app/
│   ├── page.tsx         # Landing
│   ├── playground/      # 코드 에디터 + 게임
│   ├── play/            # 게임 플레이
│   └── docs/            # 문서
├── src/components/
│   ├── editor/          # Monaco 에디터
│   ├── board/           # 체스 보드
│   └── docs/            # 문서 컴포넌트
└── content/docs/        # MDX 문서
```

### 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 |
| `/playground` | 코드 에디터 + 실시간 게임 |
| `/play` | 게임 목록 및 플레이 |
| `/play/[gameId]` | 특정 게임 플레이 |
| `/docs` | 문서 홈 |
| `/docs/[...slug]` | 문서 페이지 |
| `/examples` | 예제 갤러리 |

### 기술 스택

- Next.js 14 (App Router)
- Monaco Editor (코드 에디터)
- Tailwind CSS + shadcn/ui
- Zustand (상태 관리)
- MDX (문서)
- Web Worker (엔진 실행)

### 핵심 기능

**Playground:**
- ChessLang syntax highlighting
- 실시간 문법 검사
- 자동완성
- 코드 포맷팅
- 공유 링크
- 실시간 게임 보드

**Docs:**
- MDX 기반
- 검색
- Interactive examples (문서 내 미니 게임)
- "Try in Playground" 버튼

### 문서 구조

```
content/docs/
├── getting-started/     # 시작하기
├── language/            # 언어 가이드
│   ├── level1.mdx
│   ├── level2.mdx
│   └── level3.mdx
├── reference/           # 레퍼런스
│   ├── keywords.mdx
│   ├── patterns.mdx
│   ├── directions.mdx
│   ├── conditions.mdx
│   └── actions.mdx
└── examples/            # 예제
```

### 상세 스펙

전체 웹 앱 스펙은 `CLAUDE_CODE_PROMPT.md` Part 2 참조.