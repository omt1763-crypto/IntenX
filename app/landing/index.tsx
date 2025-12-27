import Navbar from "./Navbar";
import Hero from "./sections/Hero";
import TrustedBy from "./sections/TrustedBy";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import Pricing from "./sections/Pricing";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

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
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
