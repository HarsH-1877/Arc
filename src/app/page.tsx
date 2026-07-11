import { Hero } from '@/components/landing/Hero';
import { ProblemStatement } from '@/components/landing/ProblemStatement';
import { Features } from '@/components/landing/Features';
import { DemoPreview } from '@/components/landing/DemoPreview';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col" style={{ background: 'var(--bg-base)' }}>
      <Hero />
      <ProblemStatement />
      <Features />
      <DemoPreview />
      <Footer />
    </main>
  );
}
