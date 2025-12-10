import type { LanguageRegistration } from 'shiki';

/**
 * ChessLang TextMate Grammar
 * 
 * ChessLang DSL을 위한 문법 정의
 */
export const chesslangGrammar: LanguageRegistration = {
  name: 'chesslang',
  scopeName: 'source.chesslang',
  patterns: [
    // 주석
    { include: '#comments' },
    // 스크립트 블록
    { include: '#script-block' },
    // 문자열
    { include: '#strings' },
    // 숫자
    { include: '#numbers' },
    // 키워드
    { include: '#keywords' },
    // 타입/클래스
    { include: '#types' },
    // 연산자
    { include: '#operators' },
    // 좌표
    { include: '#coordinates' },
    // 속성 키
    { include: '#property-keys' },
  ],
  repository: {
    comments: {
      patterns: [
        {
          // 한 줄 주석 (# 스타일)
          name: 'comment.line.number-sign.chesslang',
          match: '#.*$',
        },
        {
          // 한 줄 주석 (// 스타일)
          name: 'comment.line.double-slash.chesslang',
          match: '//.*$',
        },
        {
          // 블록 주석
          name: 'comment.block.chesslang',
          begin: '/\\*',
          end: '\\*/',
        },
      ],
    },
    'script-block': {
      patterns: [
        {
          // script { ... } 블록
          name: 'meta.embedded.block.javascript.chesslang',
          begin: '\\b(script)\\s*(\\{)',
          beginCaptures: {
            '1': { name: 'keyword.control.script.chesslang' },
            '2': { name: 'punctuation.section.block.begin.chesslang' },
          },
          end: '(\\})',
          endCaptures: {
            '1': { name: 'punctuation.section.block.end.chesslang' },
          },
          patterns: [
            { include: '#script-contents' },
          ],
        },
      ],
    },
    'script-contents': {
      patterns: [
        // 주석
        {
          name: 'comment.line.double-slash.js',
          match: '//.*$',
        },
        {
          name: 'comment.block.js',
          begin: '/\\*',
          end: '\\*/',
        },
        // 문자열
        {
          name: 'string.quoted.double.js',
          begin: '"',
          end: '"',
          patterns: [{ name: 'constant.character.escape.js', match: '\\\\.' }],
        },
        {
          name: 'string.quoted.single.js',
          begin: "'",
          end: "'",
          patterns: [{ name: 'constant.character.escape.js', match: '\\\\.' }],
        },
        // 숫자
        {
          name: 'constant.numeric.js',
          match: '\\b\\d+(\\.\\d+)?\\b',
        },
        // JS 키워드
        {
          name: 'keyword.control.js',
          match: '\\b(if|else|for|while|do|switch|case|break|continue|return|throw|try|catch|finally)\\b',
        },
        // 선언 키워드
        {
          name: 'storage.type.js',
          match: '\\b(var|let|const|function)\\b',
        },
        // 불리언/특수 값
        {
          name: 'constant.language.js',
          match: '\\b(true|false|null|undefined|this)\\b',
        },
        // game/board API
        {
          name: 'variable.language.chesslang',
          match: '\\b(game|board|piece|event|player|opponent)\\b',
        },
        // 메서드/속성 호출
        {
          name: 'entity.name.function.js',
          match: '\\b(on|state|isCheck|isCheckmate|endTurn|declareWinner|declareDraw|allowExtraMove|pieces|at|movePiece|removePiece|createPiece|emptySquares|adjacent|getPieces|console|log|warn|error)\\b',
        },
        // 연산자
        {
          name: 'keyword.operator.js',
          match: '(===|!==|==|!=|<=|>=|&&|\\|\\||\\+\\+|--|\\+=|-=|\\*=|/=|=>|[+\\-*/%<>=!&|^~?:])',
        },
        // 괄호
        {
          name: 'punctuation.definition.block.js',
          match: '[{}\\[\\]()]',
        },
        // 세미콜론/콤마
        {
          name: 'punctuation.separator.js',
          match: '[;,]',
        },
        // 식별자
        {
          name: 'variable.other.js',
          match: '\\b[a-zA-Z_][a-zA-Z0-9_]*\\b',
        },
      ],
    },
    strings: {
      patterns: [
        {
          // 큰따옴표 문자열
          name: 'string.quoted.double.chesslang',
          begin: '"',
          end: '"',
          patterns: [
            {
              name: 'constant.character.escape.chesslang',
              match: '\\\\.',
            },
          ],
        },
        {
          // 작은따옴표 문자열
          name: 'string.quoted.single.chesslang',
          begin: "'",
          end: "'",
          patterns: [
            {
              name: 'constant.character.escape.chesslang',
              match: '\\\\.',
            },
          ],
        },
      ],
    },
    numbers: {
      patterns: [
        {
          // 숫자
          name: 'constant.numeric.chesslang',
          match: '\\b\\d+(\\.\\d+)?\\b',
        },
      ],
    },
    keywords: {
      patterns: [
        {
          // 최상위 키워드
          name: 'keyword.control.chesslang',
          match: '\\b(game|extends|board|pieces|victory|draw|rules|trigger|script|piece|state)\\b',
        },
        {
          // 섹션 키워드
          name: 'keyword.other.chesslang',
          match: '\\b(setup|zones|size|add|remove|replace|move|capture|traits|on|do|if|then|else|function|return|var|let|const)\\b',
        },
        {
          // 패턴 키워드
          name: 'support.function.chesslang',
          match: '\\b(slide|step|leap|hop|rider|cannon|teleport)\\b',
        },
        {
          // 방향 키워드
          name: 'constant.language.direction.chesslang',
          match: '\\b(orthogonal|diagonal|any|forward|backward|left|right|n|s|e|w|ne|nw|se|sw)\\b',
        },
        {
          // 조건 키워드
          name: 'keyword.operator.logical.chesslang',
          match: '\\b(in|on|at|from|to|and|or|not|is|has|can|with|where|when)\\b',
        },
        {
          // 액션 키워드
          name: 'entity.name.function.chesslang',
          match: '\\b(transform|remove|place|swap|explode|freeze|unfreeze|check|checkmate|stalemate|radius)\\b',
        },
        {
          // 불리언
          name: 'constant.language.boolean.chesslang',
          match: '\\b(true|false|yes|no|enabled|disabled)\\b',
        },
      ],
    },
    types: {
      patterns: [
        {
          // 기물 타입
          name: 'entity.name.type.chesslang',
          match: '\\b(King|Queen|Rook|Bishop|Knight|Pawn|Amazon|Chancellor|Archbishop|Empress|Princess|Dragon|Griffin|Phoenix|Unicorn|Nightrider)\\b',
        },
        {
          // 색상
          name: 'constant.language.color.chesslang',
          match: '\\b(white|black|neutral)\\b',
        },
        {
          // 특성 (traits)
          name: 'support.constant.chesslang',
          match: '\\b(royal|jump|promotable|enpassant|castling|firstmove|explosive|frozen|invulnerable)\\b',
        },
      ],
    },
    operators: {
      patterns: [
        {
          // 할당 및 비교
          name: 'keyword.operator.chesslang',
          match: '(:|=|==|!=|<|>|<=|>=|\\+|-|\\*|/|\\||&|!)',
        },
      ],
    },
    coordinates: {
      patterns: [
        {
          // 체스 좌표 (a1-z99 형식, 모든 보드 크기 지원)
          // 더 긴 패턴을 먼저 매칭 (a10, j12 등)
          name: 'constant.other.coordinate.chesslang',
          match: '\\b[a-z]([1-9][0-9]?|[1-9])\\b',
        },
      ],
    },
    'property-keys': {
      patterns: [
        {
          // zone 참조
          name: 'variable.other.property.chesslang',
          match: '\\bzone\\.[a-zA-Z_][a-zA-Z0-9_]*\\b',
        },
        {
          // 상태 참조
          name: 'variable.other.property.chesslang',
          match: '\\bstate\\.[a-zA-Z_][a-zA-Z0-9_]*\\b',
        },
        {
          // 이벤트 참조
          name: 'variable.other.property.chesslang',
          match: '\\bevent\\.[a-zA-Z_][a-zA-Z0-9_]*\\b',
        },
      ],
    },
  },
};

