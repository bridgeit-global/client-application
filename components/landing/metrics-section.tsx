'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export default function MetricsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const unitsRef = useRef<HTMLSpanElement | null>(null);
  const dataPointsRef = useRef<HTMLSpanElement | null>(null);
  const paymentsRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const trigger = sectionRef.current;
      if (!trigger) return;

      const animate = ({
        el,
        end,
        toText
      }: {
        el: HTMLSpanElement | null;
        end: number;
        toText: (n: number) => string;
      }) => {
        if (!el) return;
        const obj = { value: 0 };
        gsap.to(obj, {
          value: end,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { trigger, start: 'top 80%', once: true },
          onUpdate: () => {
            el.textContent = toText(obj.value);
          }
        });
      };

      animate({
        el: unitsRef.current,
        end: 1,
        toText: (n) => `${Math.round(n)} Mn+`
      });

      animate({
        el: dataPointsRef.current,
        end: 10,
        toText: (n) => `${Math.round(n)} Mn+`
      });

      animate({
        el: paymentsRef.current,
        end: 1000,
        toText: (n) => `₹${Math.round(n)} Cr+`
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="my-8 flex items-center justify-center py-4 md:snap-start">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-white font-bold tracking-tight sm:text-4xl">
            Why BridgeIT?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-white">
            Our impact in numbers
          </p>
        </div>

        <div className="mt-8 md:mt-10 grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
          <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2 text-white">
                <span ref={unitsRef} className="text-3xl font-bold text-primary">0</span>
                <span>Energy Units</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/80">
              We have successfully processed over a million bills,
              streamlining operations for our clients across multiple locations.
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2 text-white">
                <span ref={dataPointsRef} className="text-3xl font-bold text-primary">0</span>
                <span>Data Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/80">
              Our advanced data engineering capabilities have handled over
              10 million bill parameters with complete accuracy.
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2 text-white">
                <span ref={paymentsRef} className="text-3xl font-bold text-primary">0</span>
                <span>Processed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/80">
              We&apos;ve facilitated over 1000 Crore rupees in payments,
              ensuring timely and accurate transactions.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

