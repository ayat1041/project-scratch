import RevealOnScroll from './RevealOnScroll';
import SectionHeader from './SectionHeader';

const BACKEND_LAYERS = [
  { id: 'B1', name: 'Route', detail: 'binds controllers' },
  { id: 'B2', name: 'Auth + policies', detail: 'session, permission, resource gates' },
  { id: 'B3', name: 'Validation', detail: 'Zod request schemas' },
  { id: 'B4', name: 'Controller', detail: 'orchestration, no DB access' },
  { id: 'B5', name: 'Service', detail: 'business logic, mutation' },
  { id: 'B6', name: 'Domain queries', detail: 'single-purpose data access' },
  { id: 'B7', name: 'Database', detail: 'Drizzle schema, source of truth' },
  { id: 'B8', name: 'API docs', detail: 'Swagger, colocated' },
  { id: 'B9', name: 'Queues + workers', detail: 'RabbitMQ background jobs' },
] as const;

const FRONTEND_LAYERS = [
  { id: 'L0', name: 'Shared contracts', detail: 'schemas-types, constants' },
  { id: 'L1', name: 'Route entry', detail: 'page.tsx — routing only' },
  { id: 'L2', name: 'Components', detail: 'the actual feature UI' },
  { id: 'L3', name: 'Section context', detail: 'shared section state' },
  { id: 'L4', name: 'Hooks', detail: 'read paths' },
  { id: 'L5', name: 'Handlers', detail: 'mutation + toasts' },
  { id: 'L6', name: 'Services', detail: 'framework-agnostic logic' },
  { id: 'L7', name: 'API transport', detail: 'the only layer that fetches' },
  { id: 'L8', name: 'Route handlers', detail: 'app/api/*/route.ts' },
] as const;

function LayerStack({
  title,
  subtitle,
  layers,
  baseDelay,
}: {
  title: string;
  subtitle: string;
  layers: readonly { id: string; name: string; detail: string }[];
  baseDelay: number;
}) {
  return (
    <div>
      <RevealOnScroll delayMs={baseDelay}>
        <h3 className="text-foreground text-2xl font-semibold md:text-3xl">{title}</h3>
        <p className="text-muted-foreground mt-1 mb-6 font-mono text-sm">{subtitle}</p>
      </RevealOnScroll>
      <div className="grid grid-cols-3 gap-2.5">
        {layers.map((layer, i) => (
          <RevealOnScroll key={layer.id} delayMs={baseDelay + i * 25}>
            <div className="border-border hover:border-primary/40 hover:bg-muted/30 group h-full rounded-xl border p-3.5 transition-colors duration-300">
              <span className="text-primary font-mono text-[11px] font-semibold">{layer.id}</span>
              <p className="text-foreground mt-1 text-sm leading-tight font-medium">{layer.name}</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{layer.detail}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
}

export default function LayerStackSection() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <SectionHeader
          kicker="Architecture"
          title="A layer stack, not a folder of chaos"
          description="Every request follows the same path, in the same order, every time."
        />

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8">
          <LayerStack
            title="Backend"
            subtitle="Request → Route → … → Database"
            layers={BACKEND_LAYERS}
            baseDelay={0}
          />
          <LayerStack
            title="Frontend"
            subtitle="Component → Handler / Hook → API"
            layers={FRONTEND_LAYERS}
            baseDelay={100}
          />
        </div>
      </div>
    </section>
  );
}
