import type {
  Token,
  GameNode,
  BoardNode,
  PieceNode,
  PieceConfigNode,
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
    const piecesConfig: PieceConfigNode[] = [];
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
        case TokenType.PIECES:
          piecesConfig.push(...this.parsePiecesSection());
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
      piecesConfig: piecesConfig.length > 0 ? piecesConfig : undefined,
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

  /**
   * Parse pieces: section (Level 1 - configure existing pieces)
   * Example:
   *   pieces:
   *     Pawn:
   *       promote_to: [Queen, Rook, Bishop, Knight]
   */
  private parsePiecesSection(): PieceConfigNode[] {
    const location = this.stream.peek().location;
    this.stream.expect(TokenType.PIECES);
    this.stream.expect(TokenType.COLON);
    this.stream.skipNewlines();

    const configs: PieceConfigNode[] = [];

    if (this.stream.match(TokenType.INDENT)) {
      while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
        this.stream.skipNewlines();
        if (this.stream.check(TokenType.DEDENT)) break;

        // Parse piece name
        const pieceName = this.stream.expect(TokenType.IDENTIFIER).value;
        this.stream.expect(TokenType.COLON);
        this.stream.skipNewlines();

        let promoteTo: string[] | undefined;
        const properties: Record<string, unknown> = {};

        if (this.stream.match(TokenType.INDENT)) {
          while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
            this.stream.skipNewlines();
            if (this.stream.check(TokenType.DEDENT)) break;

            const propName = this.stream.expect(TokenType.IDENTIFIER).value;
            this.stream.expect(TokenType.COLON);

            if (propName === 'promote_to' || propName === 'promoteTo') {
              // Parse list of piece types: [Queen, Rook, Bishop, Knight]
              promoteTo = [];
              this.stream.expect(TokenType.LBRACKET);
              while (!this.stream.check(TokenType.RBRACKET) && !this.stream.isAtEnd()) {
                promoteTo.push(this.stream.expect(TokenType.IDENTIFIER).value);
                if (!this.stream.match(TokenType.COMMA)) break;
              }
              this.stream.expect(TokenType.RBRACKET);
            } else {
              // Parse other property value
              properties[propName] = this.parseLiteral();
            }
            this.stream.skipNewlines();
          }
          this.stream.match(TokenType.DEDENT);
        }

        configs.push({
          type: 'PieceConfig',
          pieceName,
          promoteTo,
          properties: Object.keys(properties).length > 0 ? properties : undefined,
          location,
        });
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return configs;
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
    let additive = false; // add: 섹션 사용 시 true

    if (this.stream.match(TokenType.INDENT)) {
      while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
        this.stream.skipNewlines();
        if (this.stream.check(TokenType.DEDENT)) break;

        if (this.stream.check(TokenType.ADD)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          additive = true; // add: 섹션 사용 → base game setup 위에 추가

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

    return { type: 'Setup', placements, fromFEN, replace, additive, location };
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

        // Parse add:, replace:, or remove: blocks
        if (this.stream.check(TokenType.ADD)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;
              conditions.push(this.parseVictoryCondition(location, 'add'));
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else if (this.stream.check(TokenType.REPLACE)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;
              conditions.push(this.parseVictoryCondition(location, 'replace'));
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else if (this.stream.check(TokenType.REMOVE)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;
              // remove: only needs the name, condition is optional
              const name = this.stream.expect(TokenType.IDENTIFIER).value;
              conditions.push({
                type: 'Victory',
                name,
                condition: { type: 'Condition', kind: 'expression', location } as ConditionNode,
                action: 'remove',
                location,
              });
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else {
          // Direct condition without add:/replace:/remove: prefix (default: add)
          conditions.push(this.parseVictoryCondition(location, 'add'));
        }
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return conditions;
  }

  private parseVictoryCondition(
    location: SourceLocation,
    action: 'add' | 'replace' | 'remove' = 'add'
  ): VictoryNode {
    const name = this.stream.expect(TokenType.IDENTIFIER).value;
    this.stream.expect(TokenType.COLON);
    const condition = this.parseCondition();
    return { type: 'Victory', name, condition, action, location };
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

        // Parse add:, replace:, or remove: blocks
        if (this.stream.check(TokenType.ADD)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;
              conditions.push(this.parseDrawCondition(location, 'add'));
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else if (this.stream.check(TokenType.REPLACE)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;
              conditions.push(this.parseDrawCondition(location, 'replace'));
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else if (this.stream.check(TokenType.REMOVE)) {
          this.stream.advance();
          this.stream.expect(TokenType.COLON);
          this.stream.skipNewlines();
          if (this.stream.match(TokenType.INDENT)) {
            while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
              this.stream.skipNewlines();
              if (this.stream.check(TokenType.DEDENT)) break;
              // remove: only needs the name
              const name = this.stream.expect(TokenType.IDENTIFIER).value;
              conditions.push({
                type: 'Draw',
                name,
                condition: { type: 'Condition', kind: 'expression', location } as ConditionNode,
                action: 'remove',
                location,
              });
              this.stream.skipNewlines();
            }
            this.stream.match(TokenType.DEDENT);
          }
        } else {
          // Direct condition without add:/replace:/remove: prefix (default: add)
          conditions.push(this.parseDrawCondition(location, 'add'));
        }
        this.stream.skipNewlines();
      }
      this.stream.match(TokenType.DEDENT);
    }

    return conditions;
  }

  private parseDrawCondition(
    location: SourceLocation,
    action: 'add' | 'replace' | 'remove' = 'add'
  ): DrawNode {
    const name = this.stream.expect(TokenType.IDENTIFIER).value;
    this.stream.expect(TokenType.COLON);
    const condition = this.parseCondition();
    return { type: 'Draw', name, condition, action, location };
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
        // Accept STRING or IDENTIFIER for visual
        const token = this.stream.peek();
        if (token.type === TokenType.STRING) {
          visual = this.stream.advance().value;
        } else if (token.type === TokenType.IDENTIFIER) {
          visual = this.stream.advance().value;
        } else {
          // Try to parse as expression (e.g., highlight(red))
          const expr = this.parseExpression();
          visual = JSON.stringify(expr);
        }
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
    let optional: boolean | undefined;
    let description: string | undefined;

    while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
      this.stream.skipNewlines();
      if (this.stream.check(TokenType.RBRACE)) break;

      if (this.stream.match(TokenType.ON)) {
        this.stream.expect(TokenType.COLON);
        on = this.parseEventType();
      } else if (this.stream.match(TokenType.WHEN)) {
        this.stream.expect(TokenType.COLON);
        when = this.parseCondition();
      } else if (this.stream.match(TokenType.OPTIONAL)) {
        this.stream.expect(TokenType.COLON);
        // Accept true/false as boolean or identifier
        const token = this.stream.peek();
        if (token.type === TokenType.BOOLEAN) {
          const value = this.stream.advance().value.toLowerCase();
          optional = value === 'true';
        } else if (token.type === TokenType.IDENTIFIER) {
          const value = this.stream.advance().value.toLowerCase();
          optional = value === 'true';
        } else {
          optional = true; // Default to true if just "optional:" without value
        }
      } else if (this.stream.match(TokenType.DESCRIPTION)) {
        this.stream.expect(TokenType.COLON);
        description = this.stream.expect(TokenType.STRING).value;
      } else if (this.stream.match(TokenType.DO)) {
        this.stream.expect(TokenType.COLON);
        this.stream.skipNewlines();

        // Support three formats:
        // 1. Indented block (Python-style)
        // 2. Brace block: do: { action1; action2 }
        // 3. Single action on same line
        if (this.stream.match(TokenType.INDENT)) {
          // Format 1: Indented block
          while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
            this.stream.skipNewlines();
            if (this.stream.check(TokenType.DEDENT)) break;
            actions.push(this.parseAction());
            this.stream.skipNewlines();
          }
          this.stream.match(TokenType.DEDENT);
        } else if (this.stream.match(TokenType.LBRACE)) {
          // Format 2: Brace block
          this.skipWhitespaceAndIndent();
          while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
            this.skipWhitespaceAndIndent();
            if (this.stream.check(TokenType.RBRACE)) break;
            actions.push(this.parseAction());
            // Allow optional semicolon between actions
            this.stream.match(TokenType.SEMICOLON);
            this.skipWhitespaceAndIndent();
          }
          this.stream.expect(TokenType.RBRACE);
        } else {
          // Format 3: Single action
          actions.push(this.parseAction());
        }
      } else {
        this.stream.advance();
      }
      this.stream.skipNewlines();
    }

    this.stream.expect(TokenType.RBRACE);

    return { type: 'Trigger', name, on, when, actions, optional, description, location };
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

    // captured condition (e.g., "King captured")
    if (this.stream.match(TokenType.CAPTURED)) {
      return { type: 'Condition', kind: 'captured', location };
    }

    // Comparison or membership
    const left = this.parseExpression();

    // "on rank N" or "on file X" (e.g., "King on rank 8")
    if (this.stream.match(TokenType.ON)) {
      if (this.stream.match(TokenType.RANK)) {
        const rankValue = this.parseExpression();
        return { type: 'Condition', kind: 'on_rank', subject: left, value: rankValue, location };
      }
      if (this.stream.match(TokenType.FILE)) {
        const fileValue = this.parseExpression();
        return { type: 'Condition', kind: 'on_file', subject: left, value: fileValue, location };
      }
      this.error('Expected "rank" or "file" after "on"');
    }

    // in operator (membership) - e.g., "King in zone.hill"
    if (this.stream.match(TokenType.IN)) {
      const right = this.parseExpression();
      return { type: 'Condition', kind: 'in', left, right, location };
    }

    // captured keyword after subject (e.g., "King captured")
    if (this.stream.match(TokenType.CAPTURED)) {
      return { type: 'Condition', kind: 'piece_captured', subject: left, location };
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
    return this.parseComparison();
  }

  private parseComparison(): ExpressionNode {
    const location = this.stream.peek().location;
    let left = this.parseAdditive();

    while (this.stream.checkAny(
      TokenType.EQ, TokenType.NE, TokenType.LT, TokenType.GT,
      TokenType.LE, TokenType.GE, TokenType.STRICT_EQ, TokenType.STRICT_NE
    )) {
      const op = this.stream.advance().value;
      const right = this.parseAdditive();
      left = { type: 'Expression', kind: 'binary', op, left, right, location };
    }

    return left;
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
      TokenType.PIECE, TokenType.PIECES, TokenType.MOVE, TokenType.CAPTURE, TokenType.CHECK,
      TokenType.EMPTY, TokenType.ENEMY, TokenType.FRIEND, TokenType.CLEAR,
      TokenType.STATE, TokenType.EFFECT, TokenType.TRIGGER, TokenType.CAPTURED,
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

    // "create piece at position [for color]" or "add piece at position [for color]"
    // 'for color' is optional - defaults to current player if omitted
    if (this.stream.match(TokenType.CREATE) || this.stream.match(TokenType.ADD)) {
      const pieceType = this.stream.expect(TokenType.IDENTIFIER).value;
      this.stream.expect(TokenType.IDENTIFIER); // 'at'
      const position = this.parseExpression();
      
      // 'for' is optional
      let owner: ReturnType<typeof this.parseExpression> | null = null;
      if (this.stream.match(TokenType.FOR)) {
        owner = this.parseExpression();
      }
      
      return { type: 'Action', kind: 'create', pieceType, position, owner, location };
    }

    if (this.stream.match(TokenType.REMOVE)) {
      const target = this.parseExpression();

      // Check for range-based removal: "remove pieces in radius(N) from target [where ...]"
      if (this.stream.check(TokenType.IN) || 
          (this.stream.check(TokenType.IDENTIFIER) && this.stream.peek().value === 'in')) {
        this.stream.advance(); // 'in'

        // Expect 'radius' function call
        if (this.stream.check(TokenType.IDENTIFIER) && this.stream.peek().value === 'radius') {
          this.stream.advance(); // 'radius'
          this.stream.expect(TokenType.LPAREN);
          const radiusValue = parseInt(this.stream.expect(TokenType.NUMBER).value, 10);
          this.stream.expect(TokenType.RPAREN);

          // Expect 'from'
          if (this.stream.check(TokenType.IDENTIFIER) && this.stream.peek().value === 'from') {
            this.stream.advance(); // 'from'
            const fromTarget = this.parseExpression();

            // Check for optional 'where' filter
            let filter: { exclude?: string[]; include?: string[] } | undefined;
            if (this.stream.check(TokenType.WHERE)) {
              this.stream.advance(); // 'where'
              filter = this.parseRemoveFilter();
            }

            return {
              type: 'Action',
              kind: 'remove',
              target,
              range: {
                kind: 'radius',
                value: radiusValue,
                from: fromTarget,
              },
              filter,
              location,
            };
          }
        }
      }

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

    // "draw" or "draw reason"
    if (this.stream.match(TokenType.DRAW)) {
      let reason: string | undefined;
      // Optional reason (string or identifier)
      if (this.stream.check(TokenType.STRING)) {
        reason = this.stream.advance().value;
      } else if (this.stream.check(TokenType.IDENTIFIER)) {
        reason = this.stream.advance().value;
      }
      return { type: 'Action', kind: 'draw', reason, location };
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

    // cancel - stops the current action/event
    if (this.stream.match(TokenType.CANCEL)) {
      return { type: 'Action', kind: 'cancel', location };
    }

    // apply effect to target
    if (this.stream.match(TokenType.APPLY)) {
      const effect = this.stream.expect(TokenType.IDENTIFIER).value;
      // "to" keyword
      if (this.stream.check(TokenType.IDENTIFIER) && this.stream.peek().value === 'to') {
        this.stream.advance();
      }
      const target = this.parseExpression();
      return { type: 'Action', kind: 'apply', effect, target, location };
    }

    // for loop: for variable in iterable: actions
    if (this.stream.match(TokenType.FOR)) {
      const variable = this.stream.expect(TokenType.IDENTIFIER).value;
      this.stream.expect(TokenType.IN);
      const iterable = this.parseExpression();
      this.stream.expect(TokenType.COLON);
      
      const actions: ActionNode[] = [];
      // Parse actions in brace block or indented block
      if (this.stream.match(TokenType.LBRACE)) {
        this.skipWhitespaceAndIndent();
        while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
          this.skipWhitespaceAndIndent();
          if (this.stream.check(TokenType.RBRACE)) break;
          actions.push(this.parseAction());
          this.stream.match(TokenType.SEMICOLON);
          this.skipWhitespaceAndIndent();
        }
        this.stream.expect(TokenType.RBRACE);
      } else if (this.stream.match(TokenType.INDENT)) {
        while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
          this.stream.skipNewlines();
          if (this.stream.check(TokenType.DEDENT)) break;
          actions.push(this.parseAction());
          this.stream.skipNewlines();
        }
        this.stream.match(TokenType.DEDENT);
      } else {
        // Single action
        actions.push(this.parseAction());
      }
      
      return { type: 'Action', kind: 'for', variable, iterable, actions, location };
    }

    // if condition: actions [else: actions]
    if (this.stream.match(TokenType.IF)) {
      const condition = this.parseExpression();
      this.stream.expect(TokenType.COLON);
      
      const thenActions: ActionNode[] = [];
      // Parse then-actions in brace block
      if (this.stream.match(TokenType.LBRACE)) {
        this.skipWhitespaceAndIndent();
        while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
          this.skipWhitespaceAndIndent();
          if (this.stream.check(TokenType.RBRACE)) break;
          thenActions.push(this.parseAction());
          this.stream.match(TokenType.SEMICOLON);
          this.skipWhitespaceAndIndent();
        }
        this.stream.expect(TokenType.RBRACE);
      } else if (this.stream.match(TokenType.INDENT)) {
        while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
          this.stream.skipNewlines();
          if (this.stream.check(TokenType.DEDENT)) break;
          thenActions.push(this.parseAction());
          this.stream.skipNewlines();
        }
        this.stream.match(TokenType.DEDENT);
      } else {
        // Single action
        thenActions.push(this.parseAction());
      }
      
      // Optional else
      let elseActions: ActionNode[] | undefined;
      if (this.stream.match(TokenType.ELSE)) {
        this.stream.match(TokenType.COLON); // Optional colon after else
        elseActions = [];
        if (this.stream.match(TokenType.LBRACE)) {
          this.skipWhitespaceAndIndent();
          while (!this.stream.check(TokenType.RBRACE) && !this.stream.isAtEnd()) {
            this.skipWhitespaceAndIndent();
            if (this.stream.check(TokenType.RBRACE)) break;
            elseActions.push(this.parseAction());
            this.stream.match(TokenType.SEMICOLON);
            this.skipWhitespaceAndIndent();
          }
          this.stream.expect(TokenType.RBRACE);
        } else if (this.stream.match(TokenType.INDENT)) {
          while (!this.stream.check(TokenType.DEDENT) && !this.stream.isAtEnd()) {
            this.stream.skipNewlines();
            if (this.stream.check(TokenType.DEDENT)) break;
            elseActions.push(this.parseAction());
            this.stream.skipNewlines();
          }
          this.stream.match(TokenType.DEDENT);
        } else {
          elseActions.push(this.parseAction());
        }
      }
      
      return { type: 'Action', kind: 'if', condition, thenActions, elseActions, location };
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
    const codeParts: string[] = [];

    // Token types that should NOT have space before them
    const noSpaceBefore = new Set([
      TokenType.DOT,
      TokenType.COMMA,
      TokenType.SEMICOLON,
      TokenType.RPAREN,
      TokenType.RBRACKET,
      TokenType.COLON,
      TokenType.LPAREN, // 함수 호출: foo(
    ]);

    // Token types that should NOT have space after them
    const noSpaceAfter = new Set([
      TokenType.DOT,
      TokenType.LPAREN,
      TokenType.LBRACKET,
      TokenType.BANG,
    ]);


    let lastToken: Token | null = null;

    while (!this.stream.isAtEnd() && braceDepth > 0) {
      const token = this.stream.advance();

      // Determine the code string for this token
      let codeStr = '';
      if (token.type === TokenType.LBRACE) {
        braceDepth++;
        codeStr = '{';
      } else if (token.type === TokenType.RBRACE) {
        braceDepth--;
        if (braceDepth > 0) {
          codeStr = '}';
        }
      } else if (token.type === TokenType.NEWLINE) {
        codeStr = '\n';
      } else if (token.type === TokenType.SEMICOLON) {
        codeStr = ';';
      } else if (token.type === TokenType.LPAREN) {
        codeStr = '(';
      } else if (token.type === TokenType.RPAREN) {
        codeStr = ')';
      } else if (token.type === TokenType.LBRACKET) {
        codeStr = '[';
      } else if (token.type === TokenType.RBRACKET) {
        codeStr = ']';
      } else if (token.type === TokenType.COMMA) {
        codeStr = ',';
      } else if (token.type === TokenType.DOT) {
        codeStr = '.';
      } else if (token.type === TokenType.COLON) {
        codeStr = ':';
      } else if (token.type === TokenType.EQ) {
        codeStr = '===';
      } else if (token.type === TokenType.NE) {
        codeStr = '!==';
      } else if (token.type === TokenType.EQUALS) {
        codeStr = '=';
      } else if (token.type === TokenType.LT) {
        codeStr = '<';
      } else if (token.type === TokenType.GT) {
        codeStr = '>';
      } else if (token.type === TokenType.LE) {
        codeStr = '<=';
      } else if (token.type === TokenType.GE) {
        codeStr = '>=';
      } else if (token.type === TokenType.PLUS) {
        // Check for ++ operator
        if (lastToken && lastToken.type === TokenType.PLUS) {
          // Find and remove the previous + (and any space before it)
          while (codeParts.length > 0) {
            const last = codeParts[codeParts.length - 1];
            if (last === '+' || last === ' ') {
              codeParts.pop();
              if (last === '+') break;
            } else {
              break;
            }
          }
          codeParts.push('++');
          lastToken = token;
          continue; // Skip normal processing
        } else {
          codeStr = '+';
        }
      } else if (token.type === TokenType.MINUS) {
        // Check for -- operator
        if (lastToken && lastToken.type === TokenType.MINUS) {
          // Find and remove the previous - (and any space before it)
          while (codeParts.length > 0) {
            const last = codeParts[codeParts.length - 1];
            if (last === '-' || last === ' ') {
              codeParts.pop();
              if (last === '-') break;
            } else {
              break;
            }
          }
          codeParts.push('--');
          lastToken = token;
          continue; // Skip normal processing
        } else {
          codeStr = '-';
        }
      } else if (token.type === TokenType.STAR) {
        codeStr = '*';
      } else if (token.type === TokenType.SLASH) {
        codeStr = '/';
      } else if (token.type === TokenType.PIPE) {
        codeStr = '||';
      } else if (token.type === TokenType.AMPERSAND) {
        codeStr = '&&';
      } else if (token.type === TokenType.BANG) {
        codeStr = '!';
      } else if (token.type === TokenType.STRING) {
        codeStr = `"${token.value}"`;
      } else {
        codeStr = token.value;
      }

      // Add space intelligently
      if (codeStr && braceDepth >= 0) {
        const needsSpaceBefore =
          lastToken !== null &&
          !noSpaceAfter.has(lastToken.type) &&
          !noSpaceBefore.has(token.type) &&
          token.type !== TokenType.NEWLINE &&
          lastToken.type !== TokenType.NEWLINE;

        if (needsSpaceBefore && codeParts.length > 0) {
          codeParts.push(' ');
        }
        codeParts.push(codeStr);
      }

      lastToken = token;
    }

    const code = codeParts.join('').trim();
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
   * Skip whitespace tokens (NEWLINE, INDENT, DEDENT)
   * Used inside brace blocks where indentation is not significant
   */
  private skipWhitespaceAndIndent(): void {
    while (
      !this.stream.isAtEnd() &&
      (this.stream.check(TokenType.NEWLINE) ||
        this.stream.check(TokenType.INDENT) ||
        this.stream.check(TokenType.DEDENT))
    ) {
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

  /**
   * Parse filter for remove action: "where not Pawn" or "where King"
   */
  private parseRemoveFilter(): { exclude?: string[]; include?: string[] } {
    const filter: { exclude?: string[]; include?: string[] } = {};
    
    // Check for 'not' (exclusion)
    if (this.stream.check(TokenType.NOT)) {
      this.stream.advance(); // 'not'
      filter.exclude = [this.stream.expect(TokenType.IDENTIFIER).value];
    } else {
      // Inclusion: specific piece type
      filter.include = [this.stream.expect(TokenType.IDENTIFIER).value];
    }

    return filter;
  }

  private error(message: string): never {
    const token = this.stream.peek();
    throw new ParserError(message, token.location);
  }
}
