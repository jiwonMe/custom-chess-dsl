import type {
  GameNode,
  PieceNode,
  EffectNode,
  TriggerNode,
  PatternExprNode,
  ConditionNode,
  ActionNode,
  ExpressionNode,
  SetupNode,
  VictoryNode,
  DrawNode,
  RulesNode,
  CompiledGame,
  PieceDefinition,
  EffectDefinition,
  TriggerDefinition,
  TraitDefinition,
  Pattern,
  Condition,
  Action,
  Expression,
  Direction,
  BoardConfig,
  SetupConfig,
  PlacementConfig,
  VictoryCondition,
  DrawCondition,
  RuleConfig,
  Position,
  Color,
} from '../types/index.js';
import { CompilerError } from '../types/index.js';
import { parseSquare } from '../engine/position.js';

/**
 * Compiler for ChessLang DSL
 * Transforms AST into executable game configuration
 */
export class Compiler {
  private ast: GameNode;
  private patterns: Map<string, Pattern> = new Map();
  private errors: CompilerError[] = [];

  constructor(ast: GameNode) {
    this.ast = ast;
  }

  /**
   * Compile the AST into an executable game
   */
  compile(): CompiledGame {
    this.errors = [];
    this.patterns.clear();

    // First pass: collect pattern definitions
    for (const pattern of this.ast.patterns) {
      const compiled = this.compilePatternExpr(pattern.pattern);
      this.patterns.set(pattern.name, compiled);
    }

    // Compile board configuration
    const board = this.compileBoardConfig();

    // Compile pieces
    const pieces = new Map<string, PieceDefinition>();
    for (const piece of this.ast.pieces) {
      const compiled = this.compilePiece(piece);
      pieces.set(piece.name, compiled);
    }

    // Compile effects
    const effects = new Map<string, EffectDefinition>();
    for (const effect of this.ast.effects) {
      const compiled = this.compileEffect(effect);
      effects.set(effect.name, compiled);
    }

    // Compile triggers
    const triggers: TriggerDefinition[] = this.ast.triggers.map((t) =>
      this.compileTrigger(t)
    );

    // Compile setup
    const setup = this.compileSetup(this.ast.setup);

    // Compile victory conditions
    const victory = this.ast.victory.map((v) => this.compileVictoryCondition(v));

    // Compile draw conditions
    const draw = this.ast.draw.map((d) => this.compileDrawCondition(d));

    // Compile rules
    const rules = this.compileRules(this.ast.rules);

    // Compile scripts
    const scripts = this.ast.scripts.map((s) => s.code);

    if (this.errors.length > 0) {
      throw this.errors[0];
    }

    // Create trait definitions from pieces
    const traits = this.compileTraits(pieces);

    return {
      name: this.ast.name,
      extends: this.ast.extends,
      board,
      pieces,
      effects,
      triggers,
      traits,
      setup,
      victory,
      draw,
      rules,
      scripts,
    };
  }

  /**
   * Compile trait definitions from piece traits
   * Custom traits get their behavior from triggers
   */
  private compileTraits(
    pieces: Map<string, PieceDefinition>
  ): Map<string, TraitDefinition> {
    const traits = new Map<string, TraitDefinition>();

    // Built-in traits
    const builtInTraits: Array<[string, Partial<TraitDefinition>]> = [
      ['royal', { name: 'royal', description: 'Target for check/checkmate' }],
      ['phase', { name: 'phase', description: 'Can pass through pieces', moveModifier: 'phase' }],
      ['jump', { name: 'jump', description: 'Can jump over pieces', moveModifier: 'jump' }],
      ['promote', { name: 'promote', description: 'Can be promoted' }],
      ['immune', { name: 'immune', description: 'Cannot be captured', immune: true }],
      ['explosive', { name: 'explosive', description: 'Destroys adjacent pieces when captured' }],
    ];

    for (const [name, def] of builtInTraits) {
      traits.set(name, def as TraitDefinition);
    }

    // Collect all unique traits from pieces
    for (const piece of pieces.values()) {
      for (const traitName of piece.traits) {
        if (!traits.has(traitName)) {
          // Custom trait - no built-in behavior
          traits.set(traitName, {
            name: traitName,
            description: `Custom trait: ${traitName}`,
          });
        }
      }
    }

    return traits;
  }

