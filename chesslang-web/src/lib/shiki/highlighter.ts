import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';
import { chesslangGrammar } from './chesslang-grammar';

let highlighter: Highlighter | null = null;

/**
 * Shiki 하이라이터 싱글톤 인스턴스 가져오기
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) {
    return highlighter;
  }

  highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: [
      // ChessLang 커스텀 언어
      chesslangGrammar,
      // 자주 사용되는 언어들
      'javascript',
      'typescript',
      'json',
      'yaml',
      'bash',
      'markdown',
    ],
  });

  return highlighter;
}

/**
 * 코드 하이라이팅 수행
 */
export async function highlightCode(
  code: string,
  lang: string = 'text'
): Promise<string> {
  const hl = await getHighlighter();
  
  // 지원하는 언어인지 확인
  const loadedLangs = hl.getLoadedLanguages();
  const language = loadedLangs.includes(lang as BundledLanguage) ? lang : 'text';

  return hl.codeToHtml(code, {
    lang: language,
    theme: 'github-dark',
  });
}

/**
 * 지원하는 언어 목록
 */
export const supportedLanguages = [
  'chesslang',
  'javascript',
  'typescript',
  'json',
  'yaml',
  'bash',
  'markdown',
  'text',
];

