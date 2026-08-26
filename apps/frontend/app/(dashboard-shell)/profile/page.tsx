import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Starter',
  description: 'Manage your profile.',
};

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-foreground text-2xl font-semibold">Profile</h1>
      <p className="text-muted-foreground mt-2">
        Profile details and editing go here.
      </p>
    </div>
  );
}
