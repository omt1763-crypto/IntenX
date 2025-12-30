import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, DollarSign, Users, Calendar, ArrowRight, AlertCircle } from "lucide-react";

const jobs = [
  {
    id: 1,
    title: "Senior Backend Developer",
    company: "HCL",
    location: "N/A",
    salary: "N/A",
    applicants: 0,
    date: "12/24/2025",
    created: "12/24/2025",
    linkExpired: true,
  },
  {
    id: 2,
    title: "Senior Software Developer",
    company: "Brancrave",
    location: "N/A",
    salary: "N/A",
    applicants: 3,
    date: "12/16/2025",
    created: "12/16/2025",
    linkExpired: true,
  },
  {
    id: 3,
    title: "Senior Software Developer",
    company: "Brancrave",
    location: "N/A",
    salary: "N/A",
    applicants: 1,
    date: "12/16/2025",
    created: "12/16/2025",
    linkExpired: true,
  },
];

const Jobs = () => {
  return (
    <DashboardLayout userType="recruiter">
      <PageHeader 
        title="Job Postings" 
        subtitle="Manage your job listings and applications"
        action={
          <Button variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            Post a Job
          </Button>
        }
      />

      <div className="space-y-4">
        {jobs.map((job) => (
          <DashboardCard key={job.id} hover>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Job Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground mb-1">{job.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{job.company}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {job.applicants} applicants
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {job.date}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-2">Created {job.created}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="text-flow-purple">
                  View Applicants ({job.applicants})
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                {job.linkExpired && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    Link expired
                  </span>
                )}
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Jobs;
