import {
  ShieldCheck,
  Users,
  ScrollText,
  Globe2,
  LayoutDashboard,
  FileJson,
  Container,
  Activity,
  GitPullRequest,
} from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';
import SectionHeader from './SectionHeader';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Authentication, done properly',
    description:
      'Email/password plus Google & LinkedIn OAuth, JWT with CSRF protection, sliding refresh-token rotation, email verification, and password reset — all pre-built.',
    span: 'md:col-span-2',
  },
  {
    icon: Users,
    title: 'Role-based access control',
    description: 'Users, roles, and granular permission strings — manageable from the admin panel.',
    span: '',
  },
  {
    icon: ScrollText,
    title: 'Audit logging',
    description: 'Every sensitive action tracked automatically, surfaced in the dashboard.',
    span: '',
  },
  {
    icon: Globe2,
    title: 'Generic lookup data',
    description: 'Countries, states, cities, languages, timezones — seeded and ready.',
    span: '',
  },
  {
    icon: LayoutDashboard,
    title: 'A real admin panel',
    description: 'Its own Next.js 15 app: users, roles & permissions, audit logs, settings.',
    span: '',
  },
  {
    icon: FileJson,
    title: 'One type, everywhere',
    description:
      'One Zod schema per table, one response type per API — backend and both frontends import the exact same type. No drift.',
    span: 'md:col-span-2',
  },
  {
    icon: Container,
    title: 'Docker-first local dev',
    description: 'Postgres, Redis, RabbitMQ, and Mailhog — one command.',
    span: '',
  },
  {
    icon: Activity,
    title: 'Observability built in',
    description: 'Prometheus, Grafana, Loki, Tempo, and OpenTelemetry tracing from day one.',
    span: '',
  },
  {
    icon: GitPullRequest,
    title: 'CI/CD from commit one',
    description: 'Lint, type-check, build, deploy — only what changed, per app.',
    span: '',
  },
] as const;

export default function FeatureGrid() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <SectionHeader
          kicker="What's included"
          title="Everything a real product needs"
          description="The scaffolding every project rebuilds from scratch — already built and wired together."
        />

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <RevealOnScroll
              key={feature.title}
              delayMs={Math.min(i * 30, 180)}
              className={feature.span}
            >
              <div className="border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 group h-full rounded-2xl border p-6 transition-all duration-300">
                <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300">
                  <feature.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-foreground mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
