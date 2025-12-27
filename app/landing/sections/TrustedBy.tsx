const companies = [
  { name: "TechCorp", icon: "🏢" },
  { name: "StartupX", icon: "🚀" },
  { name: "GlobalHR", icon: "🌐" },
  { name: "TalentHub", icon: "⭐" },
  { name: "HireFlow", icon: "💼" },
];

const TrustedBy = () => {
  return (
    <section className="py-20 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <p className="text-sm text-muted-foreground mb-2">Trusted worldwide</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Leading companies trust our platform
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {companies.map((company, index) => (
            <div
              key={company.name}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-300 hover:shadow-card animate-fade-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <span className="text-lg">{company.icon}</span>
              <span className="font-medium text-sm">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
