import PortalHeader from '@modules/common/components/PortalHeader';
import DashboardSidebar from '@modules/common/components/DashboardSidebar';
import WelcomeContent from '@modules/auth/welcome/components/WelcomeContent';
import { SidebarProvider } from '@repo/ui/components/dashboard';

export default async function WelcomePage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalHeader />
          <main className="bg-background flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
            <WelcomeContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
