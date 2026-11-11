import { AdminSidebar } from "@/components/AdminSidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { PortalHeaderActions } from "@/components/PortalHeaderActions";
import { ADMIN_ROUTES, RouteWarmup } from "@/components/RouteWarmup";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <RouteWarmup routes={ADMIN_ROUTES} />
      <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
        <AdminSidebar />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:ml-72 lg:overflow-y-auto">
          <PortalHeaderActions chatHref="/admin/chat" notificationsHref="/admin/notifications" className="hidden lg:flex" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
          <main className="safe-bottom relative flex-1 overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8 md:px-10 md:py-10 lg:px-12">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
