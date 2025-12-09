import type {
  Token,
  GameNode,
  BoardNode,
  PieceNode,
  EffectNode,
  TriggerNode,
  PatternNode,
  PatternExprNode,
  ConditionNode,
  ActionNode,
  ExpressionNode,
  SetupNode,
  PlacementNode,
  VictoryNode,
  DrawNode,
  RulesNode,
  ScriptNode,
  SourceLocation,
  Direction,
  EventType,
  Color,
} from '../types/index.js';
import { TokenType, ParserError } from '../types/index.js';
import { TokenStream } from '../lexer/index.js';

export { TokenStream } from '../lexer/index.js';

/**
 * Parser for ChessLang DSL
 * Supports all 3 levels of syntax
 */
export class Parser {
  private stream: TokenStream;

  constructor(tokens: Token[]) {
    this.stream = new TokenStream(tokens);
  }

  /**
   * Parse the entire program
   */
  parse(): GameNode {
    this.stream.skipNewlines();

    const location = this.stream.peek().location;
    let name = 'Unnamed Game';
    let extendsGame: string | undefined;
    let board: BoardNode | undefined;
    const pieces: PieceNode[] = [];
    const effects: EffectNode[] = [];
    const triggers: TriggerNode[] = [];
    const patterns: PatternNode[] = [];
    let setup: SetupNode | undefined;
    const victory: VictoryNode[] = [];
    const draw: DrawNode[] = [];
    let rules: RulesNode | undefined;
    const scripts: ScriptNode[] = [];

    // Parse game declaration
    if (this.stream.check(TokenType.GAME)) {
      name = this.parseGameDeclaration();
    }

    // Parse extends declaration
    if (this.stream.check(TokenType.EXTENDS)) {
      extendsGame = this.parseExtendsDeclaration();
    }

    // Parse sections
    while (!this.stream.isAtEnd()) {
      this.stream.skipNewlines();
      if (this.stream.isAtEnd()) break;

      const token = this.stream.peek();

      switch (token.type) {
        case TokenType.BOARD:
          board = this.parseBoardSection();
          break;
        case TokenType.PIECE:
          pieces.push(this.parsePieceDefinition());
          break;
        case TokenType.EFFECT:
          effects.push(this.parseEffectDefinition());
          break;
        case TokenType.TRIGGER:
          triggers.push(this.parseTriggerDefinition());
          break;
        case TokenType.PATTERN:
          patterns.push(this.parsePatternDefinition());
          break;
        case TokenType.SETUP:
          setup = this.parseSetupSection();
          break;
        case TokenType.VICTORY:
          victory.push(...this.parseVictorySection());
          break;
        case TokenType.DRAW:
          draw.push(...this.parseDrawSection());
          break;
        case TokenType.RULES:
          rules = this.parseRulesSection();
          break;
        case TokenType.SCRIPT:
          scripts.push(this.parseScriptBlock());
          break;
        default:
          this.error(`Unexpected token: ${token.value}`);
      }
    }

    return {
      type: 'Game',
      name,
      extends: extendsGame,
      board,
      pieces,
      effects,
      triggers,
      patterns,
      setup,
      victory,
      draw,
      rules,
      scripts,
      location,
    };
  }

  // ============================================================================
  // Level 1: Configuration Parsing
  // ============================================================================

  private parseGameDeclaration(): string {
    this.stream.expect(TokenType.GAME);
    this.stream.expect(TokenType.COLON);
    const name = this.stream.expect(TokenType.STRING).value;
    this.stream.skipNewlines();
    return name;
  }

  private parseExtendsDeclaration(): string {
    this.stream.expect(TokenType.EXTENDS);
    this.stream.expect(TokenType.COLON);
    const name = this.stream.expect(TokenType.STRING).value;
    this.stream.skipNewlines();
    return name;
  }

