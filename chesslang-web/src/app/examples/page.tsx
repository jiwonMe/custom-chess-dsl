import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const examples = [
  {
    id: 'koth',
    title: 'King of the Hill',
    description: 'Win by moving your King to the center squares (d4, d5, e4, e5).',
    code: `game: "King of the Hill"
extends: "Standard Chess"

board:
  zones:
    hill: [d4, d5, e4, e5]

victory:
  add:
    hill: King in zone.hill`,
    tags: ['victory condition', 'zones'],
  },
  {
    id: 'three-check',
    title: 'Three-Check',
    description: 'Win by giving check three times.',
    code: `game: "Three-Check"
extends: "Standard Chess"

victory:
  add:
    three_checks: checks >= 3`,
    tags: ['victory condition', 'state tracking'],
  },
  {
    id: 'custom-piece',
    title: 'Custom Piece: Amazon',
    description: 'Define a piece that combines Queen and Knight moves.',
    code: `piece Amazon {
  move: slide(orthogonal) | slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
}`,
    tags: ['custom pieces', 'patterns'],
  },
  {
    id: 'trap-effect',
    title: 'Trap Effect',
    description: 'Mark squares with effects that affect movement.',
    code: `effect trap {
  blocks: [enemy]
  visual: highlight(red)
}

trigger place_trap {
  on: move
  when: piece.type == Trapper
  do: mark origin with trap
}`,
    tags: ['effects', 'triggers'],
  },
];

export default function ExamplesPage() {
  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Examples</h1>
        <p className="text-xl text-muted-foreground">
          Learn ChessLang through practical examples
        </p>
      </div>

      <div className="space-y-8">
        {examples.map((example) => (
          <div key={example.id} className="rounded-lg border bg-card overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{example.title}</h2>
                  <p className="text-muted-foreground">{example.description}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/playground?example=${example.id}`}>
                    Try it
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {example.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-muted rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t bg-muted/30">
              <pre className="p-4 text-sm overflow-x-auto">
                <code className="font-mono">{example.code}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-lg bg-muted/50 text-center">
        <h2 className="text-xl font-semibold mb-2">Want More?</h2>
        <p className="text-muted-foreground mb-4">
          Check out the documentation for a complete language reference.
        </p>
        <Button variant="outline" asChild>
          <Link href="/docs">Read the Docs</Link>
        </Button>
      </div>
    </div>
  );
}
