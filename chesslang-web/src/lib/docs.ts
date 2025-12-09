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
      title: 'Getting Started',
      href: '/docs/getting-started',
      items: [
        { title: 'Introduction', href: '/docs/getting-started' },
        { title: 'Your First Game', href: '/docs/getting-started/first-game' },
      ],
    },
    {
      title: 'Language Guide',
      href: '/docs/language',
      items: [
        { title: 'Overview', href: '/docs/language' },
        { title: 'Level 1: Configure', href: '/docs/language/level1' },
        { title: 'Level 2: Compose', href: '/docs/language/level2' },
        { title: 'Level 3: Script', href: '/docs/language/level3' },
      ],
    },
    {
      title: 'Reference',
      href: '/docs/reference',
      items: [
        { title: 'Overview', href: '/docs/reference' },
        { title: 'Keywords', href: '/docs/reference/keywords' },
        { title: 'Patterns', href: '/docs/reference/patterns' },
        { title: 'Directions', href: '/docs/reference/directions' },
        { title: 'Conditions', href: '/docs/reference/conditions' },
        { title: 'Actions', href: '/docs/reference/actions' },
      ],
    },
    {
      title: 'Examples',
      href: '/docs/examples',
      items: [
        { title: 'All Examples', href: '/docs/examples' },
      ],
    },
  ];
}
