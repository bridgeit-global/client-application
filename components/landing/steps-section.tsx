'use client';

import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    title: 'Register your sites and providers',
    description: 'Onboard locations and billers in one place. Map connections and organize your portfolio so processing can start automatically.',
    imageSrc: '/images/registration-illustration.svg',
    imageAlt: 'Registration step illustration'
  },
  {
    title: 'Digitize and process bills automatically',
    description: 'OCR + AI extraction validate bills across provider formats—eliminating manual entry and reducing costly errors.',
    imageSrc: '/images/automation-illustration.svg',
    imageAlt: 'Digitization step illustration'
  },
  {
    title: 'Reconcile payments across locations',
    description: 'Track payment status centrally and automate reconciliation across all your sites—so nothing slips through.',
    imageSrc: '/images/reconciliation-illustration.svg',
    imageAlt: 'Reconciliation step illustration'
  },
  {
    title: 'Get insights through advanced analytics',
    description: 'Turn bills and payments into usable intelligence—cost, usage patterns, penalties, and compliance reporting.',
    imageSrc: '/images/analytics-illustration.svg',
    imageAlt: 'Analytics step illustration'
  }
];

export default function StepsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const cards = Array.from(sectionRef.current.querySelectorAll<HTMLElement>('.step-card'));
      if (!cards.length) return;

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: card, start: 'top 85%', once: true }
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="steps" ref={sectionRef} className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl text-white font-bold">How BridgeIT works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            A simple workflow that turns electricity bills into standardized data, approvals, and always-ready analytics.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-white/10 -translate-x-1/2" />

          <div className="grid grid-cols-1 gap-8">
            {steps.map((step, idx) => {
              const zigzag = idx % 2 === 0;
              return (
                <div key={step.title} className="step-card bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-6 left-4 h-3 w-3 rounded-full bg-primary md:left-1/2 md:-translate-x-1/2 z-10" />

                  <div className={`flex flex-col ${zigzag ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                    <div className="flex-1">
                      <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <span className="text-primary font-bold text-xl">{idx + 1}</span>
                      </div>

                      <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">{step.title}</h3>
                      <p className="text-white/80 leading-relaxed">{step.description}</p>
                    </div>

                    <div className="flex-1 w-full">
                      <div className="relative w-full max-w-[420px] h-[220px] mx-auto md:mx-0">
                        <Image src={step.imageSrc} alt={step.imageAlt} fill className="object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

