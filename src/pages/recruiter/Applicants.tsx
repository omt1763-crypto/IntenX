import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, CheckCircle, Clock, XCircle, FileText, Search, ChevronDown, Mail, Calendar, Briefcase } from "lucide-react";

const statusCards = [
  { label: "Completed", value: 0, icon: CheckCircle, color: "bg-green-100 text-green-600" },
  { label: "In Progress", value: 0, icon: Clock, color: "bg-blue-100 text-flow-blue" },
  { label: "Rejected", value: 1, icon: XCircle, color: "bg-red-100 text-red-500" },
  { label: "Pending", value: 5, icon: FileText, color: "bg-orange-100 text-orange-500" },
];

const applicants = [
  {
    jobTitle: "Senior Software Developer",
    company: "Brancrave",
    count: 3,
    candidates: [
      { name: "Om Tripathi", email: "brancrave@gmail.com", role: "Senior developer", date: "Dec 16, 2025", status: "shortlisted" },
      { name: "Om Tripathi", email: "brancrave@gmail.com", role: "Senior developer", date: "Dec 16, 2025", status: "rejected" },
      { name: "Om Tripathi", email: "brancrave@gmail.com", role: "Senior developer", date: "Dec 16, 2025", status: "invited" },
    ],
  },
];

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    shortlisted: "bg-flow-yellow/20 text-foreground",
    rejected: "bg-red-100 text-red-600",
    invited: "bg-flow-blue/20 text-flow-blue",
    pending: "bg-muted text-muted-foreground",
  };
  return styles[status] || styles.pending;
};

const Applicants = () => {
  return (
    <DashboardLayout userType="recruiter">
      <PageHeader 
        title="All Applicants" 
        subtitle="6 total candidates across 3 jobs"
        backLink="/recruiter/dashboard"
        icon={<Users className="w-6 h-6 text-primary-foreground" />}
      />

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statusCards.map((card) => (
          <DashboardCard key={card.label} hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-full ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10 bg-card border-border/50"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          All Status
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Applicants List */}
      <div className="space-y-6">
        {applicants.map((job, idx) => (
          <DashboardCard key={idx}>
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
              <div className="w-12 h-12 rounded-xl bg-flow-blue/20 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-flow-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">{job.jobTitle}</h3>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-flow-purple text-white text-sm font-medium">
                {job.count} applicants
              </span>
            </div>

            <div className="space-y-3">
              {job.candidates.map((candidate, cIdx) => (
                <div 
                  key={cIdx} 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-flow-purple/20 flex items-center justify-center text-sm font-semibold text-flow-purple">
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{candidate.name}</p>
                        {candidate.status === "rejected" && <XCircle className="w-4 h-4 text-red-500" />}
                        {candidate.status === "shortlisted" && <Clock className="w-4 h-4 text-flow-yellow" />}
                        {candidate.status === "invited" && <Clock className="w-4 h-4 text-flow-blue" />}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {candidate.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>• {candidate.role}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {candidate.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(candidate.status)}`}>
                      {candidate.status}
                    </span>
                    <Button variant="hero" size="sm">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Applicants;
