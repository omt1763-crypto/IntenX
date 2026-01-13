import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "candidate" | "recruiter" | "company";
}

const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar userType={userType} />
        <main className="flex-1 overflow-auto">
          <div className="relative min-h-screen">
            {/* Subtle grid background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />
            {/* Decorative blurs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-flow-purple/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-flow-blue/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
