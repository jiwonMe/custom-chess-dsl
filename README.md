# ChessLang 🎮♟️

> 체스 변형 게임을 정의하기 위한 도메인 특화 언어(DSL)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

ChessLang은 복잡한 프로그래밍 지식 없이도 나만의 체스 변형 규칙을 정의할 수 있는 언어입니다. YAML과 유사한 간단한 문법부터 JavaScript 수준의 고급 스크립팅까지, 3단계 계층 구조로 유연성을 제공합니다.

## ✨ 주요 기능

- **3-Level 계층 구조**: 간단한 설정부터 복잡한 로직까지
- **선언적 문법**: 직관적인 기물 정의 및 규칙 설정
- **다양한 변형 지원**: King of the Hill, Three-Check, Atomic Chess 등
- **실시간 플레이그라운드**: 웹에서 바로 테스트
- **AI 대전**: Minimax 기반 AI 지원

## 🚀 빠른 시작

### 설치

```bash
# 저장소 클론
git clone https://github.com/jiwonme/custom-chess-dsl.git
cd custom-chess-dsl

# 의존성 설치
npm install

# 빌드
npm run build
```

### 개발 서버 실행

```bash
# 핵심 라이브러리 개발 모드
npm run dev

# 웹 앱 개발 서버
cd chesslang-web && npm run dev
```

### 테스트

```bash
npm run test
```

## 📖 언어 가이드

### Level 1: Configure (YAML-like 설정)

가장 간단한 형태로, 기존 규칙을 확장합니다:

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

### Level 2: Compose (선언적 DSL)

커스텀 기물, 효과, 트리거를 정의합니다:

```
piece Amazon {
    move: slide(orthogonal) | slide(diagonal) | leap(2,1)
    capture: =move
    traits: [jump]
}

effect trap {
    blocks: enemy
    visual: "red"
}

trigger place_trap {
    on: move
    when: piece.type == Trapper and piece.state.traps < 3
    optional: true
    description: "덫을 설치하시겠습니까?"
    do: {
        mark origin with trap
        set piece.state.traps += 1
    }
}
```

### Level 3: Script (JavaScript subset)

고급 로직을 위한 스크립팅:

```javascript
script {
    Lancer.actions.mount = function(board, piece) {
        return adjacent(piece.pos)
            .filter(pos => board.at(pos)?.type === 'Knight')
            .map(pos => ({ type: 'mount', target: board.at(pos) }));
    };
}
```

## 🎯 지원하는 체스 변형

| 변형 | 설명 |
|------|------|
| Standard Chess | 표준 체스 규칙 |
| King of the Hill | 킹을 중앙으로 이동시키면 승리 |
| Three-Check | 체크 3회로 승리 |
| Atomic Chess | 캡처 시 주변 기물 폭발 |
| Horde | 폰 군단 vs 일반 군대 |
| Racing Kings | 8랭크에 먼저 도달하면 승리 |

## 🏗 프로젝트 구조

```
chesslang/
├── src/
│   ├── types/          # 타입 정의
│   ├── lexer/          # 토큰화
│   ├── parser/         # AST 생성
│   ├── compiler/       # 게임으로 컴파일
│   ├── engine/         # 체스 엔진
│   ├── ai/             # AI (Minimax, Random)
│   └── stdlib/         # 표준 라이브러리
├── chesslang-web/      # Next.js 웹 앱
│   ├── src/app/        # 페이지
│   ├── src/components/ # UI 컴포넌트
│   └── content/docs/   # MDX 문서
└── tests/              # 테스트
```

## 💻 API 사용법

### 기본 사용

```typescript
import { parse, compileSource, GameEngine } from 'chesslang';

// 소스 코드 파싱 및 컴파일
const source = `
game: "My Variant"
extends: "Standard Chess"
`;

const compiled = compileSource(source);

// 게임 엔진 생성 및 실행
const engine = new GameEngine(compiled);
const moves = engine.getLegalMoves();
engine.makeMove(moves[0]);
```

### 개별 모듈 사용

```typescript
import { Lexer, Parser, Compiler, Board, GameEngine } from 'chesslang';

// 단계별 처리
const lexer = new Lexer(source);
const tokens = lexer.tokenize();

const parser = new Parser(tokens);
const ast = parser.parse();

const compiler = new Compiler(ast);
const game = compiler.compile();

// 표준 보드 생성
import { createStandardBoard } from 'chesslang';
const board = createStandardBoard();
```

## 🌐 웹 플랫폼

웹 플랫폼은 다음 기능을 제공합니다:

- **Playground**: Monaco 에디터 기반 실시간 코드 편집 및 게임 플레이
- **문서**: MDX 기반 인터랙티브 문서
- **예제 갤러리**: 다양한 체스 변형 예제

### 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 |
| `/playground` | 코드 에디터 + 실시간 게임 |
| `/play` | 게임 플레이 |
| `/docs` | 문서 |
| `/examples` | 예제 갤러리 |

## 🛠 기술 스택

### 핵심 라이브러리

- **TypeScript** - 타입 안전성
- **Commander.js** - CLI
- **Vitest** - 테스트

### 웹 플랫폼

- **Next.js 14** - App Router
- **Monaco Editor** - 코드 에디터
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트
- **Zustand** - 상태 관리
- **MDX** - 문서

## 📜 문법 레퍼런스

### 패턴

| 패턴 | 설명 | 예시 |
|------|------|------|
| `step(dir)` | 한 칸 이동 | `step(N)` |
| `slide(dir)` | 방향으로 슬라이드 | `slide(diagonal)` |
| `leap(dx,dy)` | 점프 이동 | `leap(2,1)` |
| `hop(dir)` | 장애물 뛰어넘기 | `hop(orthogonal)` |

### 방향

- 기본: `N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`
- 그룹: `orthogonal`, `diagonal`, `any`
- 상대: `forward`, `backward`

### 조건

- 위치: `empty`, `enemy`, `friend`, `clear`
- 상태: `check`, `first_move`
- 논리: `and`, `or`, `not`

### 액션

- `set`: 값 설정
- `create`: 기물 생성
- `remove`: 기물 제거
- `transform`: 기물 변환
- `mark`: 효과 적용
- `win`, `lose`, `draw`: 게임 종료

## 🧪 테스트

```bash
# 전체 테스트
npm run test

# 커버리지 포함
npm run test:coverage

# 특정 테스트 파일
npm run test -- tests/engine/game.test.ts
```

## 📝 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run build` | TypeScript 빌드 |
| `npm run dev` | 개발 모드 (watch) |
| `npm run test` | 테스트 실행 |
| `npm run lint` | 린트 검사 |
| `npm run format` | 코드 포맷팅 |
| `npm run build:web` | 웹 앱 빌드 |

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고해주세요.

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)를 따릅니다.

## 🔗 링크

- [문서](https://chesslang.dev/docs)
- [플레이그라운드](https://chesslang.dev/playground)
- [이슈 트래커](https://github.com/jiwonme/custom-chess-dsl/issues)

---

Made with ♟️ by [jiwonme](https://github.com/jiwonme)
