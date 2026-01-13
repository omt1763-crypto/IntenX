import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faqs" },
];

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <nav className="mx-auto max-w-6xl nav-glass rounded-full px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img 
            src="/intenx-logo.png" 
            alt="IntenX" 
            className="h-8 w-auto"
          />
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Login
          </Button>
          <button onClick={() => window.location.href = 'https://www.aiinterviewx.com/auth/signup'} style={{ backgroundColor: '#8241FF' }} className="px-6 py-2 text-white hover:opacity-90 rounded-full font-semibold text-sm transition-all">
            Sign Up
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
