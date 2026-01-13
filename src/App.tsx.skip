import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Candidate Pages
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import PracticeTypes from "./pages/candidate/PracticeTypes";
import SkillsMap from "./pages/candidate/SkillsMap";
import Certificates from "./pages/candidate/Certificates";

// Recruiter Pages
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import Jobs from "./pages/recruiter/Jobs";
import Applicants from "./pages/recruiter/Applicants";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Candidate Routes */}
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate/practice" element={<PracticeTypes />} />
          <Route path="/candidate/skills" element={<SkillsMap />} />
          <Route path="/candidate/certificates" element={<Certificates />} />
          
          {/* Recruiter Routes */}
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/recruiter/jobs" element={<Jobs />} />
          <Route path="/recruiter/applicants" element={<Applicants />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
