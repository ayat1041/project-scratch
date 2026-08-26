import PortalHeader from '@modules/common/components/PortalHeader';
import DashboardSidebar from '@modules/common/components/DashboardSidebar';
import { SidebarProvider } from '@repo/ui/components/dashboard';

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