  private compileBoardConfig(): BoardConfig {
    const boardNode = this.ast.board;
    const zones = new Map<string, Position[]>();

    if (boardNode?.zones) {
      for (const [name, squares] of boardNode.zones) {
        const positions = squares
          .map((s) => parseSquare(s))
          .filter((p): p is Position => p !== null);
        zones.set(name, positions);
      }
    }

    return {
      width: boardNode?.width ?? 8,
      height: boardNode?.height ?? 8,
      zones,
    };
  }

  private compilePiece(node: PieceNode): PieceDefinition {
    const move = node.move ? this.compilePatternExpr(node.move) : this.defaultPattern();

    let capture: Pattern | 'same' | 'none';
    if (node.capture === 'same') {
      capture = 'same';
    } else if (node.capture === 'none') {
      capture = 'none';
    } else if (node.capture) {
      capture = this.compilePatternExpr(node.capture);
    } else {
      capture = 'same';
    }

    const triggers = node.triggers.map((t) => this.compileTrigger(t));

    return {
      name: node.name,
      move,
      capture,
      traits: node.traits,
      initialState: { ...node.state },
      triggers,
    };
  }

  private compileEffect(node: EffectNode): EffectDefinition {
    return {
      name: node.name,
      blocks: node.blocks,
      visual: node.visual,
    };
  }

  private compileTrigger(node: TriggerNode): TriggerDefinition {
    return {
      name: node.name,
      on: node.on,
      when: node.when ? this.compileCondition(node.when) : undefined,
      actions: node.actions.map((a) => this.compileAction(a)),
    };
  }

  private compilePatternExpr(node: PatternExprNode): Pattern {
    switch (node.kind) {
      case 'step':
        return {
          type: 'step',
          direction: node.direction as Direction,
          distance: node.distance ?? 1,
        };

      case 'slide':
        return {
          type: 'slide',
          direction: node.direction as Direction,
        };

      case 'leap':
        return {
          type: 'leap',
          dx: node.dx ?? 0,
          dy: node.dy ?? 0,
        };

      case 'hop':
        return {
          type: 'hop',
          direction: node.direction as Direction,
        };

      case 'or':
        return {
          type: 'composite',
          op: 'or',
          patterns: node.patterns?.map((p) => this.compilePatternExpr(p)) ?? [],
        };

      case 'then':
        return {
          type: 'composite',
          op: 'then',
          patterns: node.patterns?.map((p) => this.compilePatternExpr(p)) ?? [],
        };

      case 'repeat': {
        const base = node.patterns?.[0]
          ? this.compilePatternExpr(node.patterns[0])
          : this.defaultPattern();
        const patterns: Pattern[] = [];
        for (let i = 0; i < (node.count ?? 1); i++) {
          patterns.push(base);
        }
        return {
          type: 'composite',
          op: 'then',
          patterns,
        };
      }

      case 'conditional': {
        const pattern = node.patterns?.[0]
          ? this.compilePatternExpr(node.patterns[0])
          : this.defaultPattern();
        const condition = node.condition
          ? this.compileCondition(node.condition)
          : undefined;
        return {
          type: 'conditional',
          pattern,
          condition: condition ?? { type: 'empty' },
        };
      }

      case 'reference': {
        const referenced = this.patterns.get(node.name ?? '');
        if (referenced) {
          return referenced;
        }
        // Return a reference pattern that will be resolved at runtime
        return {
          type: 'reference',
          name: node.name ?? '',
        };
      }

      default:
        return this.defaultPattern();
    }
  }

  private compileCondition(node: ConditionNode): Condition {
    switch (node.kind) {
      case 'empty':
        return { type: 'empty' };
      case 'enemy':
        return { type: 'enemy' };
      case 'friend':
        return { type: 'friend' };
      case 'clear':
        return { type: 'clear' };
      case 'check':
        return { type: 'check' };
      case 'first_move':
        return { type: 'first_move' };
      case 'captured':
        // Standalone "captured" condition
        return {
          type: 'piece_captured',
          pieceType: 'King', // Default to King
        };

      case 'logical':
        return {
          type: 'logical',
          op: node.op as 'and' | 'or',
          left: this.compileCondition(node.left as ConditionNode),
          right: this.compileCondition(node.right as ConditionNode),
        };

      case 'not':
        return {
          type: 'not',
          condition: this.compileCondition(node.condition as ConditionNode),
        };

      case 'comparison':
        return {
          type: 'comparison',
          left: this.compileExpression(node.left as ExpressionNode),
          op: node.op as '==' | '!=' | '<' | '>' | '<=' | '>=',
          right: this.compileExpression(node.right as ExpressionNode),
        };

      case 'in':
        // "King in zone.hill" or similar
        return {
          type: 'in_zone',
          zone: this.extractZoneName(node.right as ExpressionNode),
          pieceType: this.extractPieceType(node.left as ExpressionNode),
        };

      case 'on_rank':
        // "King on rank 8"
        return {
          type: 'on_rank',
          pieceType: this.extractPieceType(node.subject as ExpressionNode),
          rank: this.extractNumber(node.value as ExpressionNode),
        };

      case 'on_file':
        // "King on file a"
        return {
          type: 'on_file',
          pieceType: this.extractPieceType(node.subject as ExpressionNode),
          file: this.extractString(node.value as ExpressionNode),
        };

      case 'piece_captured':
        // "King captured"
        return {
          type: 'piece_captured',
          pieceType: this.extractPieceType(node.subject as ExpressionNode),
        };

      case 'expression':
        // Truthy check on expression
        return {
          type: 'custom',
          name: 'truthy',
          args: [this.compileExpression(node.left as ExpressionNode)],
        };

      default:
        return { type: 'empty' };
    }
  }

