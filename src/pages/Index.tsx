import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ProblemSolution from "@/components/ProblemSolution";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import { InstantValueWidget } from "@/components/InstantValueWidget";
import DemoSection from "@/components/DemoSection";
import Testimonials from "@/components/Testimonials";
import SignupSection from "@/components/SignupSection";
import SocialProof from "@/components/SocialProof";
import PrivacySection from "@/components/PrivacySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <ProblemSolution />
        <InstantValueWidget />
        <FeaturesSection />
        <HowItWorks />
        <DemoSection />
        <Testimonials />
        <SignupSection />
        <SocialProof />
        <PrivacySection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
