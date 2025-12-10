import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const examples = [
  // ========================================
  // Basic Variants (Level 1)
  // ========================================
  {
    id: 'koth',
    title: 'King of the Hill',
    description: 'Win by moving your King to the center squares (d4, d5, e4, e5).',
    code: `game: "King of the Hill"
extends: "Standard Chess"

board:
  zones:
    hill: [d4, d5, e4, e5]

# OR 결합: checkmate OR hill
victory:
  add:
    hill: King in zone.hill`,
    tags: ['victory condition', 'zones', 'level 1'],
  },
  {
    id: 'three-check',
    title: 'Three-Check',
    description: 'Win by giving check three times.',
    code: `game: "Three-Check"
extends: "Standard Chess"

# OR 결합: checkmate OR three_checks
victory:
  add:
    three_checks: checks >= 3`,
    tags: ['victory condition', 'state tracking', 'level 1'],
  },

  // ========================================
  // Custom Pieces (Level 2 - Basic)
  // ========================================
  {
    id: 'custom-piece',
    title: 'Amazon',
    description: 'Define a piece that combines Queen and Knight moves.',
    code: `piece Amazon {
  move: slide(orthogonal) | slide(diagonal) | leap(2, 1)
  capture: =move
  traits: [jump]
  value: 12
}`,
    tags: ['custom pieces', 'patterns', 'level 2'],
  },
  {
    id: 'cannon',
    title: 'Cannon (포)',
    description: 'Xiangqi-style piece that hops over one piece to capture.',
    code: `piece Cannon {
  move: slide(orthogonal)
  capture: hop(orthogonal)
  value: 5
}`,
    tags: ['custom pieces', 'hop', 'level 2'],
  },

  // ========================================
  // Advanced Custom Pieces (Level 2 - Advanced)
  // ========================================
  {
    id: 'vampire',
    title: 'Vampire',
    description: 'Converts captured pieces to your side!',
    code: `piece Vampire {
  move: step(any) | leap(2, 0)
  capture: =move
  traits: [jump]
  state: { thralls: 0 }
  value: 6
}

trigger vampiric_conversion {
  on: capture
  when: piece.type == Vampire and captured.type != King
  do: {
    set captured.owner = piece.owner
    set piece.state.thralls = piece.state.thralls + 1
  }
}`,
    tags: ['custom pieces', 'triggers', 'state', 'level 2'],
  },
  {
    id: 'necromancer',
    title: 'Necromancer',
    description: 'Collects souls to summon Zombies!',
    code: `piece Necromancer {
  move: step(diagonal)
  capture: =move
  state: { souls: 0 }
  value: 6
}

piece Zombie {
  move: step(forward) | step(orthogonal)
  capture: step(any) where enemy
  value: 1
}

trigger collect_soul {
  on: capture
  do: set Necromancer.state.souls += 1
}

trigger raise_zombie {
  on: turn_start
  when: any Necromancer where state.souls >= 3
  do: {
    create Zombie at empty adjacent to Necromancer
    set Necromancer.state.souls -= 3
  }
}`,
    tags: ['custom pieces', 'triggers', 'summoning', 'level 2'],
  },
  {
    id: 'medusa',
    title: 'Medusa',
    description: 'Freezes enemies in her diagonal line of sight!',
    code: `piece Medusa {
  move: step(any)
  capture: slide(diagonal)
  state: { gazeActive: true }
  value: 5
}

effect frozen {
  blocks: [all]
  duration: 2
  visual: highlight(cyan, 0.5)
}

trigger medusa_gaze {
  on: turn_start
  when: any Medusa
  do: mark pieces in line(diagonal) from Medusa where enemy with frozen
}`,
    tags: ['custom pieces', 'effects', 'control', 'level 2'],
  },
  {
    id: 'timebomb',
    title: 'Time Bomb',
    description: 'Explodes after 3 turns, destroying nearby pieces!',
    code: `piece TimeBomb {
  move: step(orthogonal)
  capture: none
  state: { timer: 3 }
  value: 1
}

trigger countdown {
  on: turn_end
  when: any TimeBomb
  do: set piece.state.timer -= 1
}

trigger explode {
  on: turn_start
  when: any TimeBomb where state.timer <= 0
  do: {
    remove pieces in radius(2) from TimeBomb where not King
    remove TimeBomb
  }
}`,
    tags: ['custom pieces', 'triggers', 'delayed', 'level 2'],
  },
  {
    id: 'guardian',
    title: 'Guardian',
    description: 'Protects adjacent friendly pieces from capture.',
    code: `piece Guardian {
  move: step(any)
  capture: =move
  state: { protected: 0 }
  value: 4
}

trigger protection {
  on: capture
  when: any Guardian adjacent to captured where Guardian.owner == captured.owner
  do: {
    cancel  # Block the capture
    set Guardian.state.protected += 1
  }
}`,
    tags: ['custom pieces', 'triggers', 'defensive', 'level 2'],
  },
  {
    id: 'jester',
    title: 'Jester',
    description: 'Swaps positions with target instead of capturing.',
    code: `piece Jester {
  move: step(any)
  capture: none
  state: { swapsUsed: 0 }
  value: 4
}

trigger jester_swap {
  on: move
  when: piece.type == Jester and target has piece
  do: {
    let targetPiece = piece_at(target)
    move targetPiece to origin
    set piece.state.swapsUsed += 1
  }
}`,
    tags: ['custom pieces', 'triggers', 'positional', 'level 2'],
  },

  // ========================================
  // Effects & Triggers
  // ========================================
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
    tags: ['effects', 'triggers', 'level 2'],
  },
  {
    id: 'atomic',
    title: 'Atomic Chess',
    description: 'Captures cause explosions that destroy nearby pieces!',
    code: `trigger atomic_explosion {
  on: capture
  do: {
    remove piece
    remove captured
    remove pieces in radius(1) from target where not Pawn
  }
}

victory:
  add:
    king_exploded: opponent.King == null`,
    tags: ['triggers', 'explosion', 'level 2'],
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
