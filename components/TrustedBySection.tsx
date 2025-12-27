const companies = [
  { name: "TechCorp", icon: "🏢" },
  { name: "StartupX", icon: "🚀" },
  { name: "GlobalHR", icon: "🌐" },
  { name: "TalentHub", icon: "⭐" },
  { name: "HireFlow", icon: "💼" },
];

const TrustedBySection = () => {
  return (
    <section className="py-16 px-4 bg-card">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-sm text-muted-foreground mb-8">
          Trusted by leading companies and recruiters worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {companies.map((company) => (
            <div
              key={company.name}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg">{company.icon}</span>
              <span className="font-medium">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
