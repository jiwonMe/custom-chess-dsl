# Contributing to ChessLang 🤝

ChessLang에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 📋 목차

- [행동 강령](#행동-강령)
- [시작하기](#시작하기)
- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [코딩 컨벤션](#코딩-컨벤션)
- [커밋 메시지 규칙](#커밋-메시지-규칙)
- [풀 리퀘스트 프로세스](#풀-리퀘스트-프로세스)
- [테스트 가이드](#테스트-가이드)
- [이슈 리포팅](#이슈-리포팅)

## 행동 강령

이 프로젝트는 모든 참여자가 존중받는 환경을 유지하기 위해 노력합니다:

- 다양성과 포용성을 존중합니다
- 건설적인 피드백을 주고받습니다
- 커뮤니티에 도움이 되는 결정을 우선합니다

## 시작하기

### 기여할 수 있는 방법

1. **버그 리포트**: 버그를 발견하면 이슈로 등록해주세요
2. **기능 제안**: 새로운 기능 아이디어가 있다면 공유해주세요
3. **문서 개선**: 문서의 오류 수정이나 개선
4. **코드 기여**: 버그 수정이나 새로운 기능 구현
5. **테스트 추가**: 테스트 커버리지 향상

### 첫 기여를 위한 좋은 이슈

- `good first issue` 라벨이 붙은 이슈를 찾아보세요
- `help wanted` 라벨이 붙은 이슈도 기여하기 좋습니다

## 개발 환경 설정

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn
- Git

### 설치 과정

```bash
# 1. 저장소 포크 후 클론
git clone https://github.com/YOUR_USERNAME/custom-chess-dsl.git
cd custom-chess-dsl

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. 테스트 실행
npm run test

# 5. 개발 서버 실행 (웹 앱)
cd chesslang-web && npm run dev
```

### 개발 워크플로우

```bash
# 핵심 라이브러리 개발 (watch 모드)
npm run dev

# 웹 앱 개발
cd chesslang-web && npm run dev

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format
```

## 프로젝트 구조

```
chesslang/
├── src/                    # 핵심 라이브러리 소스
│   ├── types/              # TypeScript 타입 정의
│   ├── lexer/              # 토큰화 (Lexer)
│   │   ├── index.ts        # Lexer 클래스
│   │   ├── scanner.ts      # 문자 스캐너
│   │   └── tokens.ts       # 토큰 타입 정의
│   ├── parser/             # AST 파서
│   │   └── index.ts        # Parser 클래스
│   ├── compiler/           # AST → CompiledGame
│   │   └── index.ts        # Compiler 클래스
│   ├── engine/             # 게임 엔진
│   │   ├── board.ts        # Board 클래스
│   │   ├── game.ts         # GameEngine 클래스
│   │   ├── moves.ts        # 이동 생성 로직
│   │   └── position.ts     # 위치 유틸리티
│   ├── ai/                 # AI 구현
│   │   ├── minimax-ai.ts   # Minimax 알고리즘
│   │   └── random-ai.ts    # 랜덤 AI
│   └── stdlib/             # 표준 라이브러리
│       ├── standard-chess.ts  # 표준 체스 규칙
│       └── variants.ts     # 체스 변형
├── chesslang-web/          # Next.js 웹 앱
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── stores/         # Zustand 스토어
│   │   └── lib/            # 유틸리티
│   └── content/docs/       # MDX 문서
└── tests/                  # 테스트
    ├── engine/             # 엔진 테스트
    ├── lexer/              # 렉서 테스트
    ├── parser/             # 파서 테스트
    └── integration/        # 통합 테스트
```

## 코딩 컨벤션

### TypeScript

```typescript
// ✅ 좋은 예
interface PieceDefinition {
  type: string;
  movePattern: Pattern;
  capturePattern?: Pattern;
  traits: Set<string>;
}

// ❌ 나쁜 예 (any 사용)
function getPiece(id: any): any {
  // ...
}
```

### 명명 규칙

| 종류 | 규칙 | 예시 |
|------|------|------|
| 변수/함수 | camelCase | `getLegalMoves`, `pieceId` |
| 클래스/인터페이스 | PascalCase | `GameEngine`, `PieceDefinition` |
| 상수 | UPPER_SNAKE_CASE | `STANDARD_PIECES`, `MAX_DEPTH` |
| 파일 | kebab-case | `game-engine.ts`, `standard-chess.ts` |

### 파일 구조

- 한 파일당 300줄 이하 유지
- 관련 기능은 같은 디렉토리에 그룹화
- 순환 의존성 피하기

### 함수 작성 원칙

```typescript
// ✅ 한 가지 역할만 수행
function isInCheck(board: Board, player: Player): boolean {
  const kingPos = findKingPosition(board, player);
  return isPositionAttacked(board, kingPos, opponent(player));
}

// ❌ 여러 역할 혼합
function checkAndMakeMove(board: Board, move: Move): boolean {
  // 체크 검사, 이동 실행, 상태 업데이트 등 혼합
}
```

### 주석

```typescript
/**
 * 지정된 위치에서 가능한 모든 이동을 생성합니다.
 *
 * @param board - 현재 보드 상태
 * @param piece - 이동할 기물
 * @returns 가능한 이동 목록
 */
function generateMoves(board: Board, piece: Piece): Move[] {
  // 구현
}
```

## 커밋 메시지 규칙

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입

| 타입 | 설명 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 포맷팅 (로직 변경 없음) |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정 등 기타 변경 |

### 예시

```bash
# 새 기능
feat(engine): add castling move generation

# 버그 수정
fix(parser): handle empty trigger blocks correctly

# 문서
docs(readme): add installation instructions

# 리팩토링
refactor(lexer): extract token scanning logic
```

## 풀 리퀘스트 프로세스

### 1. 브랜치 생성

```bash
# 기능 브랜치
git checkout -b feat/new-feature

# 버그 수정 브랜치
git checkout -b fix/bug-description
```

### 2. 변경사항 커밋

```bash
git add .
git commit -m "feat(engine): add en passant support"
```

### 3. 테스트 통과 확인

```bash
npm run test
npm run lint
```

### 4. PR 생성

- 명확한 제목과 설명 작성
- 관련 이슈 링크
- 변경사항 요약
- 테스트 방법 설명

### PR 체크리스트

- [ ] 테스트가 통과합니다
- [ ] 린트 에러가 없습니다
- [ ] 새 기능에 대한 테스트를 추가했습니다
- [ ] 문서를 업데이트했습니다 (해당되는 경우)
- [ ] 커밋 메시지가 컨벤션을 따릅니다

## 테스트 가이드

### 테스트 실행

```bash
# 전체 테스트
npm run test

# 특정 파일
npm run test -- tests/engine/game.test.ts

# 워치 모드
npm run test -- --watch

# 커버리지
npm run test:coverage
```

### 테스트 작성

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../src/engine/game';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(STANDARD_CHESS);
  });

  it('should generate legal moves for starting position', () => {
    const moves = engine.getLegalMoves();
    // 폰 16개 이동 + 나이트 4개 이동 = 20
    expect(moves.length).toBe(20);
  });

  it('should detect checkmate', () => {
    // Fool's mate 설정
    engine.makeMove(/* e4 */);
    engine.makeMove(/* f6 */);
    engine.makeMove(/* Bc4 */);
    engine.makeMove(/* g5 */);
    engine.makeMove(/* Qh5 */);

    expect(engine.isCheckmate()).toBe(true);
  });
});
```

### 테스트 구조

- `describe`: 테스트 그룹
- `it` / `test`: 개별 테스트
- `beforeEach` / `afterEach`: 설정/정리
- `expect`: 단언문

## 이슈 리포팅

### 버그 리포트

버그 리포트에는 다음 정보를 포함해주세요:

1. **버그 설명**: 무엇이 잘못되었나요?
2. **재현 단계**: 버그를 재현하는 방법
3. **예상 동작**: 어떻게 동작해야 하나요?
4. **실제 동작**: 실제로 어떻게 동작하나요?
5. **환경**: Node.js 버전, OS 등

### 기능 요청

1. **문제 설명**: 어떤 문제를 해결하고 싶나요?
2. **제안하는 해결책**: 어떤 기능을 원하나요?
3. **대안**: 고려한 다른 방법이 있나요?
4. **추가 컨텍스트**: 관련된 예시나 참고 자료

### 이슈 템플릿

```markdown
## 버그 리포트

### 설명
[버그에 대한 간단한 설명]

### 재현 단계
1. '...'로 이동
2. '...'를 클릭
3. '...'까지 스크롤
4. 에러 확인

### 예상 동작
[어떻게 동작해야 하는지 설명]

### 스크린샷
[해당되는 경우 스크린샷 추가]

### 환경
- OS: [예: macOS 14.0]
- Node.js: [예: 20.10.0]
- 브라우저: [예: Chrome 120]
```

## 🔧 개발 팁

### 디버깅

```typescript
// 토큰 스트림 확인
const lexer = new Lexer(source);
const tokens = lexer.tokenize();
console.log(tokens.map(t => `${t.type}: ${t.value}`));

// AST 확인
const parser = new Parser(tokens);
const ast = parser.parse();
console.log(JSON.stringify(ast, null, 2));
```

### 자주 하는 실수

1. **Position vs Square**: `Position`은 `{ file, rank }` 객체, `Square`는 `"e4"` 문자열
2. **Owner vs Player**: 기물의 `owner`와 현재 `turn`을 혼동하지 마세요
3. **Move 복사**: 이동을 수정할 때는 항상 새 객체를 생성하세요

## 📞 도움이 필요하신가요?

- GitHub Issues에서 질문해주세요
- 기존 이슈와 PR을 참고하세요

---

감사합니다! 🙏
