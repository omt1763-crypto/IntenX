import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Target } from "lucide-react";

const technicalSkills = [
  { name: "Communication", interviews: 3, progress: 78 },
  { name: "Teamwork", interviews: 3, progress: 85 },
  { name: "Problem Solving", interviews: 3, progress: 72 },
  { name: "Leadership", interviews: 2, progress: 65 },
  { name: "Time Management", interviews: 2, progress: 58 },
];

const codingSkills = [
  { name: "Data Structures", interviews: 4, progress: 82 },
  { name: "Algorithms", interviews: 4, progress: 75 },
  { name: "System Design", interviews: 2, progress: 60 },
  { name: "Code Quality", interviews: 3, progress: 88 },
];

const SkillsMap = () => {
  return (
    <DashboardLayout userType="candidate">
      <PageHeader 
        title="Skills Map" 
        subtitle="Track and improve your skills based on your interviews"
        backLink="/candidate/dashboard"
      />

      {/* Technical Skills */}
      <DashboardCard className="mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-flow-purple" />
          <h2 className="font-semibold text-lg text-foreground">Technical Skills</h2>
        </div>

        <div className="space-y-6">
          {technicalSkills.map((skill) => (
            <div key={skill.name} className="bg-muted/30 rounded-2xl p-5 border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{skill.name}</h3>
                  <p className="text-xs text-muted-foreground">{skill.interviews} interviews completed</p>
                </div>
                <span className="text-sm font-bold text-flow-purple">{skill.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-flow-purple to-flow-blue rounded-full transition-all duration-700"
                  style={{ width: `${skill.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Coding Skills */}
      <DashboardCard>
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-flow-blue" />
          <h2 className="font-semibold text-lg text-foreground">Coding Skills</h2>
        </div>

        <div className="space-y-6">
          {codingSkills.map((skill) => (
            <div key={skill.name} className="bg-muted/30 rounded-2xl p-5 border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{skill.name}</h3>
                  <p className="text-xs text-muted-foreground">{skill.interviews} interviews completed</p>
                </div>
                <span className="text-sm font-bold text-flow-blue">{skill.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-flow-blue to-flow-purple rounded-full transition-all duration-700"
                  style={{ width: `${skill.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
};

export default SkillsMap;
