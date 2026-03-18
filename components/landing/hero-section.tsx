'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';

const rotatingTexts = [
  'Energy Management',
  'Connection Management',
  'Bill Management',
  'Payment Management',
  'Compliance & Reporting'
];

gsap.registerPlugin(TextPlugin);

export default function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

      rotatingTexts.forEach((text, index) => {
        tl.to(textRef.current as HTMLSpanElement, {
          duration: 1,
          text,
          ease: 'none',
          delay: index === 0 ? 0 : 2
        });
      });

      tl.to(textRef.current as HTMLSpanElement, {
        duration: 1,
        text: rotatingTexts[0],
        delay: 2
      });
    },
    { scope: heroRef }
  );

  const scrollToSteps = () => {
    const el = document.getElementById('steps');
    if (!el) return;

    // Adjust for the fixed header (4rem).
    const y = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <section ref={heroRef} className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm text-white/80">Specialized ERP for electricity operations</span>
          </div>

          <h1 className="mt-6 text-3xl tracking-tight md:text-5xl text-white">
            <span className="block text-white/90">India&apos;s specialized ERP for electricity</span>
            <span className="block h-14 md:h-16">
              <span
                ref={textRef}
                className="block text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-[#7dd3fc] bg-clip-text text-transparent"
              >
                Energy Management
              </span>
            </span>
          </h1>

          <p className="mt-5 text-lg text-white/80">
            BridgeIT standardizes bill discovery, digitization, compliance, and payments across multi-location businesses—so teams
            can act fast, stay compliant, and avoid arrears.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/15 bg-white/5 hover:bg-white/10 text-white"
              onClick={scrollToSteps}
            >
              See how it works
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">1 Mn+</div>
              <div className="mt-1 text-sm text-white/70">Bills processed</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">92+</div>
              <div className="mt-1 text-sm text-white/70">Electricity billers</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">₹1000 Cr+</div>
              <div className="mt-1 text-sm text-white/70">Payments facilitated</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={scrollToSteps}
          className="group rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2"
          aria-label="Scroll to how it works"
        >
          <span className="text-sm text-white/80 group-hover:text-white">How it works</span>
          <span className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-bounce">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  );
}

