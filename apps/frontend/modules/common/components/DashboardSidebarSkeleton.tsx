import { Skeleton } from '@repo/ui/components/ui/skeleton';

export default function DashboardSidebarSkeleton() {
  return (
    <aside className="relative z-501 hidden min-h-screen w-55 flex-col border-r border-gray-200 bg-[#ebecf0] transition-all duration-300 md:flex">
      <div className="fixed w-55">
        {/* Logo Area Skeleton */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        {/* Navigation Skeleton */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {/* Render 6 skeleton nav items */}
            {Array.from({ length: 6 }).map((_, index) => (
              <li key={index}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="h-4.5 w-4.5 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
