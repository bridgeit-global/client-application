'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';

const texts = ['Energy Management', 'Connection Management', 'Bill Management', 'Payment Management', 'Compliance & Reporting'];

gsap.registerPlugin(useGSAP, TextPlugin, ScrollTrigger, ScrollToPlugin);

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    // Text rotation animation
    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.5
    });

    texts.forEach((text, index) => {
      tl.to(textRef.current, {
        duration: 1,
        text: text,
        ease: "none",
        delay: index === 0 ? 0 : 2
      });
    });

    // Return to first text to complete the cycle
    tl.to(textRef.current, {
      duration: 1,
      text: texts[0],
      delay: 2
    });

  }, { scope: containerRef });

  return (
    <section className="py-12 sm:py-16 items-center justify-center place-content-center">
      <div className="container mx-auto text-center px-4 sm:px-6">
        <h1 className="text-3xl tracking-tight md:text-4xl text-white">
          <p className="text-3xl mb-4">Platform for Electricity</p>
          <span ref={textRef} className="block h-12 text-white font-bold text-4xl md:text-5xl">Energy Management</span>
        </h1>
      </div>
    </section>
  );
}

