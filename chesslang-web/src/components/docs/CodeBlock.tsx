import { highlightCode } from '@/lib/shiki/highlighter';
import { cn } from '@/lib/utils/cn';

interface CodeBlockProps {
  children: string;
  language?: string;
  filename?: string;
}

/**
 * 서버 컴포넌트로 구현된 코드 블록
 * Shiki를 사용해서 코드 하이라이팅 수행
 */
export async function CodeBlock({ 
  children, 
  language = 'text',
  filename 
}: CodeBlockProps) {
  // 코드 앞뒤 공백 제거
  const code = children.trim();
  
  // Shiki로 하이라이팅된 HTML 생성
  const html = await highlightCode(code, language);

  return (
    <div className={cn(
      // 마진
      'my-6',
      // 라운드
      'rounded-lg',
      // 오버플로우
      'overflow-hidden',
      // 배경
      'bg-zinc-950'
    )}>
      {/* 파일명 헤더 (선택적) */}
      {filename && (
        <div className={cn(
          // 패딩
          'px-4 py-2',
          // 배경
          'bg-zinc-900',
          // 보더
          'border-b border-zinc-800',
          // 텍스트
          'text-xs text-zinc-400 font-mono'
        )}>
          {filename}
        </div>
      )}
      
      {/* 언어 뱃지 */}
      <div className={cn(
        // 레이아웃
        'flex items-center justify-between',
        // 패딩
        'px-4 py-1.5',
        // 배경
        'bg-zinc-900/50',
        // 보더
        'border-b border-zinc-800/50'
      )}>
        <span className={cn(
          // 텍스트
          'text-xs font-medium',
          // 색상
          'text-emerald-400'
        )}>
          {language}
        </span>
      </div>
      
      {/* 코드 영역 */}
      <div 
        className={cn(
          // 패딩
          'p-4',
          // 오버플로우
          'overflow-x-auto',
          // 코드 스타일
          '[&_pre]:!bg-transparent',
          '[&_pre]:!m-0',
          '[&_pre]:!p-0',
          '[&_code]:!bg-transparent',
          '[&_.line]:leading-relaxed',
          // 폰트
          'text-sm font-mono'
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

