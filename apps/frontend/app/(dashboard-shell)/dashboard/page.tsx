import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Starter',
  description: 'Your account dashboard.',
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-foreground text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Welcome back. This is your starting point — build out the rest of your
        product here.
      </p>
    </div>
  );
}
