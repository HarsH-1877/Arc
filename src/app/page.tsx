import { LandingNav } from '@/components/landing/LandingNav';
import { MountainTrail } from '@/components/landing/MountainTrail';
import { Hero } from '@/components/landing/Hero';

import { FeatureCards } from '@/components/landing/FeatureCards';
import { Payoff } from '@/components/landing/Payoff';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      {/* Fixed full-viewport mountain + trail background */}
      <MountainTrail />

      {/* Sticky nav */}
      <LandingNav />

      {/* Page content — scrolls over the fixed mountain */}
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'transparent',
        }}
      >
        <Hero />
        <FeatureCards />
        <Payoff />
        <Footer />
      </main>
    </>
  );
}
