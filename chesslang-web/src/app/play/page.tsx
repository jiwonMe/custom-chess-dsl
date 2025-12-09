import Link from 'next/link';
import { Button } from '@/components/ui/button';

const variants = [
  {
    id: 'standard',
    name: 'Standard Chess',
    description: 'The classic game of chess',
    category: 'Classic',
  },
  {
    id: 'koth',
    name: 'King of the Hill',
    description: 'Reach the center with your King to win',
    category: 'Popular',
  },
  {
    id: 'three-check',
    name: 'Three-Check',
    description: 'Give check three times to win',
    category: 'Popular',
  },
  {
    id: 'atomic',
    name: 'Atomic Chess',
    description: 'Captures cause explosions',
    category: 'Popular',
  },
  {
    id: 'racing-kings',
    name: 'Racing Kings',
    description: 'First king to rank 8 wins',
    category: 'Racing',
  },
  {
    id: 'horde',
    name: 'Horde',
    description: 'Army of pawns vs standard pieces',
    category: 'Asymmetric',
  },
];

export default function PlayPage() {
  const categories = [...new Set(variants.map((v) => v.category))];

  return (
    <div className="container max-w-6xl py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Play Chess Variants</h1>
        <p className="text-xl text-muted-foreground">
          Choose a variant and start playing
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {variants
              .filter((v) => v.category === category)
              .map((variant) => (
                <div
                  key={variant.id}
                  className="p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-2">{variant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {variant.description}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/playground?variant=${variant.id}`}>Play</Link>
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-6 rounded-lg bg-muted/50 text-center">
        <h2 className="text-xl font-semibold mb-2">Create Your Own</h2>
        <p className="text-muted-foreground mb-4">
          Use ChessLang to define your own custom chess variants.
        </p>
        <Button variant="outline" asChild>
          <Link href="/playground">Open Playground</Link>
        </Button>
      </div>
    </div>
  );
}
