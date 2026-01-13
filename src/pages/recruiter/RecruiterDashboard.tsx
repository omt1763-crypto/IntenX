import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Briefcase, Users, MessageSquare, CheckCircle, Clock } from "lucide-react";

const weeklyData = [
  { day: "Mon", value: 60 },
  { day: "Tue", value: 45 },
  { day: "Wed", value: 75 },
  { day: "Thu", value: 65 },
  { day: "Fri", value: 40 },
  { day: "Sat", value: 55 },
  { day: "Sun", value: 90 },
];

const RecruiterDashboard = () => {
  return (
    <DashboardLayout userType="recruiter">
      <PageHeader 
        title="Work Hub" 
        subtitle="Manage jobs and track candidate interviews"
        action={
          <Button variant="hero" asChild>
            <Link to="/recruiter/jobs">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Job
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Total Jobs Posted" 
          value={4} 
          sublabel="0% this month"
          gradient="pink"
          icon={<Briefcase className="w-5 h-5 text-flow-purple" />}
          chart={
            <div className="flex items-end gap-1 h-16">
              {weeklyData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div 
                    className="w-5 bg-gradient-to-t from-flow-blue to-flow-purple rounded-t"
                    style={{ height: `${d.value * 0.6}px` }}
                  />
                  <span className="text-[8px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          }
        />
        <StatCard 
          label="Total Candidates" 
          value={6} 
          sublabel="Awaiting review"
          gradient="blue"
          icon={<Users className="w-5 h-5 text-flow-blue" />}
          chart={
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle 
                  cx="32" cy="32" r="28" fill="none" 
                  stroke="hsl(var(--flow-purple))" strokeWidth="4"
                  strokeDasharray={`${60 * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          }
        />
        <StatCard 
          label="Total Interviews" 
          value={0} 
          sublabel="Conducted"
          icon={<MessageSquare className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard 
          label="Shortlisted" 
          value={0} 
          sublabel="Total"
          icon={<CheckCircle className="w-5 h-5 text-muted-foreground" />}
        />
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <DashboardCard gradient="pink" hover>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-flow-purple/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-flow-purple" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Manage Jobs</h3>
              <p className="text-sm text-muted-foreground">View and edit your job postings</p>
            </div>
          </div>
          <Button variant="hero" className="w-full" asChild>
            <Link to="/recruiter/jobs">View Details</Link>
          </Button>
        </DashboardCard>

        <DashboardCard gradient="blue" hover>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-flow-blue/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-flow-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Candidates</h3>
              <p className="text-sm text-muted-foreground">Review applicant profiles</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/recruiter/applicants">View Candidates</Link>
          </Button>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
