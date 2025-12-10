import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import { getAllDocSlugs, getDocBySlug, getDocsNavigation } from '@/lib/docs';
import { cn } from '@/lib/utils/cn';
import { components } from '@/components/docs/MDXComponents';

// MDX 옵션 - GFM (GitHub Flavored Markdown) 지원
const mdxOptions = {
  remarkPlugins: [remarkGfm],
};

// 정적 경로 생성
export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

// 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const doc = getDocBySlug(slug || []);

  if (!doc) {
    return { title: 'Not Found' };
  }

  return {
    title: `${doc.title} | ChessLang Docs`,
    description: doc.description,
  };
}

// 이전/다음 페이지 찾기
function findPrevNext(currentSlug: string[]) {
  const nav = getDocsNavigation();
  const allLinks: { title: string; href: string }[] = [];

  // 모든 링크 평탄화
  for (const section of nav) {
    if (section.items) {
      for (const item of section.items) {
        allLinks.push(item);
      }
    }
  }

  const currentHref = `/docs/${currentSlug.join('/')}`;
  const currentIndex = allLinks.findIndex((link) => link.href === currentHref);

  return {
    prev: currentIndex > 0 ? allLinks[currentIndex - 1] : null,
    next: currentIndex < allLinks.length - 1 ? allLinks[currentIndex + 1] : null,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const doc = getDocBySlug(slug || []);

  if (!doc) {
    notFound();
  }

  const { prev, next } = findPrevNext(slug || []);

  return (
    <article className={cn(
      // 최대 너비
      'max-w-3xl',
      // 마진
      'mx-auto',
      // 패딩
      'py-8'
    )}>
      {/* 문서 헤더 */}
      <div className="mb-8">
        {doc.description && (
          <p className={cn(
            // 텍스트
            'text-lg text-muted-foreground',
            // 마진
            'mb-2'
          )}>
            {doc.description}
          </p>
        )}
      </div>

      {/* MDX 콘텐츠 */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <MDXRemote 
          source={doc.content} 
          components={components as never}
          options={{ mdxOptions }}
        />
      </div>

      {/* 이전/다음 네비게이션 */}
      <nav className={cn(
        // 레이아웃
        'flex items-center justify-between',
        // 마진
        'mt-12 pt-6',
        // 보더
        'border-t'
      )}>
        {prev ? (
          <Link
            href={prev.href}
            className={cn(
              // 레이아웃
              'flex items-center gap-2',
              // 텍스트
              'text-sm text-muted-foreground',
              // 호버
              'hover:text-foreground transition-colors'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {prev.title}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.href}
            className={cn(
              // 레이아웃
              'flex items-center gap-2',
              // 텍스트
              'text-sm text-muted-foreground',
              // 호버
              'hover:text-foreground transition-colors'
            )}
          >
            {next.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}

