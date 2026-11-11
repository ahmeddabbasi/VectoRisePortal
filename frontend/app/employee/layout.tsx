import { AuthGuard } from "@/components/AuthGuard";
import { PortalHeaderActions } from "@/components/PortalHeaderActions";
import { EMPLOYEE_ROUTES, RouteWarmup } from "@/components/RouteWarmup";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="employee">
      <RouteWarmup routes={EMPLOYEE_ROUTES} />
      <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
        <EmployeeSidebar />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:ml-64 lg:overflow-y-auto">
          <PortalHeaderActions chatHref="/employee/chat" notificationsHref="/employee/notifications" className="hidden lg:flex" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
          <main className="safe-bottom relative flex-1 overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8 md:px-10 md:py-10 lg:px-12">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
