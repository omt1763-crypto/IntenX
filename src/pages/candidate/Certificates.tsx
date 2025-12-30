import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatCard from "@/components/dashboard/StatCard";
import { Trophy, Star, Award, Medal } from "lucide-react";

const earnedCertificates = [
  {
    title: "Interview Champion",
    description: "Completed 10+ mock interviews",
    icon: Trophy,
    color: "from-flow-yellow/40 to-flow-yellow/10",
    earned: true,
  },
  {
    title: "Interview Enthusiast",
    description: "5+ hours of practice",
    icon: Medal,
    color: "from-flow-purple/20 to-flow-purple/5",
    earned: true,
  },
];

const availableCertificates = [
  {
    title: "Communication Master",
    description: "Score 90%+ in communication",
    icon: Star,
    progress: 75,
  },
  {
    title: "Tech Wizard",
    description: "Complete all technical challenges",
    icon: Award,
    progress: 40,
  },
  {
    title: "Quick Thinker",
    description: "Answer 50 questions under time limit",
    icon: Trophy,
    progress: 60,
  },
  {
    title: "Consistent Performer",
    description: "Practice for 7 consecutive days",
    icon: Medal,
    progress: 85,
  },
];

const Certificates = () => {
  return (
    <DashboardLayout userType="candidate">
      <PageHeader 
        title="Certificates & Achievements" 
        subtitle="Earn certificates by completing milestones"
        backLink="/candidate/dashboard"
        icon={<Trophy className="w-6 h-6 text-primary-foreground" />}
      />

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <StatCard 
          label="Total Available" 
          value={6}
          gradient="blue"
          icon={<Award className="w-5 h-5 text-flow-blue" />}
        />
        <StatCard 
          label="Earned" 
          value={2}
          gradient="yellow"
          icon={<Trophy className="w-5 h-5 text-flow-yellow" />}
        />
      </div>

      {/* Earned Certificates */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🏆</span>
          <h2 className="font-semibold text-xl text-foreground">Earned Certificates</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {earnedCertificates.map((cert) => (
            <DashboardCard key={cert.title} hover>
              <div className={`absolute inset-0 bg-gradient-to-br ${cert.color} opacity-60 rounded-2xl`} />
              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-card/80 flex items-center justify-center border border-border/30">
                  <cert.icon className="w-7 h-7 text-flow-purple" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{cert.title}</h3>
                    <Star className="w-4 h-4 text-flow-yellow fill-flow-yellow" />
                  </div>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </div>
              </div>
            </DashboardCard>
          ))}
        </div>
      </div>

      {/* Available Certificates */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎯</span>
          <h2 className="font-semibold text-xl text-foreground">In Progress</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {availableCertificates.map((cert) => (
            <DashboardCard key={cert.title} hover>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <cert.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{cert.title}</h3>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-flow-purple to-flow-blue rounded-full"
                    style={{ width: `${cert.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{cert.progress}%</span>
              </div>
            </DashboardCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Certificates;
