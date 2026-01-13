import { useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Zap, 
  TrendingUp, 
  FileText, 
  Award, 
  User,
  Briefcase,
  CreditCard,
  Users,
  LogOut,
  Building2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  userType: "candidate" | "recruiter" | "company";
}

const candidateItems = [
  { title: "Dashboard", url: "/candidate/dashboard", icon: LayoutDashboard },
  { title: "Practice Types", url: "/candidate/practice", icon: Zap },
  { title: "Skills Map", url: "/candidate/skills", icon: TrendingUp },
  { title: "Resume Analysis", url: "/candidate/resume", icon: FileText },
  { title: "Certificates", url: "/candidate/certificates", icon: Award },
  { title: "My Profile", url: "/candidate/profile", icon: User },
];

const recruiterItems = [
  { title: "Dashboard", url: "/recruiter/dashboard", icon: LayoutDashboard },
  { title: "My Profile", url: "/recruiter/profile", icon: User },
  { title: "Jobs", url: "/recruiter/jobs", icon: Briefcase },
  { title: "Billing", url: "/recruiter/billing", icon: CreditCard },
  { title: "Applicants", url: "/recruiter/applicants", icon: Users },
];

const companyItems = [
  { title: "Dashboard", url: "/company/dashboard", icon: LayoutDashboard },
  { title: "Recruiters", url: "/company/recruiters", icon: Users },
  { title: "Jobs Overview", url: "/company/jobs", icon: Briefcase },
  { title: "Analytics", url: "/company/analytics", icon: TrendingUp },
  { title: "Billing", url: "/company/billing", icon: CreditCard },
  { title: "Settings", url: "/company/settings", icon: Building2 },
];

const DashboardSidebar = ({ userType }: DashboardSidebarProps) => {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  const items = userType === "candidate" 
    ? candidateItems 
    : userType === "recruiter" 
    ? recruiterItems 
    : companyItems;

  const platformLabel = userType === "candidate" 
    ? "Candidate Platform" 
    : userType === "recruiter" 
    ? "AI Interview Platform"
    : "Company Portal";

  return (
    <Sidebar 
      className="border-r border-border/50 bg-gradient-to-b from-flow-purple/95 via-flow-purple/90 to-flow-blue/80"
      collapsible="icon"
    >
      <div className="p-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="/intenx-logo.svg" 
              alt="IntenX" 
              className="w-10 h-10"
            />
          </div>
          {!collapsed && (
            <div>
              <span className="font-display font-bold text-lg text-white">IntenX</span>
              <p className="text-[10px] text-white/70">{platformLabel}</p>
            </div>
          )}
        </Link>
      </div>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Settings section at bottom */}
      <div className="mt-auto p-3">
        <div className="border-t border-white/20 pt-4 mb-4">
          {!collapsed && (
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-3 px-2">Settings</p>
          )}
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all w-full">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
        {!collapsed && (
          <p className="text-[10px] text-white/40 text-center">© 2024 IntenX</p>
        )}
      </div>

      {/* Collapse trigger */}
      <div className="absolute top-4 right-0 translate-x-1/2">
        <SidebarTrigger className="bg-card border border-border/50 shadow-md rounded-full p-1.5 hover:bg-muted transition-colors" />
      </div>
    </Sidebar>
  );
};

export default DashboardSidebar;
