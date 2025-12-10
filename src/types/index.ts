// ============================================================================
// ChessLang Core Types
// ============================================================================

// ----------------------------------------------------------------------------
// Source Location
// ----------------------------------------------------------------------------

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
  length: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

// ----------------------------------------------------------------------------
// Position & Board
// ----------------------------------------------------------------------------

export interface Position {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

export type Color = 'White' | 'Black';

export interface Square {
  pos: Position;
  piece: Piece | null;
  effects: Effect[];
  zone?: string;
}

export interface BoardConfig {
  width: number;
  height: number;
  zones: Map<string, Position[]>;
}

// ----------------------------------------------------------------------------
// Pieces
// ----------------------------------------------------------------------------

export interface Piece {
  id: string;
  type: string;
  owner: Color;
  pos: Position;
  traits: Set<string>;
  state: Record<string, unknown>;
}

export interface PieceDefinition {
  name: string;
  move: Pattern;
  capture: Pattern | 'same' | 'none';
  traits: string[];
  initialState: Record<string, unknown>;
  triggers: TriggerDefinition[];
}

// ----------------------------------------------------------------------------
// Movement Patterns
// ----------------------------------------------------------------------------

export type Direction =
  | 'N' | 'S' | 'E' | 'W'
  | 'NE' | 'NW' | 'SE' | 'SW'
  | 'orthogonal' | 'diagonal' | 'any'
  | 'forward' | 'backward';

export type Pattern =
  | StepPattern
  | SlidePattern
  | LeapPattern
  | HopPattern
  | CompositePattern
  | ConditionalPattern
  | ReferencePattern;

export interface StepPattern {
  type: 'step';
  direction: Direction;
  distance: number;
}

export interface SlidePattern {
  type: 'slide';
  direction: Direction;
}

export interface LeapPattern {
  type: 'leap';
  dx: number;
  dy: number;
}

export interface HopPattern {
  type: 'hop';
  direction: Direction;
}

export interface CompositePattern {
  type: 'composite';
  op: 'or' | 'then';
  patterns: Pattern[];
}

export interface ConditionalPattern {
  type: 'conditional';
  pattern: Pattern;
  condition: Condition;
}

export interface ReferencePattern {
  type: 'reference';
  name: string;
}

// ----------------------------------------------------------------------------
// Conditions
// ----------------------------------------------------------------------------

export type Condition =
  | EmptyCondition
  | EnemyCondition
  | FriendCondition
  | ClearCondition
  | CheckCondition
  | FirstMoveCondition
  | InZoneCondition
  | OnRankCondition
  | OnFileCondition
  | PieceCapturedCondition
  | ComparisonCondition
  | LogicalCondition
  | NotCondition
  | CustomCondition;

export interface EmptyCondition {
  type: 'empty';
}

export interface EnemyCondition {
  type: 'enemy';
}

export interface FriendCondition {
  type: 'friend';
}

export interface ClearCondition {
  type: 'clear';
}

export interface CheckCondition {
  type: 'check';
}

export interface FirstMoveCondition {
  type: 'first_move';
}

export interface InZoneCondition {
  type: 'in_zone';
  zone: string;
  pieceType?: string; // Optional: specific piece type (e.g., "King")
}

export interface OnRankCondition {
  type: 'on_rank';
  pieceType: string; // e.g., "King"
  rank: number; // 1-based rank number
}

export interface OnFileCondition {
  type: 'on_file';
  pieceType: string; // e.g., "King"
  file: string; // e.g., "a", "b", etc.
}

export interface PieceCapturedCondition {
  type: 'piece_captured';
  pieceType: string; // e.g., "King"
}

export interface ComparisonCondition {
  type: 'comparison';
  left: Expression;
  op: '==' | '!=' | '<' | '>' | '<=' | '>=';
  right: Expression;
}

export interface LogicalCondition {
  type: 'logical';
  op: 'and' | 'or';
  left: Condition;
  right: Condition;
}

export interface NotCondition {
  type: 'not';
  condition: Condition;
}

export interface CustomCondition {
  type: 'custom';
  name: string;
  args: Expression[];
}

// ----------------------------------------------------------------------------
// Expressions
// ----------------------------------------------------------------------------

export type Expression =
  | LiteralExpression
  | IdentifierExpression
  | MemberExpression
  | CallExpression
  | BinaryExpression
  | UnaryExpression
  | ArrayExpression
  | ObjectExpression;

export interface LiteralExpression {
  type: 'literal';
  value: string | number | boolean | null;
}

export interface IdentifierExpression {
  type: 'identifier';
  name: string;
}

export interface MemberExpression {
  type: 'member';
  object: Expression;
  property: string;
}

export interface CallExpression {
  type: 'call';
  callee: Expression;
  args: Expression[];
}

export interface BinaryExpression {
  type: 'binary';
  op: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: 'unary';
  op: string;
  operand: Expression;
}

export interface ArrayExpression {
  type: 'array';
  elements: Expression[];
}

export interface ObjectExpression {
  type: 'object';
  properties: Map<string, Expression>;
}

// ----------------------------------------------------------------------------
// Moves
// ----------------------------------------------------------------------------

export type MoveType =
  | 'normal'
  | 'capture'
  | 'castle_kingside'
  | 'castle_queenside'
  | 'en_passant'
  | 'promotion'
  | 'custom';

export interface Move {
  type: MoveType;
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;
  promotion?: string;
  metadata?: Record<string, unknown>;
}

export interface MoveResult {
  success: boolean;
  move?: Move;
  captured?: Piece;
  events: GameEvent[];
  error?: string;
}

// ----------------------------------------------------------------------------
// Effects
// ----------------------------------------------------------------------------

export interface Effect {
  id: string;
  type: string;
  owner?: Color;
  blocks: 'none' | 'enemy' | 'friend' | 'all';
  visual?: string;
  data?: Record<string, unknown>;
  position?: Position;  // For tracking effect location in game state
}

export interface EffectDefinition {
  name: string;
  blocks: 'none' | 'enemy' | 'friend' | 'all';
  visual?: string;
}

// ----------------------------------------------------------------------------
// Triggers
// ----------------------------------------------------------------------------

export type EventType =
  | 'move'
  | 'capture'
  | 'captured'
  | 'turn_start'
  | 'turn_end'
  | 'check'
  | 'enter_zone'
  | 'exit_zone'
  | 'game_start'
  | 'game_end';

export interface TriggerDefinition {
  name: string;
  on: EventType;
  when?: Condition;
  actions: Action[];
  optional?: boolean;  // If true, user can choose whether to execute
  description?: string;  // Description shown in confirmation dialog
}

// ----------------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------------

export type Action =
  | SetAction
  | CreateAction
  | RemoveAction
  | TransformAction
  | MarkAction
  | MoveAction
  | WinAction
  | LoseAction
  | DrawAction
  | CancelAction
  | ApplyAction
  | ForAction
  | IfAction
  | CustomAction;

export interface SetAction {
  type: 'set';
  target: Expression;
  op: '=' | '+=' | '-=';
  value: Expression;
}

export interface CreateAction {
  type: 'create';
  pieceType: string;
  position: Expression;
  owner: Color | Expression | null;  // null means use context (e.g., current player)
}

export interface RemoveAction {
  type: 'remove';
  target: Expression;
  // For range-based removal: "remove pieces in radius(N) from target"
  range?: {
    kind: 'radius';
    value: number;
    from: Expression;
  };
  // Filter condition: "where not Pawn"
  filter?: {
    exclude?: string[];  // Piece types to exclude
    include?: string[];  // Piece types to include (if set, only these are removed)
    condition?: Condition;  // General condition
  };
}

export interface TransformAction {
  type: 'transform';
  target: Expression;
  newType: string;
}

export interface MarkAction {
  type: 'mark';
  position: Expression;
  effect: string;
}

export interface MoveAction {
  type: 'move';
  target: Expression;
  destination: Expression;
}

export interface WinAction {
  type: 'win';
  player: Color | Expression;
}

export interface LoseAction {
  type: 'lose';
  player: Color | Expression;
}

export interface DrawAction {
  type: 'draw';
  reason?: string;
}

export interface CancelAction {
  type: 'cancel';
}

export interface ApplyAction {
  type: 'apply';
  effect: string;
  target: Expression;
}

export interface ForAction {
  type: 'for';
  variable: string;
  iterable: Expression;
  actions: Action[];
}

export interface IfAction {
  type: 'if';
  condition: Expression;
  thenActions: Action[];
  elseActions?: Action[];
}

export interface CustomAction {
  type: 'custom';
  name: string;
  args: Expression[];
}

// ----------------------------------------------------------------------------
// Game State
// ----------------------------------------------------------------------------

export interface GameState {
  board: Square[][];
  pieces: Piece[];
  currentPlayer: Color;
  moveHistory: Move[];
  halfMoveClock: number;
  fullMoveNumber: number;
  positionHistory: string[];
  effects: Effect[];
  customState: Record<string, unknown>;
  result?: GameResult;
  checkCount?: { White: number; Black: number }; // For three-check variants
  pendingOptionalTriggers?: PendingOptionalTrigger[];  // Triggers waiting for user decision
}

export interface PendingOptionalTrigger {
  triggerId: string;
  triggerName: string;
  description?: string;
  move: Move;
}

export interface GameResult {
  winner?: Color;
  reason: string;
  isDraw: boolean;
}

export interface GameEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// ----------------------------------------------------------------------------
// Victory & Draw Conditions
// ----------------------------------------------------------------------------

/**
 * Victory condition for a chess variant.
 * 
 * **Combination Rules:**
 * - Multiple victory conditions are combined with OR logic
 * - If ANY condition is satisfied, the game ends with that victory
 * - Use `and`/`or` within a single condition for complex logic
 * 
 * **Action Types:**
 * - `add`: Add new condition to existing conditions (OR combination)
 * - `replace`: Replace an existing condition with same name
 * - `remove`: Remove an existing condition by name
 */
export interface VictoryCondition {
  name: string;
  condition: Condition;
  winner: Color | 'current' | 'opponent';
  /** Action type when extending a base game */
  action?: 'add' | 'replace' | 'remove';
}

/**
 * Draw condition for a chess variant.
 * 
 * **Combination Rules:**
 * - Multiple draw conditions are combined with OR logic
 * - If ANY condition is satisfied, the game ends in a draw
 * - Use `and`/`or` within a single condition for complex logic
 * 
 * **Action Types:**
 * - `add`: Add new condition to existing conditions (OR combination)
 * - `replace`: Replace an existing condition with same name
 * - `remove`: Remove an existing condition by name
 */
export interface DrawCondition {
  name: string;
  condition: Condition;
  /** Action type when extending a base game */
  action?: 'add' | 'replace' | 'remove';
}

// ----------------------------------------------------------------------------
// Game Definition (Compiled)
// ----------------------------------------------------------------------------

export interface CompiledGame {
  name: string;
  extends?: string;
  board: BoardConfig;
  pieces: Map<string, PieceDefinition>;
  effects: Map<string, EffectDefinition>;
  triggers: TriggerDefinition[];
  traits: Map<string, TraitDefinition>; // Custom trait definitions
  setup: SetupConfig;
  victory: VictoryCondition[];
  draw: DrawCondition[];
  rules: RuleConfig;
  scripts: string[]; // 스크립트 코드 배열
}

// ----------------------------------------------------------------------------
// Trait Definitions
// ----------------------------------------------------------------------------

/**
 * Built-in traits with predefined behavior:
 * - 'royal': Target for check/checkmate
 * - 'phase': Can pass through other pieces (no capture)
 * - 'jump': Can jump over pieces (used with leap pattern)
 * - 'promote': Can be promoted at specific rank
 * - 'immune': Cannot be captured
 * - 'explosive': Destroys adjacent pieces when captured
 */
export type BuiltInTrait = 
  | 'royal' 
  | 'phase' 
  | 'jump' 
  | 'promote' 
  | 'immune' 
  | 'explosive';

/**
 * Custom trait definition
 * Traits can modify piece behavior and trigger special effects
 */
export interface TraitDefinition {
  name: string;
  description?: string;
  // Effects when piece with this trait moves
  onMove?: TriggerDefinition;
  // Effects when piece with this trait captures
  onCapture?: TriggerDefinition;
  // Effects when piece with this trait is captured
  onCaptured?: TriggerDefinition;
  // Modifies how the piece generates moves
  moveModifier?: 'phase' | 'jump' | 'none';
  // Whether this trait makes the piece immune to capture
  immune?: boolean;
}

// ----------------------------------------------------------------------------
// Script Runtime Types
// ----------------------------------------------------------------------------

export type ScriptEventType = 
  | 'move' 
  | 'capture' 
  | 'turnStart' 
  | 'turnEnd' 
  | 'check' 
  | 'checkmate'
  | 'promotion';

export interface ScriptEvent {
  type: ScriptEventType;
  piece?: Piece;
  from?: Position;
  to?: Position;
  captured?: Piece;
  player: Color;
}

export type ScriptEventHandler = (event: ScriptEvent) => void;

export interface SetupConfig {
  placements: PlacementConfig[];
  replace?: Map<string, string>; // 기존 기물을 다른 기물로 대체 (예: Queen -> Amazon)
  additive?: boolean; // true면 base game setup 위에 추가, false면 완전 교체
  customSetup?: (state: GameState) => void;
}

export interface PlacementConfig {
  pieceType: string;
  position: Position;
  owner: Color;
}

export interface RuleConfig {
  checkDetection: boolean;
  castling: boolean;
  enPassant: boolean;
  promotion: boolean;
  fiftyMoveRule: boolean;
  threefoldRepetition: boolean;
}

// ----------------------------------------------------------------------------
// AST Nodes
// ----------------------------------------------------------------------------

export interface ASTNode {
  type: string;
  location: SourceLocation;
}

export interface GameNode extends ASTNode {
  type: 'Game';
  name: string;
  extends?: string;
  board?: BoardNode;
  pieces: PieceNode[];
  piecesConfig?: PieceConfigNode[]; // Level 1: 기존 기물 속성 변경
  effects: EffectNode[];
  triggers: TriggerNode[];
  patterns: PatternNode[];
  setup?: SetupNode;
  victory: VictoryNode[];
  draw: DrawNode[];
  rules?: RulesNode;
  scripts: ScriptNode[];
}

// Level 1: 기존 기물 속성 변경 (pieces: 섹션)
export interface PieceConfigNode extends ASTNode {
  type: 'PieceConfig';
  pieceName: string;
  promoteTo?: string[]; // promote_to: [Queen, Rook, ...]
  properties?: Record<string, unknown>; // 기타 속성
}

export interface BoardNode extends ASTNode {
  type: 'Board';
  width: number;
  height: number;
  zones: Map<string, string[]>; // zone name -> square notations
}

export interface PieceNode extends ASTNode {
  type: 'Piece';
  name: string;
  move?: PatternExprNode;
  capture?: PatternExprNode | 'same' | 'none';
  traits: string[];
  state: Record<string, unknown>;
  triggers: TriggerNode[];
}

export interface EffectNode extends ASTNode {
  type: 'Effect';
  name: string;
  blocks: 'none' | 'enemy' | 'friend' | 'all';
  visual?: string;
}

export interface TriggerNode extends ASTNode {
  type: 'Trigger';
  name: string;
  on: EventType;
  when?: ConditionNode;
  actions: ActionNode[];
  optional?: boolean;  // If true, user can choose whether to execute
  description?: string;  // Description shown in confirmation dialog
}

export interface PatternNode extends ASTNode {
  type: 'Pattern';
  name: string;
  pattern: PatternExprNode;
}

export interface PatternExprNode extends ASTNode {
  type: 'PatternExpr';
  kind: 'step' | 'slide' | 'leap' | 'hop' | 'or' | 'then' | 'repeat' | 'conditional' | 'reference';
  direction?: Direction;
  distance?: number;
  dx?: number;
  dy?: number;
  patterns?: PatternExprNode[];
  count?: number;
  condition?: ConditionNode;
  name?: string;
}

export interface ConditionNode extends ASTNode {
  type: 'Condition';
  kind: string;
  value?: unknown;
  left?: ConditionNode | ExpressionNode;
  right?: ConditionNode | ExpressionNode;
  op?: string;
  condition?: ConditionNode;
  subject?: ExpressionNode; // for on_rank, on_file, piece_captured
}

export interface ActionNode extends ASTNode {
  type: 'Action';
  kind: string;
  target?: ExpressionNode;
  value?: ExpressionNode;
  op?: string;
  pieceType?: string;
  position?: ExpressionNode;
  owner?: string | ExpressionNode | null;  // null means use context (current player)
  effect?: string;
  newType?: string;
  player?: string | ExpressionNode;
  reason?: string; // For draw action
  // For range-based removal: "remove pieces in radius(N) from target"
  range?: {
    kind: 'radius';
    value: number;
    from: ExpressionNode;
  };
  // Filter condition: "where not Pawn"
  filter?: {
    exclude?: string[];  // Piece types to exclude
    include?: string[];  // Piece types to include
  };
  // For 'for' action
  variable?: string;
  iterable?: ExpressionNode;
  actions?: ActionNode[];
  // For 'if' action
  condition?: ExpressionNode;
  thenActions?: ActionNode[];
  elseActions?: ActionNode[];
}

export interface ExpressionNode extends ASTNode {
  type: 'Expression';
  kind: string;
  value?: unknown;
  name?: string;
  object?: ExpressionNode;
  property?: string;
  callee?: ExpressionNode;
  args?: ExpressionNode[];
  op?: string;
  left?: ExpressionNode;
  right?: ExpressionNode;
  operand?: ExpressionNode;
  elements?: ExpressionNode[];
  properties?: Map<string, ExpressionNode>;
}

export interface SetupNode extends ASTNode {
  type: 'Setup';
  placements: PlacementNode[];
  fromFEN?: string;
  replace?: Map<string, string>; // 기존 기물을 다른 기물로 대체 (예: Queen -> Amazon)
  additive?: boolean; // true면 add: 섹션 사용, base game 위에 추가
}

export interface PlacementNode extends ASTNode {
  type: 'Placement';
  pieceType: string;
  square: string;
  owner: Color;
}

/**
 * AST node for victory condition definition.
 * 
 * **Combination Rules (OR logic):**
 * - Multiple victory conditions are combined with OR
 * - If ANY condition is satisfied, the game ends with that victory
 * - For AND logic, use `and` within a single condition expression
 * 
 * **Example:**
 * ```chesslang
 * victory:
 *   add:                               # OR: checkmate OR hill
 *     hill: King in zone.hill
 *   add:
 *     complex: A and B                 # Single condition with AND
 * ```
 */
export interface VictoryNode extends ASTNode {
  type: 'Victory';
  name: string;
  condition: ConditionNode;
  /**
   * Action when extending a base game:
   * - 'add' (default): Add to existing conditions (OR combination)
   * - 'replace': Replace existing condition with same name
   * - 'remove': Remove existing condition by name
   */
  action?: 'add' | 'replace' | 'remove';
}

/**
 * AST node for draw condition definition.
 * 
 * **Combination Rules (OR logic):**
 * - Multiple draw conditions are combined with OR
 * - If ANY condition is satisfied, the game ends in a draw
 * - For AND logic, use `and` within a single condition expression
 * 
 * **Example:**
 * ```chesslang
 * draw:
 *   add:                               # OR: stalemate OR bare_king
 *     bare_king: pieces == 1 and opponent.pieces == 1
 * ```
 */
export interface DrawNode extends ASTNode {
  type: 'Draw';
  name: string;
  condition: ConditionNode;
  /**
   * Action when extending a base game:
   * - 'add' (default): Add to existing conditions (OR combination)
   * - 'replace': Replace existing condition with same name
   * - 'remove': Remove existing condition by name
   */
  action?: 'add' | 'replace' | 'remove';
}

export interface RulesNode extends ASTNode {
  type: 'Rules';
  checkDetection?: boolean;
  castling?: boolean;
  enPassant?: boolean;
  promotion?: boolean;
  fiftyMoveRule?: boolean;
  threefoldRepetition?: boolean;
}

export interface ScriptNode extends ASTNode {
  type: 'Script';
  code: string;
}

// ----------------------------------------------------------------------------
// Tokens
// ----------------------------------------------------------------------------

export enum TokenType {
  // Keywords - Level 1
  GAME = 'GAME',
  EXTENDS = 'EXTENDS',
  BOARD = 'BOARD',
  SIZE = 'SIZE',
  ZONES = 'ZONES',
  PIECES = 'PIECES',
  SETUP = 'SETUP',
  VICTORY = 'VICTORY',
  DRAW = 'DRAW',
  RULES = 'RULES',
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  REPLACE = 'REPLACE',

