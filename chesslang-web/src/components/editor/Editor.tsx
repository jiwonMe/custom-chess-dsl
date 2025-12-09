'use client';

import { useRef, useEffect, useCallback } from 'react';
import MonacoEditor, { OnMount, BeforeMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { registerChessLangLanguage } from '@/lib/monaco/language';
import { registerChessLangThemes } from '@/lib/monaco/theme';

interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  errors?: Array<{ line: number; column: number; message: string }>;
  readOnly?: boolean;
  className?: string;
}

export function Editor({
  value,
  onChange,
  onMount,
  errors = [],
  readOnly = false,
  className,
}: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  // Before mount - register language and theme
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monacoRef.current = monaco;
    registerChessLangLanguage(monaco);
    registerChessLangThemes(monaco);
  }, []);

  // On mount - store editor reference
  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      onMount?.(editor);
    },
    [onMount]
  );

  // Update error markers when errors change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: monaco.editor.IMarkerData[] = errors.map((error) => ({
      severity: monacoRef.current!.MarkerSeverity.Error,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + 1,
      message: error.message,
    }));

    monacoRef.current.editor.setModelMarkers(model, 'chesslang', markers);
  }, [errors]);

  // Handle value change
  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange?.(value ?? '');
    },
    [onChange]
  );

  return (
    <div className={className}>
      <MonacoEditor
        height="100%"
        language="chesslang"
        theme="chesslang-dark"
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          folding: true,
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
      />
    </div>
  );
}
