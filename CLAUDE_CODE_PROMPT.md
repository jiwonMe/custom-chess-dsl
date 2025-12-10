# ChessLang DSL Implementation Prompt

## Project Overview

ChessLang는 체스 변형 게임을 정의하기 위한 도메인 특화 언어(DSL)입니다. 3단계 계층 구조로 설계되어, 간단한 설정부터 복잡한 스크립트까지 점진적으로 복잡성을 다룰 수 있습니다.

## Goals

1. **ChessLang DSL Parser** - 3-Level 문법 파싱
2. **Compiler/Interpreter** - DSL을 실행 가능한 게임으로 변환
3. **Linter** - 문법 오류 및 의미 오류 검출
4. **Debugger** - 게임 상태 추적 및 디버깅
5. **Language Server (LSP)** - IDE 지원 (자동완성, 호버, 진단)
6. **CLI Tool** - 게임 실행, 검증, 테스트

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ChessLang Toolchain                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Source (.cl)                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │  Lexer  │ -> │ Parser  │ -> │   AST   │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
│                                      │                      │
│                    ┌─────────────────┼─────────────────┐    │
│                    │                 │                 │    │
│                    ▼                 ▼                 ▼    │
│              ┌──────────┐     ┌──────────┐     ┌──────────┐ │
│              │  Linter  │     │ Compiler │     │   LSP    │ │
│              └──────────┘     └──────────┘     └──────────┘ │
│                                      │                      │
│                                      ▼                      │
│                               ┌──────────┐                  │
│                               │  Engine  │                  │
│                               └──────────┘                  │
│                                      │                      │
│                    ┌─────────────────┼─────────────────┐    │
│                    │                 │                 │    │
│                    ▼                 ▼                 ▼    │
│              ┌──────────┐     ┌──────────┐     ┌──────────┐ │
│              │   CLI    │     │ Debugger │     │   Web    │ │
│              └──────────┘     └──────────┘     └──────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## DSL Specification

### Level 1: Configure (YAML-like)

가장 간단한 형태. 기존 게임을 확장하고 설정만 변경.

```yaml
game: "King of the Hill"
extends: "Standard Chess"

board:
  zones:
    hill: [d4, d5, e4, e5]

victory:
  add:
    hill: King in zone.hill

rules:
  castling: true
  en_passant: true
```

**Level 1 Grammar (EBNF):**

```ebnf
level1_file     = game_decl extend_decl? section* ;
game_decl       = "game:" string ;
extend_decl     = "extends:" string ;
section         = board_section | pieces_section | setup_section 
                | victory_section | draw_section | rules_section ;

board_section   = "board:" indent board_props ;
board_props     = (size_prop | zones_prop)* ;
size_prop       = "size:" number "x" number ;
zones_prop      = "zones:" indent zone_def+ ;
zone_def        = identifier ":" square_list ;
square_list     = "[" square ("," square)* "]" ;
square          = file_char rank_char ;

pieces_section  = "pieces:" indent piece_config+ ;
piece_config    = piece_name ":" indent piece_props ;
piece_props     = (promote_to_prop | other_prop)* ;

setup_section   = "setup:" indent setup_commands ;
setup_commands  = (add_cmd | remove_cmd | clear_cmd | place_cmd)* ;
add_cmd         = "add:" indent placement+ ;
remove_cmd      = "remove:" indent removal+ ;
placement       = color ":" "{" square ":" piece_name ("," ...)* "}" ;

victory_section = "victory:" indent victory_commands ;
# NOTE: Multiple victory conditions are combined with OR logic
# (Any condition satisfied -> game ends)
# For AND logic, use "and" within a single condition expression
victory_commands= (add_cmd | replace_cmd | remove_cmd)* ;
add_cmd_vic     = "add:" indent victory_cond+ ;        # OR: base conditions OR new conditions
replace_cmd     = "replace:" indent victory_cond+ ;    # Replace condition by name
remove_cmd_vic  = "remove:" indent identifier+ ;       # Remove condition by name
victory_cond    = identifier ":" condition_expr ;

draw_section    = "draw:" indent draw_commands ;
# NOTE: Same OR logic applies to draw conditions

rules_section   = "rules:" indent rule_toggle+ ;
rule_toggle     = identifier ":" boolean ;

string          = '"' [^"]* '"' ;
identifier      = [a-zA-Z_][a-zA-Z0-9_]* ;
number          = [0-9]+ ;
boolean         = "true" | "false" ;
file_char       = [a-h] ;
rank_char       = [1-8] ;
color           = "White" | "Black" ;
piece_name      = "King" | "Queen" | "Rook" | "Bishop" | "Knight" | "Pawn" | identifier ;
```

---

### Level 2: Compose (Declarative DSL)

새로운 기물, 패턴, 트리거 정의 가능.

```
game: "Trapper Chess"
extends: "Standard Chess"

effect trap {
    blocks: enemy
    visual: "X"
}

piece Trapper {
    move: step(any)
    capture: =move
    state: { traps: 0 }
}

trigger place_trap {
    on: move
    when: piece.type == Trapper and piece.state.traps < 3
    do:
        mark origin with trap
        set piece.state.traps += 1
}

setup:
    add:
        White: { c1: Trapper }
        Black: { c8: Trapper }
```

**Level 2 Grammar (EBNF):**

```ebnf
level2_file     = level1_content level2_content* ;
level2_content  = pattern_def | piece_def | effect_def | trigger_def | action_def ;

(* Pattern Definition *)
pattern_def     = "pattern" identifier "=" pattern_expr ;
pattern_expr    = pattern_term ("|" pattern_term)* ;
pattern_term    = pattern_factor ("+" pattern_factor)* ;
pattern_factor  = pattern_base ("*" number)? condition_clause? ;
pattern_base    = step_pattern | slide_pattern | leap_pattern | hop_pattern 
                | "(" pattern_expr ")" | identifier ;
step_pattern    = "step" "(" direction ("," number)? ")" ;
slide_pattern   = "slide" "(" direction ")" ;
leap_pattern    = "leap" "(" number "," number ")" ;
hop_pattern     = "hop" "(" direction ")" ;
direction       = "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW" 
                | "orthogonal" | "diagonal" | "any" | "forward" | "backward" ;
condition_clause= "where" condition_expr ;

(* Piece Definition *)
piece_def       = "piece" identifier "{" piece_body "}" ;
piece_body      = piece_member* ;
piece_member    = move_def | capture_def | traits_def | state_def | trigger_inline ;
move_def        = "move:" pattern_expr ;
capture_def     = "capture:" (pattern_expr | "=move" | "none") ;
traits_def      = "traits:" "[" trait_list "]" ;
trait_list      = trait ("," trait)* ;
trait           = "royal" | "jump" | "promote" | identifier ;
state_def       = "state:" "{" state_pairs "}" ;
state_pairs     = (identifier ":" literal)* ;

(* Effect Definition *)
effect_def      = "effect" identifier "{" effect_body "}" ;
effect_body     = effect_prop* ;
effect_prop     = blocks_prop | visual_prop ;
blocks_prop     = "blocks:" ("none" | "enemy" | "friend" | "all") ;
visual_prop     = "visual:" string ;

(* Trigger Definition *)
trigger_def     = "trigger" identifier "{" trigger_body "}" ;
trigger_body    = on_clause when_clause? do_clause ;
on_clause       = "on:" event_type ;
event_type      = "move" | "capture" | "captured" | "turn_start" | "turn_end" 
                | "check" | "enter_zone" | "exit_zone" ;
when_clause     = "when:" condition_expr ;
do_clause       = "do:" action_list ;
action_list     = action+ ;
action          = set_action | create_action | remove_action | transform_action 
                | mark_action | move_action | win_action | lose_action | draw_action ;
set_action      = "set" lvalue ("=" | "+=" | "-=") rvalue ;
create_action   = "create" identifier "at" position_expr "for" color ;
remove_action   = "remove" target_expr ;
transform_action= "transform" target_expr "to" identifier ;
mark_action     = "mark" position_expr "with" identifier ;
move_action     = "move" target_expr "to" position_expr ;
win_action      = "win" color_expr ;
lose_action     = "lose" color_expr ;
draw_action     = "draw" string? ;

(* Condition Expression *)
condition_expr  = condition_term (("and" | "or") condition_term)* ;
condition_term  = ("not")? condition_factor ;
condition_factor= comparison | membership | builtin_cond | "(" condition_expr ")" ;
comparison      = value_expr comp_op value_expr ;
comp_op         = "==" | "!=" | "<" | ">" | "<=" | ">=" ;
membership      = value_expr "in" collection_expr ;
builtin_cond    = "empty" | "enemy" | "friend" | "clear" | "check" | identifier ;

(* Value Expressions *)
value_expr      = literal | lvalue | function_call ;
lvalue          = identifier ("." identifier)* ;
literal         = number | string | boolean | square ;
function_call   = identifier "(" arg_list? ")" ;
arg_list        = value_expr ("," value_expr)* ;
```

