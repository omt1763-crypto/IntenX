import { Button } from "@/components/ui/button";
import DashboardMockup from "./DashboardMockup";
import GridBackground from "./GridBackground";

const HeroSection = () => {
  return (
    <GridBackground className="relative min-h-screen hero-gradient pt-32 pb-20 px-4">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-flow-purple/10 rounded-full blur-3xl" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-flow-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-flow-pink rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-flow-purple rounded-full blur-3xl opacity-15" />
      
      {/* Corner decorations */}
      <div className="absolute top-32 right-20 hidden lg:block">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-border">
          <path d="M0 0V20H2V2H20V0H0Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="absolute top-32 left-20 hidden lg:block rotate-90">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-border">
          <path d="M0 0V20H2V2H20V0H0Z" fill="currentColor"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 animate-float" style={{ animation: 'float 4s ease-in-out infinite' }} />
            <span className="text-sm text-muted-foreground">
              AI-powered interviews for candidates, recruiters & companies
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Ace your interviews with
            <br />
            <span className="text-gradient">AI-powered intelligence</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          Practice role-based interviews, get instant resume analysis, and streamline hiring with 
          intelligent AI agents for candidates, recruiters, and companies.
        </p>

        {/* CTA Button */}
        <div className="flex justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => window.location.href = 'https://www.aiinterviewx.com/auth/signup'}
          >
            Start Interview
          </Button>
          <Button variant="outline" size="lg" className="hidden sm:inline-flex">
            Watch Demo
          </Button>
        </div>

        {/* Dashboard Mockup */}
        <div className="animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <DashboardMockup />
        </div>
      </div>
    </GridBackground>
  );
};

export default HeroSection;
