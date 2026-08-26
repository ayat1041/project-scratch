import RevealOnScroll from './RevealOnScroll';

interface SectionHeaderProps {
  kicker: string;
  title: string;
  description: string;
  inverted?: boolean;
}

export default function SectionHeader({ kicker, title, description, inverted }: SectionHeaderProps) {
  return (
    <RevealOnScroll className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
      <div>
        <span
          className={
            inverted
              ? 'text-background/50 font-mono text-xs font-semibold tracking-wider uppercase'
              : 'text-primary font-mono text-xs font-semibold tracking-wider uppercase'
          }
        >
          {kicker}
        </span>
        <h2
          className={
            inverted
              ? 'mt-3 max-w-lg text-3xl font-semibold tracking-tight text-balance md:text-4xl'
              : 'text-foreground mt-3 max-w-lg text-3xl font-semibold tracking-tight text-balance md:text-4xl'
          }
        >
          {title}
        </h2>
      </div>
      <p
        className={
          inverted
            ? 'text-background/60 max-w-sm text-base leading-relaxed md:text-right'
            : 'text-muted-foreground max-w-sm text-base leading-relaxed md:text-right'
        }
      >
        {description}
      </p>
    </RevealOnScroll>
  );
}