  // Keywords - Level 2
  PIECE = 'PIECE',
  EFFECT = 'EFFECT',
  TRIGGER = 'TRIGGER',
  PATTERN = 'PATTERN',
  MOVE = 'MOVE',
  CAPTURE = 'CAPTURE',
  TRAITS = 'TRAITS',
  STATE = 'STATE',
  ON = 'ON',
  WHEN = 'WHEN',
  DO = 'DO',
  BLOCKS = 'BLOCKS',
  VISUAL = 'VISUAL',
  OPTIONAL = 'OPTIONAL',
  DESCRIPTION = 'DESCRIPTION',

  // Keywords - Level 3
  SCRIPT = 'SCRIPT',
  FUNCTION = 'FUNCTION',
  LET = 'LET',
  CONST = 'CONST',
  VAR = 'VAR',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  RETURN = 'RETURN',
  OF = 'OF',
  IN = 'IN',

  // Pattern keywords
  STEP = 'STEP',
  SLIDE = 'SLIDE',
  LEAP = 'LEAP',
  HOP = 'HOP',

  // Direction keywords
  NORTH = 'N',
  SOUTH = 'S',
  EAST = 'E',
  WEST = 'W',
  NORTHEAST = 'NE',
  NORTHWEST = 'NW',
  SOUTHEAST = 'SE',
  SOUTHWEST = 'SW',
  ORTHOGONAL = 'ORTHOGONAL',
  DIAGONAL = 'DIAGONAL',
  ANY = 'ANY',
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',

