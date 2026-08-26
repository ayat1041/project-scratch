import RevealOnScroll from './RevealOnScroll';
import SectionHeader from './SectionHeader';

const APPS = [
  {
    name: 'backend',
    port: null,
    description: 'Express 5 · Drizzle ORM · PostgreSQL · Redis · RabbitMQ',
  },
  {
    name: 'frontend',
    port: '3000',
    description: 'Next.js 15 · React 19 — the public-facing app',
  },
  {
    name: 'admin',
    port: '4000',
    description: 'Next.js 15 · React 19 — users, roles & permissions',
  },
] as const;

const PACKAGES = [
  { name: 'schemas-types', description: 'Zod schemas & response types — single source of truth' },
  { name: 'constants', description: 'Roles, permissions, and routes shared everywhere' },
  { name: 'utilities', description: 'Framework-agnostic fetch, error, and formatting helpers' },
  { name: 'ui', description: 'Shared React component library, built on shadcn/ui' },
  { name: 'styles', description: 'One Tailwind design system for every app' },
] as const;

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="bg-foreground text-background scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <SectionHeader
          inverted
          kicker="pnpm workspaces + Turborepo"
          title="One monorepo. Three apps. Zero duplication."
          description="Every app shares the same types, the same components, and the same build pipeline."
        />

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <RevealOnScroll delayMs={80}>
            <h3 className="text-background/50 mb-6 font-mono text-sm tracking-wide uppercase">
              apps/
            </h3>
            <div className="space-y-3">
              {APPS.map((app) => (
                <div
                  key={app.name}
                  className="border-background/15 hover:border-primary/50 hover:bg-background/[0.04] hover:-translate-y-0.5 rounded-xl border p-6 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-semibold">{app.name}</span>
                    {app.port && (
                      <span className="border-background/25 text-background/70 rounded-full border px-2.5 py-0.5 font-mono text-xs">
                        :{app.port}
                      </span>
                    )}
                  </div>
                  <p className="text-background/60 mt-2 text-sm md:text-base">
                    {app.description}
                  </p>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={160}>
            <h3 className="text-background/50 mb-6 font-mono text-sm tracking-wide uppercase">
              packages/
            </h3>
            <div className="space-y-3">
              {PACKAGES.map((pkg) => (
                <div
                  key={pkg.name}
                  className="border-background/15 hover:border-primary/50 hover:bg-background/[0.04] hover:-translate-y-0.5 rounded-xl border p-6 transition-all duration-300"
                >
                  <span className="font-mono text-lg font-semibold">@repo/{pkg.name}</span>
                  <p className="text-background/60 mt-2 text-sm md:text-base">
                    {pkg.description}
                  </p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
