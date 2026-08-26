import RevealOnScroll from './RevealOnScroll';

const LINES = [
  { prompt: '$', text: 'pnpm install && pnpm run build:packages', muted: false },
  { prompt: '$', text: 'docker compose -f apps/backend/docker-compose.dev.yml up', muted: false },
  { prompt: '$', text: 'pnpm run dev', muted: false },
  { prompt: '', text: '', muted: false },
  { prompt: '', text: '  ▲ frontend   http://localhost:3000', muted: true },
  { prompt: '', text: '  ▲ admin      http://localhost:4000', muted: true },
  { prompt: '', text: '  ● postgres, redis, rabbitmq, mailhog — all healthy', muted: true },
] as const;

export default function TerminalSection() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <RevealOnScroll>
            <span className="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
              Local dev
            </span>
            <h2 className="text-foreground mt-3 max-w-lg text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Three commands. Everything running.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
              No manually wiring up a database, a queue, and a cache before you can write a
              single feature. Install, build the shared packages, and bring up the stack.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delayMs={120}>
            <div className="border-border bg-card shadow-primary/5 overflow-hidden rounded-xl border shadow-2xl">
              <div className="border-border flex items-center gap-1.5 border-b px-4 py-3">
                <span className="bg-destructive/70 h-2.5 w-2.5 rounded-full" />
                <span className="bg-warning/70 h-2.5 w-2.5 rounded-full" />
                <span className="bg-success/70 h-2.5 w-2.5 rounded-full" />
              </div>
              <div className="space-y-2 p-6 font-mono text-sm">
                {LINES.map((line, i) => (
                  <div key={i} className={line.muted ? 'text-muted-foreground' : 'text-foreground'}>
                    {line.prompt && <span className="text-success mr-2">{line.prompt}</span>}
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
