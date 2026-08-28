import { ReactNode } from 'react';
import { SidebarProvider } from '@repo/ui/components/dashboard';
import AdminSidebar from '@modules/common/components/DashboardSidebar';
import AdminPortalHeader from '@modules/common/components/DashboardPortalHeader';
import { cn } from '@repo/ui/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300'
        )}
      >
        <AdminPortalHeader />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
