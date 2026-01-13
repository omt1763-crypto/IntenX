"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState(1); // Start at 100 interviews

  const interviewTiers = [
    { interviews: 50, monthlyPrice: 200, yearlyPrice: 2000 },
    { interviews: 100, monthlyPrice: 400, yearlyPrice: 4000 },
    { interviews: 300, monthlyPrice: 1200, yearlyPrice: 12000 },
    { interviews: 500, monthlyPrice: 2000, yearlyPrice: 20000 },
    { interviews: 1000, monthlyPrice: 4000, yearlyPrice: 40000 },
  ];

  const pricingPlans = [
    {
      name: "Candidate",
      description: "Perfect for getting started",
      monthlyPrice: 25,
      yearlyPrice: 240,
      highlighted: false,
      gradient: "from-blue-50 via-blue-50 to-blue-50",
      borderColor: "border-blue-200",
      buttonBg: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
      features: [
        "AI-powered mock interview",
        "Role-based & skill-based questions",
        "Real-time AI feedback & scoring",
        "Communication & confidence analysis",
        "Detailed interview performance reports",
        "First 2 interviews are free",
        "Additional interviews charged at $10 each",
      ],
    },
    {
      name: "Professional",
      description: "For active job seekers",
      monthlyPrice: 29,
      yearlyPrice: 290,
      highlighted: true,
      gradient: "from-purple-100 via-blue-50 to-yellow-50",
      borderColor: "border-purple-300",
      badge: "Popular",
      buttonBg: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
      features: [
        "Unlimited Mock Interviews",
        "Advanced Resume Analysis",
        "Performance Analytics",
        "Priority Email Support",
        "Interview History & Feedback",
        "Custom Interview Scenarios",
        "First 2 interviews are free",
        "Additional interviews charged at $10 each",
      ],
      isDraggable: true,
    },
    {
      name: "Enterprise",
      description: "For teams and organizations",
      monthlyPrice: 99,
      yearlyPrice: 990,
      highlighted: false,
      gradient: "from-orange-50 via-yellow-50 to-orange-50",
      borderColor: "border-orange-200",
      buttonBg: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
      features: [
        "Unlimited Everything",
        "Team Management",
        "Advanced Analytics Dashboard",
        "Custom Integrations",
        "Dedicated Account Manager",
        "24/7 Priority Support",
        "SSO & Advanced Security",
      ],
    },
  ];

  const selectedTier = interviewTiers[selectedTierIndex];
  const displayPrice = isYearly ? selectedTier.yearlyPrice : selectedTier.monthlyPrice;

  return (
    <section className="py-20 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                !isYearly
                  ? "bg-purple-600 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                isYearly
                  ? "bg-purple-600 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly <span className="text-xs ml-1 text-purple-200">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`animate-fade-up relative ${plan.highlighted ? "md:scale-105" : ""}`}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Card */}
              <div
                className={`bg-gradient-to-br ${plan.gradient} rounded-2xl p-8 border-2 ${plan.borderColor} h-full flex flex-col transition-all duration-300 hover:shadow-lg`}
              >
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                {plan.name !== "Enterprise" && (
                <div className="mb-8">
                  {plan.isDraggable ? (
                    <div>
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl font-bold text-foreground">
                            ${displayPrice}
                          </span>
                          <span className="text-muted-foreground">
                            /{isYearly ? "year" : "month"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedTier.interviews} Interviews
                        </div>
                      </div>
                      <div className="space-y-2">
                        
                        {/* Custom Slider */}
                        <div className="relative py-4 px-2">
                          <div className="absolute inset-y-1/2 left-2 right-2 h-1 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full -translate-y-1/2"></div>
                          
                          <div className="relative flex justify-between">
                            {interviewTiers.map((tier, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedTierIndex(index)}
                                className={`relative z-10 w-6 h-6 rounded-full transition-all duration-200 transform ${
                                  index === selectedTierIndex
                                    ? "bg-purple-600 shadow-lg scale-110"
                                    : "bg-white border-2 border-purple-300 hover:scale-105"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                          <span>50</span>
                          <span>100</span>
                          <span>300</span>
                          <span>500</span>
                          <span>1000</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">
                        /{isYearly ? "year" : "month"}
                      </span>
                    </div>
                  )}
                </div>
                )}

                {/* Features */}
                <div className="space-y-4 flex-grow mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  className={`${plan.name === "Enterprise" ? "bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700" : plan.buttonBg} text-white font-semibold py-3 rounded-full transition-all w-full`}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Choose Plan"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-16 animate-fade-up">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