  // Condition keywords
  EMPTY = 'EMPTY',
  ENEMY = 'ENEMY',
  FRIEND = 'FRIEND',
  CLEAR = 'CLEAR',
  CHECK = 'CHECK',
  FIRST_MOVE = 'FIRST_MOVE',
  
  // Victory condition keywords
  RANK = 'RANK',
  FILE = 'FILE',
  CAPTURED = 'CAPTURED',
  CHECKS = 'CHECKS',
  OPPONENT = 'OPPONENT',

  // Action keywords
  SET = 'SET',
  CREATE = 'CREATE',
  TRANSFORM = 'TRANSFORM',
  MARK = 'MARK',
  WIN = 'WIN',
  LOSE = 'LOSE',
  CANCEL = 'CANCEL',
  APPLY = 'APPLY',

  // Logical keywords
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  WHERE = 'WHERE',

  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  IDENTIFIER = 'IDENTIFIER',
  SQUARE = 'SQUARE',

  // Colors
  WHITE = 'WHITE',
  BLACK = 'BLACK',

  // Operators
  COLON = 'COLON',
  COMMA = 'COMMA',
  DOT = 'DOT',
  PIPE = 'PIPE',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  EQUALS = 'EQUALS',
  PLUS_EQUALS = 'PLUS_EQUALS',
  MINUS_EQUALS = 'MINUS_EQUALS',
  STAR_EQUALS = 'STAR_EQUALS',
  SLASH_EQUALS = 'SLASH_EQUALS',
  EQ = 'EQ',
  STRICT_EQ = 'STRICT_EQ',
  NE = 'NOT_EQ',
  STRICT_NE = 'STRICT_NE',
  LT = 'LT',
  GT = 'GT',
  LE = 'LE',
  GE = 'GE',
  AMPERSAND = 'AMPERSAND',
  DOUBLE_AMPERSAND = 'DOUBLE_AMPERSAND',
  DOUBLE_PIPE = 'DOUBLE_PIPE',
  BANG = 'BANG',
  QUESTION = 'QUESTION',
  ARROW = 'ARROW',
  FAT_ARROW = 'FAT_ARROW',

