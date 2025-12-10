import type * as monaco from 'monaco-editor';

/**
 * Ayu Light 테마 기반 ChessLang 테마
 * https://github.com/ayu-theme/ayu-colors
 */
export const ayuLightTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // 주석 - 회색 이탤릭
    { token: 'comment', foreground: 'ABB0B6', fontStyle: 'italic' },

    // 문자열 - 녹색
    { token: 'string', foreground: '86B300' },

    // 키워드 - 주황색 bold
    { token: 'keyword', foreground: 'FA8D3E', fontStyle: 'bold' },

    // 패턴 (step, slide, leap, hop) - 노란색
    { token: 'type.pattern', foreground: 'F2AE49' },

    // 방향 (N, S, E, W, diagonal, orthogonal) - 청록색
    { token: 'constant.direction', foreground: '4CBF99' },

    // 조건 (empty, enemy, friend, check) - 파란색
    { token: 'variable.condition', foreground: '399EE6' },

    // 연산자 키워드 (and, or, not) - 주황색
    { token: 'keyword.operator', foreground: 'ED9366' },

    // 액션 (set, create, remove, transform) - 노란색
    { token: 'function.action', foreground: 'F2AE49' },

    // 트레이트 (royal, jump, phase) - 청록색
    { token: 'constant.trait', foreground: '4CBF99' },

    // 기물 타입 (King, Queen, Rook) - 파란색
    { token: 'type.piece', foreground: '399EE6' },

    // 색상 (White, Black) - 보라색
    { token: 'constant.color', foreground: 'A37ACC' },

    // 숫자 - 보라색
    { token: 'number', foreground: 'A37ACC' },

    // 체스 칸 (e4, d5) - 주황색
    { token: 'number.square', foreground: 'FA8D3E' },

    // 크기 숫자 - 보라색
    { token: 'number.size', foreground: 'A37ACC' },

    // 연산자 - 주황색
    { token: 'operator', foreground: 'ED9366' },

    // 구분자 - 기본 텍스트
    { token: 'delimiter', foreground: '5C6166' },

    // 식별자 - 기본 텍스트
    { token: 'identifier', foreground: '575F66' },
  ],
  colors: {
    // 에디터 배경
    'editor.background': '#FAFAFA',

    // 기본 텍스트 색상
    'editor.foreground': '#575F66',

    // 현재 줄 하이라이트
    'editor.lineHighlightBackground': '#F0F0F0',

    // 커서
    'editorCursor.foreground': '#FF9940',

    // 선택 영역
    'editor.selectionBackground': '#D1E4F4',
    'editor.inactiveSelectionBackground': '#E8EEF4',

    // 줄 번호
    'editorLineNumber.foreground': '#ABB0B6',
    'editorLineNumber.activeForeground': '#575F66',

    // 들여쓰기 가이드
    'editorIndentGuide.background': '#E8E8E8',
    'editorIndentGuide.activeBackground': '#D0D0D0',

    // 괄호 매칭
    'editorBracketMatch.background': '#FFE6CC',
    'editorBracketMatch.border': '#FA8D3E',

    // 스크롤바
    'scrollbarSlider.background': '#D0D0D080',
    'scrollbarSlider.hoverBackground': '#C0C0C0A0',
    'scrollbarSlider.activeBackground': '#B0B0B0C0',

    // 위젯 (자동완성 등)
    'editorWidget.background': '#FFFFFF',
    'editorWidget.border': '#E0E0E0',

    // 검색 하이라이트
    'editor.findMatchBackground': '#FFE6CC',
    'editor.findMatchHighlightBackground': '#FFF4E6',

    // 에러/경고 표시
    'editorError.foreground': '#F51818',
    'editorWarning.foreground': '#FA8D3E',
  },
};

/**
 * Ayu Dark 테마 기반 ChessLang 테마
 */
export const ayuDarkTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // 주석 - 회색 이탤릭
    { token: 'comment', foreground: '5C6773', fontStyle: 'italic' },

    // 문자열 - 녹색
    { token: 'string', foreground: 'AAD94C' },

    // 키워드 - 주황색 bold
    { token: 'keyword', foreground: 'FF8F40', fontStyle: 'bold' },

    // 패턴 - 노란색
    { token: 'type.pattern', foreground: 'FFB454' },

    // 방향 - 청록색
    { token: 'constant.direction', foreground: '95E6CB' },

    // 조건 - 파란색
    { token: 'variable.condition', foreground: '59C2FF' },

    // 연산자 키워드 - 주황색
    { token: 'keyword.operator', foreground: 'F29668' },

    // 액션 - 노란색
    { token: 'function.action', foreground: 'FFB454' },

    // 트레이트 - 청록색
    { token: 'constant.trait', foreground: '95E6CB' },

    // 기물 타입 - 파란색
    { token: 'type.piece', foreground: '59C2FF' },

    // 색상 - 보라색
    { token: 'constant.color', foreground: 'D2A6FF' },

    // 숫자 - 보라색
    { token: 'number', foreground: 'D2A6FF' },

    // 체스 칸 - 주황색
    { token: 'number.square', foreground: 'FF8F40' },

    // 크기 숫자 - 보라색
    { token: 'number.size', foreground: 'D2A6FF' },

    // 연산자 - 주황색
    { token: 'operator', foreground: 'F29668' },

    // 구분자 - 기본 텍스트
    { token: 'delimiter', foreground: 'B3B1AD' },

    // 식별자 - 기본 텍스트
    { token: 'identifier', foreground: 'BFBDB6' },
  ],
  colors: {
    // 에디터 배경
    'editor.background': '#0D1017',

    // 기본 텍스트 색상
    'editor.foreground': '#BFBDB6',

    // 현재 줄 하이라이트
    'editor.lineHighlightBackground': '#131721',

    // 커서
    'editorCursor.foreground': '#E6B450',

    // 선택 영역
    'editor.selectionBackground': '#273747',
    'editor.inactiveSelectionBackground': '#1B2733',

    // 줄 번호
    'editorLineNumber.foreground': '#5C6773',
    'editorLineNumber.activeForeground': '#BFBDB6',

    // 들여쓰기 가이드
    'editorIndentGuide.background': '#1E222A',
    'editorIndentGuide.activeBackground': '#2D323C',

    // 괄호 매칭
    'editorBracketMatch.background': '#3D4455',
    'editorBracketMatch.border': '#FF8F40',

    // 스크롤바
    'scrollbarSlider.background': '#3D445580',
    'scrollbarSlider.hoverBackground': '#4D5465A0',
    'scrollbarSlider.activeBackground': '#5D6475C0',

    // 위젯
    'editorWidget.background': '#0D1017',
    'editorWidget.border': '#1B2733',

    // 검색 하이라이트
    'editor.findMatchBackground': '#5C4A1D',
    'editor.findMatchHighlightBackground': '#3D351D',

    // 에러/경고 표시
    'editorError.foreground': '#F51818',
    'editorWarning.foreground': '#FF8F40',
  },
};

export function registerChessLangThemes(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('chesslang-ayu-light', ayuLightTheme);
  monaco.editor.defineTheme('chesslang-ayu-dark', ayuDarkTheme);
}
