import RevealOnScroll from './RevealOnScroll';

const STACK = [
  'Next.js 15',
  'React 19',
  'TypeScript',
  'Express 5',
  'Drizzle ORM',
  'PostgreSQL',
  'Redis',
  'RabbitMQ',
  'Zod',
  'Tailwind CSS v4',
  'Turborepo',
  'pnpm',
  'Docker',
  'GitHub Actions',
] as const;

export default function TechStackSection() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <RevealOnScroll className="text-center">
          <span className="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
            Tech stack
          </span>
          <h2 className="text-foreground mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Boring, battle-tested technology
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-base leading-relaxed">
            Nothing exotic — the stack a new engineer already knows how to run.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delayMs={120} className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {STACK.map((tech) => (
            <span
              key={tech}
              className="text-muted-foreground hover:text-foreground text-xl font-medium tracking-tight transition-colors md:text-2xl"
            >
              {tech}
            </span>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
