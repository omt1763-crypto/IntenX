"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const ROICalculator = () => {
  const [recruitmentType, setRecruitmentType] = useState("agency");
  const [avgSalary, setAvgSalary] = useState(70000);
  const [agencyFee, setAgencyFee] = useState(20);
  const [rolesPerYear, setRolesPerYear] = useState(50);
  const [applicantsPerRole, setApplicantsPerRole] = useState(150);

  // Constants
  const INTENTX_COST_PER_INTERVIEW = 4;
  const POSTING_COST_PER_ROLE = 400;

  // Calculations
  const totalApplicants = rolesPerYear * applicantsPerRole;
  const applicantsToInterview = totalApplicants / 2; // 50% filtered by ATS
  const totalInterviews = applicantsToInterview;

  // Agency economics
  const agencyFeePerHire = (avgSalary * agencyFee) / 100;
  const totalAgencyFeesPerYear = rolesPerYear * agencyFeePerHire;

  // IntenX costs
  const intentxCostPerHire = INTENTX_COST_PER_INTERVIEW * (totalInterviews / rolesPerYear);
  const totalIntentxCost = totalInterviews * INTENTX_COST_PER_INTERVIEW;

  // In-house costs
  const totalInHouseScreeningCost = rolesPerYear * POSTING_COST_PER_ROLE + totalIntentxCost;

  // Savings
  const annualSavings = totalAgencyFeesPerYear - totalInHouseScreeningCost;
  const savingsPerHire = agencyFeePerHire - (intentxCostPerHire + POSTING_COST_PER_ROLE);
  const reductionPercent = ((agencyFeePerHire - (intentxCostPerHire + POSTING_COST_PER_ROLE)) / agencyFeePerHire) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section id="roi-calculator" className="py-20 px-4 bg-gradient-to-b from-background to-muted/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            ROI Calculator
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Estimate your savings with IntenX. Switch between scenarios to match how you recruit today.
          </p>
        </div>

        {/* Main Calculator Container */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Input Section */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
            <h3 className="font-semibold text-lg text-foreground mb-6">Customize Your Scenario</h3>

            {/* Recruitment Type */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground mb-3">Recruitment Method</label>
              <div className="flex gap-3">
                {[
                  { value: "agency", label: "External Recruitment Agency" },
                  { value: "internal", label: "Internal Recruiters" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRecruitmentType(option.value)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      recruitmentType === option.value
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-6">
              {/* Average Salary */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="salary" className="text-sm font-medium text-foreground">
                    Average salary per role (USD)
                  </label>
                  <span className="text-sm text-muted-foreground">What is the typical average salary for these hires?</span>
                </div>
                <input
                  id="salary"
                  type="number"
                  value={avgSalary}
                  onChange={(e) => setAvgSalary(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                  min="0"
                  step="1000"
                />
              </div>

              {/* Agency Fee */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="fee" className="text-sm font-medium text-foreground">
                    Agency fee (% of salary)
                  </label>
                  <span className="text-sm text-muted-foreground">Standard agency fees are often 15% - 25%.</span>
                </div>
                <input
                  id="fee"
                  type="number"
                  value={agencyFee}
                  onChange={(e) => setAgencyFee(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              {/* Number of Roles */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="roles" className="text-sm font-medium text-foreground">
                    Number of roles per year
                  </label>
                  <span className="text-sm text-muted-foreground">How many openings do you fill annually?</span>
                </div>
                <input
                  id="roles"
                  type="number"
                  value={rolesPerYear}
                  onChange={(e) => setRolesPerYear(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                  min="1"
                  step="5"
                />
              </div>

              {/* Applicants Per Role */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="applicants" className="text-sm font-medium text-foreground">
                    Average applicants per role
                  </label>
                    <span className="text-sm text-muted-foreground">We assume your ATS filters out ~50% before IntenX.</span>
                </div>
                <input
                  id="applicants"
                  type="number"
                  value={applicantsPerRole}
                  onChange={(e) => setApplicantsPerRole(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                  min="1"
                  step="10"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Estimated Annual Savings */}
            <div className="rounded-xl border border-border bg-gradient-to-br from-purple-50 to-blue-50 p-8 shadow-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Estimated annual savings on agency fees</h3>
              <div className="mb-4">
                <div className="text-4xl md:text-5xl font-bold text-purple-600">
                  {formatCurrency(Math.max(0, annualSavings))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Numbers include IntenX costs at ${INTENTX_COST_PER_INTERVIEW} per interview.</p>
            </div>

            {/* Per-Hire Economics */}
            <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
              <h3 className="font-semibold text-lg text-foreground mb-4">Per-hire economics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">Typical agency fee per hire</span>
                  <span className="font-semibold text-foreground">{formatCurrency(agencyFeePerHire)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">Estimated IntenX cost per hire</span>
                  <span className="font-semibold text-foreground">{formatCurrency(intentxCostPerHire)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <div>
                    <span className="text-sm text-muted-foreground">Cost of posting job ads in-house</span>
                    <p className="text-xs text-muted-foreground mt-1">Estimated staff time to post roles on job boards and manage IntenX screening: ~{formatCurrency(POSTING_COST_PER_ROLE)} per role</p>
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(POSTING_COST_PER_ROLE)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-medium text-foreground">Savings per hire</span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(Math.max(0, savingsPerHire))}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-medium text-foreground">Reduction in per-hire fees</span>
                  <span className="font-bold text-green-600 text-lg">{Math.max(0, reductionPercent).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Annualized View */}
            <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
              <h3 className="font-semibold text-lg text-foreground mb-4">Annualized view</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">Total agency fees per year</span>
                  <span className="font-semibold text-foreground">{formatCurrency(totalAgencyFeesPerYear)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">Total in-house screening cost per year</span>
                  <span className="font-semibold text-foreground">{formatCurrency(totalInHouseScreeningCost)}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 p-8 text-center">
              <h3 className="font-semibold text-foreground mb-2">Ready to validate these numbers?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start with a single role pilot and see your ROI with real data. Most companies have results within 1 week. No long-term commitment required.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href="/auth/signup">
                  <button style={{ backgroundColor: '#8241FF' }} className="px-6 py-3 text-white hover:opacity-90 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 justify-center">
                    Start Your Pilot
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </a>
                <button className="px-6 py-3 text-purple-600 border border-purple-200 hover:bg-purple-50 rounded-lg font-semibold text-sm transition-all">
                  Talk to our team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
