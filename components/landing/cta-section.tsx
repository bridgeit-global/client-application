import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section className="relative py-12 sm:py-16 md:py-24 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="absolute inset-0 bg-theme-mesh pointer-events-none" />

          <div className="relative text-center px-6 py-12 sm:px-10 sm:py-16">
            <h2 className="text-2xl md:text-3xl text-white font-bold mb-6">
              Ready to streamline your electricity bill management?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Digitize bills, reconcile payments, and generate analytics in one portal—built for multi-location operations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <Link href="/signup">Get Started Now</Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/15 bg-white/5 hover:bg-white/10 text-white"
                asChild
              >
                <Link href="/signup">Contact Us</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-white/60">
              No complex setup—our team helps you onboard sites and providers quickly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

