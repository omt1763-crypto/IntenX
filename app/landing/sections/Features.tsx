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

const Features = () => {
  return (
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
          <div className="md:col-span-2 bg-gradient-to-br from-flow-pink/15 via-card to-card rounded-3xl p-8 border border-border/50 overflow-hidden relative hover:shadow-card transition-all duration-300 hover:border-flow-pink/20 animate-fade-up" style={{ animationDelay: "0.1s" }}>
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

          {/* Recruiter Dashboard Card */}
          <div
            className="group bg-gradient-to-br from-blue-500/10 via-card to-card rounded-3xl p-6 border border-border/50 hover:shadow-card hover:border-blue-500/30 transition-all duration-300 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground">{features[2].title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{features[2].description}</p>
            
            {/* Recruiter Dashboard Content */}
            <div className="bg-card rounded-2xl p-4 space-y-3 border border-border/30">
              {/* Job Role */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Senior Developer</p>
                  <p className="text-xs text-muted-foreground">12 applicants</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 font-medium whitespace-nowrap">Active</span>
              </div>
              
              {/* Interview Link */}
              <div className="bg-muted/40 rounded-lg p-2 px-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V9.5M14 1.5v4m-4-4v4m-6 5h12M5 11.5h10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
                <p className="text-xs text-muted-foreground font-mono truncate">intenx.ai/interview/abc123</p>
              </div>
              
              {/* Stats Container */}
              <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-base font-bold text-foreground">24</p>
                    <p className="text-xs text-muted-foreground">Interviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-foreground">89%</p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-foreground">4.8</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Portal Card */}
          <div
            className="group bg-gradient-to-br from-purple-500/10 via-card to-card rounded-3xl p-6 border border-border/50 hover:shadow-card hover:border-purple-500/30 transition-all duration-300 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground">{features[3].title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{features[3].description}</p>
            
            {/* Company Portal Content */}
            <div className="bg-card rounded-2xl p-4 space-y-3 border border-border/30">
              {/* Team Members */}
              <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                  {[{ name: "JD", color: "bg-purple-500" }, { name: "MK", color: "bg-blue-500" }, { name: "AL", color: "bg-yellow-500" }].map((member) => (
                    <div key={member.name} className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white border-2 border-card`}>
                      {member.name}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-medium bg-muted/20 px-2 py-1 rounded">8 Recruiters</p>
              </div>
              
              {/* Hiring Pipeline */}
              <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Hiring Pipeline</p>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted/50">
                  <div className="w-1/3 bg-blue-500 rounded-l-full"></div>
                  <div className="w-2/5 bg-purple-500"></div>
                  <div className="w-1/5 bg-yellow-500 rounded-r-full"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Applied: 156</span>
                  <span>Interview: 48</span>
                  <span>Hired: 12</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors font-medium">Add Team</button>
                <button className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors font-medium">Analytics</button>
                <button className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-muted/50 text-foreground hover:bg-muted/70 transition-colors font-medium">Settings</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
