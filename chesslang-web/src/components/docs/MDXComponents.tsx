import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { highlightCode } from '@/lib/shiki/highlighter';
import React from 'react';

// 헤딩 컴포넌트
export const h1 = ({ children }: { children?: React.ReactNode }) => (
  <h1 className={cn(
    // 타이포그래피
    'text-4xl font-bold tracking-tight',
    // 마진
    'mt-2 mb-6',
    // 스크롤 마진
    'scroll-m-20'
  )}>
    {children}
  </h1>
);

export const h2 = ({ children }: { children?: React.ReactNode }) => (
  <h2 className={cn(
    // 타이포그래피
    'text-2xl font-semibold tracking-tight',
    // 마진
    'mt-10 mb-4',
    // 보더
    'border-b pb-2',
    // 스크롤 마진
    'scroll-m-20'
  )}>
    {children}
  </h2>
);

export const h3 = ({ children }: { children?: React.ReactNode }) => (
  <h3 className={cn(
    // 타이포그래피
    'text-xl font-semibold tracking-tight',
    // 마진
    'mt-8 mb-4',
    // 스크롤 마진
    'scroll-m-20'
  )}>
    {children}
  </h3>
);

// 본문 컴포넌트
export const p = ({ children }: { children?: React.ReactNode }) => (
  <p className={cn(
    // 줄 높이
    'leading-7',
    // 마진
    '[&:not(:first-child)]:mt-6'
  )}>
    {children}
  </p>
);

// 리스트 컴포넌트
export const ul = ({ children }: { children?: React.ReactNode }) => (
  <ul className={cn(
    // 리스트 스타일
    'list-disc',
    // 마진 및 패딩
    'my-6 ml-6',
    // 중첩 리스트 마진
    '[&>li]:mt-2'
  )}>
    {children}
  </ul>
);

export const ol = ({ children }: { children?: React.ReactNode }) => (
  <ol className={cn(
    // 리스트 스타일
    'list-decimal',
    // 마진 및 패딩
    'my-6 ml-6',
    // 중첩 리스트 마진
    '[&>li]:mt-2'
  )}>
    {children}
  </ol>
);

// 인라인 코드 컴포넌트
export const code = ({ children }: { children?: React.ReactNode }) => (
  <code className={cn(
    // 배경 및 패딩
    'relative rounded bg-muted px-[0.3rem] py-[0.2rem]',
    // 폰트
    'font-mono text-sm font-semibold'
  )}>
    {children}
  </code>
);

// 코드 블록 컴포넌트 (Shiki 하이라이팅 적용)
interface PreProps {
  children?: React.ReactElement<{ className?: string; children?: string }>;
}

export async function pre({ children }: PreProps) {
  // children이 code 요소인지 확인
  if (!children || typeof children !== 'object') {
    return (
      <pre className={cn(
        'mb-4 mt-6 overflow-x-auto rounded-lg',
        'bg-zinc-950 p-4',
        'font-mono text-sm'
      )}>
        {children}
      </pre>
    );
  }

  // code 요소에서 언어와 코드 추출
  const codeElement = children;
  const className = codeElement.props?.className || '';
  const codeContent = codeElement.props?.children || '';
  
  // language-xxx 클래스에서 언어 추출
  const languageMatch = className.match(/language-(\w+)/);
  const language = languageMatch ? languageMatch[1] : 'text';
  
  // 문자열이 아니면 기본 렌더링
  if (typeof codeContent !== 'string') {
    return (
      <pre className={cn(
        'mb-4 mt-6 overflow-x-auto rounded-lg',
        'bg-zinc-950 p-4',
        'font-mono text-sm'
      )}>
        {children}
      </pre>
    );
  }

  // Shiki로 하이라이팅
  const html = await highlightCode(codeContent.trim(), language);

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
          // 코드 스타일 - Shiki 스타일 오버라이드
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

// 링크 컴포넌트
export const a = ({ href, children }: { href?: string; children?: React.ReactNode }) => (
  <Link
    href={href || '#'}
    className={cn(
      // 폰트
      'font-medium',
      // 색상
      'text-primary underline underline-offset-4',
      // 호버
      'hover:text-primary/80'
    )}
  >
    {children}
  </Link>
);

// 인용구 컴포넌트
export const blockquote = ({ children }: { children?: React.ReactNode }) => (
  <blockquote className={cn(
    // 마진
    'mt-6',
    // 보더
    'border-l-2 border-primary',
    // 패딩
    'pl-6',
    // 폰트
    'italic text-muted-foreground'
  )}>
    {children}
  </blockquote>
);

// 테이블 컴포넌트
export const table = ({ children }: { children?: React.ReactNode }) => (
  <div className={cn(
    // 마진
    'my-6',
    // 오버플로우
    'w-full overflow-x-auto',
    // 라운드
    'rounded-lg',
    // 보더
    'border border-zinc-200 dark:border-zinc-800'
  )}>
    <table className={cn(
      // 너비
      'w-full',
      // 테두리 합치기
      'border-collapse',
      // 텍스트
      'text-sm'
    )}>
      {children}
    </table>
  </div>
);

export const thead = ({ children }: { children?: React.ReactNode }) => (
  <thead className={cn(
    // 배경
    'bg-zinc-100 dark:bg-zinc-800/50'
  )}>
    {children}
  </thead>
);

export const tbody = ({ children }: { children?: React.ReactNode }) => (
  <tbody className={cn(
    // 줄무늬 배경
    '[&>tr:nth-child(even)]:bg-zinc-50',
    'dark:[&>tr:nth-child(even)]:bg-zinc-900/30'
  )}>
    {children}
  </tbody>
);

export const tr = ({ children }: { children?: React.ReactNode }) => (
  <tr className={cn(
    // 보더
    'border-b border-zinc-200 dark:border-zinc-800',
    // 마지막 행은 보더 없음
    'last:border-b-0',
    // 호버
    'transition-colors',
    'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
  )}>
    {children}
  </tr>
);

export const th = ({ children, align }: { children?: React.ReactNode; align?: 'left' | 'center' | 'right' }) => (
  <th className={cn(
    // 패딩
    'px-4 py-3',
    // 텍스트
    'font-semibold text-left',
    // 보더
    'border-b border-zinc-200 dark:border-zinc-700',
    // 정렬
    align === 'center' && 'text-center',
    align === 'right' && 'text-right'
  )}>
    {children}
  </th>
);

export const td = ({ children, align }: { children?: React.ReactNode; align?: 'left' | 'center' | 'right' }) => (
  <td className={cn(
    // 패딩
    'px-4 py-3',
    // 텍스트
    'text-left',
    // 정렬
    align === 'center' && 'text-center',
    align === 'right' && 'text-right'
  )}>
    {children}
  </td>
);

// 수평선 컴포넌트
export const hr = () => <hr className="my-8" />;

// 모든 컴포넌트 export
export const components = {
  h1,
  h2,
  h3,
  p,
  ul,
  ol,
  code,
  pre,
  a,
  blockquote,
  table,
  thead,
  tbody,
  tr,
  th,
  td,
  hr,
};

