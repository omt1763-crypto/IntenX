import { Users, Briefcase, Building2 } from "lucide-react";

const HowItWorks = () => {
  const sections = [
    {
      title: "For Candidates",
      description: "Prepare for your dream role with AI-powered mock interviews",
      icon: Users,
      steps: [
        {
          number: "01",
          title: "Sign Up & Choose Role",
          description: "Create your account and select the job role you're preparing for.",
        },
        {
          number: "02",
          title: "Practice with AI",
          description: "Take mock interviews with our intelligent AI that adapts to your responses.",
        },
        {
          number: "03",
          title: "Get Detailed Analysis",
          description: "Receive comprehensive feedback on your performance and resume.",
        },
      ],
    },
    {
      title: "For Recruiters",
      description: "Streamline your hiring process with AI-powered screening",
      icon: Briefcase,
      steps: [
        {
          number: "01",
          title: "Post Your Job",
          description: "Create job postings with customized interview criteria.",
        },
        {
          number: "02",
          title: "Share Interview Link",
          description: "Send unique interview links to candidates for AI screening.",
        },
        {
          number: "03",
          title: "Review Analytics",
          description: "Get detailed reports and rankings for each applicant.",
        },
      ],
    },
    {
      title: "For Companies",
      description: "Build a unified hiring system across your entire organization",
      icon: Building2,
      steps: [
        {
          number: "01",
          title: "Set Up Organization",
          description: "Create your company profile and configure hiring workflows.",
        },
        {
          number: "02",
          title: "Manage Recruiters",
          description: "Add team members and assign roles with custom permissions.",
        },
        {
          number: "03",
          title: "Track Performance",
          description: "Monitor hiring metrics and analyze team performance.",
        },
      ],
    },
  ];

  return (
    <section className="py-20 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-block mb-4 px-6 py-2 rounded-full bg-purple-300/25 border border-purple-300/40">
            <h2 className="font-display text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              How It Works
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple steps to transform your hiring. Whether you're a candidate, recruiter, or company, get started in minutes.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-20">
          {sections.map((section, sectionIdx) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.title}
                className="animate-fade-up"
                style={{ animationDelay: `${0.1 + sectionIdx * 0.15}s` }}
              >
                {/* Section Header */}
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Steps Grid - 3 columns in one line */}
                <div className="grid md:grid-cols-3 gap-6">
                  {section.steps.map((step, stepIdx) => {
                    const gradients = [
                      "from-purple-500/10 via-purple-400/5 to-blue-500/10",
                      "from-blue-500/10 via-cyan-400/5 to-teal-500/10",
                      "from-yellow-500/10 via-amber-400/5 to-orange-500/10"
                    ];
                    return (
                    <div
                      key={step.number}
                      className="group animate-fade-up"
                      style={{ animationDelay: `${0.1 + sectionIdx * 0.15 + stepIdx * 0.05}s` }}
                    >
                      {/* Step Box */}
                      <div className={`bg-gradient-to-br ${gradients[stepIdx % 3]} rounded-2xl p-6 border border-border/50 hover:shadow-card hover:border-border/80 transition-all duration-300 h-full flex flex-col overflow-hidden relative`}>
                        {/* Step Number */}
                        <div className="mb-6 relative z-10">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center mb-3">
                            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                              {step.number}
                            </p>
                          </div>
                        </div>

                        {/* Step Title */}
                        <h4 className="font-semibold text-foreground mb-3 text-sm group-hover:text-purple-600 transition-colors relative z-10">
                          {step.title}
                        </h4>

                        {/* Step Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed flex-grow relative z-10">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