  // Brackets
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',

  // Special
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  NEWLINE = 'NEWLINE',
  SEMICOLON = 'SEMICOLON',
  EOF = 'EOF',
  ERROR = 'ERROR',
}

export interface Token {
  type: TokenType;
  value: string;
  location: SourceLocation;
}

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

export class ChessLangError extends Error {
  constructor(
    message: string,
    public location: SourceLocation,
    public code: string
  ) {
    super(message);
    this.name = 'ChessLangError';
  }
}

export class LexerError extends ChessLangError {
  constructor(message: string, location: SourceLocation) {
    super(message, location, 'LEXER_ERROR');
    this.name = 'LexerError';
  }
}

export class ParserError extends ChessLangError {
  constructor(message: string, location: SourceLocation) {
    super(message, location, 'PARSER_ERROR');
    this.name = 'ParserError';
  }
}

export class CompilerError extends ChessLangError {
  constructor(message: string, location: SourceLocation) {
    super(message, location, 'COMPILER_ERROR');
    this.name = 'CompilerError';
  }
}

export class RuntimeError extends ChessLangError {
  constructor(message: string, location: SourceLocation) {
    super(message, location, 'RUNTIME_ERROR');
    this.name = 'RuntimeError';
  }
}

// ----------------------------------------------------------------------------
// Diagnostics
// ----------------------------------------------------------------------------

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface Diagnostic {
  severity: DiagnosticSeverity;
  message: string;
  location: SourceLocation;
  code: string;
  suggestions?: Fix[];
}

export interface Fix {
  description: string;
  edits: TextEdit[];
}

export interface TextEdit {
  range: SourceRange;
  newText: string;
}
