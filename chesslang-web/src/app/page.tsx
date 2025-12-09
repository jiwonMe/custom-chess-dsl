import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code2, Gamepad2, BookOpen, Share2 } from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: '3-Level DSL',
    description: 'From simple YAML config to full scripting power',
  },
  {
    icon: Gamepad2,
    title: 'Live Play',
    description: 'Play your variants instantly in the browser',
  },
  {
    icon: BookOpen,
    title: 'Rich Docs',
    description: 'Comprehensive documentation with interactive examples',
  },
  {
    icon: Share2,
    title: 'Share Games',
    description: 'Share your creations with a simple link',
  },
];

const exampleCode = `game: "King of the Hill"
extends: "Standard Chess"

board:
  zones:
    hill: [d4, d5, e4, e5]

victory:
  add:
    hill: King in zone.hill`;

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Define Chess Variants with Code
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            ChessLang is a domain-specific language for creating custom chess
            variants easily. From simple rule tweaks to entirely new games.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/playground">
                Try Playground
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">Read Docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-card rounded-lg border p-6 font-mono text-sm">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2">king-of-the-hill.cl</span>
              </div>
              <pre className="text-foreground whitespace-pre-wrap">{exampleCode}</pre>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4">Simple Yet Powerful</h2>
              <p className="text-muted-foreground mb-6">
                Define victory conditions, custom pieces, and complex rules with
                an intuitive syntax. ChessLang compiles your code into a playable
                game instantly.
              </p>
              <Button variant="outline" asChild>
                <Link href="/playground?example=koth">
                  Try This Example
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg border bg-card text-center"
              >
                <feature.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Variants Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Example Variants
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'King of the Hill', id: 'koth' },
              { name: 'Atomic Chess', id: 'atomic' },
              { name: 'Three-Check', id: 'three-check' },
              { name: 'Racing Kings', id: 'racing-kings' },
            ].map((variant) => (
              <Link
                key={variant.id}
                href={`/play/${variant.id}`}
                className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
              >
                <span className="font-medium">{variant.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-muted-foreground mb-8">
            Jump into the playground and start defining your own chess variants.
          </p>
          <Button size="lg" asChild>
            <Link href="/playground">
              Open Playground
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
