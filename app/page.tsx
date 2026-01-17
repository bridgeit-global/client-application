import dynamic from 'next/dynamic';
import AboutSection from '@/components/landing/about-section';
import StepsSection from '@/components/landing/steps-section';
import FeaturesSection from '@/components/landing/features-section';
import CostImpactSection from '@/components/landing/cost-impact-section';
import MetricsSection from '@/components/landing/metrics-section';
import CTASection from '@/components/landing/cta-section';
import MapSection from '@/components/landing/map-section';
import Footer from '@/components/layout/landing/footer';
import { createClient } from '@/lib/supabase/server';
import { getStoredKPIMetrics } from '@/services/kpi-metrics';
import { KPISection } from '@/components/kpi/kpi-section';

// Dynamically import client components for incremental loading
const Header = dynamic(() => import('@/components/layout/landing/header'), {
  ssr: true,
  loading: () => (
    <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-sm border-b border-white/10">
      <div className="container">
        <div className="flex h-16 items-center justify-between md:px-0">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  )
});

const HeroSection = dynamic(() => import('@/components/landing/hero-section'), {
  ssr: true,
  loading: () => (
    <section className="py-12 sm:py-16 items-center justify-center place-content-center">
      <div className="container mx-auto text-center px-4 sm:px-6">
        <h1 className="text-3xl tracking-tight md:text-4xl text-white">
          <p className="text-3xl mb-4">Platform for Electricity</p>
          <span className="block h-12 text-white font-bold text-4xl md:text-5xl">Energy Management</span>
        </h1>
      </div>
    </section>
  )
});

export default async function Home() {
  // const kpiMetrics = await getStoredKPIMetrics('49af6e1b-8d81-4914-b8c4-ffd2e9af2521');

  return (
    <div className='w-full relative min-h-screen'>
      {/* Mesh overlay */}
      <div className="absolute inset-0 bg-theme-mesh pointer-events-none" />

      <Header />
      <main className="w-full pt-16 relative">
        <HeroSection />
        {/* {kpiMetrics && kpiMetrics.length > 0 && (
          <KPISection metrics={kpiMetrics} />
        )} */}
        <AboutSection />
        <FeaturesSection />
        <MapSection />
        <StepsSection />
        <CostImpactSection />
        <MetricsSection />
        <CTASection />
        <Footer />
      </main>
    </div>
  );
}
