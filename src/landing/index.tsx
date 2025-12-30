import Navbar from "./Navbar";
import Hero from "./sections/Hero";
import TrustedBy from "./sections/TrustedBy";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import Pricing from "./sections/Pricing";

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <Pricing />
      </main>
    </>
  );
};

export default LandingPage;
