import RevealOnScroll from './RevealOnScroll';

const STATS = [
  { value: '3', label: 'Apps, one repo' },
  { value: '9', label: 'Backend request layers' },
  { value: '8', label: 'Frontend feature layers' },
  { value: '0', label: 'Type drift, ever' },
] as const;

export default function StatsBar() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-14 px-4 py-12 sm:grid-cols-4 md:py-16">
        {STATS.map((stat, i) => (
          <RevealOnScroll key={stat.label} delayMs={i * 90} className="flex flex-col items-center text-center">
            <span className="text-foreground text-6xl font-semibold tracking-tighter tabular-nums md:text-8xl">
              {stat.value}
            </span>
            <span className="text-muted-foreground mt-3 text-sm md:text-base">{stat.label}</span>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
