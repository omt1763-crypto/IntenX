'use client';

import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Users, 
  BarChart3, 
  Mic, 
  Briefcase, 
  UserCheck, 
  Building2,
  FolderOpen,
  ChevronDown,
  Diamond
} from "lucide-react";

const sidebarItems = {
  main: [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: MessageSquare, label: "AI Interviews" },
    { icon: FileText, label: "Resume Analysis" },
    { icon: Users, label: "Candidates" },
    { icon: BarChart3, label: "Analytics" },
  ],
  roles: [
    { icon: UserCheck, label: "Candidate Portal" },
    { icon: Briefcase, label: "Recruiter Hub" },
    { icon: Building2, label: "Company Dashboard" },
  ],
  folders: [
    { label: "Software Engineering" },
  ],
};

const DashboardMockup = () => {
  return (
    <div className="max-w-4xl mx-auto pointer-events-none select-none">
      <div className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-56 bg-gradient-to-b from-flow-pink/15 to-card border-r border-border/50 p-4 hidden md:block">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-flow-purple to-flow-blue flex items-center justify-center">
                <Diamond className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">IntenX AI</span>
                <p className="text-[10px] text-muted-foreground">Interview Platform</p>
              </div>
            </div>

            {/* Main Section */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Main</p>
              <nav className="space-y-1">
                {sidebarItems.main.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      item.active 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                ))}
              </nav>
            </div>

            {/* Roles Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Portals</p>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
              <nav className="space-y-1">
                {sidebarItems.roles.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                ))}
              </nav>
            </div>

            {/* Folders Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Job Roles</p>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
              <nav className="space-y-1">
                {sidebarItems.folders.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {item.label}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-foreground">AI Interview Hub</h2>
              <div className="relative">
                {/* Main mic button */}
                <div className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#8241FF' }}>
                  <Mic className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* AI Orb - Simple floating sphere */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-blue-600 shadow-2xl animate-float mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-1">Welcome to IntenX</h3>
              <p className="text-sm text-muted-foreground text-center">Your AI-powered interview assistant</p>
              <p className="text-xs text-muted-foreground/60 text-center mt-1">
                Practice interviews, analyze resumes, and get hired faster with intelligent AI.
              </p>
            </div>

            {/* Preview Notice */}
            <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Select your role to get started
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-purple-500/20 text-xs font-medium text-purple-600">
                    Candidate
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-flow-blue/10 text-xs font-medium text-flow-blue">
                    Recruiter
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-flow-yellow/20 text-xs font-medium text-foreground">
                    Company
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
