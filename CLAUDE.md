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
  add:
    hill: King in zone.hill
```

**Level 2 (Compose)**: 선언적 DSL
```
piece Trapper {
    move: step(any)
    capture: =move
    state: { traps: 0 }
}

trigger place_trap {
    on: move
    when: piece.type == Trapper and piece.state.traps < 3
    do: mark origin with trap
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

**Level 2**: `piece`, `pattern`, `effect`, `trigger`, `action`, `move`, `capture`, `traits`, `state`, `on`, `when`, `do`

**Level 3**: `script`, `function`, `let`, `const`, `if`, `else`, `for`, `while`, `return`

**Patterns**: `step`, `slide`, `leap`, `hop`

**Directions**: `N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`, `orthogonal`, `diagonal`, `any`, `forward`

**Conditions**: `empty`, `enemy`, `friend`, `clear`, `check`, `first_move`, `in`

**Actions**: `set`, `create`, `remove`, `transform`, `mark`, `win`, `lose`

### 상세 스펙

전체 문법과 구현 상세는 `CLAUDE_CODE_PROMPT.md` 참조.

### Current Status

- [x] 타입 정의 (`src/types/index.ts`)
- [x] Position 유틸리티 (`src/engine/position.ts`)
- [x] Board 클래스 (`src/engine/board.ts`)
- [ ] Lexer
- [ ] Parser
- [ ] Compiler
- [ ] 나머지...

### Next Steps

1. Lexer 구현 시작
   - Token 타입 정의
   - Scanner 구현
   - 인덴트 처리 (Python-like)

2. Level 1 Parser
   - YAML-like 문법 파싱
   - 기본 AST 생성

3. Standard Chess 정의
   - 기본 기물들
   - 이동 규칙
   - 특수 규칙 (캐슬링, 앙파상, 프로모션)

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