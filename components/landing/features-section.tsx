'use client';

import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'Multi-Location Management',
    description:
      'Centralized control for managing electricity bills from 92+ billers across India—standardized inputs, structured sites, and traceable processing.',
    imageSrc: '/images/cdn-globe-locations-svgrepo-com.svg',
    imageAlt: 'Multi-location illustration'
  },
  {
    title: 'Cost Optimization',
    description:
      'Spot cost-saving opportunities with analytics, align approvals quickly, and avoid penalties and arrears using timely payment visibility.',
    imageSrc: '/images/budget-cost-svgrepo-com.svg',
    imageAlt: 'Cost optimization illustration'
  },
  {
    title: 'Digitized Bill Processing',
    description:
      'Eliminate manual entry with automated discovery, OCR + AI extraction, and validation across diverse bill formats—built for accuracy.',
    imageSrc: '/images/automation-illustration.svg',
    imageAlt: 'Digitization illustration'
  },
  {
    title: 'Compliance & Reporting',
    description:
      'Generate audit-ready reports with environmental and compliance insights, helping you make informed decisions without last-minute scrambles.',
    imageSrc: '/images/cloud-build-svgrepo-com.svg',
    imageAlt: 'Compliance reporting illustration'
  }
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const cards = Array.from(sectionRef.current.querySelectorAll<HTMLElement>('.feature-card'));
    if (!cards.length) return;

    cards.forEach((card) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            once: true
          }
        }
      );
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="features" className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl text-white font-bold text-center mb-12">
          Portal capabilities
        </h2>

        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {features.map((f, idx) => {
            const zigzag = idx % 2 === 0;
            return (
              <div key={f.title} className="feature-card bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className={`flex flex-col ${zigzag ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Image src={f.imageSrc} alt={f.imageAlt} width={24} height={24} />
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">{f.title}</h3>
                    <p className="text-white/80 leading-relaxed">{f.description}</p>
                  </div>

                  <div className="flex-1 w-full">
                    <div className="relative w-full max-w-[420px] h-[220px] mx-auto md:mx-0 md:h-[260px]">
                      <Image
                        src={f.imageSrc}
                        alt={f.imageAlt}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

