import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Code2, Puzzle, Terminal } from 'lucide-react';

const sections = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of ChessLang',
    icon: BookOpen,
    href: '/docs/getting-started',
    items: ['Introduction', 'First Game', 'Basic Concepts'],
  },
  {
    title: 'Language Guide',
    description: 'Deep dive into the DSL',
    icon: Code2,
    href: '/docs/language',
    items: ['Level 1: Configure', 'Level 2: Compose', 'Level 3: Script'],
  },
  {
    title: 'Reference',
    description: 'Complete API reference',
    icon: Terminal,
    href: '/docs/reference',
    items: ['Keywords', 'Patterns', 'Directions', 'Conditions', 'Actions'],
  },
  {
    title: 'Examples',
    description: 'Learn from real examples',
    icon: Puzzle,
    href: '/docs/examples',
    items: ['King of the Hill', 'Atomic Chess', 'Custom Pieces'],
  },
];

export default function DocsPage() {
  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Learn how to create chess variants with ChessLang
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group block p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <section.icon className="h-8 w-8 text-primary mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {section.title}
                </h2>
                <p className="text-muted-foreground mb-4">{section.description}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {section.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-lg bg-muted/50 text-center">
        <h2 className="text-xl font-semibold mb-2">Ready to Start?</h2>
        <p className="text-muted-foreground mb-4">
          Jump into the playground and start creating your own chess variants.
        </p>
        <Button asChild>
          <Link href="/playground">
            Open Playground
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
