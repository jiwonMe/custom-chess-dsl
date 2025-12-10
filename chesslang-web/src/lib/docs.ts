import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDirectory = path.join(process.cwd(), 'content/docs');

export interface DocMeta {
  title: string;
  description?: string;
  slug: string[];
}

export interface Doc extends DocMeta {
  content: string;
}

export interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

// Get all doc slugs for static generation
export function getAllDocSlugs(): string[][] {
  const slugs: string[][] = [];

  function traverse(dir: string, pathParts: string[] = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        traverse(path.join(dir, entry.name), [...pathParts, entry.name]);
      } else if (entry.name.endsWith('.mdx')) {
        const name = entry.name.replace('.mdx', '');
        if (name === 'index') {
          if (pathParts.length > 0) {
            slugs.push(pathParts);
          }
        } else {
          slugs.push([...pathParts, name]);
        }
      }
    }
  }

  traverse(docsDirectory);
  return slugs;
}

// Get doc by slug
export function getDocBySlug(slug: string[]): Doc | null {
  // Try exact path first
  let filePath = path.join(docsDirectory, ...slug) + '.mdx';

  if (!fs.existsSync(filePath)) {
    // Try index.mdx
    filePath = path.join(docsDirectory, ...slug, 'index.mdx');
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    title: data.title || slug[slug.length - 1],
    description: data.description,
    slug,
    content,
  };
}

// Get navigation structure
export function getDocsNavigation(): NavItem[] {
  return [
    {
      title: '시작하기',
      href: '/docs/getting-started',
      items: [
        { title: '소개', href: '/docs/getting-started' },
        { title: '첫 번째 게임', href: '/docs/getting-started/first-game' },
      ],
    },
    {
      title: '언어 가이드',
      href: '/docs/language',
      items: [
        { title: '개요', href: '/docs/language' },
        { title: '레벨 1: Configure', href: '/docs/language/level1' },
        { title: '레벨 2: Compose', href: '/docs/language/level2' },
        { title: '레벨 3: Script', href: '/docs/language/level3' },
      ],
    },
    {
      title: '레퍼런스',
      href: '/docs/reference',
      items: [
        { title: '개요', href: '/docs/reference' },
        { title: '키워드', href: '/docs/reference/keywords' },
        { title: '패턴', href: '/docs/reference/patterns' },
        { title: '방향', href: '/docs/reference/directions' },
        { title: '조건', href: '/docs/reference/conditions' },
        { title: '액션', href: '/docs/reference/actions' },
        { title: '스크립트 API', href: '/docs/reference/script-api' },
      ],
    },
    {
      title: '예제',
      href: '/docs/examples',
      items: [
        { title: '모든 예제', href: '/docs/examples' },
      ],
    },
  ];
}
