import { getDocsNavigation } from '@/lib/docs';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { cn } from '@/lib/utils/cn';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = getDocsNavigation();

  return (
    <div className={cn(
      // 레이아웃
      'container mx-auto flex gap-8',
      // 최소 높이
      'min-h-[calc(100vh-4rem)]'
    )}>
      {/* 사이드바 */}
      <DocsSidebar navigation={navigation} />

      {/* 메인 콘텐츠 */}
      <main className={cn(
        // 레이아웃
        'flex-1',
        // 최대 너비
        'max-w-4xl',
        // 패딩
        'px-4 py-8',
        // 오버플로우
        'overflow-hidden'
      )}>
        {children}
      </main>
    </div>
  );
}

