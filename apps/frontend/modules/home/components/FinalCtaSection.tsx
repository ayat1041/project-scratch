import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import RevealOnScroll from './RevealOnScroll';

export default function FinalCtaSection() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <RevealOnScroll>
          <h2 className="text-4xl font-semibold tracking-tight text-balance md:text-7xl">
            Stop rebuilding auth from scratch
          </h2>
          <p className="text-background/60 mx-auto mt-6 max-w-xl text-lg md:text-xl">
            Create an account and see the whole stack running end to end — signup, sessions, and
            the admin panel included.
          </p>
          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 h-14 px-8 text-base"
              asChild
            >
              <Link href="/auth/signup">
                Create an account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