  private extractPieceType(expr: ExpressionNode | undefined): string {
    if (!expr) return 'King';
    if (expr.kind === 'identifier' && expr.name) {
      return expr.name;
    }
    return 'King';
  }

  private extractNumber(expr: ExpressionNode | undefined): number {
    if (!expr) return 0;
    if (expr.kind === 'literal' && typeof expr.value === 'number') {
      return expr.value;
    }
    return 0;
  }

  private extractString(expr: ExpressionNode | undefined): string {
    if (!expr) return '';
    if (expr.kind === 'literal' && typeof expr.value === 'string') {
      return expr.value;
    }
    if (expr.kind === 'identifier' && expr.name) {
      return expr.name;
    }
    return '';
  }

  private compileExpression(node: ExpressionNode): Expression {
    switch (node.kind) {
      case 'literal':
        return {
          type: 'literal',
          value: node.value as string | number | boolean | null,
        };

      case 'identifier':
        return {
          type: 'identifier',
          name: node.name ?? '',
        };

      case 'square':
        return {
          type: 'literal',
          value: node.value as string,
        };

      case 'member':
        return {
          type: 'member',
          object: this.compileExpression(node.object as ExpressionNode),
          property: node.property ?? '',
        };

      case 'call':
        return {
          type: 'call',
          callee: this.compileExpression(node.callee as ExpressionNode),
          args: node.args?.map((a) => this.compileExpression(a)) ?? [],
        };

      case 'binary':
        return {
          type: 'binary',
          op: node.op ?? '+',
          left: this.compileExpression(node.left as ExpressionNode),
          right: this.compileExpression(node.right as ExpressionNode),
        };

      case 'unary':
        return {
          type: 'unary',
          op: node.op ?? '-',
          operand: this.compileExpression(node.operand as ExpressionNode),
        };

      case 'array':
        return {
          type: 'array',
          elements: node.elements?.map((e) => this.compileExpression(e)) ?? [],
        };

      case 'object':
        const properties = new Map<string, Expression>();
        if (node.properties) {
          for (const [key, value] of node.properties) {
            properties.set(key, this.compileExpression(value));
          }
        }
        return {
          type: 'object',
          properties,
        };

      case 'index':
        return {
          type: 'call',
          callee: {
            type: 'member',
            object: this.compileExpression(node.object as ExpressionNode),
            property: 'get',
          },
          args: node.args?.map((a) => this.compileExpression(a)) ?? [],
        };

      default:
        return { type: 'literal', value: null };
    }
  }

