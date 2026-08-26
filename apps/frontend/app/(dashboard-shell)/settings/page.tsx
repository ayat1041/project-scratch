import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Starter',
  description: 'Manage your account settings.',
};

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-foreground text-2xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-2">
        Account settings go here.
      </p>
    </div>
  );
}
