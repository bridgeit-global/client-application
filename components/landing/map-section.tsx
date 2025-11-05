import dynamic from 'next/dynamic';

const MapboxLandingPage = dynamic(
  () => import('@/components/mapbox/landing-page').then((mod) => mod.MapboxLandingPage),
  {
    ssr: false,
    loading: () => (
      <div 
        className="w-full"
        style={{
          height: '80vh',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}
      >
        Loading map...
      </div>
    )
  }
);

export default function MapSection() {
  return (
    <section className="min-h-screen">
      <div className="container py-12 sm:py-16">
        <h2 className="text-xl text-white font-sans tracking-tight sm:text-2xl text-center mb-8">
          Standardizing electricity bills from the following electricity providers in India
        </h2>
        <MapboxLandingPage />
      </div>
    </section>
  );
}