  private parseBoardSection(): BoardNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.BOARD);
    this.stream.expect(TokenType.COLON);
    this.stream.skipNewlines();

    let width = 8;
    let height = 8;
    const zones = new Map<string, string[]>();

    if (this.stream.match(TokenType.INDENT)) {
      while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
        this.stream.skipNewlines();
        if (this.stream.check(TokenType.DEDENT)) break;

        if (this.stream.check(TokenType.SIZE)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          width = parseInt(this.stream.expect(TokenType.NUMBER).value, 10);
          // Handle "x8" as identifier, square, or "x" followed by number
          const nextToken = this.stream.peek();
          if (nextToken.type === TokenType.IDENTIFIER && nextToken.value.startsWith('x')) {
            const xPart = this.stream.advance().value;
            // Extract height from "x8"
            height = parseInt(xPart.slice(1), 10);
          } else if (nextToken.type === TokenType.SQUARE && nextToken.value.startsWith('x')) {
            // x8 was parsed as a SQUARE token (since x is a-z and 8 is 1-9)
            const xPart = this.stream.advance().value;
            // Extract height from "x8"
            height = parseInt(xPart.slice(1), 10);
          } else if (nextToken.type === TokenType.IDENTIFIER && nextToken.value === 'x') {
            this.stream.advance(); // 'x'
            height = parseInt(this.stream.expect(TokenType.NUMBER).value, 10);
          } else {
            // Assume same dimension if only one number provided
            height = width;
          }
        } else if (this.stream.check(TokenType.ZONES)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();

          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;

              const zoneName = this.stream.expect(TokenType.IDENTIFIER).value;
              this.stream.expect(TokenType.COLON);
              const squares = this.parseSquareList();
              zones.set(zoneName, squares);
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else {
          this.stream.advance(); // Skip unknown property
          this.skipToNextLine();
        }
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return { type: 'Board', width, height, zones, location };
  }

  private parseSquareList(): string[] {
    const squares: string[] = [];
    this.stream.expect(TokenType.LBRACKET);

    while (!this.stream.check(TokenType.RBRACKET) && !this.stream.isAtEnd()) {
      if (this.stream.check(TokenType.SQUARE)) {
        squares.push(this.stream.advance().value);
      } else if (this.stream.check(TokenType.IDENTIFIER)) {
        // Could be a square notation parsed as identifier
        squares.push(this.stream.advance().value);
      }

      if (!this.stream.match(TokenType.COMMA)) break;
    }

    this.stream.expect(TokenType.RBRACKET);
    return squares;
  }

  private parseSetupSection(): SetupNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.SETUP);
    this.stream.expect(TokenType.COLON);
    this.stream.skipNewlines();

    const placements: PlacementNode[] = [];
    let fromFEN: string | undefined;
    let replace: Map<string, string> | undefined;

    if (this.stream.match(TokenType.INDENT)) {
      while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
        this.stream.skipNewlines();
        if (this.stream.check(TokenType.DEDENT)) break;

        if (this.stream.check(TokenType.ADD)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();

          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;

              const color = this.parseColor();

              // Check if next token is COLON (old format) or IDENTIFIER (new format)
              if (this.stream.check(TokenType.COLON)) {
                // Old format: White: { ... } or White: Piece: [squares]
                this.stream.expect(TokenType.COLON);
                placements.push(...this.parsePlacementList(color, location));
              } else if (this.stream.check(TokenType.IDENTIFIER)) {
                // New format: White Piece: [squares]
                const pieceType = this.stream.expect(TokenType.IDENTIFIER).value;
                this.stream.expect(TokenType.COLON);
                const squares = this.parseSquareList();
                for (const square of squares) {
                  placements.push({ type: 'Placement', pieceType, square, owner: color, location });
                }
              }
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else if (this.stream.check(TokenType.REPLACE)) {
          // Parse replace section: replace: { Queen: Amazon }
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();

          replace = new Map<string, string>();

          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;

              // Parse: OldPiece: NewPiece
              const oldPiece = this.stream.expect(TokenType.IDENTIFIER).value;
              this.stream.expect(TokenType.COLON);
              const newPiece = this.stream.expect(TokenType.IDENTIFIER).value;
              replace.set(oldPiece, newPiece);
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else if (this.stream.check(TokenType.IDENTIFIER) && this.stream.peek().value === 'fromFEN') {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          fromFEN = this.stream.expect(TokenType.STRING).value;
        } else if (this.stream.check(TokenType.WHITE) || this.stream.check(TokenType.BLACK)) {
          const color = this.parseColor();
          this.stream.expect(TokenType.COLON);
          placements.push(...this.parsePlacementList(color, location));
        } else {
          this.stream.advance();
          this.skipToNextLine();
        }
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return { type: 'Setup', placements, fromFEN, replace, location };
  }

  private parsePlacementList(owner: Color, location: SourceLocation): PlacementNode[] {
    const placements: PlacementNode[] = [];

    if (this.stream.check(TokenType.LBRACE)) {
      // Object notation: { e1: King, d1: Queen }
      this.stream.expect(TokenType.LBRACE);
      while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
        const square = this.stream.check(TokenType.SQUARE)
          ? this.stream.advance().value
          : this.stream.expect(TokenType.IDENTIFIER).value;
        this.stream.expect(TokenType.COLON);
        const pieceType = this.stream.expect(TokenType.IDENTIFIER).value;

        placements.push({ type: 'Placement', pieceType, square, owner, location });

        if (!this.stream.match(TokenType.COMMA)) break;
      }
      this.stream.expect(TokenType.RBRACE);
    } else if (this.stream.check(TokenType.LBRACKET)) {
      // Array notation: [R, N, B, Q, K, B, N, R]
      // This is used with rank() function
      this.stream.expect(TokenType.LBRACKET);
      const pieces: string[] = [];
      while (!this.stream.check(TokenType.RBRACKET) && !this.stream.isAtEnd()) {
        pieces.push(this.stream.expect(TokenType.IDENTIFIER).value);
        if (!this.stream.match(TokenType.COMMA)) break;
      }
      this.stream.expect(TokenType.RBRACKET);
      // Note: actual position would come from context (e.g., rank(1))
    }

    return placements;
  }

  private parseVictorySection(): VictoryNode[] {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.VICTORY);
    this.stream.expect(TokenType.COLON);
    this.stream.skipNewlines();

    const conditions: VictoryNode[] = [];

    if (this.stream.match(TokenType.INDENT)) {
      while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
        this.stream.skipNewlines();
        if (this.stream.check(TokenType.DEDENT)) break;

        if (this.stream.check(TokenType.ADD)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;
              conditions.push(this.parseVictoryCondition(location));
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else {
          conditions.push(this.parseVictoryCondition(location));
        }
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return conditions;
  }

  private parseVictoryCondition(location: SourceLocation): VictoryNode {
    const name = this.stream.expect(TokenType.IDENTIFIER).value;
    this.stream.expect(TokenType.COLON);
    const condition = this.parseCondition();
    return { type: 'Victory', name, condition, location };
  }

  private parseDrawSection(): DrawNode[] {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.DRAW);
    this.stream.expect(TokenType.COLON);
    this.stream.skipNewlines();

    const conditions: DrawNode[] = [];

    if (this.stream.match(TokenType.INDENT)) {
      while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
        this.stream.skipNewlines();
        if (this.stream.check(TokenType.DEDENT)) break;

        const name = this.stream.expect(TokenType.IDENTIFIER).value;
        this.stream.expect(TokenType.COLON);
        const condition = this.parseCondition();
        conditions.push({ type: 'Draw', name, condition, location });
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return conditions;
  }

  private parseRulesSection(): RulesNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.RULES);
    this.stream.expect(TokenType.COLON);
    this.stream.skipNewlines();

    const rules: RulesNode = { type: 'Rules', location };

    if (this.stream.match(TokenType.INDENT)) {
      while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
        this.stream.skipNewlines();
        if (this.stream.check(TokenType.DEDENT)) break;

        const name = this.stream.expect(TokenType.IDENTIFIER).value;
        this.stream.expect(TokenType.COLON);
        const value = this.stream.expect(TokenType.BOOLEAN).value === 'true';

        switch (name) {
          case 'check_detection':
          case 'checkDetection':
            rules.checkDetection = value;
            break;
          case 'castling':
            rules.castling = value;
            break;
          case 'en_passant':
          case 'enPassant':
            rules.enPassant = value;
            break;
          case 'promotion':
            rules.promotion = value;
            break;
          case 'fifty_move_rule':
          case 'fiftyMoveRule':
            rules.fiftyMoveRule = value;
            break;
          case 'threefold_repetition':
          case 'threefoldRepetition':
            rules.threefoldRepetition = value;
            break;
        }
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return rules;
  }

  // ============================================================================
  // Level 2: Declarative DSL Parsing
  // ============================================================================

  private parsePieceDefinition(): PieceNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.PIECE);
    const name = this.stream.expect(TokenType.IDENTIFIER).value;
    this.stream.expect(TokenType.LBRACE);
    this.stream.skipNewlines();

    let move: PatternExprNode | undefined;
    let capture: PatternExprNode | 'same' | 'none' | undefined;
    const traits: string[] = [];
    const state: Record<string, unknown> = {};
    const triggers: TriggerNode[] = [];

    while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
      this.stream.skipNewlines();
      if (this.stream.check(TokenType.RBRACE)) break;

      if (this.stream.match(TokenType.MOVE)) {
        this.stream.expect(TokenType.COLON);
        move = this.parsePatternExpression();
      } else if (this.stream.match(TokenType.CAPTURE)) {
        this.stream.expect(TokenType.COLON);
        if (this.stream.check(TokenType.EQUALS) && this.stream.peekNext().value === 'move') {
          this.stream.advance(); // =
          this.stream.advance(); // move
          capture = 'same';
        } else if (this.stream.check(TokenType.IDENTIFIER) && this.stream.peek().value === 'none') {
          this.stream.advance();
          capture = 'none';
        } else {
          capture = this.parsePatternExpression();
        }
      } else if (this.stream.match(TokenType.TRAITS)) {
        this.stream.expect(TokenType.COLON);
        this.stream.expect(TokenType.LBRACKET);
        while (!this.stream.check(TokenType.RBRACKET) && !this.stream.isAtEnd()) {
          traits.push(this.stream.expect(TokenType.IDENTIFIER).value);
          if (!this.stream.match(TokenType.COMMA)) break;
        }
        this.stream.expect(TokenType.RBRACKET);
      } else if (this.stream.match(TokenType.STATE)) {
        this.stream.expect(TokenType.COLON);
        this.stream.expect(TokenType.LBRACE);
        while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
          const key = this.stream.expect(TokenType.IDENTIFIER).value;
          this.stream.expect(TokenType.COLON);
          const value = this.parseLiteral();
          state[key] = value;
          if (!this.stream.match(TokenType.COMMA)) break;
        }
        this.stream.expect(TokenType.RBRACE);
      } else if (this.stream.check(TokenType.TRIGGER)) {
        triggers.push(this.parseTriggerDefinition());
      } else {
        this.stream.advance();
      }
      this.stream.skipNewlines();
    }

    this.stream.expect(TokenType.RBRACE);

    return {
      type: 'Piece',
      name,
      move,
      capture,
      traits,
      state,
      triggers,
      location,
    };
  }

  private parseEffectDefinition(): EffectNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.EFFECT);
    const name = this.stream.expect(TokenType.IDENTIFIER).value;
    this.stream.expect(TokenType.LBRACE);
    this.stream.skipNewlines();

    let blocks: 'none' | 'enemy' | 'friend' | 'all' = 'none';
    let visual: string | undefined;

    while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
      this.stream.skipNewlines();
      if (this.stream.check(TokenType.RBRACE)) break;

      if (this.stream.match(TokenType.BLOCKS)) {
        this.stream.expect(TokenType.COLON);
        // blocks value can be a keyword or identifier
        const token = this.stream.peek();
        let value: string;
        if (token.type === TokenType.ENEMY) {
          this.stream.advance();
          value = 'enemy';
        } else if (token.type === TokenType.FRIEND) {
          this.stream.advance();
          value = 'friend';
        } else if (token.type === TokenType.IDENTIFIER) {
          value = this.stream.advance().value;
        } else {
          this.error('Expected blocks value (none, enemy, friend, all)');
        }
        if (value === 'none' || value === 'enemy' || value === 'friend' || value === 'all') {
          blocks = value;
        }
      } else if (this.stream.match(TokenType.VISUAL)) {
        this.stream.expect(TokenType.COLON);
        visual = this.stream.expect(TokenType.STRING).value;
      } else {
        this.stream.advance();
      }
      this.stream.skipNewlines();
    }

    this.stream.expect(TokenType.RBRACE);

    return { type: 'Effect', name, blocks, visual, location };
  }

  private parseTriggerDefinition(): TriggerNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.TRIGGER);
    const name = this.stream.expect(TokenType.IDENTIFIER).value;
    this.stream.expect(TokenType.LBRACE);
    this.stream.skipNewlines();

    let on: EventType = 'move';
    let when: ConditionNode | undefined;
    const actions: ActionNode[] = [];

    while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
      this.stream.skipNewlines();
      if (this.stream.check(TokenType.RBRACE)) break;

      if (this.stream.match(TokenType.ON)) {
        this.stream.expect(TokenType.COLON);
        on = this.parseEventType();
      } else if (this.stream.match(TokenType.WHEN)) {
        this.stream.expect(TokenType.COLON);
        when = this.parseCondition();
      } else if (this.stream.match(TokenType.DO)) {
        this.stream.expect(TokenType.COLON);
        this.stream.skipNewlines();
        if (this.stream.match(TokenType.INDENT)) {
          while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
            this.stream.skipNewlines();
            if (this.stream.check(TokenType.DEDENT)) break;
            actions.push(this.parseAction());
            this.stream.skipNewlines();
          }
          this.stream.match(TokenType.DEDENT);
        } else {
          actions.push(this.parseAction());
        }
      } else {
        this.stream.advance();
      }
      this.stream.skipNewlines();
    }

    this.stream.expect(TokenType.RBRACE);

    return { type: 'Trigger', name, on, when, actions, location };
  }

  private parsePatternDefinition(): PatternNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.PATTERN);
    const name = this.stream.expect(TokenType.IDENTIFIER).value;
    this.stream.expect(TokenType.EQUALS);
    const pattern = this.parsePatternExpression();

    return { type: 'Pattern', name, pattern, location };
  }

  // ============================================================================
  // Pattern Expression Parsing
  // ============================================================================

  private parsePatternExpression(): PatternExprNode {
    return this.parsePatternOr();
  }

  private parsePatternOr(): PatternExprNode {
    const location = this.stream.peek().location;
    let left = this.parsePatternThen();

    while (this.stream.match(TokenType.PIPE)) {
      const right = this.parsePatternThen();
      left = {
        type: 'PatternExpr',
        kind: 'or',
        patterns: [left, right],
        location,
      };
    }

    return left;
  }

  private parsePatternThen(): PatternExprNode {
    const location = this.stream.peek().location;
    let left = this.parsePatternRepeat();

    while (this.stream.match(TokenType.PLUS)) {
      const right = this.parsePatternRepeat();
      left = {
        type: 'PatternExpr',
        kind: 'then',
        patterns: [left, right],
        location,
      };
    }

    return left;
  }

  private parsePatternRepeat(): PatternExprNode {
    const location = this.stream.peek().location;
    let pattern = this.parsePatternConditional();

    if (this.stream.match(TokenType.STAR)) {
      const count = parseInt(this.stream.expect(TokenType.NUMBER).value, 10);
      pattern = {
        type: 'PatternExpr',
        kind: 'repeat',
        patterns: [pattern],
        count,
        location,
      };
    }

    return pattern;
  }

  private parsePatternConditional(): PatternExprNode {
    const location = this.stream.peek().location;
    const pattern = this.parsePatternPrimary();

    if (this.stream.match(TokenType.WHERE)) {
      const condition = this.parseCondition();
      return {
        type: 'PatternExpr',
        kind: 'conditional',
        patterns: [pattern],
        condition,
        location,
      };
    }

    return pattern;
  }

  private parsePatternPrimary(): PatternExprNode {
    const location = this.stream.peek().location;

    // Parenthesized pattern
    if (this.stream.match(TokenType.LPAREN)) {
      const pattern = this.parsePatternExpression();
      this.stream.expect(TokenType.RPAREN);
      return pattern;
    }

    // step(direction) or step(direction, distance)
    if (this.stream.match(TokenType.STEP)) {
      this.stream.expect(TokenType.LPAREN);
      const direction = this.parseDirection();
      let distance = 1;
      if (this.stream.match(TokenType.COMMA)) {
        distance = parseInt(this.stream.expect(TokenType.NUMBER).value, 10);
      }
      this.stream.expect(TokenType.RPAREN);
      return { type: 'PatternExpr', kind: 'step', direction, distance, location };
    }

    // slide(direction)
    if (this.stream.match(TokenType.SLIDE)) {
      this.stream.expect(TokenType.LPAREN);
      const direction = this.parseDirection();
      this.stream.expect(TokenType.RPAREN);
      return { type: 'PatternExpr', kind: 'slide', direction, location };
    }

    // leap(dx, dy)
    if (this.stream.match(TokenType.LEAP)) {
      this.stream.expect(TokenType.LPAREN);
      const dx = parseInt(this.stream.expect(TokenType.NUMBER).value, 10);
      this.stream.expect(TokenType.COMMA);
      const dy = parseInt(this.stream.expect(TokenType.NUMBER).value, 10);
      this.stream.expect(TokenType.RPAREN);
      return { type: 'PatternExpr', kind: 'leap', dx, dy, location };
    }

    // hop(direction)
    if (this.stream.match(TokenType.HOP)) {
      this.stream.expect(TokenType.LPAREN);
      const direction = this.parseDirection();
      this.stream.expect(TokenType.RPAREN);
      return { type: 'PatternExpr', kind: 'hop', direction, location };
    }

    // Named pattern reference
    if (this.stream.check(TokenType.IDENTIFIER)) {
      const name = this.stream.advance().value;
      return { type: 'PatternExpr', kind: 'reference', name, location };
    }

    this.error('Expected pattern expression');
  }

  private parseDirection(): Direction {
    const token = this.stream.peek();

    const directionMap: Partial<Record<TokenType, Direction>> = {
      [TokenType.NORTH]: 'N',
      [TokenType.SOUTH]: 'S',
      [TokenType.EAST]: 'E',
      [TokenType.WEST]: 'W',
      [TokenType.NORTHEAST]: 'NE',
      [TokenType.NORTHWEST]: 'NW',
      [TokenType.SOUTHEAST]: 'SE',
      [TokenType.SOUTHWEST]: 'SW',
      [TokenType.ORTHOGONAL]: 'orthogonal',
      [TokenType.DIAGONAL]: 'diagonal',
      [TokenType.ANY]: 'any',
      [TokenType.FORWARD]: 'forward',
      [TokenType.BACKWARD]: 'backward',
    };

    const direction = directionMap[token.type];
    if (direction) {
      this.stream.advance();
      return direction;
    }

    // Handle direction as identifier (e.g., forward, diagonal)
    if (token.type === TokenType.IDENTIFIER) {
      const value = token.value.toLowerCase();
      if (['orthogonal', 'diagonal', 'any', 'forward', 'backward'].includes(value)) {
        this.stream.advance();
        return value as Direction;
      }
    }

    this.error('Expected direction');
  }

  // ============================================================================
  // Condition Parsing
  // ============================================================================

  private parseCondition(): ConditionNode {
    return this.parseConditionOr();
  }

  private parseConditionOr(): ConditionNode {
    const location = this.stream.peek().location;
    let left = this.parseConditionAnd();

    while (this.stream.match(TokenType.OR, TokenType.DOUBLE_PIPE)) {
      const right = this.parseConditionAnd();
      left = {
        type: 'Condition',
        kind: 'logical',
        op: 'or',
        left,
        right,
        location,
      };
    }

    return left;
  }

  private parseConditionAnd(): ConditionNode {
    const location = this.stream.peek().location;
    let left = this.parseConditionNot();

    while (this.stream.match(TokenType.AND, TokenType.DOUBLE_AMPERSAND)) {
      const right = this.parseConditionNot();
      left = {
        type: 'Condition',
        kind: 'logical',
        op: 'and',
        left,
        right,
        location,
      };
    }

    return left;
  }

  private parseConditionNot(): ConditionNode {
    const location = this.stream.peek().location;

    if (this.stream.match(TokenType.NOT, TokenType.BANG)) {
      const condition = this.parseConditionPrimary();
      return { type: 'Condition', kind: 'not', condition, location };
    }

    return this.parseConditionPrimary();
  }

  private parseConditionPrimary(): ConditionNode {
    const location = this.stream.peek().location;

    // Parenthesized condition
    if (this.stream.match(TokenType.LPAREN)) {
      const condition = this.parseCondition();
      this.stream.expect(TokenType.RPAREN);
      return condition;
    }

    // Built-in conditions
    if (this.stream.match(TokenType.EMPTY)) {
      return { type: 'Condition', kind: 'empty', location };
    }
    if (this.stream.match(TokenType.ENEMY)) {
      return { type: 'Condition', kind: 'enemy', location };
    }
    if (this.stream.match(TokenType.FRIEND)) {
      return { type: 'Condition', kind: 'friend', location };
    }
    if (this.stream.match(TokenType.CLEAR)) {
      return { type: 'Condition', kind: 'clear', location };
    }
    if (this.stream.match(TokenType.CHECK)) {
      return { type: 'Condition', kind: 'check', location };
    }
    if (this.stream.match(TokenType.FIRST_MOVE)) {
      return { type: 'Condition', kind: 'first_move', location };
    }

    // Comparison or membership
    const left = this.parseExpression();

    // in operator (membership)
    if (this.stream.match(TokenType.IN)) {
      const right = this.parseExpression();
      return { type: 'Condition', kind: 'in', left, right, location };
    }

    // Comparison operators
    if (this.stream.checkAny(
      TokenType.EQ, TokenType.NE, TokenType.STRICT_EQ, TokenType.STRICT_NE,
      TokenType.LT, TokenType.GT, TokenType.LE, TokenType.GE
    )) {
      const op = this.stream.advance().value;
      const right = this.parseExpression();
      return { type: 'Condition', kind: 'comparison', op, left, right, location };
    }

    // Single expression as condition (truthy check)
    return { type: 'Condition', kind: 'expression', left, location };
  }

  // ============================================================================
  // Expression Parsing
  // ============================================================================

  private parseExpression(): ExpressionNode {
    return this.parseAdditive();
  }

  private parseAdditive(): ExpressionNode {
    const location = this.stream.peek().location;
    let left = this.parseMultiplicative();

    while (this.stream.checkAny(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.stream.advance().value;
      const right = this.parseMultiplicative();
      left = { type: 'Expression', kind: 'binary', op, left, right, location };
    }

    return left;
  }

  private parseMultiplicative(): ExpressionNode {
    const location = this.stream.peek().location;
    let left = this.parseUnary();

    while (this.stream.checkAny(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const op = this.stream.advance().value;
      const right = this.parseUnary();
      left = { type: 'Expression', kind: 'binary', op, left, right, location };
    }

    return left;
  }

  private parseUnary(): ExpressionNode {
    const location = this.stream.peek().location;

    if (this.stream.checkAny(TokenType.MINUS, TokenType.BANG)) {
      const op = this.stream.advance().value;
      const operand = this.parseUnary();
      return { type: 'Expression', kind: 'unary', op, operand, location };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): ExpressionNode {
    let expr = this.parsePrimary();

    while (true) {
      const location = this.stream.peek().location;

      if (this.stream.match(TokenType.DOT)) {
        // Property can be identifier or keyword (e.g., piece.state, piece.type)
        const property = this.parseIdentifierOrKeyword();
        expr = { type: 'Expression', kind: 'member', object: expr, property, location };
      } else if (this.stream.match(TokenType.LBRACKET)) {
        const index = this.parseExpression();
        this.stream.expect(TokenType.RBRACKET);
        expr = { type: 'Expression', kind: 'index', object: expr, property: undefined, args: [index], location };
      } else if (this.stream.match(TokenType.LPAREN)) {
        const args: ExpressionNode[] = [];
        if (!this.stream.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.stream.match(TokenType.COMMA));
        }
        this.stream.expect(TokenType.RPAREN);
        expr = { type: 'Expression', kind: 'call', callee: expr, args, location };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): ExpressionNode {
    const location = this.stream.peek().location;

    // Literals
    if (this.stream.check(TokenType.NUMBER)) {
      const value = parseFloat(this.stream.advance().value);
      return { type: 'Expression', kind: 'literal', value, location };
    }

    if (this.stream.check(TokenType.STRING)) {
      const value = this.stream.advance().value;
      return { type: 'Expression', kind: 'literal', value, location };
    }

    if (this.stream.check(TokenType.BOOLEAN)) {
      const value = this.stream.advance().value === 'true';
      return { type: 'Expression', kind: 'literal', value, location };
    }

    if (this.stream.match(TokenType.NULL)) {
      return { type: 'Expression', kind: 'literal', value: null, location };
    }

    // Square notation
    if (this.stream.check(TokenType.SQUARE)) {
      const value = this.stream.advance().value;
      return { type: 'Expression', kind: 'square', value, location };
    }

    // Array literal
    if (this.stream.match(TokenType.LBRACKET)) {
      const elements: ExpressionNode[] = [];
      if (!this.stream.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.parseExpression());
        } while (this.stream.match(TokenType.COMMA));
      }
      this.stream.expect(TokenType.RBRACKET);
      return { type: 'Expression', kind: 'array', elements, location };
    }

    // Object literal
    if (this.stream.match(TokenType.LBRACE)) {
      const properties = new Map<string, ExpressionNode>();
      if (!this.stream.check(TokenType.RBRACE)) {
        do {
          const key = this.stream.expect(TokenType.IDENTIFIER).value;
          this.stream.expect(TokenType.COLON);
          const value = this.parseExpression();
          properties.set(key, value);
        } while (this.stream.match(TokenType.COMMA));
      }
      this.stream.expect(TokenType.RBRACE);
      return { type: 'Expression', kind: 'object', properties, location };
    }

    // Parenthesized expression
    if (this.stream.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.stream.expect(TokenType.RPAREN);
      return expr;
    }

    // Identifier
    if (this.stream.check(TokenType.IDENTIFIER)) {
      const name = this.stream.advance().value;
      return { type: 'Expression', kind: 'identifier', name, location };
    }

    // Colors as identifiers
    if (this.stream.check(TokenType.WHITE) || this.stream.check(TokenType.BLACK)) {
      const name = this.stream.advance().value;
      return { type: 'Expression', kind: 'identifier', name, location };
    }

    // Some keywords can be used as identifiers in expressions
    // e.g., "piece.type", "check", etc.
    const keywordAsIdentifier: TokenType[] = [
      TokenType.PIECE, TokenType.MOVE, TokenType.CAPTURE, TokenType.CHECK,
      TokenType.EMPTY, TokenType.ENEMY, TokenType.FRIEND, TokenType.CLEAR,
      TokenType.STATE, TokenType.EFFECT, TokenType.TRIGGER,
    ];
    if (keywordAsIdentifier.includes(this.stream.peek().type)) {
      const name = this.stream.advance().value;
      return { type: 'Expression', kind: 'identifier', name, location };
    }

    this.error('Expected expression');
  }

  // ============================================================================
  // Action Parsing
  // ============================================================================

  private parseAction(): ActionNode {
    const location = this.stream.peek().location;

    if (this.stream.match(TokenType.SET)) {
      const target = this.parseExpression();
      const op = this.stream.checkAny(TokenType.EQUALS, TokenType.PLUS_EQUALS, TokenType.MINUS_EQUALS)
        ? this.stream.advance().value
        : '=';
      const value = this.parseExpression();
      return { type: 'Action', kind: 'set', target, op, value, location };
    }

    if (this.stream.match(TokenType.CREATE)) {
      const pieceType = this.stream.expect(TokenType.IDENTIFIER).value;
      this.stream.expect(TokenType.IDENTIFIER); // 'at'
      const position = this.parseExpression();
      this.stream.expect(TokenType.FOR);
      const owner = this.parseExpression();
      return { type: 'Action', kind: 'create', pieceType, position, owner, location };
    }

    if (this.stream.match(TokenType.REMOVE)) {
      const target = this.parseExpression();
      return { type: 'Action', kind: 'remove', target, location };
    }

    if (this.stream.match(TokenType.TRANSFORM)) {
      const target = this.parseExpression();
      this.stream.expect(TokenType.IDENTIFIER); // 'to'
      const newType = this.stream.expect(TokenType.IDENTIFIER).value;
      return { type: 'Action', kind: 'transform', target, newType, location };
    }

    if (this.stream.match(TokenType.MARK)) {
      const position = this.parseExpression();
      this.stream.expect(TokenType.IDENTIFIER); // 'with'
      const effect = this.stream.expect(TokenType.IDENTIFIER).value;
      return { type: 'Action', kind: 'mark', position, effect, location };
    }

    if (this.stream.match(TokenType.MOVE)) {
      const target = this.parseExpression();
      this.stream.expect(TokenType.IDENTIFIER); // 'to'
      const position = this.parseExpression();
      return { type: 'Action', kind: 'move', target, position, location };
    }

    if (this.stream.match(TokenType.WIN)) {
      const player = this.parseExpression();
      return { type: 'Action', kind: 'win', player, location };
    }

    if (this.stream.match(TokenType.LOSE)) {
      const player = this.parseExpression();
      return { type: 'Action', kind: 'lose', player, location };
    }

    // Custom action or let statement
    if (this.stream.check(TokenType.LET) || this.stream.check(TokenType.CONST)) {
      this.stream.advance();
      const name = this.stream.expect(TokenType.IDENTIFIER).value;
      this.stream.expect(TokenType.EQUALS);
      const value = this.parseExpression();
      return {
        type: 'Action',
        kind: 'let',
        target: { type: 'Expression', kind: 'identifier', name, location },
        value,
        location,
      };
    }

    this.error('Expected action');
  }

  // ============================================================================
  // Level 3: Script Block Parsing
  // ============================================================================

  private parseScriptBlock(): ScriptNode {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.SCRIPT);
    this.stream.expect(TokenType.LBRACE);

    // Collect all tokens until matching closing brace
    let braceDepth = 1;
    const codeTokens: string[] = [];

    while (!this.stream.isAtEnd() && braceDepth > 0) {
      const token = this.stream.advance();
      if (token.type === TokenType.LBRACE) {
        braceDepth++;
        codeTokens.push('{');
      } else if (token.type === TokenType.RBRACE) {
        braceDepth--;
        if (braceDepth > 0) {
          codeTokens.push('}');
        }
      } else {
        codeTokens.push(token.value);
        if (token.type === TokenType.NEWLINE) {
          // Newlines are significant in script blocks
        }
      }
    }

    const code = codeTokens.join(' ').trim();
    return { type: 'Script', code, location };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private parseColor(): Color {
    if (this.stream.match(TokenType.WHITE)) return 'White';
    if (this.stream.match(TokenType.BLACK)) return 'Black';
    this.error('Expected color (White or Black)');
  }

  private parseEventType(): EventType {
    const token = this.stream.peek();

    // Event types can be keywords like MOVE, CAPTURE, CHECK
    const eventTypeMap: Partial<Record<TokenType, EventType>> = {
      [TokenType.MOVE]: 'move',
      [TokenType.CAPTURE]: 'capture',
      [TokenType.CHECK]: 'check',
    };

    if (eventTypeMap[token.type]) {
      this.stream.advance();
      return eventTypeMap[token.type]!;
    }

    // Also accept as identifier
    if (token.type === TokenType.IDENTIFIER) {
      const eventTypes: EventType[] = [
        'move', 'capture', 'captured', 'turn_start', 'turn_end',
        'check', 'enter_zone', 'exit_zone', 'game_start', 'game_end',
      ];

      this.stream.advance();
      if (eventTypes.includes(token.value as EventType)) {
        return token.value as EventType;
      }
    }

    this.error(`Invalid event type: ${token.value}`);
  }

  private parseLiteral(): unknown {
    if (this.stream.check(TokenType.NUMBER)) {
      return parseFloat(this.stream.advance().value);
    }
    if (this.stream.check(TokenType.STRING)) {
      return this.stream.advance().value;
    }
    if (this.stream.check(TokenType.BOOLEAN)) {
      return this.stream.advance().value === 'true';
    }
    if (this.stream.match(TokenType.NULL)) {
      return null;
    }
    this.error('Expected literal value');
  }

  private skipToNextLine(): void {
    while (!this.stream.isAtEnd() && !this.stream.check(TokenType.NEWLINE)) {
      this.stream.advance();
    }
  }

  /**
   * Parse an identifier, accepting keywords as identifiers in certain contexts
   * (e.g., property names in member access)
   */
  private parseIdentifierOrKeyword(): string {
    const token = this.stream.peek();

    // Accept regular identifiers
    if (token.type === TokenType.IDENTIFIER) {
      return this.stream.advance().value;
    }

    // Accept keywords that can be used as property names
    const keywordsAsProperties: TokenType[] = [
      TokenType.PIECE, TokenType.MOVE, TokenType.CAPTURE, TokenType.CHECK,
      TokenType.EMPTY, TokenType.ENEMY, TokenType.FRIEND, TokenType.CLEAR,
      TokenType.STATE, TokenType.EFFECT, TokenType.TRIGGER, TokenType.PATTERN,
      TokenType.TRAITS, TokenType.BLOCKS, TokenType.VISUAL, TokenType.ON,
      TokenType.WHEN, TokenType.DO, TokenType.ADD, TokenType.REMOVE,
      TokenType.RULES, TokenType.SETUP, TokenType.VICTORY, TokenType.DRAW,
      TokenType.BOARD, TokenType.GAME, TokenType.EXTENDS, TokenType.SIZE,
      TokenType.ZONES, TokenType.WIN, TokenType.LOSE, TokenType.SET,
      TokenType.CREATE, TokenType.TRANSFORM, TokenType.MARK,
    ];

    if (keywordsAsProperties.includes(token.type)) {
      return this.stream.advance().value;
    }

    this.error('Expected identifier');
  }

  private error(message: string): never {
    const token = this.stream.peek();
    throw new ParserError(message, token.location);
  }
}
