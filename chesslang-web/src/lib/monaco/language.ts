import type * as monaco from 'monaco-editor';

// ChessLang language definition for Monaco Editor
export const chessLangLanguageDefinition: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.chesslang',

  keywords: [
    'game',
    'extends',
    'board',
    'piece',
    'effect',
    'trigger',
    'pattern',
    'move',
    'capture',
    'traits',
    'state',
    'on',
    'when',
    'do',
    'script',
    'setup',
    'victory',
    'draw',
    'rules',
    'add',
    'remove',
    'size',
    'zones',
  ],

  patterns: ['step', 'slide', 'leap', 'hop'],

  directions: [
    'N',
    'S',
    'E',
    'W',
    'NE',
    'NW',
    'SE',
    'SW',
    'orthogonal',
    'diagonal',
    'any',
    'forward',
    'backward',
  ],

  conditions: ['empty', 'enemy', 'friend', 'clear', 'check', 'first_move'],

  logical: ['and', 'or', 'not', 'in', 'where'],

  actions: ['set', 'create', 'remove', 'transform', 'mark', 'win', 'lose'],

  traits: ['royal', 'jump', 'promote'],

  pieces: ['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn'],

  colors: ['White', 'Black'],

  operators: ['=', '==', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '|', '&', ':'],

  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.square' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
  ],

  tokenizer: {
    root: [
      // Comments
      [/#.*$/, 'comment'],
      [/\/\/.*$/, 'comment'],

      // Strings
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],

      // Square notation - extended format first (e.g., a10, j12 for larger boards)
      [/\b[a-z][1-9][0-9]?\b/, 'number.square'],

      // Board size (e.g., 8x8)
      [/\b\d+x\d+\b/, 'number.size'],

      // Keywords
      [
        /\b(game|extends|board|piece|effect|trigger|pattern|move|capture|traits|state|on|when|do|script|setup|victory|draw|rules|add|remove|size|zones)\b/,
        'keyword',
      ],

      // Patterns
      [/\b(step|slide|leap|hop)\b/, 'type.pattern'],

      // Directions
      [
        /\b(N|S|E|W|NE|NW|SE|SW|orthogonal|diagonal|any|forward|backward)\b/,
        'constant.direction',
      ],

      // Conditions
      [/\b(empty|enemy|friend|clear|check|first_move)\b/, 'variable.condition'],

      // Logical operators
      [/\b(and|or|not|in|where)\b/, 'keyword.operator'],

      // Actions
      [/\b(set|create|remove|transform|mark|win|lose)\b/, 'function.action'],

      // Traits
      [/\b(royal|jump|promote)\b/, 'constant.trait'],

      // Pieces
      [/\b(King|Queen|Rook|Bishop|Knight|Pawn)\b/, 'type.piece'],

      // Colors
      [/\b(White|Black)\b/, 'constant.color'],

      // Numbers
      [/\b\d+\b/, 'number'],

      // Identifiers
      [/[a-zA-Z_]\w*/, 'identifier'],

      // Operators
      [/[=<>!]=?/, 'operator'],
      [/[+\-*\/|&]/, 'operator'],
      [/:/, 'delimiter'],

      // Brackets
      [/[{}()\[\]]/, '@brackets'],

      // Whitespace
      [/\s+/, 'white'],
    ],
  },
};

// ChessLang language configuration
export const chessLangLanguageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  indentationRules: {
    increaseIndentPattern: /:\s*$/,
    decreaseIndentPattern: /^\s*[}\]]/,
  },
};

// Register ChessLang language with Monaco
export function registerChessLangLanguage(monaco: typeof import('monaco-editor')) {
  // Register the language
  monaco.languages.register({ id: 'chesslang' });

  // Set the tokens provider
  monaco.languages.setMonarchTokensProvider('chesslang', chessLangLanguageDefinition);

  // Set the language configuration
  monaco.languages.setLanguageConfiguration('chesslang', chessLangLanguageConfiguration);

  // Register completion provider
  monaco.languages.registerCompletionItemProvider('chesslang', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [
        // Keywords
        ...['game', 'extends', 'board', 'piece', 'trigger', 'setup', 'victory', 'draw', 'rules'].map(
          (kw) => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          })
        ),

        // Patterns
        ...['step', 'slide', 'leap', 'hop'].map((p) => ({
          label: p,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${p}($1)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        })),

        // Directions
        ...['orthogonal', 'diagonal', 'any', 'forward', 'N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'].map(
          (d) => ({
            label: d,
            kind: monaco.languages.CompletionItemKind.Constant,
            insertText: d,
            range,
          })
        ),

        // Pieces
        ...['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn'].map((p) => ({
          label: p,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: p,
          range,
        })),

        // Snippets
        {
          label: 'piece',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['piece ${1:Name} {', '  move: ${2:step(any)}', '  capture: =move', '}'].join(
            '\n'
          ),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define a new piece',
          range,
        },
        {
          label: 'trigger',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'trigger ${1:name} {',
            '  on: ${2:move}',
            '  when: ${3:condition}',
            '  do: ${4:action}',
            '}',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define a trigger',
          range,
        },
        {
          label: 'game',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'game: "${1:My Game}"',
            'extends: "Standard Chess"',
            '',
            'board:',
            '  size: 8x8',
            '',
            'victory:',
            '  ${2:checkmate}: ${3:condition}',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Start a new game definition',
          range,
        },
      ];

      return { suggestions };
    },
  });

  // Register hover provider
  monaco.languages.registerHoverProvider('chesslang', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const docs: Record<string, string> = {
        step: '**step(direction, distance?)**\n\nMove a fixed number of squares in a direction.\n\n```chesslang\nmove: step(orthogonal)\nmove: step(forward, 2)\n```',
        slide:
          '**slide(direction)**\n\nMove any number of squares in a direction until blocked.\n\n```chesslang\nmove: slide(diagonal)\n```',
        leap: '**leap(dx, dy)**\n\nJump to a specific offset, ignoring pieces in between.\n\n```chesslang\nmove: leap(2, 1)  # Knight move\n```',
        hop: '**hop(direction)**\n\nJump over a piece and land on the other side.\n\n```chesslang\nmove: hop(orthogonal)\n```',
        royal: '**royal**\n\nTrait marking a piece whose capture ends the game (like King).',
        jump: '**jump**\n\nTrait allowing a piece to ignore pieces in its path.',
        promote:
          '**promote**\n\nTrait marking a piece that can promote when reaching the end rank.',
        orthogonal: '**orthogonal**\n\nThe four cardinal directions: N, S, E, W.',
        diagonal: '**diagonal**\n\nThe four diagonal directions: NE, NW, SE, SW.',
        any: '**any**\n\nAll eight directions (orthogonal + diagonal).',
        forward: '**forward**\n\nPlayer-relative forward direction (N for White, S for Black).',
        empty: '**empty**\n\nCondition: target square is empty.',
        enemy: '**enemy**\n\nCondition: target square has an enemy piece.',
        friend: '**friend**\n\nCondition: target square has a friendly piece.',
        check: '**check**\n\nCondition: player is in check.',
        first_move: "**first_move**\n\nCondition: this is the piece's first move.",
        where: '**where condition**\n\nAdd a condition to a movement pattern.',
      };

      const doc = docs[word.word];
      if (doc) {
        return {
          contents: [{ value: doc }],
        };
      }

      return null;
    },
  });
}