  private compileAction(node: ActionNode): Action {
    switch (node.kind) {
      case 'set':
        return {
          type: 'set',
          target: this.compileExpression(node.target as ExpressionNode),
          op: (node.op as '=' | '+=' | '-=') ?? '=',
          value: this.compileExpression(node.value as ExpressionNode),
        };

      case 'create':
        return {
          type: 'create',
          pieceType: node.pieceType ?? 'Pawn',
          position: this.compileExpression(node.position as ExpressionNode),
          owner: typeof node.owner === 'string'
            ? node.owner as Color
            : this.compileExpression(node.owner as ExpressionNode),
        };

      case 'remove':
        return {
          type: 'remove',
          target: this.compileExpression(node.target as ExpressionNode),
        };

      case 'transform':
        return {
          type: 'transform',
          target: this.compileExpression(node.target as ExpressionNode),
          newType: node.newType ?? 'Queen',
        };

      case 'mark':
        return {
          type: 'mark',
          position: this.compileExpression(node.position as ExpressionNode),
          effect: node.effect ?? '',
        };

      case 'move':
        return {
          type: 'move',
          target: this.compileExpression(node.target as ExpressionNode),
          destination: this.compileExpression(node.position as ExpressionNode),
        };

      case 'win':
        return {
          type: 'win',
          player: typeof node.player === 'string'
            ? node.player as Color
            : this.compileExpression(node.player as ExpressionNode),
        };

      case 'lose':
        return {
          type: 'lose',
          player: typeof node.player === 'string'
            ? node.player as Color
            : this.compileExpression(node.player as ExpressionNode),
        };

      case 'let':
        return {
          type: 'set',
          target: this.compileExpression(node.target as ExpressionNode),
          op: '=',
          value: this.compileExpression(node.value as ExpressionNode),
        };

      case 'cancel':
        return {
          type: 'cancel',
        };

      case 'apply':
        return {
          type: 'apply',
          effect: node.effect ?? '',
          target: this.compileExpression(node.target as ExpressionNode),
        };

      case 'for':
        return {
          type: 'for',
          variable: node.variable ?? 'item',
          iterable: this.compileExpression(node.iterable as ExpressionNode),
          actions: node.actions?.map((a) => this.compileAction(a)) ?? [],
        };

      case 'if':
        return {
          type: 'if',
          condition: this.compileExpression(node.condition as ExpressionNode),
          thenActions: node.thenActions?.map((a) => this.compileAction(a)) ?? [],
          elseActions: node.elseActions?.map((a) => this.compileAction(a)),
        };

      case 'draw':
        return {
          type: 'draw',
          reason: node.reason,
        };

      default:
        return {
          type: 'custom',
          name: node.kind,
          args: [],
        };
    }
  }

  private compileSetup(node?: SetupNode): SetupConfig {
    const placements: PlacementConfig[] = [];
    let replace: Map<string, string> | undefined;
    let additive = false;

    if (node) {
      for (const p of node.placements) {
        const position = parseSquare(p.square);
        if (position) {
          placements.push({
            pieceType: p.pieceType,
            position,
            owner: p.owner,
          });
        }
      }

      // Copy replace map if exists
      if (node.replace && node.replace.size > 0) {
        replace = new Map(node.replace);
      }

      // Copy additive flag
      additive = node.additive ?? false;
    }

    return { placements, replace, additive };
  }

  /**
   * Compile a victory condition node.
   * 
   * **Combination Rules:**
   * - Multiple conditions are combined with OR logic
   * - 'add': Adds to existing conditions (OR)
   * - 'replace': Replaces condition with same name
   * - 'remove': Removes condition by name
   */
  private compileVictoryCondition(node: VictoryNode): VictoryCondition {
    return {
      name: node.name,
      condition: this.compileCondition(node.condition),
      winner: 'current',
      action: node.action ?? 'add',
    };
  }

  /**
   * Compile a draw condition node.
   * 
   * **Combination Rules:**
   * - Multiple conditions are combined with OR logic
   * - 'add': Adds to existing conditions (OR)
   * - 'replace': Replaces condition with same name
   * - 'remove': Removes condition by name
   */
  private compileDrawCondition(node: DrawNode): DrawCondition {
    return {
      name: node.name,
      condition: this.compileCondition(node.condition),
      action: node.action ?? 'add',
    };
  }

  private compileRules(node?: RulesNode): RuleConfig {
    return {
      checkDetection: node?.checkDetection ?? true,
      castling: node?.castling ?? true,
      enPassant: node?.enPassant ?? true,
      promotion: node?.promotion ?? true,
      fiftyMoveRule: node?.fiftyMoveRule ?? true,
      threefoldRepetition: node?.threefoldRepetition ?? true,
    };
  }

  private extractZoneName(expr: ExpressionNode): string {
    // Handle "zone.hill" -> "hill"
    if (expr.kind === 'member' && expr.property) {
      return expr.property;
    }
    if (expr.kind === 'identifier' && expr.name) {
      return expr.name;
    }
    return '';
  }

  private defaultPattern(): Pattern {
    return { type: 'step', direction: 'any', distance: 0 };
  }
}

/**
 * Compile ChessLang AST to executable game
 */
export function compile(ast: GameNode): CompiledGame {
  const compiler = new Compiler(ast);
  return compiler.compile();
}
