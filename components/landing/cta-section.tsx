import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
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
  );
}