---

### Level 3: Script (JavaScript subset)

완전한 프로그래밍 가능.

```
game: "Lancer Chess"
extends: "Standard Chess"

piece Lancer {
    move: step(orthogonal)
    capture: =move
    state: { mounted: null }
}

script {
    // Mount action
    Lancer.actions.mount = function(board, piece) {
        if (piece.state.mounted) return [];
        
        return adjacent(piece.pos)
            .filter(pos => {
                let target = board.at(pos);
                return target 
                    && target.type === 'Knight'
                    && target.owner === piece.owner;
            })
            .map(pos => ({
                type: 'mount',
                target: board.at(pos)
            }));
    };
    
    on('action:mount', (ctx) => {
        ctx.piece.state.mounted = ctx.target;
        ctx.piece.pos = ctx.target.pos;
    });
    
    // Follow mounted knight
    on('move', (ctx) => {
        game.pieces
            .filter(p => p.type === 'Lancer' && p.state.mounted === ctx.piece)
            .forEach(lancer => {
                lancer.pos = ctx.piece.pos;
            });
    });
}
```

**Level 3 Grammar (EBNF):**

```ebnf
level3_file     = level2_content* script_block* ;
script_block    = "script" "{" js_code "}" ;

(* JavaScript Subset *)
js_code         = statement* ;
statement       = var_decl | func_decl | if_stmt | for_stmt | while_stmt 
                | return_stmt | expr_stmt | block ;
var_decl        = ("let" | "const") identifier ("=" expression)? ";" ;
func_decl       = "function" identifier "(" param_list? ")" block ;
param_list      = identifier ("," identifier)* ;
block           = "{" statement* "}" ;
if_stmt         = "if" "(" expression ")" statement ("else" statement)? ;
for_stmt        = "for" "(" for_init ";" expression ";" expression ")" statement 
                | "for" "(" ("let" | "const")? identifier "of" expression ")" statement ;
while_stmt      = "while" "(" expression ")" statement ;
return_stmt     = "return" expression? ";" ;
expr_stmt       = expression ";" ;

expression      = assignment_expr ;
assignment_expr = lvalue_expr ("=" | "+=" | "-=" | "*=" | "/=") assignment_expr 
                | ternary_expr ;
ternary_expr    = logical_or ("?" expression ":" expression)? ;
logical_or      = logical_and ("||" logical_and)* ;
logical_and     = equality ("&&" equality)* ;
equality        = comparison (("==" | "===" | "!=" | "!==") comparison)* ;
comparison      = additive (("<" | ">" | "<=" | ">=") additive)* ;
additive        = multiplicative (("+" | "-") multiplicative)* ;
multiplicative  = unary (("*" | "/" | "%") unary)* ;
unary           = ("!" | "-" | "typeof")? postfix ;
postfix         = primary (call_expr | member_expr | index_expr)* ;
call_expr       = "(" arg_list? ")" ;
member_expr     = "." identifier ;
index_expr      = "[" expression "]" ;
primary         = literal | identifier | array_literal | object_literal 
                | func_expr | arrow_func | "(" expression ")" ;
array_literal   = "[" (expression ("," expression)*)? "]" ;
object_literal  = "{" (property ("," property)*)? "}" ;
property        = (identifier | string) ":" expression ;
func_expr       = "function" "(" param_list? ")" block ;
arrow_func      = (identifier | "(" param_list? ")") "=>" (expression | block) ;
```

---

## Implementation Requirements

### 1. Lexer (`src/lexer/`)

```typescript
// Token types
enum TokenType {
    // Keywords
    GAME, EXTENDS, BOARD, PIECE, EFFECT, TRIGGER, PATTERN,
    MOVE, CAPTURE, TRAITS, STATE, ON, WHEN, DO, SCRIPT,
    
    // Literals
    NUMBER, STRING, BOOLEAN, IDENTIFIER, SQUARE,
    
    // Operators
    COLON, COMMA, DOT, PIPE, PLUS, STAR, EQUALS,
    LPAREN, RPAREN, LBRACE, RBRACE, LBRACKET, RBRACKET,
    EQ, NE, LT, GT, LE, GE, AND, OR, NOT,
    PLUS_EQ, MINUS_EQ,
    
    // Special
    INDENT, DEDENT, NEWLINE, EOF, ERROR
}

interface Token {
    type: TokenType;
    value: string;
    location: SourceLocation;
}

interface SourceLocation {
    line: number;
    column: number;
    offset: number;
    length: number;
}

class Lexer {
    constructor(source: string, filename?: string);
    tokenize(): Token[];
    peek(): Token;
    next(): Token;
    expect(type: TokenType): Token;
}
```

