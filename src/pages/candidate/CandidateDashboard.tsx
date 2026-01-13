import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Award, FileText, Play, Clock, Target } from "lucide-react";
import { Link } from "react-router-dom";

const practiceTypes = [
  { 
    title: "HR Interview", 
    description: "Practice behavioral questions",
    icon: "💼",
    color: "bg-flow-yellow/20"
  },
  { 
    title: "Technical Interview", 
    description: "Master coding challenges",
    icon: "💻",
    color: "bg-flow-blue/20"
  },
  { 
    title: "System Design", 
    description: "Architectural discussions",
    icon: "🏗️",
    color: "bg-flow-purple/10"
  },
];

const CandidateDashboard = () => {
  return (
    <DashboardLayout userType="candidate">
      <PageHeader 
        title="Welcome back!" 
        subtitle="Continue your interview preparation journey"
      />

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Practice Sessions" 
          value={12} 
          sublabel="This month"
          gradient="pink"
          icon={<Play className="w-5 h-5 text-flow-purple" />}
        />
        <StatCard 
          label="Hours Practiced" 
          value="8.5" 
          sublabel="+2.5 hrs this week"
          gradient="blue"
          icon={<Clock className="w-5 h-5 text-flow-blue" />}
        />
        <StatCard 
          label="Avg. Score" 
          value="85%" 
          sublabel="↑ 5% improvement"
          gradient="yellow"
          icon={<Target className="w-5 h-5 text-flow-yellow" />}
        />
        <StatCard 
          label="Certificates" 
          value={3} 
          sublabel="Earned"
          gradient="purple"
          icon={<Award className="w-5 h-5 text-flow-purple" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <DashboardCard gradient="pink" className="h-full">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-flow-purple" />
              <h2 className="font-semibold text-lg text-foreground">Quick Practice</h2>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4">
              {practiceTypes.map((type) => (
                <Link 
                  key={type.title}
                  to="/candidate/practice"
                  className="group"
                >
                  <div className={`${type.color} rounded-2xl p-5 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                    <div className="text-3xl mb-3">{type.icon}</div>
                    <h3 className="font-semibold text-foreground mb-1">{type.title}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="hero" className="flex-1" asChild>
                <Link to="/candidate/practice">
                  <Zap className="w-4 h-4 mr-2" />
                  Start New Practice
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/candidate/resume">
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze Resume
                </Link>
              </Button>
            </div>
          </DashboardCard>
        </div>

        {/* Skills Progress */}
        <DashboardCard>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-flow-blue" />
            <h2 className="font-semibold text-lg text-foreground">Skills Progress</h2>
          </div>

          <div className="space-y-5">
            {[
              { name: "Communication", progress: 85, color: "bg-flow-purple" },
              { name: "Problem Solving", progress: 72, color: "bg-flow-blue" },
              { name: "Technical", progress: 68, color: "bg-flow-yellow" },
              { name: "Leadership", progress: 55, color: "bg-flow-pink" },
            ].map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-foreground">{skill.name}</span>
                  <span className="text-muted-foreground">{skill.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${skill.color} rounded-full transition-all duration-500`}
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-6" asChild>
            <Link to="/candidate/skills">View All Skills →</Link>
          </Button>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
};

export default CandidateDashboard;
