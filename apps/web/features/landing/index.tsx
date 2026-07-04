import { CtaSection } from "./components/cta-section";
import { DevelopersSection } from "./components/developers-section";
import { FeaturesSection } from "./components/features-section";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { LifecycleSection } from "./components/lifecycle-section";
import { Navbar } from "./components/navbar";
import { ProblemsSection } from "./components/problems-section";
import { SecuritySection } from "./components/security-section";
import { TrustBar } from "./components/trust-bar";

export function LandingPage() {
  return (
    <div className="bg-background font-sans text-foreground antialiased">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <ProblemsSection />
        <FeaturesSection />
        <LifecycleSection />
        <DevelopersSection />
        <SecuritySection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
