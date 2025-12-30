import { MessageSquare, Shield, Users, Building2, FileText, BarChart3 } from "lucide-react";

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

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
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
          <div className="md:col-span-2 bg-gradient-to-br from-flow-pink/30 via-card to-card rounded-3xl p-8 border border-border/50 overflow-hidden relative">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-flow-purple/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-flow-purple" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{features[0].title}</h3>
                </div>
                <p className="text-muted-foreground mb-6">{features[0].description}</p>
                
                {/* Mini Interview Interface */}
                <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
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
                  <div className="bg-flow-yellow/20 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Skills Match</span>
                    <span className="text-xs text-muted-foreground">92% compatible</span>
                  </div>
                  <div className="bg-flow-purple/10 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">ATS Score</span>
                    <span className="text-xs text-muted-foreground">85/100</span>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Analyzing keywords...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Feature Cards */}
          {features.slice(2).map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-3xl p-6 border border-border/50 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
