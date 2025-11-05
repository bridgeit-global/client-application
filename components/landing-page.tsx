'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Factory, Store, Building2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { MapboxLandingPage } from '@/components/mapbox/landing-page';
import Image from 'next/image';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';
import Footer from './layout/landing/footer';
import Header from './layout/landing/header';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const texts = ['Energy Management', 'Connection Management', 'Bill Management', 'Payment Management', 'Compliance & Reporting'];

gsap.registerPlugin(useGSAP, TextPlugin, ScrollTrigger, ScrollToPlugin);

export default function LandingPage() {
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
    <div ref={containerRef} className='w-full relative min-h-screen'>
      {/* Mesh overlay */}
      <div className="absolute inset-0 bg-theme-mesh pointer-events-none" />

      <Header />
      <main className="w-full pt-16 relative">
        {/* Hero section */}
        <section className="py-12 sm:py-16 items-center justify-center place-content-center">
          <div className="container mx-auto text-center px-4 sm:px-6">
            <h1 className="text-3xl tracking-tight md:text-4xl text-white">
              <p className="text-3xl mb-4">Platform for Electricity</p>
              <span ref={textRef} className="block h-12 text-white font-bold text-4xl md:text-5xl">Energy Management</span>
            </h1>
          </div>
        </section>
        {/* About Us section */}
        <section className="py-12 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 md:p-12 hover:bg-white/15 transition-all duration-300">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Who We Are</h2>
                <div className="space-y-4">
                  <p className="text-lg text-white text-justify">
                    BridgeIT is a pioneering platform revolutionizing electricity management for businesses across India. We bridge the gap between complex energy systems and streamlined operations.{" "}
                  </p>
                  <p className="text-lg text-white/60 text-justify">
                    Our mission is to simplify electricity management through innovative technology, helping organizations reduce costs, improve efficiency, and make data-driven decisions about their energy consumption.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/15 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Innovation</h3>
                <p className="text-white/80">
                  Leveraging cutting-edge technology to transform how businesses manage their electricity needs.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/15 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Reliability</h3>
                <p className="text-white/80">
                  Providing dependable solutions that businesses can trust for their critical energy management needs.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/15 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Efficiency</h3>
                <p className="text-white/80">
                  Optimizing energy processes to save time, reduce costs, and improve operational performance.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Map section */}
        <section className="min-h-screen">
          <div className="container py-12 sm:py-16">
            <h2 className="text-xl text-white font-sans tracking-tight sm:text-2xl text-center mb-8">
              Power Distribution Companies in India
            </h2>
            <MapboxLandingPage />
          </div>
        </section>

        {/* Steps section */}
        <section className="py-12 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl text-white font-bold text-center mb-8 md:mb-12">
              Streamline in 4 simple steps
            </h2>
            <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
              {/* Step 1 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <span className="text-primary font-bold text-xl">1</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Register your sites and providers</h3>
                    <p className="text-white/80 leading-relaxed">
                      Easily onboard all your locations and electricity providers through our
                      intuitive interface. Map connections and organize your portfolio efficiently.
                    </p>
                  </div>
                  {/* Simplify visuals by hiding heavy illustration on dark */}
                  <div className="hidden md:block flex-1" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <span className="text-primary font-bold text-xl">2</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Digitize and process bills automatically</h3>
                    <p className="text-white/80 leading-relaxed">
                      Our advanced OCR and AI systems automatically process and validate your
                      electricity bills, eliminating manual data entry and reducing errors.
                    </p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <span className="text-primary font-bold text-xl">3</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Reconcile payments across locations</h3>
                    <p className="text-white/80 leading-relaxed">
                      Track and manage payments centrally. Get real-time updates on payment
                      status and automate reconciliation across all your locations.
                    </p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <span className="text-primary font-bold text-xl">4</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Get insights through advanced analytics</h3>
                    <p className="text-white/80 leading-relaxed">
                      Leverage powerful analytics to identify cost-saving opportunities and
                      optimize your electricity consumption patterns across your portfolio.
                    </p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section id="about" className="py-12 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl text-white font-bold text-center mb-12">
              Features
            </h2>
            <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
              {/* Multi-Location Management */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Image
                        src="/images/cdn-globe-locations-svgrepo-com.svg"
                        alt="Multi-location icon"
                        width={24}
                        height={24}
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Multi-Location Management</h3>
                    <p className="text-white/80 leading-relaxed">
                      Centralized control for managing electricity bills from 92+
                      billers across India, with smart meter integrations and FTP
                      inputs for seamless data collection
                    </p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              </div>

              {/* Cost Optimization */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Image
                        src="/images/budget-cost-svgrepo-com.svg"
                        alt="Cost optimization icon"
                        width={24}
                        height={24}
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Cost Optimization</h3>
                    <p className="text-white/80 leading-relaxed">
                      Advanced analytics to identify cost-saving opportunities,
                      optimize electricity consumption, and avoid penalties and
                      arrears through timely payment tracking
                    </p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              </div>

              {/* Automated Processing */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Image
                        src="/images/standardization-svgrepo-com.svg"
                        alt="Automation icon"
                        width={24}
                        height={24}
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Digitized Bill Processing</h3>
                    <p className="text-white/80 leading-relaxed">
                      Eliminate manual data entry with automated bill download, extraction and
                      validation across all providers, ensuring accurate data
                      from diverse bill formats
                    </p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              </div>

              {/* Compliance & Reporting */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  <div className="flex-1">
                    <div className="bg-primary/15 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Image
                        src="/images/cloud-build-svgrepo-com.svg"
                        alt="Compliance icon"
                        width={24}
                        height={24}
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Compliance & Reporting</h3>
                    <p className="text-white/80 leading-relaxed">
                      Ensure regulatory compliance, Track environmental metrics and generate
                      comprehensive compliance reports for informed decision-making
                      and regulatory requirements
                    </p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cost Impact section */}
        <section className="my-8 flex items-center justify-center py-4 md:snap-start">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl text-white font-bold tracking-tight sm:text-4xl">
                Our offerings
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-xl text-white">
                Tangible impact on your business
              </p>
            </div>

            <div className="mt-12 md:mt-16 grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full"></div>
                <CardHeader>
                  <CardTitle className="items-center gap-2">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-primary">100%</span>
                    </div>
                    <span className="text-xl text-white">Bill Digitization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white">
                    Complete digital transformation of your billing process
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">Zero manual data entry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">99.9% accuracy rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">Instant digital archiving</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full"></div>
                <CardHeader>
                  <span className="text-sm text-white mr-1">up to</span>
                  <CardTitle className="items-center gap-2">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-primary">120MINS</span>
                    </div>
                    <span className="text-xl text-white">saved per bill</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white">
                    Dramatic reduction in processing time per bill
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">Process 1000s of bills simultaneously</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">75% faster approvals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">Real-time processing status</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-transparent">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/10 rounded-full"></div>
                <CardHeader>
                  <CardTitle className="items-center gap-2">
                    <div className="items-baseline">
                      <span className="text-4xl font-bold text-primary">100%</span>
                    </div>
                    <span className="text-xl text-white">timely payments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white">
                    Significant reduction in operational costs
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">Eliminate late payment penalties</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">Reduce processing costs by 85%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-white">Average ROI in 3 months</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Calculate Your Savings
              </Button>
            </div>
          </div>
        </section>

        {/* Metrics section */}
        <section className="my-8 flex items-center justify-center py-4 md:snap-start">
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
              <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-baseline gap-2 text-white">
                    <span className="text-3xl font-bold text-primary">1 Mn+</span>
                    <span>Energy Units</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-white/80">
                  We have successfully processed over a million bills,
                  streamlining operations for our clients across multiple locations.
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-baseline gap-2 text-white">
                    <span className="text-3xl font-bold text-primary">10 Mn+</span>
                    <span>Data Points</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-white/80">
                  Our advanced data engineering capabilities have handled over
                  10 million bill parameters with complete accuracy.
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-baseline gap-2 text-white">
                    <span className="text-3xl font-bold text-primary">₹1000 Cr+</span>
                    <span>Processed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-white/80">
                  We&apos;ve facilitated over 1000 Crore rupees in payments,
                  ensuring timely and accurate transactions.
                </CardContent>
              </Card>
            </div>

              <div className="mt-12 md:mt-16">
              <p className="mx-auto mt-4 max-w-2xl text-center text-xl text-white">
                Real Results from Real Companies
              </p>

              <div className="mt-12 md:mt-16 grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
                <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center shadow-inner">
                        <Factory className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Manufacturing Excellence</CardTitle>
                        <CardDescription className="text-white/70">Global Manufacturing Co.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-white/80">
                        A leading manufacturer with 50+ facilities across Asia and Europe needed a solution to streamline their electricity bill management.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Bill Processing Time</span>
                          <span className="text-white font-medium">Reduced by 85%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Cost Savings</span>
                          <span className="text-white font-medium">$2.5M annually</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Implementation Time</span>
                          <span className="text-white font-medium">2 weeks</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center shadow-inner">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Retail Transformation</CardTitle>
                        <CardDescription className="text-white/70">National Retail Chain</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-white/80">
                        A retail chain with 200+ stores needed a centralized solution for energy bill management and analytics.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Processing Time</span>
                          <span className="text-white font-medium">75% reduction</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Energy Savings</span>
                          <span className="text-white font-medium">15% reduction</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">ROI</span>
                          <span className="text-white font-medium">300%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-0 hover:bg-white/15 transition-all duration-300 !bg-transparent">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center shadow-inner">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Healthcare Innovation</CardTitle>
                        <CardDescription className="text-white/70">Healthcare Network</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-white/80">
                        A healthcare provider managing multiple hospitals needed an efficient way to handle energy costs and compliance.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Cost Reduction</span>
                          <span className="text-white font-medium">$1.8M annually</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Compliance Rate</span>
                          <span className="text-white font-medium">100%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Time Saved</span>
                          <span className="text-white font-medium">40 hours/week</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-24 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl md:text-3xl text-white font-bold mb-6">
              Ready to streamline your electricity bill management?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using our platform to manage their electricity bills efficiently.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              asChild
            >
              <Link href="/signup">Get Started Now</Link>
            </Button>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
