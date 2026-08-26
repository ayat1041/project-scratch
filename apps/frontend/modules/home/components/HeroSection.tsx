import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import RevealOnScroll from './RevealOnScroll';

export default function HeroSection() {
  return (
    <section className="border-border relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.15] blur-3xl"
        style={{ backgroundColor: 'hsl(var(--primary))' }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pt-20 pb-16 text-center md:pt-24 md:pb-20">
        <RevealOnScroll>
          <div className="border-border bg-background/80 text-muted-foreground mb-10 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="bg-success inline-block h-1.5 w-1.5 rounded-full" />
            Production-grade &middot; every layer wired together
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={80}>
          <h1 className="text-foreground max-w-5xl text-[13vw] leading-[0.95] font-semibold tracking-tighter text-balance sm:text-7xl md:text-8xl lg:text-9xl">
            Build fast.
            <br />
            <span className="from-primary via-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
              Ship it right.
            </span>
          </h1>
        </RevealOnScroll>

        <RevealOnScroll delayMs={160}>
          <p className="text-muted-foreground mt-10 max-w-2xl text-lg leading-relaxed text-balance md:text-2xl">
            A full-stack monorepo with a layered Express &amp; Drizzle backend, two Next.js 15
            apps, one shared type system, and CI/CD — working from the first commit.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delayMs={240}>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" className="h-14 px-8 text-base" asChild>
              <Link href="/auth/signup">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base" asChild>
              <a href="#architecture">See how it&apos;s built</a>
            </Button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
