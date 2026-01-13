import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Info, Briefcase, Code, Users, Lightbulb } from "lucide-react";

const practiceTypes = [
  {
    icon: Briefcase,
    emoji: "💼",
    title: "HR Interview",
    description: "Practice general HR and behavioral questions",
    skills: ["Communication", "Teamwork", "Problem Solving"],
    color: "from-flow-yellow/40 to-flow-yellow/10",
    iconBg: "bg-flow-yellow/30",
  },
  {
    icon: Code,
    emoji: "💻",
    title: "Technical Interview",
    description: "Master coding and technical problem-solving",
    skills: ["Coding", "Data Structures", "Algorithms"],
    color: "from-flow-blue/30 to-flow-blue/10",
    iconBg: "bg-flow-blue/20",
  },
  {
    icon: Users,
    emoji: "🏗️",
    title: "System Design",
    description: "Practice architecture and design discussions",
    skills: ["Architecture", "Scalability", "Trade-offs"],
    color: "from-flow-purple/20 to-flow-purple/5",
    iconBg: "bg-flow-purple/15",
  },
  {
    icon: Lightbulb,
    emoji: "🧠",
    title: "Case Study",
    description: "Solve business problems and showcase strategy",
    skills: ["Analysis", "Strategy", "Presentation"],
    color: "from-flow-pink/40 to-flow-pink/10",
    iconBg: "bg-flow-pink/40",
  },
];

const PracticeTypes = () => {
  return (
    <DashboardLayout userType="candidate">
      <PageHeader 
        title="Practice Types" 
        subtitle="Choose your interview practice mode"
        backLink="/candidate/dashboard"
      />

      {/* Settings Banner */}
      <DashboardCard gradient="blue" className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-flow-blue/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-flow-blue" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              Using saved settings: <span className="font-semibold">Full Stack Developer</span> • 1-3 years
            </p>
            <button className="text-sm text-flow-purple hover:underline">→ Update settings</button>
          </div>
        </div>
      </DashboardCard>

      {/* Practice Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {practiceTypes.map((type) => (
          <DashboardCard key={type.title} hover className="overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-50`} />
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl ${type.iconBg} flex items-center justify-center mb-5`}>
                <span className="text-3xl">{type.emoji}</span>
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {type.title}
              </h3>
              <p className="text-muted-foreground mb-5">{type.description}</p>

              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {type.skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs font-medium text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <Button variant="hero" className="w-full">
                Start Practice
              </Button>
            </div>
          </DashboardCard>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default PracticeTypes;
