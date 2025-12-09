'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { NavItem } from '@/lib/docs';

interface DocsSidebarProps {
  navigation: NavItem[];
}

export function DocsSidebar({ navigation }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      // 포지션
      'sticky top-16',
      // 크기
      'h-[calc(100vh-4rem)] w-64',
      // 스크롤
      'overflow-y-auto',
      // 패딩
      'py-8 pr-4',
      // 숨김 (모바일에서)
      'hidden lg:block'
    )}>
      <nav className="space-y-6">
        {navigation.map((section) => (
          <div key={section.href}>
            {/* 섹션 타이틀 */}
            <h4 className={cn(
              // 폰트
              'font-semibold text-sm',
              // 마진
              'mb-2',
              // 색상
              'text-foreground'
            )}>
              {section.title}
            </h4>

            {/* 섹션 아이템 */}
            {section.items && section.items.length > 0 && (
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          // 레이아웃
                          'flex items-center gap-2',
                          // 패딩
                          'py-1.5 px-2',
                          // 라운드
                          'rounded-md',
                          // 폰트
                          'text-sm',
                          // 전환
                          'transition-colors',
                          // 조건부 스타일 - 활성화
                          isActive && [
                            'bg-primary/10',
                            'text-primary',
                            'font-medium'
                          ],
                          // 조건부 스타일 - 비활성화
                          !isActive && [
                            'text-muted-foreground',
                            'hover:text-foreground',
                            'hover:bg-muted'
                          ]
                        )}
                      >
                        <ChevronRight className={cn(
                          // 크기
                          'h-3 w-3',
                          // 색상
                          isActive ? 'text-primary' : 'text-muted-foreground/50'
                        )} />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

