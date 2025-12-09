import type * as monaco from 'monaco-editor';

export const chessLangDarkTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
    { token: 'type.pattern', foreground: 'DCDCAA' },
    { token: 'constant.direction', foreground: '4EC9B0' },
    { token: 'variable.condition', foreground: '9CDCFE' },
    { token: 'keyword.operator', foreground: 'C586C0' },
    { token: 'function.action', foreground: 'DCDCAA' },
    { token: 'constant.trait', foreground: '4EC9B0' },
    { token: 'type.piece', foreground: '4FC1FF' },
    { token: 'constant.color', foreground: 'B5CEA8' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'number.square', foreground: 'D7BA7D' },
    { token: 'number.size', foreground: 'B5CEA8' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'delimiter', foreground: 'D4D4D4' },
    { token: 'identifier', foreground: '9CDCFE' },
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editor.lineHighlightBackground': '#2A2A2A',
    'editorCursor.foreground': '#AEAFAD',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
  },
};

export const chessLangLightTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '008000', fontStyle: 'italic' },
    { token: 'string', foreground: 'A31515' },
    { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
    { token: 'type.pattern', foreground: '795E26' },
    { token: 'constant.direction', foreground: '267F99' },
    { token: 'variable.condition', foreground: '001080' },
    { token: 'keyword.operator', foreground: 'AF00DB' },
    { token: 'function.action', foreground: '795E26' },
    { token: 'constant.trait', foreground: '267F99' },
    { token: 'type.piece', foreground: '0070C1' },
    { token: 'constant.color', foreground: '098658' },
    { token: 'number', foreground: '098658' },
    { token: 'number.square', foreground: 'E06C00' },
    { token: 'number.size', foreground: '098658' },
    { token: 'operator', foreground: '000000' },
    { token: 'delimiter', foreground: '000000' },
    { token: 'identifier', foreground: '001080' },
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#F5F5F5',
    'editorCursor.foreground': '#000000',
    'editor.selectionBackground': '#ADD6FF',
    'editor.inactiveSelectionBackground': '#E5EBF1',
  },
};

export function registerChessLangThemes(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('chesslang-dark', chessLangDarkTheme);
  monaco.editor.defineTheme('chesslang-light', chessLangLightTheme);
}