**Requirements:**
- Indentation-sensitive (Python-like) for Level 1
- Support both YAML-like and C-like syntax
- Track source locations for error reporting
- Handle comments (# and //)
- Unicode support for piece symbols

---

### 2. Parser (`src/parser/`)

```typescript
// AST Node types
interface ASTNode {
    type: string;
    location: SourceLocation;
}

interface GameNode extends ASTNode {
    type: 'Game';
    name: string;
    extends?: string;
    board?: BoardNode;
    pieces: PieceNode[];
    effects: EffectNode[];
    triggers: TriggerNode[];
    setup?: SetupNode;
    victory: VictoryNode[];
    draw: DrawNode[];
    scripts: ScriptNode[];
}

interface PieceNode extends ASTNode {
    type: 'Piece';
    name: string;
    move: PatternNode;
    capture: PatternNode | 'same' | 'none';
    traits: string[];
    state: Record<string, any>;
    triggers: TriggerNode[];
}

interface PatternNode extends ASTNode {
    type: 'Pattern';
    kind: 'step' | 'slide' | 'leap' | 'hop' | 'composite';
    // ... pattern details
}

class Parser {
    constructor(tokens: Token[]);
    parse(): GameNode;
    parseLevel1(): GameNode;
    parseLevel2(): GameNode;
    parseLevel3(): GameNode;
}
```

**Requirements:**
- Recursive descent parser
- Pratt parser for expressions (precedence climbing)
- Automatic level detection (L1/L2/L3)
- Rich error messages with suggestions
- Error recovery for multiple errors

---

### 3. Semantic Analyzer / Linter (`src/linter/`)

```typescript
interface Diagnostic {
    severity: 'error' | 'warning' | 'info' | 'hint';
    message: string;
    location: SourceLocation;
    code: string;
    suggestions?: Fix[];
}

interface Fix {
    description: string;
    edits: TextEdit[];
}

interface TextEdit {
    range: SourceRange;
    newText: string;
}

class Linter {
    constructor(ast: GameNode);
    analyze(): Diagnostic[];
    
    // Checks
    checkUndefinedReferences(): Diagnostic[];
    checkTypeErrors(): Diagnostic[];
    checkUnreachableCode(): Diagnostic[];
    checkPatternValidity(): Diagnostic[];
    checkCircularDependencies(): Diagnostic[];
    checkUnusedDefinitions(): Diagnostic[];
}
```

**Checks to implement:**
- Undefined piece/pattern/effect references
- Type mismatches in expressions
- Invalid move patterns (e.g., negative distances)
- Unreachable trigger conditions
- Circular extends dependencies
- Unused definitions
- Duplicate names
- Invalid square notation
- Missing required fields
- Deprecated syntax warnings

---

### 4. Compiler (`src/compiler/`)

```typescript
interface CompiledGame {
    name: string;
    board: BoardConfig;
    pieces: Map<string, CompiledPiece>;
    effects: Map<string, CompiledEffect>;
    triggers: CompiledTrigger[];
    setup: SetupConfig;
    rules: RuleConfig;
    victory: CompiledCondition[];
    draw: CompiledCondition[];
    scripts: CompiledScript[];
}

interface CompiledPiece {
    name: string;
    getMoves(board: Board, piece: Piece): Move[];
    getCaptures(board: Board, piece: Piece): Move[];
    traits: Set<string>;
    initialState: Record<string, any>;
}

class Compiler {
    constructor(ast: GameNode);
    compile(): CompiledGame;
    
    // Optimization
    optimizePatterns(): void;
    inlineTriggers(): void;
    precomputeMoves(): void;
}
```

**Requirements:**
- Resolve extends hierarchy
- Compile patterns to move generators
- Compile triggers to event handlers
- Compile conditions to predicates
- Optimize for performance
- Support incremental compilation

---

### 5. Interpreter/Engine (`src/engine/`)

```typescript
class GameEngine {
    constructor(compiled: CompiledGame);
    
    // Game state
    getState(): GameState;
    setState(state: GameState): void;
    
    // Moves
    getLegalMoves(): Move[];
    makeMove(move: Move): MoveResult;
    undoMove(): boolean;
    
    // Game flow
    isGameOver(): boolean;
    getResult(): GameResult;
    
    // Events
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
    emit(event: string, data: any): void;
}

interface MoveResult {
    success: boolean;
    captured?: Piece;
    events: GameEvent[];
    newState: GameState;
}
```

---

### 6. Debugger (`src/debugger/`)

```typescript
interface Breakpoint {
    id: number;
    location: SourceLocation;
    condition?: string;
    enabled: boolean;
}

interface StackFrame {
    name: string;
    location: SourceLocation;
    locals: Map<string, any>;
}

class Debugger {
    constructor(engine: GameEngine, source: string);
    
    // Breakpoints
    setBreakpoint(location: SourceLocation, condition?: string): Breakpoint;
    removeBreakpoint(id: number): void;
    listBreakpoints(): Breakpoint[];
    
    // Execution control
    continue(): void;
    stepOver(): void;
    stepInto(): void;
    stepOut(): void;
    pause(): void;
    
    // Inspection
    getStackTrace(): StackFrame[];
    evaluate(expr: string): any;
    getVariables(): Map<string, any>;
    
    // State
    getGameState(): GameState;
    getBoard(): Board;
    getPieces(): Piece[];
    
    // Time travel
    getMoveHistory(): Move[];
    goToMove(index: number): void;
    
    // Events
    on(event: 'breakpoint' | 'step' | 'error', handler: Function): void;
}
```

**Features:**
- Breakpoints on triggers, moves, conditions
- Step through game turns
- Inspect piece states
- Watch expressions
- Time-travel debugging (move history)
- Conditional breakpoints

---

### 7. Language Server (LSP) (`src/lsp/`)

```typescript
class ChessLangServer {
    // Document sync
    onDidOpenTextDocument(doc: TextDocument): void;
    onDidChangeTextDocument(doc: TextDocument, changes: TextDocumentChange[]): void;
    onDidCloseTextDocument(doc: TextDocument): void;
    
    // Language features
    onCompletion(params: CompletionParams): CompletionItem[];
    onHover(params: HoverParams): Hover;
    onDefinition(params: DefinitionParams): Location[];
    onReferences(params: ReferenceParams): Location[];
    onDocumentSymbol(params: DocumentSymbolParams): DocumentSymbol[];
    onRename(params: RenameParams): WorkspaceEdit;
    onCodeAction(params: CodeActionParams): CodeAction[];
    onFormatting(params: FormattingParams): TextEdit[];
    
    // Diagnostics
    publishDiagnostics(uri: string, diagnostics: Diagnostic[]): void;
}
```

**Features:**
- Syntax highlighting (TextMate grammar)
- Auto-completion for keywords, pieces, patterns
- Hover information
- Go to definition
- Find all references
- Symbol outline
- Code formatting
- Quick fixes for common errors
- Snippets for common patterns

---

### 8. CLI (`src/cli/`)

```bash
chesslang <command> [options] [file]

Commands:
  parse     Parse a .cl file and show AST
  lint      Check for errors and warnings
  compile   Compile to executable game
  run       Run a game interactively
  debug     Run with debugger
  test      Run test cases
  format    Format source code
  lsp       Start language server

Options:
  --level   Force specific level (1, 2, 3)
  --output  Output file/directory
  --format  Output format (json, pretty, binary)
  --watch   Watch for changes
  --verbose Show detailed output
  --quiet   Suppress output
```

---

## Standard Library (`src/stdlib/`)

### Standard Games

```
stdlib/
├── games/
│   ├── standard-chess.cl      # 표준 체스
│   ├── chess960.cl            # 피셔 랜덤
│   ├── crazyhouse.cl          # 크레이지하우스
│   ├── atomic.cl              # 아토믹
│   ├── three-check.cl         # 쓰리체크
│   ├── king-of-the-hill.cl    # 킹 오브 더 힐
│   ├── horde.cl               # 호드
│   └── racing-kings.cl        # 레이싱 킹즈
│
├── pieces/
│   ├── standard.cl            # K Q R B N P
│   ├── fairy/
│   │   ├── amazon.cl          # Q + N
│   │   ├── archbishop.cl      # B + N
│   │   ├── chancellor.cl      # R + N
│   │   └── ...
│   └── custom/
│       ├── trapper.cl
│       └── ...
│
├── patterns/
│   ├── basic.cl               # step, slide, leap
│   └── composite.cl           # 조합 패턴들
│
└── effects/
    ├── trap.cl
    ├── void.cl
    └── ...
```

### Standard Chess Definition

```
-- stdlib/games/standard-chess.cl

game: "Standard Chess"

board:
    size: 8x8
    zones:
        white_promotion: rank(8)
        black_promotion: rank(1)
        white_castle_kingside: [e1, f1, g1]
        white_castle_queenside: [e1, d1, c1, b1]
        black_castle_kingside: [e8, f8, g8]
        black_castle_queenside: [e8, d8, c8, b8]

piece King {
    move: step(any)
    capture: =move
    traits: [royal]
    state: { moved: false }
}

piece Queen {
    move: slide(any)
    capture: =move
}

piece Rook {
    move: slide(orthogonal)
    capture: =move
    state: { moved: false }
}

piece Bishop {
    move: slide(diagonal)
    capture: =move
}

piece Knight {
    move: leap(2, 1)
    capture: =move
    traits: [jump]
}

piece Pawn {
    move: step(forward) where empty
        | step(forward, 2) where empty and clear and first_move
    capture: step(forward + diagonal) where enemy
    traits: [promote]
    state: { just_double: false }
}

trigger pawn_double_move {
    on: move
    when: piece.type == Pawn and distance(from, to) == 2
    do: set piece.state.just_double = true
}

trigger clear_double_move {
    on: turn_end
    do: 
        for p in pieces where p.type == Pawn:
            set p.state.just_double = false
}

trigger en_passant {
    on: move
    when: piece.type == Pawn 
        and capture 
        and empty(to)
        and adjacent_enemy.state.just_double
    do:
        remove adjacent_enemy
}

trigger promotion {
    on: move
    when: piece.type == Pawn and (to in zone.white_promotion or to in zone.black_promotion)
    do:
        let choice = choose([Queen, Rook, Bishop, Knight])
        transform piece to choice
}

trigger castling_kingside {
    on: move
    when: piece.type == King 
        and not piece.state.moved
        and to.file == from.file + 2
    do:
        let rook = piece_at(from + (3, 0))
        move rook to from + (1, 0)
        set piece.state.moved = true
        set rook.state.moved = true
}

trigger castling_queenside {
    on: move
    when: piece.type == King
        and not piece.state.moved
        and to.file == from.file - 2
    do:
        let rook = piece_at(from + (-4, 0))
        move rook to from + (-1, 0)
        set piece.state.moved = true
        set rook.state.moved = true
}

trigger mark_king_moved {
    on: move
    when: piece.type == King
    do: set piece.state.moved = true
}

trigger mark_rook_moved {
    on: move
    when: piece.type == Rook
    do: set piece.state.moved = true
}

setup:
    White:
        rank(1): [R, N, B, Q, K, B, N, R]
        rank(2): P * 8
    Black:
        rank(8): [R, N, B, Q, K, B, N, R]
        rank(7): P * 8

victory:
    checkmate: in_check and no_legal_moves

draw:
    stalemate: not in_check and no_legal_moves
    repetition: position_count >= 3
    fifty_move: half_move_clock >= 100
    insufficient:
        K vs K
        or KB vs K
        or KN vs K
        or KB vs KB where same_color_bishops

rules:
    check_detection: true
    castling: true
    en_passant: true
    promotion: true
    fifty_move_rule: true
    threefold_repetition: true
```

---

## Project Structure

```
chesslang/
├── package.json
├── tsconfig.json
├── README.md
│
├── src/
│   ├── index.ts              # Main entry
│   │
│   ├── types/
│   │   ├── index.ts          # Core types
│   │   ├── ast.ts            # AST node types
│   │   └── errors.ts         # Error types
│   │
│   ├── lexer/
│   │   ├── index.ts          # Lexer
│   │   ├── tokens.ts         # Token types
│   │   └── scanner.ts        # Character scanner
│   │
│   ├── parser/
│   │   ├── index.ts          # Parser entry
│   │   ├── level1.ts         # Level 1 parser
│   │   ├── level2.ts         # Level 2 parser
│   │   ├── level3.ts         # Level 3 parser
│   │   ├── expressions.ts    # Expression parser
│   │   └── patterns.ts       # Pattern parser
│   │
│   ├── linter/
│   │   ├── index.ts          # Linter entry
│   │   ├── rules/            # Lint rules
│   │   │   ├── undefined.ts
│   │   │   ├── types.ts
│   │   │   └── ...
│   │   └── fixes.ts          # Quick fixes
│   │
│   ├── compiler/
│   │   ├── index.ts          # Compiler entry
│   │   ├── resolver.ts       # Resolve extends
│   │   ├── patterns.ts       # Compile patterns
│   │   ├── triggers.ts       # Compile triggers
│   │   └── optimizer.ts      # Optimizations
│   │
│   ├── engine/
│   │   ├── index.ts          # Engine entry
│   │   ├── board.ts          # Board state
│   │   ├── piece.ts          # Piece logic
│   │   ├── moves.ts          # Move generation
│   │   ├── rules.ts          # Rule checking
│   │   └── game.ts           # Game flow
│   │
│   ├── debugger/
│   │   ├── index.ts          # Debugger entry
│   │   ├── breakpoints.ts    # Breakpoint handling
│   │   ├── stepping.ts       # Step execution
│   │   └── inspector.ts      # State inspection
│   │
│   ├── lsp/
│   │   ├── index.ts          # LSP server
│   │   ├── completion.ts     # Auto-completion
│   │   ├── hover.ts          # Hover info
│   │   ├── definition.ts     # Go to definition
│   │   └── diagnostics.ts    # Diagnostics
│   │
│   ├── cli/
│   │   ├── index.ts          # CLI entry
│   │   ├── commands/         # Command handlers
│   │   │   ├── parse.ts
│   │   │   ├── lint.ts
│   │   │   ├── run.ts
│   │   │   └── ...
│   │   └── repl.ts           # Interactive REPL
│   │
│   └── stdlib/
│       ├── index.ts          # Stdlib loader
│       ├── games/
│       ├── pieces/
│       └── patterns/
│
├── games/                    # Example games
│   ├── king-of-the-hill.cl
│   ├── atomic.cl
│   └── ...
│
├── tests/
│   ├── lexer/
│   ├── parser/
│   ├── compiler/
│   ├── engine/
│   └── integration/
│
└── docs/
    ├── language-spec.md
    ├── tutorial.md
    └── api.md
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (TypeScript, ESLint, Prettier)
- [ ] Core types definition
- [ ] Position and Board utilities
- [ ] Basic piece logic

### Phase 2: Lexer & Parser (Week 3-4)
- [ ] Lexer implementation
- [ ] Level 1 parser
- [ ] Level 2 parser
- [ ] Level 3 parser (JS subset)
- [ ] AST types

### Phase 3: Compiler & Engine (Week 5-6)
- [ ] AST to compiled game
- [ ] Pattern compilation
- [ ] Trigger compilation
- [ ] Move generation
- [ ] Game rules (check, castling, etc.)

### Phase 4: Linter (Week 7)
- [ ] Semantic analysis
- [ ] Error detection
- [ ] Warnings
- [ ] Quick fixes

### Phase 5: Debugger (Week 8)
- [ ] Breakpoints
- [ ] Step execution
- [ ] State inspection
- [ ] Time travel

### Phase 6: CLI & LSP (Week 9-10)
- [ ] CLI commands
- [ ] REPL
- [ ] LSP server
- [ ] VS Code extension

### Phase 7: Standard Library (Week 11)
- [ ] Standard chess
- [ ] Common variants
- [ ] Fairy pieces
- [ ] Documentation

### Phase 8: Polish (Week 12)
- [ ] Performance optimization
- [ ] Error messages
- [ ] Documentation
- [ ] Examples

---

## Testing Strategy

```typescript
// Unit tests for each component
describe('Lexer', () => {
    it('tokenizes Level 1 syntax', () => { ... });
    it('tokenizes Level 2 syntax', () => { ... });
    it('tokenizes Level 3 syntax', () => { ... });
    it('handles errors gracefully', () => { ... });
});

describe('Parser', () => {
    it('parses simple game definition', () => { ... });
    it('parses piece definitions', () => { ... });
    it('parses pattern expressions', () => { ... });
    it('parses script blocks', () => { ... });
});

describe('Engine', () => {
    it('generates legal moves for King', () => { ... });
    it('detects check', () => { ... });
    it('detects checkmate', () => { ... });
    it('handles castling', () => { ... });
    it('handles en passant', () => { ... });
    it('handles promotion', () => { ... });
});

// Integration tests
describe('Standard Chess', () => {
    it('plays Scholar\'s Mate', () => { ... });
    it('plays Opera Game', () => { ... });
});

// Snapshot tests for AST
describe('AST Snapshots', () => {
    it('matches snapshot for standard chess', () => { ... });
});
```

---

## Notes

1. **Error Messages**: 사용자 친화적인 에러 메시지 중요
   - 위치 정보 포함
   - 가능한 해결책 제안
   - 비슷한 이름 제안

2. **Performance**: 이동 생성은 성능 중요
   - 비트보드 고려
   - 이동 캐싱
   - 증분 업데이트

3. **Extensibility**: 새로운 기능 추가 용이하게
   - 플러그인 시스템 고려
   - 커스텀 룰 훅

4. **Compatibility**: 표준 체스 100% 호환
   - PGN 입출력
   - FEN 입출력
   - UCI 프로토콜 고려

---

---

# Part 2: ChessLang Web Platform

## Overview

ChessLang Web Platform은 브라우저에서 ChessLang DSL을 작성하고, 게임을 플레이하며, 문서를 참조할 수 있는 통합 웹 애플리케이션입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                  ChessLang Web Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Editor    │  │    Play     │  │    Docs     │         │
│  │  Playground │  │   Ground    │  │  Reference  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                    ┌─────▼─────┐                            │
│                    │  Engine   │                            │
│                    │  (WASM)   │                            │
│                    └───────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Web App Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Tech Stack                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend:                                                  │
│  ├─ Next.js 14+ (App Router)                               │
│  ├─ TypeScript                                              │
│  ├─ Tailwind CSS                                            │
│  ├─ shadcn/ui                                               │
│  ├─ Monaco Editor (코드 에디터)                             │
│  ├─ Framer Motion (애니메이션)                              │
│  └─ Zustand (상태 관리)                                     │
│                                                             │
│  Chess UI:                                                  │
│  ├─ react-chessboard 또는 커스텀                           │
│  └─ chess.js 호환 레이어                                   │
│                                                             │
│  Engine:                                                    │
│  ├─ ChessLang Core (브라우저 빌드)                         │
│  └─ Web Worker (메인 스레드 블로킹 방지)                   │
│                                                             │
│  Documentation:                                             │
│  ├─ MDX                                                     │
│  ├─ next-mdx-remote                                         │
│  └─ Shiki (syntax highlighting)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure (Web)

```
chesslang-web/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
│
├── public/
│   ├── pieces/              # 체스 기물 이미지
│   │   ├── standard/
│   │   └── custom/
│   └── sounds/              # 효과음
│
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Landing page
│   │   ├── globals.css
│   │   │
│   │   ├── playground/      # 코드 에디터 + 게임
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── components/
│   │   │
│   │   ├── play/            # 게임 플레이
│   │   │   ├── page.tsx     # 게임 목록
│   │   │   ├── [gameId]/    # 특정 게임
│   │   │   └── components/
│   │   │
│   │   ├── docs/            # 문서
│   │   │   ├── page.tsx     # 문서 홈
│   │   │   ├── [[...slug]]/ # 동적 문서 라우트
│   │   │   └── components/
│   │   │
│   │   ├── examples/        # 예제 갤러리
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │
│   │   └── api/             # API Routes
│   │       ├── compile/
│   │       ├── validate/
│   │       └── share/
│   │
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │
│   │   ├── editor/          # Monaco 에디터 관련
│   │   │   ├── Editor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── ErrorPanel.tsx
│   │   │   └── chesslang-language.ts  # Monaco 언어 정의
│   │   │
│   │   ├── board/           # 체스 보드 관련
│   │   │   ├── Board.tsx
│   │   │   ├── Square.tsx
│   │   │   ├── Piece.tsx
│   │   │   ├── MoveIndicator.tsx
│   │   │   ├── PromotionDialog.tsx
│   │   │   └── GameControls.tsx
│   │   │
│   │   ├── game/            # 게임 UI
│   │   │   ├── GamePanel.tsx
│   │   │   ├── MoveHistory.tsx
│   │   │   ├── CapturedPieces.tsx
│   │   │   ├── GameInfo.tsx
│   │   │   └── GameResult.tsx
│   │   │
│   │   ├── docs/            # 문서 컴포넌트
│   │   │   ├── DocsSidebar.tsx
│   │   │   ├── DocsNavigation.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   ├── InteractiveExample.tsx
│   │   │   └── APIReference.tsx
│   │   │
│   │   └── shared/          # 공통 컴포넌트
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── Logo.tsx
│   │
│   ├── lib/
│   │   ├── engine/          # ChessLang 엔진 래퍼
│   │   │   ├── index.ts
│   │   │   ├── worker.ts    # Web Worker
│   │   │   └── bridge.ts    # Worker 통신
│   │   │
│   │   ├── monaco/          # Monaco 설정
│   │   │   ├── language.ts  # 언어 정의
│   │   │   ├── theme.ts     # 테마
│   │   │   └── completion.ts # 자동완성
│   │   │
│   │   └── utils/
│   │       ├── cn.ts        # classnames 유틸
│   │       ├── storage.ts   # localStorage
│   │       └── share.ts     # 공유 기능
│   │
│   ├── hooks/
│   │   ├── useEngine.ts     # 엔진 훅
│   │   ├── useGame.ts       # 게임 상태 훅
│   │   ├── useEditor.ts     # 에디터 훅
│   │   └── useKeyboard.ts   # 키보드 단축키
│   │
│   ├── stores/
│   │   ├── editorStore.ts   # 에디터 상태
│   │   ├── gameStore.ts     # 게임 상태
│   │   └── settingsStore.ts # 설정
│   │
│   └── types/
│       ├── index.ts
│       └── engine.ts
│
├── content/                  # MDX 문서
│   ├── docs/
│   │   ├── index.mdx        # 소개
│   │   ├── getting-started/
│   │   │   ├── index.mdx
│   │   │   ├── installation.mdx
│   │   │   └── first-game.mdx
│   │   │
│   │   ├── language/
│   │   │   ├── index.mdx
│   │   │   ├── level1.mdx   # Level 1 문법
│   │   │   ├── level2.mdx   # Level 2 문법
│   │   │   ├── level3.mdx   # Level 3 문법
│   │   │   ├── patterns.mdx
│   │   │   ├── triggers.mdx
│   │   │   └── conditions.mdx
│   │   │
│   │   ├── reference/
│   │   │   ├── index.mdx
│   │   │   ├── keywords.mdx
│   │   │   ├── patterns.mdx
│   │   │   ├── directions.mdx
│   │   │   ├── conditions.mdx
│   │   │   ├── actions.mdx
│   │   │   ├── events.mdx
│   │   │   └── builtin-pieces.mdx
│   │   │
│   │   ├── examples/
│   │   │   ├── index.mdx
│   │   │   ├── king-of-the-hill.mdx
│   │   │   ├── atomic.mdx
│   │   │   ├── crazyhouse.mdx
│   │   │   └── custom-pieces.mdx
│   │   │
│   │   └── advanced/
│   │       ├── index.mdx
│   │       ├── scripting.mdx
│   │       ├── debugging.mdx
│   │       └── optimization.mdx
│   │
│   └── blog/                # 선택적: 블로그
│
└── examples/                # 예제 .cl 파일
    ├── standard-chess.cl
    ├── king-of-the-hill.cl
    ├── atomic.cl
    └── ...
```

---

## Page Specifications

### 1. Landing Page (`/`)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] ChessLang              [Playground] [Docs] [GitHub] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Define Chess Variants with Code                │
│                                                             │
│     ChessLang is a domain-specific language for            │
│     creating custom chess variants easily.                  │
│                                                             │
│         [Try Playground]    [Read Docs]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ game: "KOTH"     │  │    ┌───────┐     │                │
│  │ extends: ...     │  │    │ Board │     │                │
│  │ victory:         │  │    │  UI   │     │                │
│  │   hill: King in  │  │    └───────┘     │                │
│  └──────────────────┘  └──────────────────┘                │
│       Code                   Preview                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Features                                │
│                                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│  │3-Level │  │  Live  │  │  Rich  │  │ Share  │           │
│  │ System │  │  Play  │  │  Docs  │  │ Games  │           │
│  └────────┘  └────────┘  └────────┘  └────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   Example Variants                          │
│                                                             │
│  [King of the Hill] [Atomic] [Crazyhouse] [Three-Check]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Playground Page (`/playground`)

핵심 기능: 코드 작성 + 실시간 게임 플레이

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  ChessLang Playground     [Examples▾] [Share] [⚙]  │
├─────────────────────────────────────────────────────────────┤
│  [New] [Open] [Save] [Format] │ [▶ Run] [⏸] [↻ Reset]      │
├───────────────────────────────┴─────────────────────────────┤
│                         │                                   │
│  ┌───────────────────┐  │  ┌─────────────────────────────┐ │
│  │                   │  │  │                             │ │
│  │   Monaco Editor   │  │  │                             │ │
│  │                   │  │  │        Chess Board          │ │
│  │   - Syntax HL     │  │  │                             │ │
│  │   - Autocomplete  │  │  │        + Game Info          │ │
│  │   - Error marks   │  │  │                             │ │
│  │                   │  │  │                             │ │
│  │                   │  │  └─────────────────────────────┘ │
│  │                   │  │  ┌─────────────────────────────┐ │
│  │                   │  │  │  Move History  │  Captured  │ │
│  │                   │  │  │  1. e4  e5    │  ♟♟        │ │
│  │                   │  │  │  2. Nf3 Nc6   │             │ │
│  └───────────────────┘  │  └─────────────────────────────┘ │
├─────────────────────────┴───────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Problems (2)  │  Output  │  Debug                   │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ ⚠ Line 15: Unknown piece type 'Amazon'             │    │
│  │ ✗ Line 23: Expected ':' after 'move'               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**기능:**
- Monaco Editor with ChessLang syntax highlighting
- 실시간 문법 검사 (타이핑 중)
- 자동완성 (키워드, 기물, 패턴)
- 에러 마커 표시
- 코드 포맷팅
- 예제 로드
- 공유 링크 생성 (URL에 코드 인코딩 또는 서버 저장)
- 로컬 저장 (localStorage)
- 게임 보드 실시간 미리보기
- 이동 히스토리
- Undo/Redo
- 게임 리셋
- 디버그 패널 (기물 상태, 트리거 로그)

### 3. Play Page (`/play`)

게임 목록 및 플레이

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Play Chess Variants          [Playground] [Docs]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Popular Variants                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Standard   │ │ KOTH       │ │ Atomic     │              │
│  │ Chess      │ │            │ │            │              │
│  │ [Play]     │ │ [Play]     │ │ [Play]     │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Crazyhouse │ │ Three-Check│ │ Chess960   │              │
│  │            │ │            │ │            │              │
│  │ [Play]     │ │ [Play]     │ │ [Play]     │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│  Community Variants                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ User Game  │ │ User Game  │ │ User Game  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Documentation Page (`/docs`)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  ChessLang Docs           [Playground] [GitHub]     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                           │
│  │ Search...    │                                           │
│  └──────────────┘                                           │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  Getting Started │  # Getting Started                       │
│  ├─ Introduction │                                          │
│  ├─ Installation │  ChessLang is a domain-specific         │
│  └─ First Game   │  language for defining chess variants.  │
│                  │                                          │
│  Language Guide  │  ## Quick Example                        │
│  ├─ Level 1      │                                          │
│  ├─ Level 2      │  ```chesslang                           │
│  ├─ Level 3      │  game: "King of the Hill"               │
│  ├─ Patterns     │  extends: "Standard Chess"              │
│  └─ Triggers     │  ...                                    │
│                  │  ```                                     │
│  Reference       │                                          │
│  ├─ Keywords     │  [▶ Try in Playground]                  │
│  ├─ Patterns     │                                          │
│  ├─ Directions   │  ## Next Steps                          │
│  ├─ Conditions   │                                          │
│  ├─ Actions      │  - Read the Language Guide              │
│  └─ Events       │  - Explore Examples                     │
│                  │  - Join the Community                   │
│  Examples        │                                          │
│  └─ ...          │                                          │
│                  │  ← Previous    Next →                    │
└──────────────────┴──────────────────────────────────────────┘
```

**문서 기능:**
- 검색
- 사이드바 네비게이션
- 코드 블록 syntax highlighting
- "Try in Playground" 버튼 (코드 블록 → Playground로 이동)
- Interactive examples (문서 내 미니 게임)
- 페이지 네비게이션 (이전/다음)
- 목차 (Table of Contents)
- 다크/라이트 모드

---

## Component Specifications

### Monaco Editor Integration

```typescript
// src/lib/monaco/language.ts

import * as monaco from 'monaco-editor';

export function registerChessLangLanguage() {
    // 언어 등록
    monaco.languages.register({ id: 'chesslang' });
    
    // 토큰 프로바이더 (Syntax Highlighting)
    monaco.languages.setMonarchTokensProvider('chesslang', {
        keywords: [
            'game', 'extends', 'board', 'piece', 'effect', 'trigger',
            'pattern', 'move', 'capture', 'traits', 'state', 'on',
            'when', 'do', 'script', 'setup', 'victory', 'draw', 'rules'
        ],
        
        patterns: ['step', 'slide', 'leap', 'hop'],
        
        directions: [
            'N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW',
            'orthogonal', 'diagonal', 'any', 'forward', 'backward'
        ],
        
        conditions: [
            'empty', 'enemy', 'friend', 'clear', 'check',
            'first_move', 'in', 'and', 'or', 'not'
        ],
        
        actions: [
            'set', 'create', 'remove', 'transform', 'mark',
            'win', 'lose', 'add'
        ],
        
        traits: ['royal', 'jump', 'promote'],
        
        pieces: ['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn'],
        
        tokenizer: {
            root: [
                // Comments
                [/#.*$/, 'comment'],
                [/\/\/.*$/, 'comment'],
                
                // Strings
                [/"[^"]*"/, 'string'],
                
                // Keywords
                [/\b(game|extends|board|piece|effect|trigger|pattern|move|capture|traits|state|on|when|do|script|setup|victory|draw|rules)\b/, 'keyword'],
                
                // Patterns
                [/\b(step|slide|leap|hop)\b/, 'type.pattern'],
                
                // Directions
                [/\b(N|S|E|W|NE|NW|SE|SW|orthogonal|diagonal|any|forward|backward)\b/, 'constant.direction'],
                
                // Conditions
                [/\b(empty|enemy|friend|clear|check|first_move)\b/, 'variable.condition'],
                
                // Logical
                [/\b(and|or|not|in|where)\b/, 'keyword.operator'],
                
                // Actions
                [/\b(set|create|remove|transform|mark|win|lose|add)\b/, 'function.action'],
                
                // Traits
                [/\b(royal|jump|promote)\b/, 'constant.trait'],
                
                // Pieces
                [/\b(King|Queen|Rook|Bishop|Knight|Pawn)\b/, 'type.piece'],
                
                // Square notation
                [/\b[a-h][1-8]\b/, 'number.square'],
                
                // Numbers
                [/\b\d+\b/, 'number'],
                
                // Identifiers
                [/[a-zA-Z_]\w*/, 'identifier'],
                
                // Operators
                [/[=<>!]=?/, 'operator'],
                [/[+\-*\/|&]/, 'operator'],
                
                // Brackets
                [/[{}()\[\]]/, '@brackets'],
                
                // Delimiters
                [/[,:]/, 'delimiter'],
            ],
        }
    });
    
    // 자동완성
    monaco.languages.registerCompletionItemProvider('chesslang', {
        provideCompletionItems: (model, position) => {
            const suggestions: monaco.languages.CompletionItem[] = [];
            
            // 키워드 자동완성
            const keywords = ['game', 'extends', 'board', 'piece', ...];
            keywords.forEach(kw => {
                suggestions.push({
                    label: kw,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: kw,
                });
            });
            
            // 스니펫
            suggestions.push({
                label: 'piece',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                    'piece ${1:Name} {',
                    '    move: ${2:step(any)}',
                    '    capture: =move',
                    '    traits: [${3}]',
                    '}'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new piece'
            });
            
            return { suggestions };
        }
    });
    
    // 호버 정보
    monaco.languages.registerHoverProvider('chesslang', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;
            
            const docs: Record<string, string> = {
                'step': 'Move a fixed number of squares in a direction.\n\nUsage: `step(direction)` or `step(direction, distance)`',
                'slide': 'Move any number of squares in a direction until blocked.\n\nUsage: `slide(direction)`',
                'royal': 'Piece whose capture ends the game (like King).',
                // ...
            };
            
            if (docs[word.word]) {
                return {
                    contents: [{ value: docs[word.word] }]
                };
            }
            
            return null;
        }
    });
}
```

### Chess Board Component

```typescript
// src/components/board/Board.tsx

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Square } from './Square';
import { Piece } from './Piece';
import { MoveIndicator } from './MoveIndicator';
import { PromotionDialog } from './PromotionDialog';
import { useGame } from '@/hooks/useGame';
import { Position, Move } from '@/types';

interface BoardProps {
    flipped?: boolean;
    interactive?: boolean;
    highlightLastMove?: boolean;
    showCoordinates?: boolean;
    onMove?: (move: Move) => void;
}

export function Board({
    flipped = false,
    interactive = true,
    highlightLastMove = true,
    showCoordinates = true,
    onMove
}: BoardProps) {
    const { state, getLegalMoves, makeMove, selectedPiece, selectPiece } = useGame();
    const [promotionPending, setPromotionPending] = useState<Move | null>(null);
    
    const boardSize = state.board.length;
    const legalMoves = useMemo(() => 
        selectedPiece ? getLegalMoves(selectedPiece) : [],
        [selectedPiece, getLegalMoves]
    );
    
    const handleSquareClick = useCallback((pos: Position) => {
        if (!interactive) return;
        
        const clickedPiece = state.board[pos.rank][pos.file].piece;
        
        // 이미 선택된 기물이 있고, 클릭한 곳이 합법 이동인 경우
        if (selectedPiece) {
            const move = legalMoves.find(m => 
                m.to.file === pos.file && m.to.rank === pos.rank
            );
            
            if (move) {
                if (move.type === 'promotion') {
                    setPromotionPending(move);
                } else {
                    makeMove(move);
                    onMove?.(move);
                }
                selectPiece(null);
                return;
            }
        }
        
        // 자신의 기물 클릭 시 선택
        if (clickedPiece && clickedPiece.owner === state.currentPlayer) {
            selectPiece(clickedPiece);
        } else {
            selectPiece(null);
        }
    }, [interactive, selectedPiece, legalMoves, state, makeMove, selectPiece, onMove]);
    
    const handlePromotion = useCallback((pieceType: string) => {
        if (promotionPending) {
            const move = { ...promotionPending, promotion: pieceType };
            makeMove(move);
            onMove?.(move);
            setPromotionPending(null);
        }
    }, [promotionPending, makeMove, onMove]);
    
    // 랭크/파일 순서 (뒤집기 지원)
    const ranks = flipped 
        ? Array.from({ length: boardSize }, (_, i) => i)
        : Array.from({ length: boardSize }, (_, i) => boardSize - 1 - i);
    const files = flipped
        ? Array.from({ length: boardSize }, (_, i) => boardSize - 1 - i)
        : Array.from({ length: boardSize }, (_, i) => i);
    
    return (
        <div className="relative">
            <div 
                className="grid gap-0 border-2 border-gray-800 rounded"
                style={{ 
                    gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                    aspectRatio: '1'
                }}
            >
                {ranks.map(rank => 
                    files.map(file => {
                        const pos = { file, rank };
                        const square = state.board[rank][file];
                        const piece = square.piece;
                        const isSelected = selectedPiece?.pos.file === file && 
                                          selectedPiece?.pos.rank === rank;
                        const isLegalMove = legalMoves.some(m => 
                            m.to.file === file && m.to.rank === rank
                        );
                        const isLastMove = highlightLastMove && 
                            state.lastMove && (
                                (state.lastMove.from.file === file && state.lastMove.from.rank === rank) ||
                                (state.lastMove.to.file === file && state.lastMove.to.rank === rank)
                            );
                        
                        return (
                            <Square
                                key={`${file}-${rank}`}
                                pos={pos}
                                isLight={(file + rank) % 2 === 1}
                                isSelected={isSelected}
                                isLastMove={isLastMove}
                                onClick={() => handleSquareClick(pos)}
                                showCoordinates={showCoordinates}
                                showRank={file === (flipped ? boardSize - 1 : 0)}
                                showFile={rank === (flipped ? boardSize - 1 : 0)}
                            >
                                {piece && (
                                    <Piece
                                        type={piece.type}
                                        color={piece.owner}
                                        isDraggable={interactive && piece.owner === state.currentPlayer}
                                    />
                                )}
                                {isLegalMove && (
                                    <MoveIndicator 
                                        isCapture={square.piece !== null}
                                    />
                                )}
                            </Square>
                        );
                    })
                )}
            </div>
            
            {promotionPending && (
                <PromotionDialog
                    color={state.currentPlayer}
                    options={state.promotionOptions}
                    onSelect={handlePromotion}
                    onCancel={() => setPromotionPending(null)}
                />
            )}
        </div>
    );
}
```

### Engine Hook

```typescript
// src/hooks/useEngine.ts

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Move, Piece, CompiledGame } from '@/types';

interface EngineMessage {
    type: 'compiled' | 'state' | 'moves' | 'error' | 'event';
    payload: any;
}

export function useEngine(source: string) {
    const workerRef = useRef<Worker | null>(null);
    const [state, setState] = useState<GameState | null>(null);
    const [compiled, setCompiled] = useState<CompiledGame | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [isCompiling, setIsCompiling] = useState(false);
    
    // Worker 초기화
    useEffect(() => {
        workerRef.current = new Worker(
            new URL('@/lib/engine/worker.ts', import.meta.url)
        );
        
        workerRef.current.onmessage = (e: MessageEvent<EngineMessage>) => {
            const { type, payload } = e.data;
            
            switch (type) {
                case 'compiled':
                    setCompiled(payload);
                    setIsCompiling(false);
                    setErrors([]);
                    break;
                case 'state':
                    setState(payload);
                    break;
                case 'moves':
                    // 합법 이동 응답 처리
                    break;
                case 'error':
                    setErrors(payload);
                    setIsCompiling(false);
                    break;
                case 'event':
                    // 게임 이벤트 (체크, 캡처 등)
                    break;
            }
        };
        
        return () => {
            workerRef.current?.terminate();
        };
    }, []);
    
    // 소스 변경 시 컴파일
    useEffect(() => {
        if (workerRef.current && source) {
            setIsCompiling(true);
            workerRef.current.postMessage({
                type: 'compile',
                payload: source
            });
        }
    }, [source]);
    
    // 이동 실행
    const makeMove = useCallback((move: Move) => {
        workerRef.current?.postMessage({
            type: 'move',
            payload: move
        });
    }, []);
    
    // 합법 이동 요청
    const getLegalMoves = useCallback((piece: Piece): Move[] => {
        // 동기적으로 필요하면 메인 스레드에서 계산
        // 또는 비동기로 Worker에 요청
        return [];
    }, [state]);
    
    // 게임 리셋
    const resetGame = useCallback(() => {
        workerRef.current?.postMessage({ type: 'reset' });
    }, []);
    
    // Undo
    const undo = useCallback(() => {
        workerRef.current?.postMessage({ type: 'undo' });
    }, []);
    
    return {
        state,
        compiled,
        errors,
        isCompiling,
        makeMove,
        getLegalMoves,
        resetGame,
        undo
    };
}
```

### Web Worker

```typescript
// src/lib/engine/worker.ts

import { Lexer } from 'chesslang/lexer';
import { Parser } from 'chesslang/parser';
import { Compiler } from 'chesslang/compiler';
import { GameEngine } from 'chesslang/engine';

let engine: GameEngine | null = null;

self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;
    
    switch (type) {
        case 'compile': {
            try {
                const tokens = new Lexer(payload).tokenize();
                const ast = new Parser(tokens).parse();
                const compiled = new Compiler(ast).compile();
                engine = new GameEngine(compiled);
                
                self.postMessage({
                    type: 'compiled',
                    payload: compiled
                });
                
                self.postMessage({
                    type: 'state',
                    payload: engine.getState()
                });
            } catch (error: any) {
                self.postMessage({
                    type: 'error',
                    payload: [error.message]
                });
            }
            break;
        }
        
        case 'move': {
            if (engine) {
                const result = engine.makeMove(payload);
                self.postMessage({
                    type: 'state',
                    payload: engine.getState()
                });
                
                if (result.events.length > 0) {
                    self.postMessage({
                        type: 'event',
                        payload: result.events
                    });
                }
            }
            break;
        }
        
        case 'reset': {
            if (engine) {
                engine.reset();
                self.postMessage({
                    type: 'state',
                    payload: engine.getState()
                });
            }
            break;
        }
        
        case 'undo': {
            if (engine) {
                engine.undoMove();
                self.postMessage({
                    type: 'state',
                    payload: engine.getState()
                });
            }
            break;
        }
        
        case 'getLegalMoves': {
            if (engine) {
                const moves = engine.getLegalMoves(payload);
                self.postMessage({
                    type: 'moves',
                    payload: moves
                });
            }
            break;
        }
    }
};
```

---

## Documentation Content Structure

### Reference Documentation

```mdx
// content/docs/reference/patterns.mdx

---
title: Movement Patterns
description: Complete reference for ChessLang movement patterns
---

# Movement Patterns

Movement patterns define how pieces can move on the board.

## Basic Patterns

### step

Moves a fixed number of squares in a direction.

```chesslang
step(direction)           // 1 square
step(direction, N)        // N squares
```

<InteractiveExample
  code={`piece Example {
    move: step(orthogonal)
}`}
  initialPosition="4k3/8/8/3E4/8/8/8/4K3"
/>

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| direction | Direction | Movement direction |
| distance | number | Number of squares (default: 1) |

**Examples:**

```chesslang
// King movement
move: step(any)

// Pawn initial double move
move: step(forward, 2) where first_move and clear
```

### slide

Moves any number of squares in a direction until blocked.

```chesslang
slide(direction)
```

<InteractiveExample
  code={`piece Example {
    move: slide(diagonal)
}`}
  initialPosition="4k3/8/8/3E4/8/8/8/4K3"
/>

**Examples:**

```chesslang
// Rook movement
move: slide(orthogonal)

// Bishop movement
move: slide(diagonal)

// Queen movement
move: slide(any)
```

### leap

Jumps to a specific offset, ignoring pieces in between.

```chesslang
leap(dx, dy)
```

<InteractiveExample
  code={`piece Example {
    move: leap(2, 1)
    traits: [jump]
}`}
  initialPosition="4k3/8/8/3E4/8/8/8/4K3"
/>

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| dx | number | File offset (can be negative) |
| dy | number | Rank offset (can be negative) |

**Note:** All 8 rotations/reflections are automatically included.

**Examples:**

```chesslang
// Knight movement
move: leap(2, 1)

// Camel movement (fairy piece)
move: leap(3, 1)

// Zebra movement (fairy piece)
move: leap(3, 2)
```

## Pattern Combinators

### Or (`|`)

Choose between multiple patterns.

```chesslang
pattern1 | pattern2
```

**Example:**

```chesslang
// Queen = Rook + Bishop
move: slide(orthogonal) | slide(diagonal)
```

### Then (`+`)

Sequential movement (for special pieces).

```chesslang
pattern1 + pattern2
```

**Example:**

```chesslang
// Gryphon: moves diagonally then orthogonally
move: step(diagonal) + slide(orthogonal)
```

### Repeat (`*`)

Repeat a pattern N times.

```chesslang
pattern * N
```

**Example:**

```chesslang
// Move exactly 3 squares
move: step(forward) * 3 where clear
```

---

## Directions Reference

| Direction | Vector | Description |
|-----------|--------|-------------|
| `N` | (0, 1) | North (up) |
| `S` | (0, -1) | South (down) |
| `E` | (1, 0) | East (right) |
| `W` | (-1, 0) | West (left) |
| `NE` | (1, 1) | Northeast |
| `NW` | (-1, 1) | Northwest |
| `SE` | (1, -1) | Southeast |
| `SW` | (-1, -1) | Southwest |
| `orthogonal` | N\|S\|E\|W | Cardinal directions |
| `diagonal` | NE\|NW\|SE\|SW | Diagonal directions |
| `any` | all 8 | All directions |
| `forward` | N for White, S for Black | Player-relative forward |
| `backward` | S for White, N for Black | Player-relative backward |

---

## See Also

- [Conditions](/docs/reference/conditions) - Pattern conditions
- [Piece Definition](/docs/language/level2#pieces) - Defining pieces
- [Examples](/docs/examples) - Real-world usage
```

### Interactive Example Component

```typescript
// src/components/docs/InteractiveExample.tsx

'use client';

import { useState } from 'react';
import { Board } from '@/components/board/Board';
import { useEngine } from '@/hooks/useEngine';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface InteractiveExampleProps {
    code: string;
    initialPosition?: string;  // FEN-like
    description?: string;
}

export function InteractiveExample({ 
    code, 
    initialPosition,
    description 
}: InteractiveExampleProps) {
    const fullCode = `
game: "Example"
extends: "Standard Chess"

${code}

setup:
    fromFEN: "${initialPosition || 'startpos'}"
`;
    
    const { state, errors, resetGame } = useEngine(fullCode);
    const [showMoves, setShowMoves] = useState(true);
    
    // Playground 링크 생성
    const playgroundUrl = `/playground?code=${encodeURIComponent(code)}`;
    
    return (
        <div className="my-6 border rounded-lg overflow-hidden">
            <div className="bg-muted p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Interactive Example</span>
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={resetGame}
                        >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reset
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            asChild
                        >
                            <Link href={playgroundUrl} target="_blank">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Open in Playground
                            </Link>
                        </Button>
                    </div>
                </div>
                
                {description && (
                    <p className="text-sm text-muted-foreground mb-4">
                        {description}
                    </p>
                )}
                
                <div className="max-w-[300px] mx-auto">
                    {state && !errors.length ? (
                        <Board 
                            interactive={true}
                            highlightLastMove={true}
                            showCoordinates={false}
                        />
                    ) : (
                        <div className="aspect-square bg-muted-foreground/10 flex items-center justify-center">
                            {errors.length > 0 ? (
                                <span className="text-destructive text-sm">
                                    {errors[0]}
                                </span>
                            ) : (
                                <span className="text-muted-foreground">
                                    Loading...
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

---

## Deployment

### Vercel Configuration

```javascript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
    // MDX 지원
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
    
    // 웹 워커 지원
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.output.globalObject = 'self';
        }
        
        // WASM 지원 (필요시)
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };
        
        return config;
    },
    
    // 정적 내보내기 (선택)
    // output: 'export',
};

module.exports = nextConfig;
```

### Package Dependencies

```json
{
  "name": "chesslang-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    
    "chesslang": "workspace:*",
    
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.44.0",
    
    "zustand": "^4.4.0",
    "framer-motion": "^10.16.0",
    
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.292.0",
    
    "next-mdx-remote": "^4.4.0",
    "@next/mdx": "^14.0.0",
    "shiki": "^0.14.0",
    "gray-matter": "^4.0.3",
    "reading-time": "^1.5.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

---

## Start Command

```bash
# Core 패키지와 함께 모노레포 구성
npm init -y
npx create-next-app@latest chesslang-web --typescript --tailwind --app

# 의존성 설치
cd chesslang-web
npm install @monaco-editor/react zustand framer-motion
npm install next-mdx-remote @next/mdx shiki gray-matter
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui 초기화
npx shadcn-ui@latest init

# 컴포넌트 추가
npx shadcn-ui@latest add button dialog dropdown-menu tabs card
```