import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Users, Building2, FileText, BarChart3, Diamond } from "lucide-react";
import DashboardMockup from "./DashboardMockup";
import GridBackground from "./GridBackground";

// Companies for trusted section
const companies = [
  { name: "TechCorp", icon: "🏢" },
  { name: "StartupX", icon: "🚀" },
  { name: "GlobalHR", icon: "🌐" },
  { name: "TalentHub", icon: "⭐" },
  { name: "HireFlow", icon: "💼" },
];

// Features data
const features = [
  {
    icon: MessageSquare,
    title: "AI Mock Interviews",
    description: "Practice role-based interviews with our intelligent AI agents that adapt to your responses.",
  },
  {
    icon: Shield,
    title: "Resume Analysis",
    description: "Get instant, detailed feedback on your resume with AI-powered insights and suggestions.",
  },
  {
    icon: Users,
    title: "Recruiter Dashboard",
    description: "Post jobs, share interview links, and get comprehensive candidate analytics.",
  },
  {
    icon: Building2,
    title: "Company Portal",
    description: "Manage multiple recruiters, track hiring pipelines, and analyze team performance.",
  },
];

const LandingPage = () => {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <GridBackground className="relative min-h-screen hero-gradient pt-32 pb-20 px-4">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-flow-purple/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-flow-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-flow-pink rounded-full blur-3xl opacity-50" />
        
        {/* Corner decorations */}
        <div className="absolute top-32 right-20 hidden lg:block">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-border">
            <path d="M0 0V20H2V2H20V0H0Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute top-32 left-20 hidden lg:block rotate-90">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-border">
            <path d="M0 0V20H2V2H20V0H0Z" fill="currentColor"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect">
              <span className="w-2 h-2 rounded-full bg-flow-purple animate-pulse" />
              <span className="text-sm text-muted-foreground">
                AI-powered interviews for candidates, recruiters & companies
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Ace your interviews with
              <br />
              <span className="text-gradient">AI-powered intelligence</span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            Practice role-based interviews, get instant resume analysis, and streamline hiring with 
            intelligent AI agents for candidates, recruiters, and companies.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Button variant="hero" size="lg">
              Start Interview
            </Button>
            <Button variant="outline" size="lg" className="hidden sm:inline-flex">
              Watch Demo
            </Button>
          </div>

          {/* Dashboard Mockup */}
          <div className="animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <DashboardMockup />
          </div>
        </div>
      </GridBackground>

      {/* Trusted By Section */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-up">
            <p className="text-sm text-muted-foreground mb-2">Trusted worldwide</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Leading companies trust our platform
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {companies.map((company, index) => (
              <div
                key={company.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-300 hover:shadow-card animate-fade-up"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <span className="text-lg">{company.icon}</span>
                <span className="font-medium text-sm">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need for smarter hiring
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three dashboards, one powerful platform. Designed for candidates, recruiters, and companies.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Main Feature Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-flow-pink/30 via-card to-card rounded-3xl p-8 border border-border/50 overflow-hidden relative hover:shadow-card transition-all duration-300 hover:border-flow-pink/30 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-flow-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5 text-flow-purple" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">{features[0].title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">{features[0].description}</p>
                  
                  {/* Mini Interview Interface */}
                  <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(258 100% 63%)' }}>
                        <MessageSquare className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Tell me about yourself</p>
                        <p className="text-xs text-muted-foreground">AI Interviewer</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-sm text-muted-foreground">Recording your response...</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-flow-blue/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-flow-blue" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">{features[1].title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">{features[1].description}</p>
                  
                  {/* Analysis Cards */}
                  <div className="space-y-3">
                    <div className="bg-flow-yellow/20 rounded-xl p-3 flex items-center justify-between hover:bg-flow-yellow/30 transition-colors cursor-default">
                      <span className="text-sm font-medium text-foreground">Skills Match</span>
                      <span className="text-xs text-muted-foreground">92% compatible</span>
                    </div>
                    <div className="bg-flow-purple/10 rounded-xl p-3 flex items-center justify-between hover:bg-flow-purple/20 transition-colors cursor-default">
                      <span className="text-sm font-medium text-foreground">ATS Score</span>
                      <span className="text-xs text-muted-foreground">85/100</span>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2 hover:bg-muted/70 transition-colors">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Analyzing keywords...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Feature Cards */}
            {features.slice(2).map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-card rounded-3xl p-6 border border-border/50 hover:shadow-card hover:border-flow-purple/30 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-flow-purple/10 flex items-center justify-center transition-all duration-300">
                    <feature.icon className="w-5 h-5 text-foreground group-hover:text-flow-purple transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
